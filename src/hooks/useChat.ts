import { useState, useCallback, useRef, useEffect } from 'react';
import type { ChatMessage, Conversation, ChatThread, MessageBlock } from '../data/types';
import { findMatchingResponse, initialConversations, suggestions } from '../data/mockResponses';

const STORAGE_KEY = 'pulse-analytics-conversations';
const ACTIVE_KEY = 'pulse-analytics-active';
const THREADS_KEY = 'pulse-analytics-threads';

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function loadConversations(): Conversation[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Conversation[];
      return parsed.map((c) => ({
        ...c,
        updatedAt: new Date(c.updatedAt),
        messages: c.messages.map((m) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        })),
      }));
    }
  } catch { /* ignore */ }
  return initialConversations.map((c) => ({
    ...c,
    updatedAt: c.updatedAt,
    messages: [],
  }));
}

function saveConversations(convs: Conversation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
  } catch { /* ignore */ }
}

function loadThreads(): ChatThread[] {
  try {
    const stored = localStorage.getItem(THREADS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ChatThread[];
      return parsed.map((t) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        messages: t.messages.map((m) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        })),
      }));
    }
  } catch { /* ignore */ }
  return [];
}

function saveThreads(threads: ChatThread[]) {
  try {
    localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
  } catch { /* ignore */ }
}

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>(() => loadConversations());
  const [activeConversationId, setActiveConversationId] = useState<string | null>(() =>
    localStorage.getItem(ACTIVE_KEY)
  );
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const activeId = localStorage.getItem(ACTIVE_KEY);
    if (activeId) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Conversation[];
          const conv = parsed.find((c) => c.id === activeId);
          if (conv) {
            return conv.messages.map((m) => ({
              ...m,
              timestamp: new Date(m.timestamp),
            }));
          }
        }
      } catch { /* ignore */ }
    }
    return [];
  });
  const [isTyping, setIsTyping] = useState(false);
  const [visibleBlocks, setVisibleBlocks] = useState<Set<string>>(new Set());
  const [threads, setThreads] = useState<ChatThread[]>(() => loadThreads());
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore active thread from stored threads
  useEffect(() => {
    const storedThreads = loadThreads();
    if (storedThreads.length > 0) {
      setThreads(storedThreads);
    }
  }, []);

  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    if (activeConversationId) {
      localStorage.setItem(ACTIVE_KEY, activeConversationId);
    }
  }, [activeConversationId]);

  useEffect(() => {
    saveThreads(threads);
  }, [threads]);

  // Pre-populate visible blocks for restored messages
  useEffect(() => {
    if (messages.length > 0) {
      const newVisible = new Set<string>();
      messages.forEach((msg) => {
        msg.blocks.forEach((_, idx) => {
          newVisible.add(`${msg.id}-${idx}`);
        });
      });
      setVisibleBlocks(newVisible);
    }
  }, []);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const addThreadMessage = useCallback((message: ChatMessage) => {
    setActiveThread((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, messages: [...prev.messages, message] };
      // Also update in the threads array
      setThreads((threads) =>
        threads.map((t) => (t.id === prev.id ? updated : t))
      );
      return updated;
    });
  }, []);

  const getThreadVisibleBlocks = useCallback((thread: ChatThread) => {
    const visible = new Set<string>();
    thread.messages.forEach((msg) => {
      msg.blocks.forEach((_, idx) => {
        visible.add(`${msg.id}-${idx}`);
      });
    });
    return visible;
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      blocks: [{ type: 'text', content: content.trim() }],
      timestamp: new Date(),
    };

    // If in a thread, send to thread
    if (activeThread) {
      addThreadMessage(userMessage);
    } else {
      addMessage(userMessage);
    }

    setIsTyping(true);

    const response = findMatchingResponse(content.trim());

    const [minMs, maxMs] = response.thinkingMs;
    const delay = Math.random() * (maxMs - minMs) + minMs;

    await new Promise((resolve) => {
      typingTimeoutRef.current = setTimeout(resolve, delay);
    });

    setIsTyping(false);

    const aiMessage: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      blocks: response.blocks,
      timestamp: new Date(),
      interpretationCard: response.interpretationCard,
      trustLayer: response.trustLayer,
      suggestions: response.suggestions,
    };

    if (activeThread) {
      addThreadMessage(aiMessage);
    } else {
      addMessage(aiMessage);
    }

    const msgId = aiMessage.id;
    response.blocks.forEach((_, index) => {
      setTimeout(() => {
        setVisibleBlocks((prev) => new Set([...prev, `${msgId}-${index}`]));
      }, 300 + index * 400);
    });
    setTimeout(() => {
      setVisibleBlocks((prev) => new Set([...prev, `${msgId}-0`]));
    }, 300);

    // Persist to conversations (only if not in thread)
    if (!activeThread) {
      const convId = activeConversationId;
      const conversationExists = conversations.some(c => c.id === convId);

      if (!convId || !conversationExists) {
        const newTitle = content.trim().slice(0, 40) + (content.trim().length > 40 ? '...' : '');
        const newConvId = convId || generateId();
        
        const newConv: Conversation = {
          id: newConvId,
          title: newTitle,
          messages: [userMessage, aiMessage],
          updatedAt: new Date(),
        };
        
        setConversations((prev) => [newConv, ...prev.filter(c => c.id !== newConvId)]);
        setActiveConversationId(newConvId);
      } else {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? { ...c, messages: [...c.messages, userMessage, aiMessage], updatedAt: new Date() }
              : c
          )
        );
      }
    }
  }, [addMessage, addThreadMessage, activeConversationId, activeThread, conversations]);

  const openThread = useCallback((message: ChatMessage, block?: MessageBlock | null, blockIndex: number = 0) => {
    const targetBlock = block || message.blocks[blockIndex] || message.blocks[0];
    let title = '';
    if (targetBlock.type === 'text' && targetBlock.content) {
      title = targetBlock.content.split('\n')[0].replace(/\*\*/g, '').trim().slice(0, 50);
      if (targetBlock.content.length > 50) title += '...';
    } else if (targetBlock.type === 'table' && targetBlock.table) {
      title = `Table: ${targetBlock.table.headers.slice(0, 3).join(', ')}`;
    } else if (targetBlock.type === 'chart' && targetBlock.chart) {
      title = targetBlock.chart.title;
    } else {
      title = 'Analysis';
    }

    // Check if a thread already exists for this specific block in this message
    const existingThread = threads.find((t) => t.parentMessageId === message.id && t.contextBlockIndex === blockIndex);
    if (existingThread) {
      setActiveThread(existingThread);
      return;
    }

    const thread: ChatThread = {
      id: generateId(),
      parentMessageId: message.id,
      contextBlockIndex: blockIndex,
      contextBlock: targetBlock,
      title,
      messages: [],
      createdAt: new Date(),
    };

    setActiveThread(thread);
    setThreads((prev) => [thread, ...prev]);
  }, [threads]);

  const closeThread = useCallback(() => {
    setActiveThread(null);
    // Restore main conversation visible blocks
    const newVisible = new Set<string>();
    messages.forEach((msg) => {
      msg.blocks.forEach((_, idx) => {
        newVisible.add(`${msg.id}-${idx}`);
      });
    });
    setVisibleBlocks(newVisible);
  }, [messages]);

  const selectThread = useCallback((threadId: string) => {
    const stored = localStorage.getItem(THREADS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ChatThread[];
        const thread = parsed.find((t) => t.id === threadId);
        if (thread) {
          setActiveThread({
            ...thread,
            createdAt: new Date(thread.createdAt),
            messages: thread.messages.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })),
          });
        }
      } catch { /* ignore */ }
    }
  }, []);

  const startNewChat = useCallback(() => {
    if (activeThread) {
      closeThread();
    }
    const newConv: Conversation = {
      id: generateId(),
      title: 'New conversation',
      messages: [],
      updatedAt: new Date(),
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
    setMessages([]);
    setVisibleBlocks(new Set());
  }, [activeThread, closeThread]);

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (activeConversationId === id) {
        const next = filtered[0];
        setActiveConversationId(next?.id || null);
        if (next) {
          setMessages(next.messages.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })));
          const newVisible = new Set<string>();
          next.messages.forEach((msg) => {
            msg.blocks.forEach((_, idx) => newVisible.add(`${msg.id}-${idx}`));
          });
          setVisibleBlocks(newVisible);
        } else {
          setMessages([]);
          setVisibleBlocks(new Set());
        }
      }
      return filtered;
    });
  }, [activeConversationId]);

  const deleteThread = useCallback((id: string) => {
    setThreads((prev) => prev.filter((t) => t.id !== id));
    if (activeThread?.id === id) {
      setActiveThread(null);
    }
  }, [activeThread]);

  const selectConversation = useCallback((id: string) => {
    if (activeThread) closeThread();
    setActiveConversationId(id);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Conversation[];
        const conv = parsed.find((c) => c.id === id);
        if (conv) {
          setMessages(conv.messages.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })));
          const newVisible = new Set<string>();
          conv.messages.forEach((msg) => {
            msg.blocks.forEach((_, idx) => {
              newVisible.add(`${msg.id}-${idx}`);
            });
          });
          setVisibleBlocks(newVisible);
          return;
        }
      }
    } catch { /* ignore */ }
    setMessages([]);
    setVisibleBlocks(new Set());
  }, [activeThread, closeThread]);

  return {
    messages,
    isTyping,
    conversations,
    activeConversationId,
    visibleBlocks,
    threads,
    activeThread,
    sendMessage,
    startNewChat,
    selectConversation,
    selectThread,
    openThread,
    closeThread,
    getThreadVisibleBlocks,
    deleteConversation,
    deleteThread,
    formatRelativeTime,
    suggestions,
  };
}

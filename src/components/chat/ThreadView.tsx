import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ArrowLeft, GitBranch, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { ChatMessageItem } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { ChatInput } from '../input/ChatInput';
import { TextBlock } from './TextBlock';
import { TableBlock } from './TableBlock';
import { ChartBlock } from './ChartBlock';
import type { ChatMessage, ChatThread } from '../../data/types';

interface ThreadViewProps {
  thread: ChatThread;
  messages: ChatMessage[];
  isTyping: boolean;
  visibleBlocks: Set<string>;
  isVisible: (key: string) => boolean;
  onSend: (content: string) => void;
  onClose: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export function ThreadView({
  thread, messages, isTyping, isVisible, onSend, onClose, isSidebarOpen = true, onToggleSidebar
}: ThreadViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

  return (
    <div className="flex flex-col h-full bg-bg-base/30">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-2.5 border-b border-border bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleSidebar}
              className="p-2 rounded-xl text-text-tertiary hover:text-primary hover:bg-primary-soft transition-all"
              title={isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
            >
              {isSidebarOpen ? <PanelLeftClose size={18} strokeWidth={2} /> : <PanelLeftOpen size={18} strokeWidth={2} />}
            </motion.button>
          )}

          <motion.button 
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-bg-subtle border border-border text-[11px] font-bold text-text-secondary hover:text-text-primary hover:border-primary/30 transition-all shadow-sm"
          >
            <ArrowLeft size={12} strokeWidth={2.5} />
            <span>Back</span>
          </motion.button>
          
          <div className="h-4 w-px bg-border-light" />
          
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary-soft flex items-center justify-center text-primary shadow-sm">
              <GitBranch size={13} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-text-primary tracking-tight truncate max-w-[200px]">{thread.title}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold text-primary uppercase tracking-widest">Thread</span>
                <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="py-4 space-y-6 max-w-4xl mx-auto">
          {/* Context Block with enhanced styling */}
          {thread.contextBlock && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="px-5"
            >
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="p-1 rounded bg-bg-subtle border border-border-light">
                  <MessageSquare size={10} className="text-text-tertiary" />
                </div>
                <p className="text-[9px] text-text-tertiary font-bold uppercase tracking-widest opacity-80">Parent Context</p>
              </div>
              
              <div className="relative">
                <div className="absolute -left-2 top-0 bottom-0 w-0.5 bg-primary/10 rounded-full" />
                {thread.contextBlock.type === 'text' && thread.contextBlock.content && (
                  <TextBlock content={thread.contextBlock.content} />
                )}
                {thread.contextBlock.type === 'table' && thread.contextBlock.table && (
                  <TableBlock table={thread.contextBlock.table} />
                )}
                {thread.contextBlock.type === 'chart' && thread.contextBlock.chart && (
                  <ChartBlock chart={thread.contextBlock.chart} />
                )}
              </div>
            </motion.div>
          )}

          {/* Divider */}
          <div className="px-5">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-border-light to-transparent" />
          </div>

          {/* Messages */}
          <div className="space-y-1">
            <AnimatePresence mode="popLayout">
              {messages.map((msg) => (
                <ChatMessageItem key={msg.id} message={msg} isVisible={isVisible} compact />
              ))}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {isTyping && (
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="px-5"
              >
                <TypingIndicator />
              </motion.div>
            )}
          </AnimatePresence>
          
          <div ref={messagesEndRef} className="h-2" />
        </div>
      </div>

      {/* Input Placeholder (Input is handled globally in App.tsx) */}
      <div className="h-20 flex-shrink-0" />
    </div>
  );
}

import React, { useState } from 'react';
import { Plus, MessageSquare, BarChart3, TrendingUp, Users, Settings, GitBranch, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChatThread } from '../../data/types';

interface SidebarProps {
  conversations: Array<{
    id: string;
    title: string;
    updatedAt: Date;
  }>;
  threads?: ChatThread[];
  activeId: string | null;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onSelectThread?: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onDeleteThread: (id: string) => void;
}

const navIcons: Record<string, React.ReactNode> = {
  'Q1 revenue': <TrendingUp size={13} />,
  'retention': <Users size={13} />,
  'channel': <BarChart3 size={13} />,
  'tier': <BarChart3 size={13} />,
};

function getIcon(title: string) {
  const t = title.toLowerCase();
  for (const [key, icon] of Object.entries(navIcons)) {
    if (t.includes(key)) return icon;
  }
  return <MessageSquare size={13} />;
}

export function Sidebar({
  conversations,
  threads = [],
  activeId,
  onNewChat,
  onSelectConversation,
  onSelectThread,
  onDeleteConversation,
  onDeleteThread,
}: SidebarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <aside className="w-56 flex-shrink-0 bg-bg-surface border-r border-border flex flex-col h-full relative z-20 shadow-sm">
      {/* New Chat */}
      <div className="px-3 py-4">
        <motion.button
          onClick={onNewChat}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold shadow-premium hover:shadow-glow transition-all duration-300 overflow-hidden relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <Plus size={16} strokeWidth={2.5} />
          <span>New Insight</span>
        </motion.button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 space-y-6 pb-4 custom-scrollbar">
        {/* Threads section */}
        <AnimatePresence>
          {threads.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-1"
            >
              <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest px-2 mb-2 flex items-center gap-2">
                <GitBranch size={10} className="opacity-70" />
                <span>Threads</span>
              </div>
              <nav className="space-y-0.5">
                {threads.map((thread) => {
                  const isActive = thread.id === activeId;
                  return (
                    <div
                      key={thread.id}
                      className="relative group"
                      onMouseEnter={() => setHoveredId(thread.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <motion.button
                        onClick={() => onSelectThread?.(thread.id)}
                        className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all duration-200 ${
                          isActive
                            ? 'bg-primary-soft text-primary shadow-sm'
                            : 'text-text-secondary hover:bg-bg-subtle hover:text-text-primary'
                        }`}
                      >
                        <span className={`flex-shrink-0 ${isActive ? 'text-primary' : 'text-text-tertiary opacity-70'}`}>
                          <GitBranch size={13} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs font-medium truncate ${isActive ? 'font-semibold' : ''}`}>
                            {thread.title}
                          </div>
                        </div>
                        {isActive && (
                          <motion.div
                            layoutId="active-pill"
                            className="absolute left-0 w-1 h-4 bg-primary rounded-full"
                          />
                        )}
                      </motion.button>
                      {(hoveredId === thread.id || isActive) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteThread(thread.id); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-text-tertiary hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Conversations section */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest px-2 mb-2">
            History
          </div>
          <nav className="space-y-0.5">
            {conversations.map((conv) => {
              const isActive = conv.id === activeId;
              return (
                <div
                  key={conv.id}
                  className="relative group"
                  onMouseEnter={() => setHoveredId(conv.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <motion.button
                    onClick={() => onSelectConversation(conv.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-soft text-primary shadow-sm'
                        : 'text-text-secondary hover:bg-bg-subtle hover:text-text-primary'
                    }`}
                  >
                    <span className={`flex-shrink-0 ${isActive ? 'text-primary' : 'text-text-tertiary opacity-70'}`}>
                      {getIcon(conv.title)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-medium truncate ${isActive ? 'font-semibold' : ''}`}>
                        {conv.title}
                      </div>
                    </div>
                    {isActive && !threads.some(t => t.id === activeId) && (
                      <motion.div
                        layoutId="active-pill"
                        className="absolute left-0 w-1 h-4 bg-primary rounded-full"
                      />
                    )}
                  </motion.button>
                  {(hoveredId === conv.id || isActive) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteConversation(conv.id); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-text-tertiary hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Settings Only */}
      <div className="mt-auto px-3 py-4 border-t border-border-light">
        <motion.button
          whileHover={{ x: 2 }}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-text-secondary hover:bg-bg-subtle hover:text-text-primary transition-all duration-200"
        >
          <Settings size={14} className="text-text-tertiary opacity-70" />
          <span className="text-[11px] font-semibold">Settings</span>
        </motion.button>
      </div>
    </aside>
  );
}

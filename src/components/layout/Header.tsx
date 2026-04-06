import { Share2, MoreHorizontal, MessageSquare, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeaderProps {
  isThread?: boolean;
  threadTitle?: string;
  conversationTitle?: string;
  isNewChat?: boolean;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export function Header({ 
  isThread = false, 
  threadTitle, 
  conversationTitle, 
  isNewChat = false,
  isSidebarOpen = true,
  onToggleSidebar
}: HeaderProps) {
  return (
    <header className="h-14 flex-shrink-0 flex items-center justify-between px-6 border-b border-border bg-white/80 backdrop-blur-md z-30">
      <div className="flex items-center gap-4">
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

        <div className="flex items-center gap-2.5">
          {isThread ? (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary-soft flex items-center justify-center text-primary">
                <MessageSquare size={14} strokeWidth={2.5} />
              </div>
              <span className="text-sm font-bold text-text-primary tracking-tight">{threadTitle}</span>
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-primary text-white uppercase tracking-wider">Thread</span>
            </div>
          ) : (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-text-primary tracking-tight">
                {isNewChat ? 'New insight' : (conversationTitle || 'New insight')}
              </span>
              {!isNewChat && (
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest opacity-70">Live Analysis</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-bg-subtle transition-all border border-transparent hover:border-border"
        >
          <Share2 size={18} strokeWidth={2} />
        </motion.button>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-bg-subtle transition-all border border-transparent hover:border-border"
        >
          <MoreHorizontal size={18} strokeWidth={2} />
        </motion.button>
      </div>
    </header>
  );
}

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { ChatMessage, MessageBlock, Entity, ChartElement } from '../../data/types';
import { MessageContent } from './MessageContent';
import { TrustLayer } from './TrustLayer';
import { FollowUpChips } from '../canvas/FollowUpChips';

interface ChatMessageProps {
  message: ChatMessage;
  isVisible: (blockKey: string) => boolean;
  compact?: boolean;
  onOpenThread?: (message: ChatMessage, block: MessageBlock, blockIndex: number) => void;
  onSend?: (msg: string) => void;
  onEntitySelect?: (entity: Entity, x: number, y: number) => void;
  onChartElementSelect?: (element: ChartElement, x: number, y: number) => void;
  onTableCellSelect?: (cell: { rowIndex: number; colIndex: number; value: string | number; header: string; rowLabel: string }, x: number, y: number) => void;
}

export function ChatMessageItem({
  message, isVisible, compact = false,
  onOpenThread, onSend,
  onEntitySelect, onChartElementSelect, onTableCellSelect,
}: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const canThread = isAssistant && onOpenThread !== undefined;
  const [trustOpen, setTrustOpen] = useState(false);

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex justify-end px-6 py-2"
      >
        <div className="max-w-[75%]">
          <div className="bg-gradient-to-br from-primary to-primary-dark text-white rounded-premium rounded-tr-sm px-5 py-3.5 shadow-premium relative group">
            <p className="text-[14px] leading-relaxed font-medium">
              {message.blocks[0]?.type === 'text' ? message.blocks[0].content : ''}
            </p>
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-premium rounded-tr-sm pointer-events-none" />
          </div>
          <p className="text-[10px] text-text-tertiary text-right mt-1.5 px-2 font-medium opacity-60 uppercase tracking-wider">
            {message.timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-start gap-4 px-6 py-3"
    >
      {/* Avatar */}
      {!compact && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="w-9 h-9 rounded-2xl flex-shrink-0 mt-1 overflow-hidden shadow-premium relative group"
        >
          <div className="w-full h-full bg-gradient-to-br from-primary via-chart-5 to-primary-dark flex items-center justify-center relative z-10">
            <motion.div animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
              <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
                <path d="M4 7.5h6M7 4.5v6" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </motion.div>
          </div>
          <div className="absolute inset-0 bg-primary/20 blur-md group-hover:blur-lg transition-all" />
        </motion.div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {!compact && (
          <div className="flex items-center gap-3 mb-2.5 px-1">
            <span className="text-xs font-bold text-text-primary tracking-tight">Pulse</span>
            <div className="h-1 w-1 rounded-full bg-text-tertiary opacity-40" />
            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest opacity-60">assistant</span>
          </div>
        )}

        <MessageContent
          blocks={message.blocks}
          messageId={message.id}
          isVisible={isVisible}
          onOpenThread={canThread ? (block, index) => onOpenThread?.(message, block, index) : undefined}
          onEntitySelect={onEntitySelect}
          onChartElementSelect={onChartElementSelect}
          onTableCellSelect={onTableCellSelect}
        />

        {message.trustLayer && (
          <div className="mt-3">
            <TrustLayer trustLayer={message.trustLayer} isOpen={trustOpen} onToggle={() => setTrustOpen(!trustOpen)} />
          </div>
        )}

        {message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-3">
            <FollowUpChips suggestions={message.suggestions}
              onSelect={(item) => { if (item.type === 'suggestion' && onSend) onSend(item.label); }} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

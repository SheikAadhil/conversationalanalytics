import { useState, useRef, useCallback, type KeyboardEvent } from 'react';
import { SendHorizonal, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ContextChip } from '../../data/types';
import { ContextChipUI } from './ContextChipUI';

interface ChatInputProps {
  onSend: (message: string, chips: ContextChip[]) => void;
  disabled?: boolean;
  placeholder?: string;
  chips?: ContextChip[];
  onRemoveChip?: (chipId: string) => void;
  onEditChip?: (chipId: string, updated: ContextChip) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  inputRef?: React.RefObject<HTMLDivElement | null>;
}

export function ChatInput({
  onSend,
  disabled,
  placeholder = 'Ask Pulse...',
  chips = [],
  onRemoveChip,
  onEditChip,
  onFocus,
  onBlur,
  inputRef,
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    adjustHeight();
  };

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    onSend(value.trim(), chips);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = value.trim().length > 0 && !disabled;
  const hasChips = chips.length > 0;

  return (
    <div className="px-4 md:px-6 pb-4 pt-1">
      {/* Input field — chips live INSIDE it, at the left edge */}
      <div className="relative group">
        <motion.div
          ref={inputRef}
          initial={false}
          animate={{
            boxShadow: value.trim() || hasChips
              ? '0 0 15px rgba(99, 102, 241, 0.06)'
              : '0 1px 2px rgba(0,0,0,0.04)',
          }}
          className="bg-bg-surface border border-border rounded-xl shadow-soft flex items-end gap-2 p-1.5 transition-all duration-300 focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/5 focus-within:shadow-premium"
        >
          {/* Inline chips + textarea */}
          <div className="flex items-end gap-1.5 min-w-0 flex-1">
            {/* Chips inside the input */}
            <AnimatePresence>
              {chips.map((chip) => (
                <ContextChipUI
                  key={chip.id}
                  chip={chip}
                  onRemove={onRemoveChip ?? (() => {})}
                  onEdit={onEditChip ?? (() => {})}
                />
              ))}
            </AnimatePresence>

            {/* Textarea — grows with content */}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={onFocus}
              onBlur={onBlur}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className="flex-1 bg-transparent px-2 py-2 text-[13px] text-text-primary placeholder:text-text-tertiary/60 outline-none resize-none font-medium leading-[1.4] max-h-36 disabled:opacity-50"
              style={{ minHeight: '38px' }}
            />
          </div>

          <motion.button
            onClick={handleSend}
            disabled={!canSend}
            whileHover={canSend ? { scale: 1.05, y: -1 } : undefined}
            whileTap={canSend ? { scale: 0.95 } : undefined}
            className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 relative overflow-hidden ${
              canSend
                ? 'bg-primary text-white shadow-premium hover:shadow-glow hover:bg-primary-dark'
                : 'bg-bg-subtle text-text-tertiary cursor-not-allowed opacity-50'
            }`}
          >
            <AnimatePresence mode="wait">
              {disabled ? (
                <motion.div
                  key="loader"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader2 size={16} strokeWidth={2.5} />
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="send"
                  initial={{ opacity: 0, scale: 0.5, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5, y: -10 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <SendHorizonal size={16} strokeWidth={2.5} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>
      </div>
      <p className="text-[9px] text-text-tertiary font-bold uppercase tracking-widest text-center mt-2 opacity-50 select-none">
        <span className="bg-bg-subtle px-1.5 py-0.5 rounded border border-border-light mr-1">Enter</span> to send
        <span className="mx-2 opacity-30">|</span>
        <span className="bg-bg-subtle px-1.5 py-0.5 rounded border border-border-light mr-1">Shift + Enter</span> for new line
      </p>
    </div>
  );
}

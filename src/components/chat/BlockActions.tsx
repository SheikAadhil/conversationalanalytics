import React, { useState, useEffect, isValidElement, cloneElement } from 'react';
import { Maximize2, Copy, Check, X, Download, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import ReactDOM from 'react-dom';

interface BlockActionsProps {
  children: React.ReactElement;
  onFullscreen: () => void;
  onThread?: () => void;
  blockRef: React.RefObject<HTMLDivElement | null>;
}

export function BlockActions({ children, onFullscreen, onThread, blockRef }: BlockActionsProps) {
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Clone child with ref attached for html2canvas capture
  const child = isValidElement(children)
    ? cloneElement(children, { ref: blockRef } as any)
    : children;

  const handleCopyImage = async () => {
    const target = blockRef.current;
    if (!target) return;

    try {
      // Find and hide action buttons temporarily
      const actionButtons = target.querySelector('.action-buttons-container') as HTMLElement;
      if (actionButtons) actionButtons.style.display = 'none';

      // Mark the block so onclone can find the root element reliably
      target.dataset['capturing'] = 'true';

      const canvas = await html2canvas(target, {
        backgroundColor: '#FFFFFF',
        scale: 3, // Higher scale for better quality
        logging: false,
        useCORS: true,
        borderRadius: 18,
        onclone: (doc) => {
          const root = doc.querySelector('[data-capturing="true"]') as HTMLElement;
          if (!root) return;

          // Hide action buttons in the cloned document
          const clonedButtons = root.querySelector('.action-buttons-container') as HTMLElement;
          if (clonedButtons) clonedButtons.style.display = 'none';

          // Hide filter/sort bar in tables for a cleaner export
          const filterBar = root.querySelector('.table-filter-bar') as HTMLElement;
          if (filterBar) filterBar.style.display = 'none';

          // Set explicit colors on the root — cascades to children
          root.style.backgroundColor = '#FFFFFF';
          root.style.color = '#111827';

          // Override all text elements with hard-coded colors
          const textEls = root.querySelectorAll('[class*="text-"]');
          textEls.forEach((el) => {
            const htmlEl = el as HTMLElement;
            const cls = htmlEl.className || '';
            if (cls.includes('text-text-secondary')) {
              htmlEl.style.color = '#6B7280';
            } else if (cls.includes('text-text-tertiary')) {
              htmlEl.style.color = '#9CA3AF';
            } else if (cls.includes('text-text-primary')) {
              htmlEl.style.color = '#111827';
            } else if (cls.includes('text-primary')) {
              htmlEl.style.color = '#6366F1';
            }
          });

          // Fix SVG axis labels
          const svgTexts = root.querySelectorAll('svg text');
          svgTexts.forEach((t) => {
            const el = t as SVGTextElement;
            el.style.fill = '#374151';
          });
        }
      });

      // Clean up the flag
      delete target.dataset['capturing'];

      if (actionButtons) actionButtons.style.display = 'flex';

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          setCopied(true);
          setShowToast(true);
          setTimeout(() => {
            setCopied(false);
            setShowToast(false);
          }, 2000);
        } catch {
          const url = canvas.toDataURL('image/png');
          const a = document.createElement('a');
          a.href = url;
          a.download = `pulse-export-${Date.now()}.png`;
          a.click();
          setShowToast(true);
          setTimeout(() => setShowToast(false), 2000);
        }
      }, 'image/png');
    } catch (err) {
      console.error('Failed to copy image:', err);
    }
  };

  const handleDownload = async () => {
    const target = blockRef.current;
    if (!target) return;

    try {
      // Mark the block so onclone can find the root element reliably
      target.dataset['capturing'] = 'true';

      const canvas = await html2canvas(target, {
        backgroundColor: '#FFFFFF',
        scale: 3,
        logging: false,
        useCORS: true,
        borderRadius: 18,
        onclone: (doc) => {
          const root = doc.querySelector('[data-capturing="true"]') as HTMLElement;
          if (!root) return;

          const clonedButtons = root.querySelector('.action-buttons-container') as HTMLElement;
          if (clonedButtons) clonedButtons.style.display = 'none';
          const filterBar = root.querySelector('.table-filter-bar') as HTMLElement;
          if (filterBar) filterBar.style.display = 'none';

          root.style.backgroundColor = '#FFFFFF';
          root.style.color = '#111827';

          const textEls = root.querySelectorAll('[class*="text-"]');
          textEls.forEach((el) => {
            const htmlEl = el as HTMLElement;
            const cls = htmlEl.className || '';
            if (cls.includes('text-text-secondary')) {
              htmlEl.style.color = '#6B7280';
            } else if (cls.includes('text-text-tertiary')) {
              htmlEl.style.color = '#9CA3AF';
            } else if (cls.includes('text-text-primary')) {
              htmlEl.style.color = '#111827';
            } else if (cls.includes('text-primary')) {
              htmlEl.style.color = '#6366F1';
            }
          });

          const svgTexts = root.querySelectorAll('svg text');
          svgTexts.forEach((t) => {
            const el = t as SVGTextElement;
            el.style.fill = '#374151';
          });
        }
      });

      delete target.dataset['capturing'];
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `pulse-analysis-${Date.now()}.png`;
      a.click();
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (err) {
      console.error('Failed to download image:', err);
    }
  };

  return (
    <div className="relative group">
      {child}

      {/* Action buttons — appear on group hover */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="action-buttons-container absolute top-3 right-3 flex items-center gap-1.5 z-30 opacity-0 group-hover:opacity-100 transition-all duration-300"
        >
          {onThread && (
            <motion.button
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onThread}
              className="p-2 rounded-xl bg-white border border-border text-text-tertiary hover:text-primary hover:border-primary/30 transition-all shadow-premium"
            >
              <MessageSquare size={14} strokeWidth={2.5} />
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopyImage}
            className="p-2 rounded-xl bg-white border border-border text-text-tertiary hover:text-text-secondary hover:border-primary/30 transition-all shadow-premium"
          >
            {copied ? <Check size={14} strokeWidth={2.5} className="text-green-500" /> : <Copy size={14} strokeWidth={2} />}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDownload}
            className="p-2 rounded-xl bg-white border border-border text-text-tertiary hover:text-text-secondary hover:border-primary/30 transition-all shadow-premium"
          >
            <Download size={14} strokeWidth={2} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onFullscreen}
            className="p-2 rounded-xl bg-white border border-border text-text-tertiary hover:text-text-secondary hover:border-primary/30 transition-all shadow-premium"
          >
            <Maximize2 size={14} strokeWidth={2} />
          </motion.button>
        </motion.div>
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-text-primary text-white text-[11px] font-bold uppercase tracking-widest shadow-premium flex items-center gap-2 z-20"
          >
            {copied ? (
              <>
                <Check size={14} strokeWidth={3} className="text-green-400" />
                <span>Copied to clipboard</span>
              </>
            ) : (
              <>
                <Download size={14} strokeWidth={3} />
                <span>Saved as Image</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface FullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function FullscreenModal({ isOpen, onClose, title, subtitle, children }: FullscreenModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-text-primary/20 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full h-full bg-bg-base overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-white/80 backdrop-blur-md border-b border-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary-soft flex items-center justify-center text-primary shadow-sm">
              <Maximize2 size={16} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary tracking-tight leading-tight">{title}</h3>
              {subtitle && <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mt-0.5 opacity-70">{subtitle}</p>}
            </div>
          </div>
          <motion.button
            whileHover={{ rotate: 90, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-subtle text-text-tertiary hover:text-red-500 hover:bg-red-50 transition-all border border-border"
          >
            <X size={16} strokeWidth={2.5} />
          </motion.button>
        </div>

        <div className="flex-1 overflow-auto p-6 custom-scrollbar flex items-start justify-center">
          <div className="w-full max-w-[1600px]">
            {children}
          </div>
        </div>

        <div className="flex-shrink-0 px-6 py-2 bg-white/50 border-t border-border-light flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-border shadow-sm text-[9px] font-bold text-text-secondary">ESC</kbd>
              <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest">to close</span>
            </div>
            <div className="h-3 w-px bg-border-light" />
            <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest font-mono">PULSE_SYSTEM_V2.0</span>
          </div>
          <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest opacity-60">Immersive Data Visualizer</p>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

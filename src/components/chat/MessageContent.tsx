import { motion, AnimatePresence } from 'framer-motion';
import type { MessageBlock, Entity, ChartElement, Selection } from '../../data/types';
import { TextBlock } from './TextBlock';
import { TableBlock } from './TableBlock';
import { ChartBlock } from './ChartBlock';
import { TableSkeleton, ChartSkeleton } from './Skeleton';

interface MessageContentProps {
  blocks: MessageBlock[];
  messageId: string;
  isVisible: (blockKey: string) => boolean;
  onOpenThread?: (block: MessageBlock, blockIndex: number) => void;
  selection?: Selection;
  onEntitySelect?: (entity: Entity, x: number, y: number) => void;
  onChartElementSelect?: (element: ChartElement, x: number, y: number) => void;
  onTableCellSelect?: (cell: { rowIndex: number; colIndex: number; value: string | number; header: string; rowLabel: string }, x: number, y: number) => void;
}

export function MessageContent({ blocks, messageId, isVisible, onOpenThread, selection, onEntitySelect, onChartElementSelect, onTableCellSelect }: MessageContentProps) {
  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {blocks.map((block, index) => {
          const key = `${messageId}-${index}`;
          const visible = isVisible(key);

          if (!visible) {
            return (
              <motion.div
                key={`${key}-skeleton`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {block.type === 'table' && <TableSkeleton />}
                {block.type === 'chart' && <ChartSkeleton />}
                {block.type === 'text' && (
                  <div className="bg-bg-surface border border-border rounded-premium p-5 shadow-sm space-y-3">
                    {[100, 85, 92, 78, 60].map((w, i) => (
                      <div key={i} className="skeleton-shimmer rounded-md h-3" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                )}
              </motion.div>
            );
          }

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: index * 0.1 }}
              layout
            >
              {block.type === 'text' && block.content && (
                <TextBlock
                  content={block.content}
                  onThread={() => onOpenThread?.(block, index)}
                  onEntitySelect={onEntitySelect}
                />
              )}

              {block.type === 'table' && block.table && (
                <TableBlock
                  table={block.table}
                  onThread={() => onOpenThread?.(block, index)}
                  onCellSelect={onTableCellSelect}
                />
              )}

              {block.type === 'chart' && block.chart && (
                <ChartBlock
                  chart={block.chart}
                  onThread={() => onOpenThread?.(block, index)}
                  onElementSelect={onChartElementSelect}
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbNode {
  id: string;
  label: string;
  type: 'metric' | 'dimension' | 'time' | 'anomaly' | 'chartElement' | 'tableCell' | 'root';
}

interface BreadcrumbProps {
  path: BreadcrumbNode[];
  onNavigate: (index: number) => void;
  onClear: () => void;
}

const TYPE_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  metric: { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-400' },
  dimension: { bg: 'bg-pink-50', text: 'text-pink-700', dot: 'bg-pink-400' },
  time: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  anomaly: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400' },
  segment: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  chartElement: { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-400' },
  tableCell: { bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-400' },
  root: { bg: 'bg-bg-subtle', text: 'text-text-secondary', dot: 'bg-text-tertiary' },
};

function getStyle(type: string) {
  return TYPE_STYLES[type] ?? TYPE_STYLES.root;
}

export function Breadcrumb({ path, onNavigate, onClear }: BreadcrumbProps) {
  if (path.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="flex-shrink-0 px-6 py-2.5 border-b border-border-light bg-bg-surface/80 backdrop-blur-sm overflow-x-auto hide-scrollbar"
    >
      <div className="flex items-center gap-1 min-w-0">
        {path.map((node, index) => {
          const isLast = index === path.length - 1;
          const isRoot = index === 0;
          const style = getStyle(node.type);

          return (
            <div key={node.id} className="flex items-center gap-1 min-w-0">
              {isRoot ? (
                <button
                  onClick={() => onNavigate(index)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[12px] font-semibold transition-all hover:opacity-80 ${style.bg} ${style.text}`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: style.dot }}
                  />
                  {node.label}
                </button>
              ) : (
                <button
                  onClick={() => onNavigate(index)}
                  disabled={isLast}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[12px] font-medium transition-all min-w-0 ${
                    isLast
                      ? `${style.bg} ${style.text} cursor-default`
                      : `${style.bg} ${style.text} hover:opacity-80 cursor-pointer`
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: style.dot }}
                  />
                  <span className="truncate max-w-[120px]">{node.label}</span>
                </button>
              )}

              {!isLast && (
                <ChevronRight size={12} className="text-text-tertiary/50 flex-shrink-0" />
              )}
            </div>
          );
        })}

        {/* Clear all */}
        <button
          onClick={onClear}
          className="ml-2 px-2 py-1 rounded-lg text-[11px] font-medium text-text-tertiary hover:text-text-primary hover:bg-bg-subtle transition-colors flex-shrink-0"
        >
          Clear
        </button>
      </div>
    </motion.div>
  );
}

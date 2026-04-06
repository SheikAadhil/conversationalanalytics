import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Selection, Entity, ChartElement } from '../../data/types';
import { ENTITY_ACTIONS, ACTION_LABELS, type EntityAction } from '../../utils/entityRecognizer';

interface ContextualMenuProps {
  selection: Selection;
  onAction: (action: string, selection: Selection) => void;
  onClose: () => void;
  ignoreRef?: React.RefObject<HTMLElement | null>;
}

const CHART_ELEMENT_ACTIONS = ['drill_down', 'compare', 'explain', 'filter_to', 'show_factors'] as const;
const TABLE_CELL_ACTIONS = ['filter_to', 'compare', 'explain', 'break_down'] as const;

const ELEMENT_LABELS: Record<string, string> = {
  drill_down: 'Drill down',
  compare: 'Compare',
  explain: 'Explain why',
  filter_to: 'Filter to this',
  show_factors: 'Show contributing factors',
  break_down: 'Break down',
  trend: 'Show trend',
};

function EntityMenu({ entity, x, y, onAction }: {
  entity: Entity;
  x: number;
  y: number;
  onAction: (action: string) => void;
}) {
  const actions = ENTITY_ACTIONS[entity.type] ?? [];

  return (
    <div className="fixed z-50" style={{ left: x, top: y, maxWidth: 240 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: -4 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white/95 backdrop-blur-xl border border-border rounded-xl shadow-premium overflow-hidden min-w-[180px]"
      >
        {/* Entity chip */}
        <div className="px-3 py-2 bg-bg-subtle border-b border-border-light flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md ${
            entity.type === 'metric' ? 'bg-indigo-50 text-indigo-600' :
            entity.type === 'dimension' ? 'bg-pink-50 text-pink-600' :
            entity.type === 'time' ? 'bg-amber-50 text-amber-600' :
            entity.type === 'anomaly' ? 'bg-red-50 text-red-600' :
            'bg-emerald-50 text-emerald-600'
          }`}>
            {entity.type}
          </span>
          <span className="text-[12px] font-semibold text-text-primary truncate">
            {entity.display}
          </span>
        </div>

        {/* Actions */}
        <div className="p-1.5 space-y-0.5">
          {actions.map((action) => (
            <button
              key={action}
              onClick={() => onAction(action)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left hover:bg-bg-subtle transition-colors group"
            >
              <span className="text-[13px] font-semibold text-text-secondary group-hover:text-text-primary transition-colors">
                {ACTION_LABELS[action]}
              </span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function ChartElementMenu({ element, x, y, onAction }: {
  element: ChartElement;
  x: number;
  y: number;
  onAction: (action: string) => void;
}) {
  return (
    <div className="fixed z-50" style={{ left: x, top: y, maxWidth: 240 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: -4 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white/95 backdrop-blur-xl border border-border rounded-xl shadow-premium overflow-hidden min-w-[180px]"
      >
        {/* Chart element chip */}
        <div className="px-3 py-2 bg-bg-subtle border-b border-border-light flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-600">
            {element.chartType === 'bar' ? 'Bar' : element.chartType === 'pie' ? 'Slice' : 'Point'}
          </span>
          <span className="text-[12px] font-semibold text-text-primary truncate">
            {element.label}
          </span>
          <span className="text-[11px] font-mono font-bold text-text-secondary ml-auto">
            {typeof element.value === 'number' ? element.value.toLocaleString() : element.value}
          </span>
        </div>

        {/* Actions */}
        <div className="p-1.5 space-y-0.5">
          {CHART_ELEMENT_ACTIONS.map((action) => (
            <button
              key={action}
              onClick={() => onAction(action)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left hover:bg-bg-subtle transition-colors group"
            >
              <span className="text-[13px] font-semibold text-text-secondary group-hover:text-text-primary transition-colors">
                {ELEMENT_LABELS[action]}
              </span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function TableCellMenu({ cell, x, y, onAction }: {
  cell: { rowIndex: number; colIndex: number; value: string | number; header: string; rowLabel: string };
  x: number;
  y: number;
  onAction: (action: string) => void;
}) {
  return (
    <div className="fixed z-50" style={{ left: x, top: y, maxWidth: 240 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: -4 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white/95 backdrop-blur-xl border border-border rounded-xl shadow-premium overflow-hidden min-w-[180px]"
      >
        {/* Cell chip */}
        <div className="px-3 py-2 bg-bg-subtle border-b border-border-light flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-teal-50 text-teal-600">
            {cell.header}
          </span>
          <span className="text-[12px] font-semibold text-text-primary truncate">
            {typeof cell.value === 'number' ? cell.value.toLocaleString() : String(cell.value)}
          </span>
          {cell.rowLabel && (
            <span className="text-[10px] text-text-tertiary ml-auto truncate">
              {cell.rowLabel}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="p-1.5 space-y-0.5">
          {TABLE_CELL_ACTIONS.map((action) => (
            <button
              key={action}
              onClick={() => onAction(action)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left hover:bg-bg-subtle transition-colors group"
            >
              <span className="text-[13px] font-semibold text-text-secondary group-hover:text-text-primary transition-colors">
                {ELEMENT_LABELS[action]}
              </span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export function ContextualMenu({ selection, onAction, onClose, ignoreRef }: ContextualMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      // Don't close if click is inside the menu or inside the ignored element (e.g. chat input)
      if (menuRef.current && !menuRef.current.contains(target)) {
        if (ignoreRef?.current && ignoreRef.current.contains(target)) return;
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose, ignoreRef]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!selection.x || !selection.y) return null;

  return (
    <div ref={menuRef}>
      <AnimatePresence>
        {selection.type === 'entity' && selection.entity && (
          <EntityMenu
            entity={selection.entity}
            x={selection.x}
            y={selection.y}
            onAction={(action) => onAction(action, selection)}
          />
        )}
        {selection.type === 'chartElement' && selection.chartElement && (
          <ChartElementMenu
            element={selection.chartElement}
            x={selection.x}
            y={selection.y}
            onAction={(action) => onAction(action, selection)}
          />
        )}
        {selection.type === 'tableCell' && selection.tableCell && (
          <TableCellMenu
            cell={selection.tableCell}
            x={selection.x}
            y={selection.y}
            onAction={(action) => onAction(action, selection)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown } from 'lucide-react';
import type { ContextChip } from '../../data/types';
import { getChipDisplayLabel } from '../../utils/contextChipUtils';

const CHIP_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  metric:       { bg: 'bg-indigo-50',  text: 'text-indigo-700',  badge: 'bg-indigo-100 text-indigo-700' },
  dimension:    { bg: 'bg-pink-50',   text: 'text-pink-700',    badge: 'bg-pink-100 text-pink-700' },
  time:         { bg: 'bg-amber-50',  text: 'text-amber-700',   badge: 'bg-amber-100 text-amber-700' },
  anomaly:      { bg: 'bg-red-50',    text: 'text-red-700',     badge: 'bg-red-100 text-red-700' },
  segment:      { bg: 'bg-emerald-50',text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
  chartElement: { bg: 'bg-violet-50', text: 'text-violet-700',  badge: 'bg-violet-100 text-violet-700' },
  tableCell:    { bg: 'bg-teal-50',   text: 'text-teal-700',    badge: 'bg-teal-100 text-teal-700' },
};

const TYPE_LABELS: Record<string, string> = {
  metric: 'Metric',
  dimension: 'Dim',
  time: 'Time',
  anomaly: 'Anomaly',
  segment: 'Segment',
  chartElement: 'Point',
  tableCell: 'Cell',
};

interface ChipEditDropdownProps {
  chip: ContextChip;
  onClose: () => void;
  onConfirm: (updated: ContextChip) => void;
}

function ChipEditDropdown({ chip, onClose, onConfirm }: ChipEditDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Mock hierarchy for now — dimension chips get a parent hierarchy
  const hierarchy = ['All', 'EMEA', 'Nordic'];
  const currentDim = chip.dimension ?? chip.metric ?? '';

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.92, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: -4 }}
      transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
      className="absolute top-full left-0 mt-1 z-50 bg-white/95 backdrop-blur-xl border border-border rounded-xl shadow-premium overflow-hidden min-w-[140px]"
    >
      <div className="px-3 py-2 border-b border-border-light">
        <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Change scope</p>
      </div>
      <div className="p-1">
        {hierarchy.map((level) => (
          <button
            key={level}
            onClick={() => {
              onConfirm({ ...chip, dimension: level });
              onClose();
            }}
            className={`w-full text-left px-3 py-2 rounded-lg text-[12px] font-semibold transition-colors ${
              level === currentDim
                ? 'bg-primary-soft text-primary'
                : 'text-text-secondary hover:bg-bg-subtle hover:text-text-primary'
            }`}
          >
            {level}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

interface ContextChipUIProps {
  chip: ContextChip;
  onRemove: (id: string) => void;
  onEdit: (id: string, updated: ContextChip) => void;
  showRemove?: boolean;
}

export function ContextChipUI({ chip, onRemove, onEdit, showRemove = true }: ContextChipUIProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const colors = CHIP_COLORS[chip.chipType] ?? CHIP_COLORS.dimension;
  const label = getChipDisplayLabel(chip);

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-border-light ${colors.bg} ${colors.text} group`}
      >
        {/* Type badge */}
        <span className={`text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded ${colors.badge} ${colors.text}`}>
          {TYPE_LABELS[chip.chipType] ?? chip.chipType}
        </span>

        {/* Label */}
        <button
          onClick={() => setShowDropdown(v => !v)}
          className="flex items-center gap-0.5 text-[11px] font-semibold"
        >
          <span className="max-w-[120px] truncate">{label}</span>
          <ChevronDown size={10} className="opacity-50 group-hover:opacity-80 transition-opacity flex-shrink-0" />
        </button>

        {/* Remove */}
        {showRemove && (
          <button
            onClick={() => onRemove(chip.id)}
            className="ml-0.5 w-4 h-4 rounded flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity hover:bg-black/5"
          >
            <X size={10} strokeWidth={2.5} />
          </button>
        )}
      </motion.div>

      <AnimatePresence>
        {showDropdown && (
          <ChipEditDropdown
            chip={chip}
            onClose={() => setShowDropdown(false)}
            onConfirm={(updated) => onEdit(chip.id, updated)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

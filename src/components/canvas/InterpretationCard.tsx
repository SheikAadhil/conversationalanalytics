import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Check } from 'lucide-react';
import type { InterpretationCard as InterpretationCardType, CanvasOverrides } from '../../data/types';

interface InterpretationCardProps {
  card: InterpretationCardType;
  overrides: CanvasOverrides;
  onChange: (newChips: Record<string, string>) => void;
}

const CHIP_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  metric: { bg: 'bg-primary-soft', text: 'text-primary', border: 'border-primary/20' },
  dimension: { bg: 'bg-chart-2/10', text: 'text-chart-2', border: 'border-chart-2/20' },
  filter: { bg: 'bg-chart-4/10', text: 'text-chart-4', border: 'border-chart-4/20' },
  time_range: { bg: 'bg-chart-5/10', text: 'text-chart-5', border: 'border-chart-5/20' },
  comparison: { bg: 'bg-chart-3/10', text: 'text-chart-3', border: 'border-chart-3/20' },
};

export function InterpretationCard({ card, overrides, onChange }: InterpretationCardProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when entering edit mode
  useEffect(() => {
    if (editingId !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleStartEdit = (chipId: string, currentValue: string) => {
    setEditingId(chipId);
    setEditValue(currentValue);
  };

  const handleApply = () => {
    if (editingId && editValue.trim()) {
      onChange({ ...overrides.chipEdits, [editingId]: editValue.trim() });
    }
    setEditingId(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApply();
    }
    if (e.key === 'Escape') {
      setEditingId(null);
      setEditValue('');
    }
  };

  // Compute the effective chip values (user edits override defaults)
  const effectiveChipValue = (chipId: string, defaultValue: string) => {
    return overrides.chipEdits[chipId] ?? defaultValue;
  };

  return (
    <div className="space-y-4">
      {/* Chip row */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {card.chips.map((chip, index) => {
          const isEditing = editingId === chip.id;
          const effectiveValue = effectiveChipValue(chip.id, chip.value);
          const colors = CHIP_COLORS[chip.type] ?? CHIP_COLORS.metric;

          return (
            <motion.div
              key={chip.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.06, type: 'spring', stiffness: 260, damping: 20 }}
              className="flex items-center gap-1.5"
            >
              {/* Chip pill */}
              <div
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${colors.bg} ${colors.border} ${
                  chip.editable && !isEditing ? 'cursor-pointer hover:shadow-sm group/chip' : ''
                } transition-all duration-200`}
                onClick={() => {
                  if (chip.editable && !isEditing) {
                    handleStartEdit(chip.id, chip.label);
                  }
                }}
              >
                {isEditing ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleApply}
                    className={`bg-transparent outline-none text-[13px] font-bold ${colors.text} min-w-[60px] max-w-[140px]`}
                  />
                ) : (
                  <>
                    <span className={`text-[13px] font-bold ${colors.text} transition-colors`}>
                      {chip.type === 'dimension' || chip.type === 'comparison'
                        ? effectiveValue
                        : chip.label}
                    </span>
                    {chip.editable && (
                      <Pencil
                        size={10}
                        strokeWidth={2.5}
                        className={`${colors.text} opacity-0 group-hover/chip:opacity-60 transition-opacity`}
                      />
                    )}
                  </>
                )}
              </div>

              {/* Arrow separator (not after last chip) */}
              {index < card.chips.length - 1 && (
                <span className="text-text-tertiary text-sm font-bold select-none">→</span>
              )}
            </motion.div>
          );
        })}

        {/* Apply button — appears when editing */}
        {editingId && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleApply}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-[12px] font-bold shadow-premium hover:bg-primary-dark transition-colors"
          >
            <Check size={12} strokeWidth={2.5} />
            Apply
          </motion.button>
        )}
      </div>

      {/* Summary */}
      <div className="pl-0.5">
        <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest">
          {card.summary}
        </span>
      </div>
    </div>
  );
}

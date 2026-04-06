import { motion } from 'framer-motion';
import type { SuggestionItem } from '../../data/types';

interface FollowUpChipsProps {
  suggestions: SuggestionItem[];
  onSelect: (item: SuggestionItem) => void;
}

export function FollowUpChips({ suggestions, onSelect }: FollowUpChipsProps) {
  if (!suggestions.length) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap pt-2">
      <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest opacity-60">
        Suggested
      </span>
      {suggestions.map((item, index) => (
        <motion.button
          key={item.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.06, type: 'spring', stiffness: 260, damping: 20 }}
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelect(item)}
          className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-200 border ${
            item.type === 'action'
              ? 'bg-chart-3/10 text-chart-3 border-chart-3/20 hover:bg-chart-3/20'
              : 'bg-bg-subtle text-text-secondary border-border hover:bg-primary-soft hover:text-primary hover:border-primary/30'
          }`}
        >
          {item.label}
        </motion.button>
      ))}
    </div>
  );
}

import { motion } from 'framer-motion';

interface SuggestionChipsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

export function SuggestionChips({ suggestions, onSelect }: SuggestionChipsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="px-6"
    >
      <div className="flex flex-wrap gap-2 justify-center">
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={suggestion}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.08, duration: 0.3, ease: 'easeOut' }}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(suggestion)}
            className="px-4 py-2 rounded-full text-xs font-medium bg-bg-surface border border-border text-text-secondary hover:bg-primary-soft hover:text-primary hover:border-primary transition-colors shadow-soft"
          >
            {suggestion}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

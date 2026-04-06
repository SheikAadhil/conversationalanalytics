import { useState, useMemo } from 'react';
import { Copy, Check, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Entity, Selection } from '../../data/types';
import { recognizeEntities } from '../../utils/entityRecognizer';

interface TextBlockProps {
  content: string;
  delay?: number;
  onThread?: () => void;
  onEntitySelect?: (entity: Entity, x: number, y: number) => void;
}

interface TextSegment {
  text: string;
  isBold: boolean;
  entityType?: 'metric' | 'dimension' | 'time' | 'anomaly' | 'segment';
  entityValue?: string;
  entityId?: string;
}

function parseTextWithEntities(raw: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let i = 0;

  while (i < raw.length) {
    if (raw[i] === '*' && raw[i + 1] === '*') {
      const end = raw.indexOf('**', i + 2);
      if (end !== -1) {
        const boldText = raw.slice(i + 2, end);
        // Detect entities within bold text
        const entities = recognizeEntities(boldText);
        if (entities.length > 0) {
          // Split bold text by entities
          let offset = 0;
          for (const entity of entities) {
            if (entity.startIndex > offset) {
              segments.push({ text: boldText.slice(offset, entity.startIndex), isBold: true });
            }
            segments.push({
              text: entity.display,
              isBold: true,
              entityType: entity.type,
              entityValue: entity.value,
              entityId: entity.id,
            });
            offset = entity.endIndex;
          }
          if (offset < boldText.length) {
            segments.push({ text: boldText.slice(offset), isBold: true });
          }
        } else {
          segments.push({ text: boldText, isBold: true });
        }
        i = end + 2;
        continue;
      }
    }

    // Collect plain text until next ** or end
    let j = i;
    while (j < raw.length && !(raw[j] === '*' && raw[j + 1] === '*')) {
      j++;
    }
    const plainText = raw.slice(i, j);

    // Detect entities in plain text
    const entities = recognizeEntities(plainText);
    if (entities.length > 0) {
      let offset = 0;
      for (const entity of entities) {
        if (entity.startIndex > offset) {
          segments.push({ text: plainText.slice(offset, entity.startIndex), isBold: false });
        }
        segments.push({
          text: entity.display,
          isBold: false,
          entityType: entity.type,
          entityValue: entity.value,
          entityId: entity.id,
        });
        offset = entity.endIndex;
      }
      if (offset < plainText.length) {
        segments.push({ text: plainText.slice(offset), isBold: false });
      }
    } else {
      segments.push({ text: plainText, isBold: false });
    }

    i = j;
  }

  return segments;
}

const ENTITY_STYLES: Record<string, string> = {
  metric: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  dimension: 'bg-pink-50 text-pink-700 border-pink-200',
  time: 'bg-amber-50 text-amber-700 border-amber-200',
  anomaly: 'bg-red-50 text-red-700 border-red-200',
  segment: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export function TextBlock({ content, onThread, onEntitySelect }: TextBlockProps) {
  const [copied, setCopied] = useState(false);

  const segments = useMemo(() => parseTextWithEntities(content), [content]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEntityClick = (e: React.MouseEvent, entityType?: string, entityValue?: string, entityId?: string) => {
    if (!entityType || !entityValue || !entityId) return;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = rect.left;
    const y = rect.bottom + 6;
    onEntitySelect?.(
      {
        id: entityId,
        type: entityType as Entity['type'],
        value: entityValue,
        display: (e.target as HTMLElement).textContent ?? entityValue,
        startIndex: 0,
        endIndex: 0,
      },
      x,
      y,
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative group mb-3"
    >
      <div className="bg-bg-surface border border-border rounded-premium p-5 shadow-premium group-hover:shadow-soft-lg transition-all duration-300">
        <div className="text-[15px] text-text-primary leading-[1.6] space-y-4 font-normal">
          {content.split('\n').map((line, lineIdx) => {
            if (!line.trim()) return <div key={lineIdx} className="h-3" />;

            const lineSegments = useMemo(() => parseTextWithEntities(line), [line]);

            return (
              <p key={lineIdx}>
                {lineSegments.map((seg, segIdx) => {
                  if (seg.entityType && seg.entityValue && seg.entityId) {
                    return (
                      <button
                        key={`${lineIdx}-${segIdx}`}
                        onClick={(e) => handleEntityClick(e, seg.entityType, seg.entityValue, seg.entityId)}
                        title={`${seg.entityType}: ${seg.entityValue}`}
                        className={`
                          inline-block mx-0.5 px-1 py-0.5 rounded-md text-[15px] cursor-pointer
                          border-b-2 border-dashed transition-all duration-150
                          hover:shadow-sm hover:-translate-y-px
                          active:scale-95
                          ${ENTITY_STYLES[seg.entityType] ?? ENTITY_STYLES.metric}
                        `}
                        style={{ borderBottomColor: 'currentColor', opacity: 0.85 }}
                      >
                        {seg.text}
                      </button>
                    );
                  }

                  if (seg.isBold) {
                    return (
                      <strong key={`${lineIdx}-${segIdx}`} className="font-semibold text-text-primary">
                        {seg.text}
                      </strong>
                    );
                  }

                  return <span key={`${lineIdx}-${segIdx}`}>{seg.text}</span>;
                })}
              </p>
            );
          })}
        </div>
      </div>

      {/* Action buttons */}
      <AnimatePresence>
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <motion.button
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
            className={`p-2 rounded-xl border transition-all duration-200 shadow-sm opacity-0 group-hover:opacity-100 ${
              copied
                ? 'bg-green-50 border-green-200 text-green-600'
                : 'bg-bg-surface border-border text-text-tertiary hover:text-primary hover:border-primary/30'
            }`}
          >
            {copied ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} strokeWidth={2} />}
          </motion.button>

          {onThread && (
            <motion.button
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onThread}
              className="p-2 rounded-xl bg-bg-surface border border-border text-text-tertiary hover:text-primary hover:border-primary/30 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm"
            >
              <MessageSquare size={14} strokeWidth={2} />
            </motion.button>
          )}
        </div>
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * Entity Recognizer
 *
 * Auto-detects analytical entities in AI-generated text:
 * - metrics: revenue, users, conversions, leads, etc.
 * - dimensions: region names, product tiers, channels, etc.
 * - time references: Q1 2026, January, last week, etc.
 * - anomalies: dropped 12%, grew 34%, increased 8.2%, etc.
 */

import type { Entity, EntityType } from '../data/types';

const METRIC_PATTERNS = [
  /\brevenue\b/gi,
  /\busers?\b/gi,
  /\bleads?\b/gi,
  /\bconversions?\b/gi,
  /\bdeals?\b/gi,
  /\bcontracts?\b/gi,
  /\bARR\b/gi,
  /\bMRR\b/gi,
  /\battainment\b/gi,
  /\bquota\b/gi,
  /\bretention\b/gi,
  /\bchurn\b/gi,
  /\bCAC\b/gi,
  /\bLTV\b/gi,
  /\bROI\b/gi,
  /\bCTR\b/gi,
  /\bCPL\b/gi,
  /\bCPA\b/gi,
  /\bMQLs?\b/gi,
  /\bSQLs?\b/gi,
  /\bpipeline\b/gi,
  /\bsales?\b/gi,
  /\bmarketing\b/gi,
  /\bproduct\b/gi,
  /\bopen rate\b/gi,
  /\bclick rate\b/gi,
];

const TIME_PATTERNS = [
  /\bQ[1-4]\s*20\d{2}\b/g,
  /\b20\d{2}\s*Q[1-4]\b/g,
  /\bJan(uary)?\b/gi,
  /\bFeb(ruary)?\b/gi,
  /\bMar(ch)?\b/gi,
  /\bApr(il)?\b/gi,
  /\bMay\b/gi,
  /\bJun(e)?\b/gi,
  /\bJul(y)?\b/gi,
  /\bAug(ust)?\b/gi,
  /\bSep(tember)?\b/gi,
  /\bOct(ober)?\b/gi,
  /\bNov(ember)?\b/gi,
  /\bDec(ember)?\b/gi,
  /\b(last|this|next)\s+(week|month|quarter|year)\b/gi,
  /\b(last|this|next)\s+week\b/gi,
  /\bweek\s*[1-9]\d*\b/gi,
  /\bmonth-over-month\b/gi,
  /\bYoY\b/gi,
  /\bYTD\b/gi,
  /\bH[12]\s*20\d{2}\b/g,
];

// Dimension values that appear in the data
const KNOWN_DIMENSIONS: Record<string, string[]> = {
  region: ['north america', 'south america', 'latin america', 'emea', 'apac', 'asia pacific', 'middle east', 'europe', 'apac', 'latam'],
  segment: ['enterprise', 'pro', 'starter', 'free trial', 'smb', 'mid-market'],
  channel: ['organic search', 'paid ads', 'social media', 'email', 'direct', 'referral', 'content', 'paid search'],
  campaign: ['product launch', 'holiday blitz', 'back to school', 'new year', 'spring launch', 'summer promo'],
  rep: ['marcus', 'jordan', 'priya', 'elena', 'aisha', 'david'],
};

const ANOMALY_PATTERNS = [
  /\b(dropped|decreased|fell|declined|down|crashed|plunged|tumbled)\s+\d+\.?\d*%/gi,
  /\b(grew|increased|rose|jumped|spiked|climbed|soared|up)\s+\d+\.?\d*%/gi,
  /\b(dipped|slipped|slid)\s+\d+\.?\d*%/gi,
  /\b(peak|high|low|record)\s+\d+\.?\d*%/gi,
  /\b(missed|below|under|underperformed)\s+\d+\.?\d*%/gi,
  /\b(exceeded|beat|above|overperformed|over)\s+\d+\.?\d*%/gi,
  /\b\d+\.?\d*%\s+(drop|decrease|decline|fall|drop|decline|increase|growth|rise|jump)/gi,
];

function matchAll(pattern: RegExp, text: string): Array<{ match: string; index: number }> {
  const results: Array<{ match: string; index: number }> = [];
  const re = new RegExp(pattern.source, pattern.flags);
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    results.push({ match: m[0], index: m.index });
    if (!pattern.global) break;
  }
  return results;
}

function detectDimensionType(value: string): EntityType {
  const lower = value.toLowerCase();
  for (const [type, values] of Object.entries(KNOWN_DIMENSIONS)) {
    if (values.some((v) => lower.includes(v))) {
      return 'dimension';
    }
  }
  return 'dimension';
}

let entityIdCounter = 0;
function nextId() {
  return `entity-${++entityIdCounter}`;
}

/**
 * Scans text and returns a list of detected entities with their positions.
 * Entities are sorted by start index and non-overlapping.
 */
export function recognizeEntities(text: string): Entity[] {
  const allMatches: Array<{ entity: Entity; start: number; end: number }> = [];

  // Metrics
  for (const pattern of METRIC_PATTERNS) {
    for (const { match, index } of matchAll(pattern, text)) {
      allMatches.push({
        start: index,
        end: index + match.length,
        entity: {
          id: nextId(),
          type: 'metric',
          value: match.toLowerCase().trim(),
          display: match.trim(),
          startIndex: index,
          endIndex: index + match.length,
        },
      });
    }
  }

  // Time references
  for (const pattern of TIME_PATTERNS) {
    for (const { match, index } of matchAll(pattern, text)) {
      allMatches.push({
        start: index,
        end: index + match.length,
        entity: {
          id: nextId(),
          type: 'time',
          value: match.toLowerCase().trim(),
          display: match.trim(),
          startIndex: index,
          endIndex: index + match.length,
        },
      });
    }
  }

  // Anomalies — detect first, highest priority
  for (const pattern of ANOMALY_PATTERNS) {
    for (const { match, index } of matchAll(pattern, text)) {
      allMatches.push({
        start: index,
        end: index + match.length,
        entity: {
          id: nextId(),
          type: 'anomaly',
          value: match.toLowerCase().trim(),
          display: match.trim(),
          startIndex: index,
          endIndex: index + match.length,
        },
      });
    }
  }

  // Sort by start position
  allMatches.sort((a, b) => a.start - b.start);

  // Remove overlaps — keep first, skip others that intersect
  const result: Entity[] = [];
  let lastEnd = 0;
  for (const item of allMatches) {
    if (item.start >= lastEnd) {
      result.push(item.entity);
      lastEnd = item.end;
    }
  }

  return result;
}

/**
 * Actions available for each entity type.
 * These are the ranked options shown in the contextual menu.
 */
export type EntityAction = 'drill_down' | 'compare' | 'explain' | 'trend' | 'break_down' | 'define' | 'correlate' | 'filter_to' | 'expand_range' | 'show_factors' | 'show_patterns';

export const ENTITY_ACTIONS: Record<EntityType, EntityAction[]> = {
  metric: ['trend', 'break_down', 'compare', 'define'],
  dimension: ['drill_down', 'compare', 'filter_to', 'explain'],
  time: ['expand_range', 'compare', 'show_factors', 'trend'],
  anomaly: ['explain', 'show_factors', 'show_patterns', 'drill_down'],
  segment: ['break_down', 'compare', 'trend', 'explain'],
};

export const ACTION_LABELS: Record<EntityAction, string> = {
  drill_down: 'Drill down',
  compare: 'Compare',
  explain: 'Explain why',
  trend: 'Show trend',
  break_down: 'Break down',
  define: 'Define metric',
  correlate: 'Correlate',
  filter_to: 'Filter to this',
  expand_range: 'Expand range',
  show_factors: 'Show contributing factors',
  show_patterns: 'Show past patterns',
};

export const ACTION_ICONS: Record<EntityAction, string> = {
  drill_down: '↓',
  compare: '⇄',
  explain: '?',
  trend: '↗',
  break_down: '⊞',
  define: 'ℹ',
  correlate: '◎',
  filter_to: '⊛',
  expand_range: '↔',
  show_factors: '≋',
  show_patterns: '∿',
};

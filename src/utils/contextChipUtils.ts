import type { Selection, ContextChip } from '../data/types';

const TIME_KEYWORDS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'q1', 'q2', 'q3', 'q4', 'qtd', 'ytd', 'mtd', 'yesterday', 'today', 'week', 'month', 'year'];

function isTimeLike(value: string): boolean {
  const lower = value.toLowerCase();
  return TIME_KEYWORDS.some(k => lower.includes(k));
}

function buildSingleChip(selection: Selection): ContextChip {
  const { type, entity, chartElement, tableCell } = selection;

  if (type === 'chartElement' && chartElement) {
    const dim = chartElement.label;
    const met = chartElement.chartTitle;
    const time = isTimeLike(dim) ? dim : isTimeLike(chartElement.chartType) ? chartElement.chartType : undefined;
    return {
      id: `chart-${chartElement.dataIndex}-${Date.now()}`,
      dimension: !isTimeLike(dim) ? dim : undefined,
      metric: met,
      timeScope: time,
      chipType: 'chartElement',
      sourceType: 'chartElement',
      selectionKey: `chart-${chartElement.dataIndex}`,
    };
  }

  if (type === 'entity' && entity) {
    const display = entity.display;
    const isTime = entity.type === 'time';
    const isMetric = entity.type === 'metric';
    return {
      id: `entity-${entity.startIndex}-${Date.now()}`,
      dimension: !isTime && !isMetric ? display : undefined,
      metric: isMetric ? display : undefined,
      timeScope: isTime ? display : undefined,
      chipType: entity.type,
      sourceType: 'entity',
      selectionKey: `entity-${entity.startIndex}`,
    };
  }

  if (type === 'tableCell' && tableCell) {
    return {
      id: `cell-${tableCell.rowIndex}-${tableCell.colIndex}-${Date.now()}`,
      dimension: tableCell.rowLabel,
      metric: tableCell.header,
      timeScope: isTimeLike(tableCell.rowLabel) ? tableCell.rowLabel : undefined,
      chipType: 'tableCell',
      sourceType: 'tableCell',
      selectionKey: `cell-${tableCell.rowIndex}-${tableCell.colIndex}`,
    };
  }

  // Fallback
  return {
    id: `fallback-${Date.now()}`,
    chipType: 'dimension',
    sourceType: 'entity',
    selectionKey: `fallback-${Date.now()}`,
  };
}

export function buildContextChips(selection: Selection | null): ContextChip[] {
  if (!selection || selection.type === null) return [];

  // For now, single selection — build one chip
  const chip = buildSingleChip(selection);

  // Filter out undefined fields to keep chip clean
  return [{ ...chip }];
}

export function getChipDisplayLabel(chip: ContextChip): string {
  const parts: string[] = [];
  if (chip.dimension) parts.push(chip.dimension);
  if (chip.metric) parts.push(chip.metric);
  if (chip.timeScope) parts.push(chip.timeScope);
  if (chip.extra) parts.push(chip.extra);
  return parts.join(' · ');
}

export function buildFullQuery(chips: ContextChip[], text: string): string {
  if (chips.length === 0) return text;
  const chipStr = chips.map(c => getChipDisplayLabel(c)).join(' ');
  return `[${chipStr}] ${text}`;
}

// Generate context-aware autocomplete suggestions based on current input text and active chips
export function generateSuggestions(text: string, chips: ContextChip[]): string[] {
  const lower = text.toLowerCase().trim();

  if (!lower) return [];

  // Suggestions keyed by the first word the user types
  const firstWord = lower.split(/\s+/)[0] ?? lower;

  const chipLabel = chips.length > 0
    ? chips.map(c => c.dimension ?? c.metric ?? c.timeScope ?? '').filter(Boolean).join(' & ')
    : 'this';

  const templates: Record<string, string[]> = {
    why: [
      `why is ${chipLabel} higher?`,
      `why is ${chipLabel} lower than expected?`,
      `why did ${chipLabel} change?`,
    ],
    show: [
      `show ${chipLabel} trend over time`,
      `show breakdown of ${chipLabel}`,
      `show ${chipLabel} vs last period`,
    ],
    compare: [
      `compare ${chipLabel} across regions`,
      `compare ${chipLabel} to target`,
      `compare ${chipLabel} to last year`,
    ],
    what: [
      `what drove ${chipLabel}?`,
      `what factors affected ${chipLabel}?`,
      `what is ${chipLabel}?`,
    ],
    how: [
      `how does ${chipLabel} perform?`,
      `how does ${chipLabel} compare to budget?`,
    ],
    list: [
      `list top drivers of ${chipLabel}`,
      `list factors behind ${chipLabel}`,
    ],
  };

  const generic: string[] = [
    `break down ${chipLabel} by dimension`,
    `explain ${chipLabel}`,
    `drill down into ${chipLabel}`,
  ];

  const base = templates[firstWord] ?? generic;
  return base.slice(0, 3);
}

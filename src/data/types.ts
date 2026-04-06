export type BlockType = 'text' | 'table' | 'chart';

export interface TableData {
  headers: string[];
  rows: (string | number)[][];
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie';
  title: string;
  subtitle?: string;
  dataKey: string;
  nameKey: string;
  data: any[];
}

export interface MessageBlock {
  type: BlockType;
  content?: string;
  table?: TableData;
  chart?: ChartConfig;
}

// --- Interpretation Card ---
export type ChipType = 'metric' | 'dimension' | 'filter' | 'time_range' | 'comparison';

export interface InterpretationChip {
  id: string;
  type: ChipType;
  label: string;    // display: "Revenue", "by Region"
  value: string;    // underlying: "revenue", "region"
  editable: boolean;
}

export interface InterpretationCard {
  id: string;
  chips: InterpretationChip[];
  summary: string;  // "Revenue → by Region → Q1 2026"
  primaryChartBlockIndex: number;
}

// --- Trust Layer ---
export interface TrustLayer {
  metricDefinitions: Array<{ name: string; definition: string; formula?: string }>;
  filters: Array<{ field: string; operator: string; value: string }>;
  dataFreshness: {
    lastUpdated: string;
    range: string;
    source: string;
  };
  reasoning?: string;
}

// --- Per-Response Suggestions ---
export type SuggestionType = 'suggestion' | 'action';

export interface SuggestionItem {
  id: string;
  label: string;
  type: SuggestionType;
}

// --- Selection System ---
export type EntityType = 'metric' | 'dimension' | 'time' | 'anomaly' | 'segment';

export interface Entity {
  id: string;
  type: EntityType;
  value: string;
  display: string;
  startIndex: number;
  endIndex: number;
}

export interface ChartElement {
  type: 'bar' | 'linePoint' | 'pieSlice' | 'axisLabel';
  dataIndex: number;
  name: string;
  value: number;
  label: string;
  chartType: 'line' | 'bar' | 'pie';
  chartTitle: string;
}

export interface TableCell {
  rowIndex: number;
  colIndex: number;
  value: string | number;
  header: string;
  rowLabel: string;
}

export type SelectionType = 'entity' | 'chartElement' | 'tableCell' | null;

export interface Selection {
  type: SelectionType;
  entity?: Entity;
  chartElement?: ChartElement;
  tableCell?: TableCell;
  sourceMessageId?: string;
  x?: number;
  y?: number;
}

// --- Canvas State ---
export interface ChartFilters {
  timeRange?: string;
  topN?: number | null;
  threshold?: number;
}

export interface CanvasOverrides {
  chipEdits: Record<string, string>;  // chipId → edited value
  chartFilters: ChartFilters;
}

export interface CanvasState {
  activeInterpretationMessageId: string | null;
  overrides: CanvasOverrides;
}

// --- Messages & Threads ---
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  blocks: MessageBlock[];
  timestamp: Date;
  interpretationCard?: InterpretationCard;
  trustLayer?: TrustLayer;
  suggestions?: SuggestionItem[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: Date;
}

export interface ChatThread {
  id: string;
  parentMessageId: string;
  contextBlockIndex?: number;
  contextBlock?: MessageBlock;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  canvasSnapshot?: CanvasState;
}

import { useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { ChartConfig, SuggestionItem, InterpretationCard as InterpretationCardType, CanvasOverrides, ChartFilters } from '../../data/types';
import { InterpretationCard } from './InterpretationCard';
import { FollowUpChips } from './FollowUpChips';
import { TrustLayer } from '../chat/TrustLayer';
import { contextualPrompts, defaultPrompts } from '../../data/firstPrompts';

const CHART_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'];

type TimeRange = '6m' | 'ytd' | '1y' | 'all';
type TopN = 3 | 5 | null;

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  '6m': '6M',
  'ytd': 'YTD',
  '1y': '1Y',
  'all': 'All',
};

function getTimeRangeSlice(data: any[], type: 'line' | 'bar', range: TimeRange): any[] {
  if (range === 'all') return data;
  const len = data.length;
  if (len <= 4) return data;
  if (range === '6m') return data.slice(-6);
  if (range === 'ytd') return data.slice(0, Math.floor(len * 0.7));
  if (range === '1y') return data.slice(-12);
  return data;
}

function getTopNData(data: any[], dataKey: string, topN: TopN): any[] {
  if (!topN) return data;
  return [...data].sort((a, b) => (b[dataKey] || 0) - (a[dataKey] || 0)).slice(0, topN);
}

function getThresholdData(data: any[], dataKey: string, threshold: number): { data: any[]; others: number } {
  if (threshold <= 0) return { data, others: 0 };
  const total = data.reduce((sum: number, d: any) => sum + (d[dataKey] || 0), 0);
  const kept: any[] = [];
  let othersSum = 0;
  data.forEach((d: any) => {
    const val = d[dataKey] || 0;
    const pct = (val / total) * 100;
    if (pct >= threshold) kept.push(d);
    else othersSum += val;
  });
  if (othersSum > 0) kept.push({ ...data[0], [dataKey]: othersSum, name: 'Others' });
  return { data: kept, others: othersSum };
}

function ChartFilterBar({
  type: chartType,
  timeRange,
  setTimeRange,
  topN,
  setTopN,
  threshold,
  setThreshold,
}: {
  type: 'line' | 'bar' | 'pie';
  timeRange: TimeRange;
  setTimeRange: (r: TimeRange) => void;
  topN: TopN;
  setTopN: (n: TopN) => void;
  threshold: number;
  setThreshold: (t: number) => void;
}) {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      {(chartType === 'line' || chartType === 'bar') && (
        <div className="flex items-center gap-1.5 bg-bg-subtle rounded-xl p-1 border border-border-light shadow-sm">
          {(['6m', 'ytd', '1y', 'all'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all duration-200 ${
                timeRange === r
                  ? 'bg-primary text-white shadow-premium'
                  : 'text-text-tertiary hover:text-text-secondary hover:bg-white'
              }`}
            >
              {TIME_RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      )}
      {chartType === 'bar' && (
        <div className="flex items-center gap-1.5 bg-bg-subtle rounded-xl p-1 border border-border-light shadow-sm">
          <span className="px-2 py-1 text-[10px] text-text-tertiary font-bold uppercase tracking-widest opacity-60">Top</span>
          {([3, 5, null] as TopN[]).map((n) => (
            <button
              key={String(n)}
              onClick={() => setTopN(n)}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all duration-200 ${
                topN === n
                  ? 'bg-primary text-white shadow-premium'
                  : 'text-text-tertiary hover:text-text-secondary hover:bg-white'
              }`}
            >
              {n === null ? 'All' : n}
            </button>
          ))}
        </div>
      )}
      {chartType === 'pie' && (
        <div className="flex items-center gap-4 bg-bg-subtle rounded-xl px-4 py-2 border border-border-light shadow-sm">
          <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest opacity-60">Sensitivity</span>
          <input
            type="range" min={0} max={20} step={1}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-24 h-1 accent-primary cursor-pointer appearance-none bg-border-light rounded-full"
          />
          <span className="text-[11px] font-bold font-mono text-text-primary min-w-[3ch]">
            {threshold === 0 ? 'OFF' : `${threshold}%`}
          </span>
        </div>
      )}
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-surface/90 backdrop-blur-md border border-border rounded-xl shadow-premium px-4 py-3 min-w-[140px]">
      <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest mb-2 opacity-70">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-xs font-semibold text-text-secondary">{entry.name}</span>
            </div>
            <span className="text-xs font-bold text-text-primary">
              {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartRenderer({ chart, height = 320 }: { chart: ChartConfig; height?: number }) {
  const { type, data, dataKey, nameKey } = chart;

  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="canvasLineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis dataKey={nameKey} tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} dy={10}/>
          <YAxis tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} width={45}
            tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v))}/>
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E2E8F0', strokeWidth: 1.5 }} />
          <Line type="monotone" dataKey={dataKey} stroke="#6366F1" strokeWidth={3}
            dot={{ fill: '#6366F1', strokeWidth: 2, r: 4, stroke: '#fff' }}
            activeDot={{ r: 7, fill: '#6366F1', strokeWidth: 3, stroke: '#fff' }}
            animationDuration={1500}/>
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis dataKey={nameKey} tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} dy={10}/>
          <YAxis tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} width={45}
            tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v))}/>
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC', opacity: 0.4 }} />
          <Bar dataKey={dataKey} fill="#6366F1" radius={[6, 6, 0, 0]} maxBarSize={48} animationDuration={1200}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} fillOpacity={0.9} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'pie') {
    return (
      <div className="flex flex-col items-center gap-10">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={80} outerRadius={115} paddingAngle={6}
              dataKey={dataKey} nameKey={nameKey} stroke="none" animationDuration={1400}>
              {data.map((_: any, index: number) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]}/>
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="w-full max-w-md space-y-3.5">
          {data.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-4 group cursor-default">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}/>
              <span className="text-xs font-semibold text-text-secondary truncate flex-1 group-hover:text-text-primary transition-colors">
                {entry[nameKey]}
              </span>
              <span className="text-xs font-bold font-mono text-text-primary bg-bg-subtle px-2 py-0.5 rounded-md border border-border-light">
                {typeof entry[dataKey] === 'number' ? `${entry[dataKey]}%` : entry[dataKey]}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

interface CanvasPanelProps {
  activeMessage: import('../../data/types').ChatMessage | null;
  canvasOverrides: CanvasOverrides;
  onOverridesChange: (overrides: CanvasOverrides) => void;
  onOpenChat: () => void;
  onSendMessage: (msg: string) => void;
  hasMessages: boolean;
}

export function CanvasPanel({
  activeMessage,
  canvasOverrides,
  onOverridesChange,
  onOpenChat,
  onSendMessage,
  hasMessages,
}: CanvasPanelProps) {
  const [trustOpen, setTrustOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [topN, setTopN] = useState<TopN>(null);
  const [threshold, setThreshold] = useState(0);

  // Sync filters from overrides
  const chartFilters: ChartFilters = canvasOverrides.chartFilters;

  // Get the chart block
  const card = activeMessage?.interpretationCard;
  const chartBlockIndex = card?.primaryChartBlockIndex;
  const chartBlock = chartBlockIndex != null ? activeMessage?.blocks[chartBlockIndex] : null;
  const chart = chartBlock?.type === 'chart' ? chartBlock.chart : null;
  const trustLayer = activeMessage?.trustLayer;
  const suggestions = activeMessage?.suggestions ?? [];

  // Apply filters to chart data
  const filteredData = useMemo(() => {
    if (!chart) return null;
    let result = (chart.type === 'line' || chart.type === 'bar')
      ? getTimeRangeSlice(chart.data, chart.type, timeRange)
      : chart.data;
    if (chart.type === 'bar' && topN) result = getTopNData(result, chart.dataKey, topN);
    if (chart.type === 'pie' && threshold > 0) {
      const { data: thresholded } = getThresholdData(result, chart.dataKey, threshold);
      result = thresholded;
    }
    return result;
  }, [chart, timeRange, topN, threshold]);

  const filteredChart = filteredData ? { ...chart, data: filteredData } : null;

  const handleSuggestion = (item: SuggestionItem) => {
    if (item.type === 'suggestion') {
      onSendMessage(item.label);
    }
  };

  return (
    <div className="h-full flex flex-col bg-bg-base">
      {/* Canvas header */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-white/60 backdrop-blur-md border-b border-border z-10">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-xl bg-primary-soft flex items-center justify-center text-primary shadow-sm">
            <svg width="14" height="14" viewBox="0 0 36 36" fill="none">
              <path d="M8 18h20M18 8v20" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h2 className="text-[13px] font-bold text-text-primary tracking-tight">Canvas</h2>
            <p className="text-[10px] text-text-tertiary font-medium">Live exploration view</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasMessages && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onOpenChat}
              className="px-3 py-1.5 rounded-xl text-[12px] font-bold bg-primary text-white shadow-premium hover:bg-primary-dark transition-colors flex items-center gap-1.5"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Chat
            </motion.button>
          )}
        </div>
      </div>

      {/* Canvas content */}
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
          {!chart || !card ? (
            // Empty state — first prompts
            <CanvasEmptyState onOpenChat={onOpenChat} onSendMessage={onSendMessage} />
          ) : (
            <>
              {/* Interpretation card */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="bg-bg-surface border border-border rounded-premium p-5 shadow-soft"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest opacity-70">
                    Showing
                  </span>
                </div>
                <InterpretationCard
                  card={card}
                  overrides={canvasOverrides}
                  onChange={(chipEdits) => onOverridesChange({ ...canvasOverrides, chipEdits })}
                />
              </motion.div>

              {/* Chart */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="bg-bg-surface border border-border rounded-premium p-5 shadow-soft"
              >
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div>
                    <h4 className="text-[14px] font-bold text-text-primary tracking-tight">{chart.title}</h4>
                    {chart.subtitle && (
                      <p className="text-[11px] text-text-tertiary font-medium mt-0.5">{chart.subtitle}</p>
                    )}
                  </div>
                </div>

                <ChartFilterBar
                  type={chart.type}
                  timeRange={timeRange}
                  setTimeRange={setTimeRange}
                  topN={topN}
                  setTopN={setTopN}
                  threshold={threshold}
                  setThreshold={setThreshold}
                />

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-6"
                >
                  {filteredChart && <ChartRenderer chart={filteredChart} />}
                </motion.div>
              </motion.div>

              {/* Trust layer */}
              {trustLayer && (
                <TrustLayer
                  trustLayer={trustLayer}
                  isOpen={trustOpen}
                  onToggle={() => setTrustOpen(!trustOpen)}
                />
              )}

              {/* Follow-up chips */}
              {suggestions.length > 0 && (
                <FollowUpChips suggestions={suggestions} onSelect={handleSuggestion} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CanvasEmptyState({ onOpenChat, onSendMessage }: { onOpenChat: () => void; onSendMessage: (msg: string) => void }) {

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-8">
      {/* Decorative chart icon */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="relative"
      >
        <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-primary via-chart-5 to-primary-dark flex items-center justify-center shadow-premium">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path d="M8 24L14 16L20 20L28 10" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="28" cy="10" r="3" fill="white"/>
            <path d="M8 28h20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.4"/>
          </svg>
        </div>
        <div className="absolute inset-0 rounded-[24px] bg-primary/30 blur-xl -z-10 animate-pulse"/>
      </motion.div>

      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-text-primary tracking-tight">
          Your visualization will appear here
        </h3>
        <p className="text-[14px] text-text-secondary max-w-sm leading-relaxed">
          Ask a question or tap a suggestion below to generate your first chart.
        </p>
      </div>

      {/* Default prompts as large cards */}
      <div className="w-full max-w-lg space-y-2">
        <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest text-center mb-3 opacity-70">
          Try asking about
        </p>
        {defaultPrompts.map((prompt: { label: string; query: string }, index: number) => (
          <motion.button
            key={prompt.query}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              onSendMessage(prompt.query);
            }}
            className="w-full flex items-center justify-between px-4 py-3 bg-bg-surface rounded-xl border border-border hover:border-primary/40 hover:shadow-soft transition-all group text-left"
          >
            <span className="text-[13px] font-semibold text-text-secondary group-hover:text-text-primary transition-colors">
              {prompt.label}
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-text-tertiary group-hover:text-primary transition-colors">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

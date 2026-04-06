import { useState, useRef, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ReferenceDot, ReferenceLine, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import type { ChartConfig, ChartElement } from '../../data/types';
import { BlockActions, FullscreenModal } from './BlockActions';

interface ChartBlockProps {
  chart: ChartConfig;
  delay?: number;
  onThread?: () => void;
  onElementSelect?: (element: ChartElement, x: number, y: number) => void;
}

const CHART_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'];
const HOVER_COLORS = ['#4F46E5', '#7C3AED', '#DB2777', '#059669', '#D97706'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-md border border-border rounded-xl shadow-premium px-4 py-3 min-w-[140px]">
      <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest mb-2 opacity-70">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-xs font-semibold text-text-secondary">{entry.name}</span>
          </div>
          <span className="text-xs font-bold text-text-primary">
            {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            {entry.unit || ''}
          </span>
        </div>
      ))}
    </div>
  );
};

type TimeRange = '6m' | 'ytd' | '1y' | 'all';
type TopN = 3 | 5 | null;

const TIME_LABELS: Record<TimeRange, string> = { '6m': '6M', 'ytd': 'YTD', '1y': '1Y', 'all': 'All' };

function sliceTime(data: any[], type: 'line' | 'bar', r: TimeRange): any[] {
  if (r === 'all' || data.length <= 4) return data;
  if (r === '6m') return data.slice(-6);
  if (r === 'ytd') return data.slice(0, Math.floor(data.length * 0.7));
  if (r === '1y') return data.slice(-12);
  return data;
}

function sliceTopN(data: any[], key: string, n: TopN): any[] {
  if (!n) return data;
  return [...data].sort((a, b) => (b[key] || 0) - (a[key] || 0)).slice(0, n);
}

function sliceThreshold(data: any[], key: string, pct: number) {
  if (pct <= 0) return { data, others: 0 };
  const total = data.reduce((s: number, d: any) => s + (d[key] || 0), 0);
  const kept = []; let others = 0;
  data.forEach((d: any) => {
    const v = d[key] || 0;
    ((v / total) * 100 >= pct ? kept : (others += v) || true) && kept.push(d);
  });
  if (others > 0) kept.push({ ...data[0], [key]: others, name: 'Others' });
  return { data: kept, others };
}

function ChartFilterBar({
  type, timeRange, setTimeRange, topN, setTopN, threshold, setThreshold,
}: {
  type: 'line' | 'bar' | 'pie';
  timeRange: TimeRange; setTimeRange: (r: TimeRange) => void;
  topN: TopN; setTopN: (n: TopN) => void;
  threshold: number; setThreshold: (t: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {(type === 'line' || type === 'bar') && (
        <div className="flex items-center gap-1 bg-bg-subtle rounded-xl p-1 border border-border-light shadow-sm">
          {(['6m', 'ytd', '1y', 'all'] as TimeRange[]).map((r) => (
            <button key={r} onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all duration-200 ${timeRange === r ? 'bg-primary text-white shadow-premium' : 'text-text-tertiary hover:text-text-secondary hover:bg-white'}`}>
              {TIME_LABELS[r]}
            </button>
          ))}
        </div>
      )}
      {type === 'bar' && (
        <div className="flex items-center gap-1 bg-bg-subtle rounded-xl p-1 border border-border-light shadow-sm">
          <span className="px-2 py-1 text-[10px] text-text-tertiary font-bold uppercase tracking-widest opacity-60">Top</span>
          {([3, 5, null] as TopN[]).map((n) => (
            <button key={String(n)} onClick={() => setTopN(n)}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${topN === n ? 'bg-primary text-white shadow-premium' : 'text-text-tertiary hover:text-text-secondary hover:bg-white'}`}>
              {n === null ? 'All' : n}
            </button>
          ))}
        </div>
      )}
      {type === 'pie' && (
        <div className="flex items-center gap-3 bg-bg-subtle rounded-xl px-4 py-2 border border-border-light shadow-sm">
          <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest opacity-60">Sensitivity</span>
          <input type="range" min={0} max={20} step={1} value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-24 h-1 accent-primary cursor-pointer appearance-none bg-border-light rounded-full" />
          <span className="text-[11px] font-bold font-mono text-text-primary min-w-[3ch]">
            {threshold === 0 ? 'OFF' : `${threshold}%`}
          </span>
        </div>
      )}
    </div>
  );
}

function ChartRenderer({
  chart, width, height, hoveredIndex, selectedIndex, onHover, onLeave, onSelect,
}: {
  chart: ChartConfig; width: number; height: number;
  hoveredIndex: number | null; selectedIndex: number | null;
  onHover: (i: number | null) => void; onLeave: () => void; onSelect: (i: number) => void;
}) {
  const { type, data, dataKey, nameKey } = chart;

  if (type === 'line') {
    return (
      <LineChart width={width} height={height} data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis dataKey={nameKey} tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
        <YAxis tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} width={45}
          tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E2E8F0', strokeWidth: 1.5 }} />
        <Line type="monotone" dataKey={dataKey} stroke="#6366F1" strokeWidth={3}
          dot={false}
          activeDot={{ r: 7, fill: '#6366F1', strokeWidth: 3, stroke: '#fff' }}
          animationDuration={1500}
        />
        {/* Clickable hit targets rendered as transparent ReferenceDots */}
        {data.map((entry, i) => {
          const on = selectedIndex === i || hoveredIndex === i;
          const activeColor = HOVER_COLORS[i % HOVER_COLORS.length];
          return (
            <ReferenceDot
              key={`dot-${i}`}
              x={entry[nameKey]}
              y={entry[dataKey]}
              r={on ? 10 : 0}
              fill={activeColor}
              fillOpacity={on ? 0.2 : 0}
              stroke={on ? activeColor : 'transparent'}
              strokeWidth={on ? 2 : 0}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => onHover(i)}
              onMouseLeave={() => onLeave()}
              onClick={() => onSelect(i)}
            />
          );
        })}
      </LineChart>
    );
  }

  if (type === 'bar') {
    return (
      <BarChart width={width} height={height} data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis dataKey={nameKey} tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
        <YAxis tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} width={45}
          tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC', opacity: 0.4 }} />
        <Bar dataKey={dataKey} radius={[6, 6, 0, 0]} maxBarSize={48} animationDuration={1200}>
          {data.map((_, i) => {
            const base = CHART_COLORS[i % CHART_COLORS.length];
            const active = HOVER_COLORS[i % HOVER_COLORS.length];
            const on = selectedIndex === i || hoveredIndex === i;
            return (
              <Cell key={`bar-${i}`}
                fill={on ? active : base} fillOpacity={on ? 1 : 0.85}
                stroke={selectedIndex === i ? active : 'transparent'}
                strokeWidth={selectedIndex === i ? 2 : 0}
                style={{ cursor: 'pointer', filter: on ? `drop-shadow(0 0 6px ${active}66)` : 'none' }}
                onMouseEnter={() => onHover(i)} onMouseLeave={onLeave} onClick={() => onSelect(i)} />
            );
          })}
        </Bar>
      </BarChart>
    );
  }

  if (type === 'pie') {
    const pieW = Math.min(Math.floor(width * 0.55), 280);
    return (
      <div className="flex items-start gap-6" style={{ height }}>
        <PieChart width={pieW} height={height}>
          <Pie data={data} cx="50%" cy="50%" innerRadius={pieW * 0.28} outerRadius={pieW * 0.44} paddingAngle={4}
            dataKey={dataKey} nameKey={nameKey} stroke="none" animationDuration={1400}
            onMouseEnter={(_, i) => onHover(i)} onMouseLeave={onLeave} onClick={(_, i) => onSelect(i)}>
            {data.map((_: any, i: number) => {
              const base = CHART_COLORS[i % CHART_COLORS.length];
              const active = HOVER_COLORS[i % HOVER_COLORS.length];
              const on = selectedIndex === i || hoveredIndex === i;
              return (
                <Cell key={`pie-${i}`}
                  fill={on ? active : base} fillOpacity={on ? 1 : 0.9}
                  stroke={selectedIndex === i ? active : 'transparent'}
                  strokeWidth={selectedIndex === i ? 2 : 0}
                  style={{ cursor: 'pointer', filter: on ? `drop-shadow(0 0 8px ${active}60)` : 'none' }} />
              );
            })}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
        <div className="flex-1 space-y-2 overflow-y-auto pt-1">
          {data.map((entry: any, i: number) => {
            const base = CHART_COLORS[i % CHART_COLORS.length];
            const active = HOVER_COLORS[i % HOVER_COLORS.length];
            const on = selectedIndex === i || hoveredIndex === i;
            return (
              <div key={i}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all ${on ? 'bg-primary-soft' : 'hover:bg-bg-subtle'}`}
                onMouseEnter={() => onHover(i)} onMouseLeave={onLeave} onClick={() => onSelect(i)}>
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: on ? active : base, boxShadow: on ? `0 0 5px ${active}60` : 'none' }} />
                <span className={`text-xs font-semibold truncate flex-1 ${on ? 'text-primary' : 'text-text-secondary'}`}>
                  {String(entry[nameKey])}
                </span>
                <span className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded-md ${on ? 'bg-primary/10 text-primary' : 'bg-bg-subtle text-text-primary'}`}>
                  {typeof entry[dataKey] === 'number' ? `${entry[dataKey]}%` : entry[dataKey]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}

export function ChartBlock({ chart, onThread, onElementSelect }: ChartBlockProps) {
  const { type, title, subtitle, data } = chart;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [topN, setTopN] = useState<TopN>(null);
  const [threshold, setThreshold] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [chartWidth, setChartWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w > 0) setChartWidth(Math.floor(w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const filtered = useMemo(() => {
    let d = type === 'line' || type === 'bar' ? sliceTime(data, type, timeRange) : data;
    if (type === 'bar' && topN) d = sliceTopN(d, chart.dataKey, topN);
    if (type === 'pie' && threshold > 0) d = sliceThreshold(d, chart.dataKey, threshold).data;
    return d;
  }, [data, type, timeRange, topN, threshold, chart.dataKey]);

  const handleSelect = (i: number) => {
    if (!onElementSelect) return;
    const entry = filtered[i];
    if (!entry) return;
    const el = containerRef.current;
    const rect = el?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : 500;
    const y = rect ? rect.top + rect.height / 2 : 300;
    onElementSelect({
      type: type === 'pie' ? 'pieSlice' : type,
      dataIndex: i,
      name: String(entry[chart.nameKey] ?? i),
      value: entry[chart.dataKey] ?? 0,
      label: String(entry[chart.nameKey] ?? ''),
      chartType: type,
      chartTitle: title,
    }, x, y);
    setSelectedIdx(i);
  };

  const finalChart = { ...chart, data: filtered };

  return (
    <>
      <BlockActions blockRef={containerRef} onFullscreen={() => setIsFullscreen(true)} onThread={onThread}>
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="bg-bg-surface border border-border rounded-premium p-4 shadow-premium mb-2 hover:shadow-soft-lg transition-shadow"
        >
          <div className="flex items-start justify-between gap-2 mb-4">
            <div>
              <h4 className="text-[13px] font-bold text-text-primary tracking-tight">{title}</h4>
              {subtitle && <p className="text-[11px] text-text-tertiary font-medium mt-0.5">{subtitle}</p>}
            </div>
            {selectedIdx !== null && (
              <button onClick={() => setSelectedIdx(null)}
                className="text-[10px] font-bold text-primary/60 hover:text-primary px-2 py-0.5 rounded-md bg-primary-soft transition-colors shrink-0">
                Clear
              </button>
            )}
          </div>

          <ChartFilterBar type={type} timeRange={timeRange} setTimeRange={setTimeRange}
            topN={topN} setTopN={setTopN} threshold={threshold} setThreshold={setThreshold} />

          <div className="mt-5" style={{ height: 220 }}>
            {chartWidth > 0 && (
              <ChartRenderer chart={finalChart} width={chartWidth} height={220}
                hoveredIndex={hoveredIdx} selectedIndex={selectedIdx}
                onHover={setHoveredIdx} onLeave={() => setHoveredIdx(null)} onSelect={handleSelect} />
            )}
          </div>

          <p className="text-[10px] text-text-tertiary/60 mt-3 text-center italic">
            {selectedIdx !== null ? 'Tap "Clear" or click a different element' : 'Click any element to explore'}
          </p>
        </motion.div>
      </BlockActions>

      <FullscreenModal isOpen={isFullscreen} onClose={() => setIsFullscreen(false)} title={title} subtitle={subtitle}>
        <ChartFilterBar type={type} timeRange={timeRange} setTimeRange={setTimeRange}
          topN={topN} setTopN={setTopN} threshold={threshold} setThreshold={setThreshold} />
        <div className="mt-5 h-[400px]">
          <ChartRenderer chart={finalChart} width={800} height={400}
            hoveredIndex={hoveredIdx} selectedIndex={selectedIdx}
            onHover={setHoveredIdx} onLeave={() => setHoveredIdx(null)} onSelect={handleSelect} />
        </div>
      </FullscreenModal>
    </>
  );
}

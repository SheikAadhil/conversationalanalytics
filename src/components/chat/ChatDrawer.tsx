import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
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
import type { ChatMessage, Conversation, ChatThread, MessageBlock, Entity, Selection } from '../../data/types';
import type { ChartConfig } from '../../data/types';
import { ChatMessageItem } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { ChatInput } from '../input/ChatInput';
import { Breadcrumb, type BreadcrumbNode } from './Breadcrumb';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  isTyping: boolean;
  visibleBlocks: Set<string>;
  isVisible: (key: string) => boolean;
  conversations: Conversation[];
  threads: ChatThread[];
  activeConversationId: string | null;
  activeThread: ChatThread | null;
  onSend: (msg: string) => void;
  onSendWithChips?: (msg: string, chips: import('../../data/types').ContextChip[]) => void;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onSelectThread: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onDeleteThread: (id: string) => void;
  onOpenThread: (message: ChatMessage, block: import('../../data/types').MessageBlock, blockIndex: number) => void;
  onCloseThread: () => void;
  placeholder?: string;
  selection?: Selection;
  chips?: import('../../data/types').ContextChip[];
  onRemoveChip?: (id: string) => void;
  onEditChip?: (id: string, updated: import('../../data/types').ContextChip) => void;
  onEntitySelect?: (entity: Entity, x: number, y: number) => void;
  onChartElementSelect?: (element: import('../../data/types').ChartElement, x: number, y: number) => void;
  onTableCellSelect?: (cell: { rowIndex: number; colIndex: number; value: string | number; header: string; rowLabel: string }, x: number, y: number) => void;
  onClearSelection?: () => void;
  selectionPath?: BreadcrumbNode[];
  onBreadcrumbNavigate?: (index: number) => void;
  onBreadcrumbClear?: () => void;
  onInputFocus?: () => void;
  onInputBlur?: () => void;
  inputRef?: React.RefObject<HTMLDivElement | null>;
}

function ThreadContext({
  thread,
  messages,
  isTyping,
  visibleBlocks,
  isVisible,
  onSend,
  onClose,
  selection,
  onEntitySelect,
  onChartElementSelect,
  onTableCellSelect,
}: {
  thread: ChatThread;
  messages: ChatMessage[];
  isTyping: boolean;
  visibleBlocks: Set<string>;
  isVisible: (key: string) => boolean;
  onSend: (msg: string) => void;
  onClose: () => void;
  selection?: import('../../data/types').Selection;
  onEntitySelect?: (entity: import('../../data/types').Entity, x: number, y: number) => void;
  onChartElementSelect?: (element: import('../../data/types').ChartElement, x: number, y: number) => void;
  onTableCellSelect?: (cell: { rowIndex: number; colIndex: number; value: string | number; header: string; rowLabel: string }, x: number, y: number) => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, isTyping]);

  function ContextBlockRenderer({ block }: { block: MessageBlock }) {
    if (block.type === 'text') {
      return (
        <div className="text-[13px] text-text-secondary leading-relaxed space-y-3">
          {block.content.split('\n').map((line, i) => {
            const cleaned = line.replace(/\*\*/g, '');
            if (!cleaned.trim()) return <div key={i} className="h-2" />;
            return <p key={i}>{cleaned}</p>;
          })}
        </div>
      );
    }
    if (block.type === 'table' && block.table) {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-primary/20">
                {block.table.headers.map((h, i) => (
                  <th key={i} className="text-left px-2 py-1.5 font-bold text-primary/80 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.table.rows.map((row, ri) => (
                <tr key={ri} className="border-b border-border-light/50 hover:bg-white/40">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-2 py-1.5 text-text-secondary">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    if (block.type === 'chart' && block.chart) {
      return <CompactChart chart={block.chart} />;
    }
    return null;
  }

  const CHART_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'];

  function CompactTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white/95 border border-border rounded-lg shadow-premium px-3 py-2 text-[11px]">
        <p className="font-bold text-text-tertiary mb-1 uppercase tracking-widest">{label}</p>
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-text-secondary">{entry.name}:</span>
            <span className="font-bold text-text-primary">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }

  function CompactChart({ chart }: { chart: ChartConfig }) {
    if (chart.type === 'line') {
      return (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chart.data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="ctxLineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey={chart.nameKey} tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} width={40}
              tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
            <Tooltip content={<CompactTooltip />} cursor={{ stroke: '#E2E8F0', strokeWidth: 1 }} />
            <Line type="monotone" dataKey={chart.dataKey} stroke="#6366F1" strokeWidth={2.5}
              dot={{ fill: '#6366F1', r: 3, stroke: '#fff', strokeWidth: 1.5 }}
              activeDot={{ r: 5, strokeWidth: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      );
    }
    if (chart.type === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chart.data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey={chart.nameKey} tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} width={40}
              tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
            <Tooltip content={<CompactTooltip />} cursor={{ fill: '#F8FAFC', opacity: 0.5 }} />
            <Bar dataKey={chart.dataKey} radius={[4, 4, 0, 0]} maxBarSize={40}>
              {chart.data.map((_: any, i: number) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.9} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }
    if (chart.type === 'pie') {
      return (
        <div className="flex flex-col items-center gap-4">
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={chart.data} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4}
                dataKey={chart.dataKey} nameKey={chart.nameKey} stroke="none">
                {chart.data.map((_: any, i: number) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CompactTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="w-full space-y-2">
            {chart.data.map((entry: any, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span className="text-[11px] text-text-secondary truncate flex-1">{entry[chart.nameKey]}</span>
                <span className="text-[11px] font-bold text-text-primary font-mono">
                  {typeof entry[chart.dataKey] === 'number' ? `${entry[chart.dataKey]}%` : entry[chart.dataKey]}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <>
      {/* Thread header */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-primary-soft border-b border-primary/20">
        <div className="w-5 h-5 rounded-md bg-primary flex items-center justify-center text-white shadow-sm">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <span className="text-[12px] font-bold text-primary truncate flex-1">{thread.title}</span>
        {/* <button onClick={onClose} className="p-1 rounded-lg text-primary hover:bg-primary/10 transition-colors">
          <X size={14} strokeWidth={2.5}/>
        </button> */}
      </div>

      {/* Thread messages */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-4 py-4 space-y-4">
        {/* Context block — full content */}
        {thread.contextBlock && (
          <div className="bg-primary-soft rounded-xl p-3 border border-primary/20 mb-2">
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3 opacity-70">Context</p>
            <ContextBlockRenderer block={thread.contextBlock} />
          </div>
        )}

        <div className="space-y-4">
          {messages.map((message) => (
            <ChatMessageItem
              key={message.id}
              message={message}
              isVisible={isVisible}
              compact
              onSend={onSend}
              selection={selection}
              onEntitySelect={onEntitySelect}
              onChartElementSelect={onChartElementSelect}
              onTableCellSelect={onTableCellSelect}
            />
          ))}
        </div>

        {isTyping && <TypingIndicator />}
        <div ref={endRef}/>
      </div>
    </>
  );
}

export function ChatDrawer({
  isOpen,
  onClose,
  messages,
  isTyping,
  visibleBlocks,
  isVisible,
  conversations,
  threads,
  activeConversationId,
  activeThread,
  onSend,
  onSendWithChips,
  onNewChat,
  onSelectConversation,
  onSelectThread,
  onDeleteConversation,
  onDeleteThread,
  onOpenThread,
  onCloseThread,
  placeholder,
  selection,
  chips,
  onRemoveChip,
  onEditChip,
  onEntitySelect,
  onChartElementSelect,
  onTableCellSelect,
  onClearSelection,
  selectionPath,
  onBreadcrumbNavigate,
  onBreadcrumbClear,
  onInputFocus,
  onInputBlur,
  inputRef,
}: ChatDrawerProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isTyping, isOpen]);

  return (
    <div className="flex-1 min-w-0 flex flex-col bg-bg-surface z-10">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-primary-soft flex items-center justify-center text-primary shadow-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <span className="text-[13px] font-bold text-text-primary">Pulse</span>
        </div>
      </div>

      {/* Breadcrumb trail — drill path */}
      {selectionPath && onBreadcrumbNavigate && onBreadcrumbClear && (
        <Breadcrumb
          path={selectionPath}
          onNavigate={onBreadcrumbNavigate}
          onClear={onBreadcrumbClear}
        />
      )}

      {/* Active thread context */}
      {activeThread ? (
        <ThreadContext
          thread={activeThread}
          messages={messages}
          isTyping={isTyping}
          visibleBlocks={visibleBlocks}
          isVisible={isVisible}
          onSend={onSend}
          onClose={onCloseThread}
          selection={selection}
          onEntitySelect={onEntitySelect}
          onChartElementSelect={onChartElementSelect}
          onTableCellSelect={onTableCellSelect}
        />
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto hide-scrollbar px-6 py-6 space-y-4">
            {messages.length === 0 ? (
              /* Welcome screen with suggestions */
              <div className="flex flex-col items-center justify-start pt-12 space-y-6">
                {/* Hero icon */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative"
                >
                  <div className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-primary via-chart-5 to-primary-dark flex items-center justify-center shadow-premium">
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <div className="absolute inset-0 rounded-[22px] bg-primary/20 blur-xl -z-10 animate-pulse"/>
                </motion.div>

                <div className="text-center space-y-1.5">
                  <h2 className="text-[18px] font-bold text-text-primary tracking-tight">
                    What would you like to explore?
                  </h2>
                  <p className="text-[13px] text-text-secondary">
                    Ask in plain English — I'll query your data and bring back insights.
                  </p>
                </div>

                {/* Default prompt cards */}
                <div className="w-full max-w-md space-y-2 pt-2">
                  {[
                    { label: "Yesterday's sales performance", query: "Yesterday's sales performance" },
                    { label: "Yesterday's lead flow", query: "Yesterday's lead flow" },
                    { label: "Last week's marketing performance", query: "Last week's marketing performance" },
                    { label: "Last week's overall performance", query: "Last week's overall performance" },
                  ].map((prompt, index) => (
                    <motion.button
                      key={prompt.query}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      whileHover={{ scale: 1.01, y: -1 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => onSend(prompt.query)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-bg-base rounded-xl border border-border hover:border-primary/40 hover:shadow-soft transition-all text-left group"
                    >
                      <span className="text-[13px] font-medium text-text-secondary group-hover:text-text-primary transition-colors">
                        {prompt.label}
                      </span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-text-tertiary group-hover:text-primary transition-colors flex-shrink-0">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <ChatMessageItem
                    key={message.id}
                    message={message}
                    isVisible={isVisible}
                    onOpenThread={onOpenThread}
                    onSend={onSend}
                    selection={selection}
                    onEntitySelect={onEntitySelect}
                    onChartElementSelect={onChartElementSelect}
                    onTableCellSelect={onTableCellSelect}
                  />
                ))}
                {isTyping && <TypingIndicator />}
              </>
            )}
            <div ref={endRef}/>
          </div>
        </>
      )}

      {/* Input */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-border bg-bg-surface space-y-3">
        {/* Context chip — shows when something is selected */}
        {selection?.type === 'entity' && selection.entity && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            className="flex items-center gap-2"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-soft rounded-full border border-primary/20">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md ${
                selection.entity.type === 'metric' ? 'bg-indigo-100 text-indigo-600' :
                selection.entity.type === 'dimension' ? 'bg-pink-100 text-pink-600' :
                selection.entity.type === 'time' ? 'bg-amber-100 text-amber-600' :
                selection.entity.type === 'anomaly' ? 'bg-red-100 text-red-600' :
                'bg-emerald-100 text-emerald-600'
              }`}>
                {selection.entity.type}
              </span>
              <span className="text-[12px] font-semibold text-primary">
                {selection.entity.display}
              </span>
            </div>
            <button
              onClick={onClearSelection}
              className="p-1 rounded-full text-text-tertiary hover:text-text-primary hover:bg-bg-subtle transition-colors"
              title="Clear selection"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </motion.div>
        )}

        <div className="bg-bg-subtle rounded-xl border border-border overflow-hidden">
          <ChatInput
            onSend={onSendWithChips ?? ((msg) => onSend(msg))}
            disabled={isTyping}
            placeholder={placeholder}
            chips={chips}
            onRemoveChip={onRemoveChip}
            onEditChip={onEditChip}
            onFocus={onInputFocus}
            onBlur={onInputBlur}
            inputRef={inputRef}
          />
        </div>
      </div>
    </div>
  );
}

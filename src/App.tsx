import { useEffect, useState, useMemo, useRef } from 'react';
import { useChat } from './hooks/useChat';
import { Sidebar } from './components/layout/Sidebar';
import { ChatDrawer } from './components/chat/ChatDrawer';
import { ContextualMenu } from './components/chat/ContextualMenu';
import type { BreadcrumbNode } from './components/chat/Breadcrumb';
import type { ChatMessage, MessageBlock, Entity, Selection, ChartElement, ContextChip } from './data/types';
import type { EntityAction } from './utils/entityRecognizer';
import { buildContextChips, buildFullQuery } from './utils/contextChipUtils';
// Canvas panel archived — see src/archived/CanvasArchived.tsx

function App() {
  const {
    messages,
    isTyping,
    conversations,
    activeConversationId,
    visibleBlocks,
    threads,
    activeThread,
    sendMessage,
    startNewChat,
    selectConversation,
    selectThread,
    openThread,
    closeThread,
    deleteConversation,
    deleteThread,
  } = useChat();

  // Selection state
  const [selection, setSelection] = useState<Selection>({ type: null });
  // Ref to the chat input container — ContextualMenu ignores clicks inside it
  const inputRef = useRef<HTMLDivElement>(null);

  // Chips appear immediately when something is selected (no focus required)
  const visibleChips = useMemo(
    () => (selection.type !== null ? buildContextChips(selection) : []),
    [selection]
  );

  // Breadcrumb path — accumulates as user drills down
  const [selectionPath, setSelectionPath] = useState<BreadcrumbNode[]>([
    { id: 'root', label: 'Overview', type: 'root' },
  ]);

  // Thread-specific state
  const [threadMessages, setThreadMessages] = useState<ChatMessage[]>([]);
  const [threadVisibleBlocks, setThreadVisibleBlocks] = useState<Set<string>>(new Set());

  // Sync thread messages when activeThread changes
  useEffect(() => {
    if (!activeThread) {
      setThreadMessages([]);
      setThreadVisibleBlocks(new Set());
      return;
    }
    const msgs = activeThread.messages.map((m) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    }));
    setThreadMessages(msgs);
    const visible = new Set<string>();
    msgs.forEach((msg) => {
      msg.blocks.forEach((_, idx) => visible.add(`${msg.id}-${idx}`));
    });
    setThreadVisibleBlocks(visible);
  }, [activeThread]);

  // Sync thread messages when new messages arrive
  useEffect(() => {
    if (!activeThread) return;
    setThreadMessages([...activeThread.messages]);
    activeThread.messages.forEach((msg) => {
      msg.blocks.forEach((_, idx) => {
        setThreadVisibleBlocks((prev) => new Set([...prev, `${msg.id}-${idx}`]));
      });
    });
  }, [activeThread?.messages.length]);

  // Active messages / visible blocks — thread or main
  const activeMessages = activeThread ? threadMessages : messages;
  const activeVisibleBlocks = activeThread ? threadVisibleBlocks : visibleBlocks;
  const isVisible = (key: string) => activeVisibleBlocks.has(key);

  const handleOpenThread = (
    message: ChatMessage,
    block: MessageBlock,
    blockIndex: number,
  ) => {
    openThread(message, block, blockIndex);
    setThreadMessages([]);
    setThreadVisibleBlocks(new Set());
    setSelection({ type: null });
  };

  const handleSend = (content: string) => {
    sendMessage(content);
  };

  const handleNewChat = () => {
    startNewChat();
    setSelection({ type: null });
    setSelectionPath([{ id: 'root', label: 'Overview', type: 'root' }]);
  };

  // Handle entity selection from text blocks
  const handleEntitySelect = (entity: Entity, x: number, y: number) => {
    setSelection({ type: 'entity', entity, x, y });
  };

  // Handle chart element selection
  const handleChartElementSelect = (element: ChartElement, x: number, y: number) => {
    setSelection({ type: 'chartElement', chartElement: element, x, y });
  };

  // Handle table cell selection
  const handleTableCellSelect = (
    cell: { rowIndex: number; colIndex: number; value: string | number; header: string; rowLabel: string },
    x: number,
    y: number,
  ) => {
    setSelection({ type: 'tableCell', tableCell: cell, x, y });
  };

  // Handle contextual menu action
  const handleAction = (action: string, sel: Selection) => {
    let query = '';
    let newNode: BreadcrumbNode | null = null;

    if (sel.type === 'entity' && sel.entity) {
      const { entity } = sel;
      query = buildEntityQuery(action as EntityAction, entity);
      newNode = {
        id: `entity-${Date.now()}`,
        label: entity.display,
        type: entity.type,
      };
    } else if (sel.type === 'chartElement' && sel.chartElement) {
      const { chartElement } = sel;
      query = buildChartQuery(action as EntityAction, chartElement);
      newNode = {
        id: `chart-${Date.now()}`,
        label: chartElement.label,
        type: 'chartElement',
      };
    } else if (sel.type === 'tableCell' && sel.tableCell) {
      const { tableCell } = sel;
      query = buildTableQuery(action as EntityAction, tableCell);
      newNode = {
        id: `table-${Date.now()}`,
        label: `${tableCell.rowLabel} · ${tableCell.header}`,
        type: 'tableCell',
      };
    }

    if (query) {
      sendMessage(query);
      // Add to breadcrumb path
      if (newNode) {
        setSelectionPath((prev) => [...prev, newNode!]);
      }
    }
    setSelection({ type: null });
  };

  // Navigate breadcrumb to a specific level
  const handleBreadcrumbNavigate = (index: number) => {
    if (index === 0) {
      // Reset to root
      setSelectionPath([{ id: 'root', label: 'Overview', type: 'root' }]);
      setSelection({ type: null });
    } else {
      // Truncate path to that level
      setSelectionPath((prev) => prev.slice(0, index + 1));
      setSelection({ type: null });
    }
  };

  // Clear entire breadcrumb
  const handleBreadcrumbClear = () => {
    setSelectionPath([{ id: 'root', label: 'Overview', type: 'root' }]);
    setSelection({ type: null });
  };

  const handleClearSelection = () => {
    setSelection({ type: null });
  };

  // Chip handlers
  const handleRemoveChip = () => {
    setSelection({ type: null });
  };

  const handleEditChip = () => {
    // Chip editing — selection persists, chip will rebuild on next focus
    setIsInputFocused(false);
  };

  const handleSendWithChips = (text: string, chips: ContextChip[]) => {
    const query = buildFullQuery(chips, text);
    sendMessage(query);
    setIsInputFocused(false);
    setSelection({ type: null });
  };

  const placeholder = visibleChips.length > 0
    ? `Ask about ${visibleChips.map(c => c.dimension ?? c.metric ?? c.timeScope ?? '').filter(Boolean).join(', ')}...`
    : 'What would you like to explore?';

  const activeNavId = activeThread?.id ?? activeConversationId;

  return (
    <div className="h-full flex bg-bg-base overflow-hidden relative">
      {/* Left nav */}
      <Sidebar
        conversations={conversations}
        threads={threads}
        activeId={activeNavId}
        onNewChat={handleNewChat}
        onSelectConversation={(id) => {
          if (activeThread) closeThread();
          selectConversation(id);
          setSelection({ type: null });
          setSelectionPath([{ id: 'root', label: 'Overview', type: 'root' }]);
        }}
        onSelectThread={(id) => {
          selectThread(id);
          setSelection({ type: null });
          setSelectionPath([{ id: 'root', label: 'Overview', type: 'root' }]);
        }}
        onDeleteConversation={deleteConversation}
        onDeleteThread={deleteThread}
      />

      {/* Main chat */}
      <ChatDrawer
        isOpen={true}
        onClose={() => {}}
        messages={activeMessages}
        isTyping={isTyping}
        visibleBlocks={activeVisibleBlocks}
        isVisible={isVisible}
        conversations={conversations}
        threads={threads}
        activeConversationId={activeConversationId}
        activeThread={activeThread}
        onSend={handleSend}
        onSendWithChips={handleSendWithChips}
        onNewChat={handleNewChat}
        onSelectConversation={(id) => {
          if (activeThread) closeThread();
          selectConversation(id);
          setSelection({ type: null });
          setSelectionPath([{ id: 'root', label: 'Overview', type: 'root' }]);
        }}
        onSelectThread={selectThread}
        onDeleteConversation={deleteConversation}
        onDeleteThread={deleteThread}
        onOpenThread={handleOpenThread}
        onCloseThread={closeThread}
        placeholder={placeholder}
        selection={selection}
        chips={visibleChips}
        onRemoveChip={handleRemoveChip}
        onEditChip={handleEditChip}
        onEntitySelect={handleEntitySelect}
        onChartElementSelect={handleChartElementSelect}
        onTableCellSelect={handleTableCellSelect}
        onClearSelection={handleClearSelection}
        selectionPath={selectionPath}
        onBreadcrumbNavigate={handleBreadcrumbNavigate}
        onBreadcrumbClear={handleBreadcrumbClear}
        onInputBlur={() => {}}
        inputRef={inputRef}
      />

      {/* Contextual action menu */}
      <ContextualMenu
        selection={selection}
        onAction={handleAction}
        onClose={handleClearSelection}
        ignoreRef={inputRef}
      />
    </div>
  );
}

function buildEntityQuery(action: EntityAction, entity: Entity): string {
  const q: Record<EntityAction, string> = {
    drill_down: `Drill down into ${entity.display}`,
    compare: `Compare ${entity.display} to other segments`,
    explain: `Explain why ${entity.display}`,
    trend: `Show ${entity.display} trend over time`,
    break_down: `Break down ${entity.display} by dimension`,
    define: `Define ${entity.display}`,
    correlate: `Correlate ${entity.display} with other metrics`,
    filter_to: `Filter to ${entity.display}`,
    expand_range: `Expand time range for ${entity.display}`,
    show_factors: `What factors contributed to ${entity.display}?`,
    show_patterns: `Show past patterns for ${entity.display}`,
  };
  return q[action] ?? `Show ${entity.display}`;
}

function buildChartQuery(action: EntityAction, element: ChartElement): string {
  const q: Record<EntityAction, string> = {
    drill_down: `Drill down into ${element.label}`,
    compare: `Compare ${element.label} to other regions`,
    explain: `Explain ${element.label} performance`,
    trend: `Show ${element.label} trend over time`,
    break_down: `Break down ${element.label}`,
    define: `Define ${element.chartTitle}`,
    correlate: `Correlate ${element.label} with other metrics`,
    filter_to: `Filter to ${element.label}`,
    expand_range: `Expand time range for ${element.label}`,
    show_factors: `What drove ${element.label}?`,
    show_patterns: `Show past patterns for ${element.label}`,
  };
  return q[action] ?? `Show ${element.label}`;
}

function buildTableQuery(action: EntityAction, cell: { rowIndex: number; colIndex: number; value: string | number; header: string; rowLabel: string }): string {
  const q: Record<EntityAction, string> = {
    filter_to: `Filter to ${cell.rowLabel} in ${cell.header}`,
    compare: `Compare ${cell.rowLabel} to other rows`,
    explain: `Explain ${cell.rowLabel} in ${cell.header}`,
    break_down: `Break down ${cell.rowLabel}`,
    drill_down: `Drill down into ${cell.rowLabel}`,
    trend: `Show ${cell.rowLabel} trend`,
    define: `Define ${cell.header}`,
    correlate: `Correlate ${cell.header}`,
    expand_range: `Expand time range for ${cell.header}`,
    show_factors: `What factors drove ${cell.rowLabel}?`,
    show_patterns: `Show past patterns for ${cell.rowLabel}`,
  };
  return q[action] ?? `Show ${cell.rowLabel}`;
}

export default App;

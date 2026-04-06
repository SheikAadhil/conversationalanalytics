import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useChat } from './hooks/useChat';
import { Sidebar } from './components/layout/Sidebar';
import { ChatDrawer } from './components/chat/ChatDrawer';
import { ContextualMenu } from './components/chat/ContextualMenu';
import type { BreadcrumbNode } from './components/chat/Breadcrumb';
import type { ChatMessage, MessageBlock, Entity, Selection, ChartElement, ContextChip } from './data/types';
import type { EntityAction } from './utils/entityRecognizer';
import { buildContextChips, buildFullQuery, generateSuggestions } from './utils/contextChipUtils';
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

  // Selection state — supports multi-select up to 3 chips
  const [selections, setSelections] = useState<Selection[]>([]);
  // Ref to the chat input container — ContextualMenu ignores clicks inside it
  const inputRef = useRef<HTMLDivElement>(null);

  // Track modifier keys for multi-select
  // Autocomplete suggestions — regenerated when input text or chips change
  const [suggestions, setSuggestions] = useState<string[]>([]);
  // Current input text (tracked to generate suggestions)
  const [inputText, setInputText] = useState('');

  // Build chips from all current selections (max 3)
  const visibleChips = useMemo(
    () => {
      const chips: ContextChip[] = [];
      for (const sel of selections) {
        const built = buildContextChips(sel);
        chips.push(...built);
      }
      return chips.slice(0, 3);
    },
    [selections]
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
    setSelections([]);
  };

  const handleSend = (content: string) => {
    sendMessage(content);
  };

  const handleNewChat = () => {
    startNewChat();
    setSelections([]);
    setSelectionPath([{ id: 'root', label: 'Overview', type: 'root' }]);
  };

  // Handle entity selection — add to selections if modifier held, else replace
  const handleEntitySelect = (entity: Entity, x: number, y: number, isMulti?: boolean) => {
    const newSel: Selection = { type: 'entity', entity, x, y };
    if (isMulti) {
      setSelections(prev => {
        if (prev.some(s => s.type === 'entity' && s.entity?.id === entity.id)) return prev;
        const next = [...prev, newSel];
        return next.slice(-3); // max 3
      });
    } else {
      setSelections([newSel]);
    }
  };

  // Handle chart element selection — add to selections if modifier held, else replace
  const handleChartElementSelect = (element: ChartElement, x: number, y: number, isMulti?: boolean) => {
    const newSel: Selection = { type: 'chartElement', chartElement: element, x, y };
    if (isMulti) {
      setSelections(prev => {
        if (prev.some(s => s.type === 'chartElement' && s.chartElement?.dataIndex === element.dataIndex && s.chartElement?.chartType === element.chartType)) return prev;
        const next = [...prev, newSel];
        return next.slice(-3);
      });
    } else {
      setSelections([newSel]);
    }
  };

  // Handle table cell selection — add to selections if modifier held, else replace
  const handleTableCellSelect = (
    cell: { rowIndex: number; colIndex: number; value: string | number; header: string; rowLabel: string },
    x: number,
    y: number,
    isMulti?: boolean,
  ) => {
    const newSel: Selection = { type: 'tableCell', tableCell: cell, x, y };
    if (isMulti) {
      setSelections(prev => {
        if (prev.some(s => s.type === 'tableCell' && s.tableCell?.rowIndex === cell.rowIndex && s.tableCell?.colIndex === cell.colIndex)) return prev;
        const next = [...prev, newSel];
        return next.slice(-3);
      });
    } else {
      setSelections([newSel]);
    }
  };

  // Handle contextual menu action — removes the acted-upon selection from the array
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
      if (newNode) {
        setSelectionPath((prev) => [...prev, newNode!]);
      }
    }
    // Remove the acted-upon selection from the array
    setSelections(prev => prev.filter(s => s !== sel));
  };

  // Navigate breadcrumb to a specific level
  const handleBreadcrumbNavigate = (index: number) => {
    if (index === 0) {
      setSelectionPath([{ id: 'root', label: 'Overview', type: 'root' }]);
      setSelections([]);
    } else {
      setSelectionPath((prev) => prev.slice(0, index + 1));
      setSelections([]);
    }
  };

  // Clear entire breadcrumb
  const handleBreadcrumbClear = () => {
    setSelectionPath([{ id: 'root', label: 'Overview', type: 'root' }]);
    setSelections([]);
  };

  const handleClearSelection = () => {
    setSelections([]);
  };

  // Chip handlers — remove a chip by its id (maps back to the selection)
  const handleRemoveChip = (chipId: string) => {
    setSelections(prev => {
      const chipIdx = prev.findIndex((sel) => {
        const chips = buildContextChips(sel);
        return chips.some(c => c.id === chipId);
      });
      if (chipIdx === -1) return prev;
      return prev.filter((_, i) => i !== chipIdx);
    });
  };

  const handleEditChip = () => {
    // Close chips view on edit
  };

  const handleSendWithChips = (text: string, chips: ContextChip[]) => {
    const query = buildFullQuery(chips, text);
    sendMessage(query);
    setSelections([]);
    setInputText('');
    setSuggestions([]);
  };

  // Track input text and regenerate suggestions on each keystroke
  const handleInputChange = useCallback((text: string) => {
    setInputText(text);
    setSuggestions(generateSuggestions(text, visibleChips));
  }, [visibleChips]);

  // When user taps a suggestion pill, fill the input with it
  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInputText(suggestion);
    setSuggestions([]);
  }, []);

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
          setSelections([]);
          setInputText('');
          setSuggestions([]);
          setSelectionPath([{ id: 'root', label: 'Overview', type: 'root' }]);
        }}
        onSelectThread={(id) => {
          selectThread(id);
          setSelections([]);
          setInputText('');
          setSuggestions([]);
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
          setSelections([]);
          setInputText('');
          setSuggestions([]);
          setSelectionPath([{ id: 'root', label: 'Overview', type: 'root' }]);
        }}
        onSelectThread={selectThread}
        onDeleteConversation={deleteConversation}
        onDeleteThread={deleteThread}
        onOpenThread={handleOpenThread}
        onCloseThread={closeThread}
        placeholder={placeholder}
        selections={selections}
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
        suggestions={suggestions}
        value={inputText}
        onChange={handleInputChange}
        onSuggestionClick={handleSuggestionClick}
        onInputBlur={() => {}}
        inputRef={inputRef}
      />

      {/* Contextual action menu */}
      <ContextualMenu
        selections={selections}
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

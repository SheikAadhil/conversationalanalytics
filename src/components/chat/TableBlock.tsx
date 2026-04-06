import { useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, SlidersHorizontal } from 'lucide-react';
import type { TableData } from '../../data/types';
import { BlockActions, FullscreenModal } from './BlockActions';

// Module-level ref to track modifier keys
const modifierRef = { shift: false, ctrl: false };
if (typeof document !== 'undefined') {
  document.addEventListener('keydown', (e) => {
    modifierRef.shift = e.shiftKey;
    modifierRef.ctrl = e.ctrlKey || e.metaKey;
  });
  document.addEventListener('keyup', (e) => {
    modifierRef.shift = e.shiftKey;
    modifierRef.ctrl = e.ctrlKey || e.metaKey;
  });
}

interface TableBlockProps {
  table: TableData;
  delay?: number;
  onThread?: () => void;
  onCellSelect?: (cell: {
    rowIndex: number;
    colIndex: number;
    value: string | number;
    header: string;
    rowLabel: string;
  }, x: number, y: number, isMulti?: boolean) => void;
}

function isNumeric(val: string | number): boolean {
  if (typeof val === 'number') return true;
  if (typeof val !== 'string') return false;
  const stripped = val.replace(/[$€£€,+\-%\s]/g, '');
  return stripped !== '' && !isNaN(Number(stripped));
}

function formatCell(cell: string | number): string {
  if (typeof cell === 'number') return cell.toLocaleString();
  return cell;
}

function parseNumeric(val: string | number): number {
  if (typeof val === 'number') return val;
  const stripped = val.replace(/[$€£€,+\-%\s]/g, '');
  return parseFloat(stripped) || 0;
}

export function TableBlock({ table, onThread, onCellSelect }: TableBlockProps) {
  const { headers, rows } = table;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const blockRef = useRef<HTMLDivElement>(null);

  const filteredRows = useMemo(() => {
    let result = [...rows];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((row) =>
        row.some((cell) => String(cell).toLowerCase().includes(q))
      );
    }
    if (sortColumn !== null) {
      result.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        const aNum = isNumeric(aVal) ? parseNumeric(aVal) : null;
        const bNum = isNumeric(bVal) ? parseNumeric(bVal) : null;
        let cmp = 0;
        if (aNum !== null && bNum !== null) {
          cmp = aNum - bNum;
        } else {
          cmp = String(aVal).localeCompare(String(bVal));
        }
        return sortDirection === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  }, [rows, searchQuery, sortColumn, sortDirection]);

  const handleSort = (colIndex: number) => {
    if (sortColumn === colIndex) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(colIndex);
      setSortDirection('asc');
    }
    setShowSortMenu(false);
  };

  const handleRowClick = (rowIndex: number, row: (string | number)[]) => {
    setSelectedRow(rowIndex);
    if (!onCellSelect) return;
    const rect = blockRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = rect.left + rect.width / 2;
    const y = rect.top + 60 + rowIndex * 40;
    onCellSelect({
      rowIndex,
      colIndex: 0,
      value: row[0],
      header: headers[0],
      rowLabel: String(row[0]),
    }, x, y);
  };

  const handleCellClick = (rowIndex: number, colIndex: number, value: string | number) => {
    if (!onCellSelect) return;
    const rect = blockRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = rect.left + rect.width / 2;
    const y = rect.top + 80 + rowIndex * 40;
    onCellSelect({
      rowIndex,
      colIndex,
      value,
      header: headers[colIndex],
      rowLabel: String(rows[rowIndex][0]),
    }, x, y, modifierRef.shift || modifierRef.ctrl);
  };

  const SortIcon = () => {
    if (sortColumn === null) return <ArrowUpDown size={12} className="opacity-50" />;
    return sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  };

  const renderTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-bg-subtle/50 border-b border-border">
            {headers.map((header, i) => {
              const isActive = sortColumn === i;
              return (
                <th
                  key={i}
                  onClick={() => handleSort(i)}
                  className={`px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest select-none cursor-pointer hover:bg-primary/5 transition-colors ${
                    i === 0 ? 'text-left' : 'text-right'
                  } ${isActive ? 'text-primary' : 'text-text-tertiary'}`}
                >
                  <div className={`flex items-center gap-1 ${i === 0 ? 'justify-start' : 'justify-end'}`}>
                    <span>{header}</span>
                    <span className={`transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}>
                      <SortIcon />
                    </span>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {filteredRows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-4 py-8 text-center text-xs text-text-tertiary font-medium">
                No matching results found
              </td>
            </tr>
          ) : (
            filteredRows.map((row, rowIndex) => {
              const isHovered = hoveredRow === rowIndex;
              const isSelected = selectedRow === rowIndex;
              const rowValue = String(row[0]);

              return (
                <motion.tr
                  key={rowIndex}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: rowIndex * 0.02, duration: 0.2 }}
                  onMouseEnter={() => setHoveredRow(rowIndex)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => handleRowClick(rowIndex, row)}
                  className={`
                    border-b border-border-light last:border-0 transition-all cursor-pointer
                    ${isSelected
                      ? 'bg-primary-soft/50 border-l-2 border-l-primary'
                      : rowIndex % 2 === 0
                      ? 'bg-white hover:bg-indigo-50/20'
                      : 'bg-bg-subtle/20 hover:bg-indigo-50/20'
                    }
                  `}
                >
                  {row.map((cell, cellIndex) => {
                    const numeric = isNumeric(cell);
                    return (
                      <td
                        key={cellIndex}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCellClick(rowIndex, cellIndex, cell);
                        }}
                        className={`px-3 py-2 text-[12px] transition-colors ${
                          numeric
                            ? 'text-right font-mono text-text-primary font-semibold'
                            : 'text-left text-text-secondary font-medium'
                        } ${isHovered || isSelected ? 'text-text-primary' : ''}`}
                      >
                        <span className="inline-block max-w-[200px] truncate">
                          {formatCell(cell)}
                        </span>
                      </td>
                    );
                  })}
                </motion.tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <BlockActions
        blockRef={blockRef}
        onFullscreen={() => setIsFullscreen(true)}
        onThread={onThread}
      >
        <motion.div
          ref={blockRef}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="bg-bg-surface border border-border rounded-premium overflow-hidden shadow-premium group/table mb-2"
        >
          {/* Filter bar */}
          <div className="table-filter-bar flex items-center gap-3 px-3 py-2 border-b border-border-light bg-bg-surface">
            <div className="relative flex-1 max-w-[200px]">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary opacity-70" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-2 py-1.5 text-[11px] bg-bg-subtle border-none rounded-lg outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/20 text-text-primary placeholder:text-text-tertiary transition-all"
              />
            </div>

            {selectedRow !== null && (
              <button
                onClick={() => setSelectedRow(null)}
                className="text-[10px] font-bold text-primary/60 hover:text-primary px-2 py-0.5 rounded-md bg-primary-soft transition-colors"
              >
                Clear row
              </button>
            )}

            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border transition-all ${
                  sortColumn !== null
                    ? 'bg-primary-soft border-primary/20 text-primary shadow-sm'
                    : 'bg-bg-subtle border-transparent text-text-secondary hover:bg-bg-surface hover:border-border shadow-none'
                }`}
              >
                <SlidersHorizontal size={11} />
                <span>{sortColumn !== null ? headers[sortColumn] : 'Sort'}</span>
                {sortColumn !== null && <SortIcon />}
              </button>

              {showSortMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                  <div className="absolute right-0 top-full mt-1.5 z-20 bg-bg-surface border border-border rounded-xl shadow-soft-lg py-1 min-w-40 overflow-hidden">
                    {headers.map((header, i) => (
                      <button
                        key={i}
                        onClick={() => handleSort(i)}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 text-[12px] hover:bg-bg-subtle transition-colors ${
                          sortColumn === i ? 'text-primary font-bold' : 'text-text-secondary font-medium'
                        }`}
                      >
                        <span>{header}</span>
                        {sortColumn === i && <span className="text-primary"><SortIcon /></span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <span className="text-[10px] text-text-tertiary/60 ml-auto italic">
              Click a row or cell to explore
            </span>
          </div>

          {renderTable()}
        </motion.div>
      </BlockActions>

      <FullscreenModal
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        title={table.headers.join(', ')}
        subtitle={`${rows.length} rows · ${headers.length} columns`}
      >
        <div className="bg-bg-surface border border-border rounded-premium overflow-hidden shadow-premium">
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border-light bg-bg-surface">
            <div className="relative flex-1 max-w-sm">
              <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary opacity-70" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search through all rows..."
                className="w-full pl-9 pr-3 py-1.5 text-[13px] bg-bg-subtle border-none rounded-xl outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/20 text-text-primary placeholder:text-text-tertiary transition-all"
              />
            </div>

            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className={`flex items-center gap-2 px-3 py-1.5 text-[13px] font-bold rounded-xl border transition-all ${
                  sortColumn !== null
                    ? 'bg-primary-soft border-primary/20 text-primary shadow-sm'
                    : 'bg-bg-subtle border-transparent text-text-secondary hover:bg-bg-surface hover:border-border'
                }`}
              >
                <SlidersHorizontal size={13} />
                <span>{sortColumn !== null ? headers[sortColumn] : 'Sort By'}</span>
                <SortIcon />
              </button>

              {showSortMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                  <div className="absolute right-0 top-full mt-1.5 z-20 bg-bg-surface border border-border rounded-2xl shadow-soft-lg py-1.5 min-w-44 overflow-hidden">
                    <div className="px-3.5 py-1.5 text-[9px] font-bold text-text-tertiary uppercase tracking-widest border-b border-border-light mb-1">Select column</div>
                    {headers.map((header, i) => (
                      <button
                        key={i}
                        onClick={() => handleSort(i)}
                        className={`w-full flex items-center justify-between gap-3 px-3.5 py-1.5 text-[13px] hover:bg-bg-subtle transition-colors ${
                          sortColumn === i ? 'text-primary font-bold' : 'text-text-secondary font-medium'
                        }`}
                      >
                        <span>{header}</span>
                        {sortColumn === i && <span className="text-primary"><SortIcon /></span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="h-6 w-px bg-border-light mx-1" />

            <div className="flex flex-col items-end leading-tight">
              <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest opacity-60">Data Set Size</span>
              <span className="text-[11px] font-bold text-text-primary">
                {filteredRows.length === rows.length
                  ? `${rows.length} Total Rows`
                  : `${filteredRows.length} of ${rows.length} Matched`}
              </span>
            </div>
          </div>

          {renderTable()}
        </div>
      </FullscreenModal>
    </>
  );
}

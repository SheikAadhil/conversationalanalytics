# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Pulse Analytics** — A conversational analytics dashboard where users query data via natural language. Responses render as typed blocks (text, table, chart) with drill-down capability via contextual selection on entities, chart elements, and table cells.

## Commands

```bash
npm run dev      # Start Vite dev server with hot reload
npm run build    # Type-check (tsc -b) then build
npm run lint     # Run ESLint
npm run preview  # Preview production build locally
```

## Tech Stack

- React 19 + TypeScript (strict mode, verbatimModuleSyntax)
- Vite as build tool
- Tailwind CSS (custom theme with chart colors, premium shadows, Inter font)
- Recharts for chart visualizations
- Framer Motion for animations
- Lucide React for icons
- ESLint (flat config)

## Architecture

### State Management
All chat state lives in `src/hooks/useChat.ts` — a custom hook managing conversations, messages, threads (drill-down sub-conversations), and LocalStorage persistence (keys: `pulse-analytics-conversations`, `pulse-analytics-active`, `pulse-analytics-threads`).

### Block-Based Response Rendering
AI responses are decomposed into typed blocks rendered by `src/components/chat/MessageContent.tsx`:
- `text` → markdown via inline renderers
- `table` → `TableBlock.tsx` with sortable columns and cell selection
- `chart` → `ChartBlock.tsx` wrapping Recharts (line, bar, pie)

### Selection System
Users can select (click) on:
- **Entities** in text (metrics, dimensions, time references, anomalies)
- **Chart elements** (bars, line points, pie slices)
- **Table cells**

Selection triggers `ContextualMenu.tsx` with relevant analytics follow-up actions, preserving the selected context in the breadcrumb trail.

### Thread/Drill-Down Model
Any message block can open a thread (sub-conversation) via `ThreadView.tsx`, preserving parent context for multi-level drill-down analysis.

## Key Conventions

- Entity detection: `src/utils/entityRecognizer.ts` identifies analytics entities in text
- Mock responses in `src/data/mockResponses.ts` with matching chart data in `src/data/chartData.ts`
- Typing indicator simulates AI response with configurable block timing
- Block reveal animations: staggered 300ms initial delay + 400ms per block
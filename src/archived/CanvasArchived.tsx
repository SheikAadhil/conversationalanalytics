/**
 * CANVAS PANEL — archived, not active
 *
 * This file contains the canvas + resizable split layout that was
 * removed in favor of a chat-first experience. To re-enable:
 *
 * 1. Copy the contents of this file's commented blocks back into App.tsx
 * 2. Uncomment the CanvasPanel import in App.tsx
 * 3. Uncomment the canvas-related state: chatWidth, canvasOverrides, handleOverridesChange
 * 4. Add the CanvasPanel JSX, resize handle, and chat drawer back into the return
 *
 * The canvas anchor logic (activeMessage) in App.tsx is preserved and active —
 * it ensures the canvas chart stays anchored to the parent message when in a thread.
 */

// ============================================================
// APP.TSX — re-enable these imports and state
// ============================================================

// import { CanvasPanel } from './components/canvas/CanvasPanel';
// import type { CanvasOverrides } from './data/types';

// const DEFAULT_CHAT_WIDTH = 360;
// const MIN_CHAT_WIDTH = 240;
// const MAX_CHAT_WIDTH = 560;

// const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
// const [chatWidth, setChatWidth] = useState(DEFAULT_CHAT_WIDTH);
// const isDraggingRef = useRef(false);
// const dragStartXRef = useRef(0);
// const dragStartWidthRef = useRef(DEFAULT_CHAT_WIDTH);
// const [canvasOverrides, setCanvasOverrides] = useState<CanvasOverrides>({
//   chipEdits: {},
//   chartFilters: {},
// });

// const handleOverridesChange = (overrides: CanvasOverrides) => {
//   setCanvasOverrides(overrides);
// };

// ============================================================
// CANVAS PANEL COMPONENT — paste into return JSX
// ============================================================

// {/* Canvas (left panel) */}
// <div className="flex-1 min-w-0">
//   <CanvasPanel
//     activeMessage={activeMessage}
//     canvasOverrides={canvasOverrides}
//     onOverridesChange={handleOverridesChange}
//     onOpenChat={handleOpenChat}
//     onSendMessage={handleSend}
//     hasMessages={activeMessages.length > 0}
//   />
// </div>

// {/* Resize handle */}
// <AnimatePresence>
//   {chatDrawerOpen && (
//     <motion.div
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       exit={{ opacity: 0 }}
//       transition={{ duration: 0.2 }}
//       onMouseDown={handleDragStart}
//       className="h-full flex-shrink-0 cursor-col-resize group relative z-30"
//       style={{ width: 6 }}
//     >
//       <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-border-light group-hover:bg-primary transition-colors" />
//     </motion.div>
//   )}
// </AnimatePresence>

// {/* Chat Drawer (right panel, slides in) */}
// <AnimatePresence>
//   {chatDrawerOpen && (
//     <motion.div
//       initial={{ width: 0, opacity: 0 }}
//       animate={{ width: chatWidth, opacity: 1 }}
//       exit={{ width: 0, opacity: 0 }}
//       transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
//       className="h-full flex-shrink-0 relative z-20"
//     >
//       <motion.div
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         exit={{ opacity: 0 }}
//         className="absolute inset-0 bg-black/5 -left-4"
//         onClick={handleCloseChat}
//       />
//       <div className="relative h-full" style={{ width: chatWidth }}>
//         <ChatDrawer
//           isOpen={chatDrawerOpen}
//           onClose={handleCloseChat}
//           messages={activeMessages}
//           isTyping={isTyping}
//           visibleBlocks={activeVisibleBlocks}
//           isVisible={isVisible}
//           conversations={conversations}
//           threads={threads}
//           activeConversationId={activeThread ? null : activeConversationId}
//           activeThread={activeThread}
//           onSend={handleSend}
//           onNewChat={startNewChat}
//           onSelectConversation={selectConversation}
//           onSelectThread={selectThread}
//           onDeleteConversation={deleteConversation}
//           onDeleteThread={deleteThread}
//           onOpenThread={handleOpenThread}
//           onCloseThread={closeThread}
//           placeholder={placeholder}
//         />
//       </div>
//     </motion.div>
//   )}
// </AnimatePresence>

// ============================================================
// DRAG-TO-RESIZE HANDLERS — paste before the return
// ============================================================

// const handleDragStart = (e: React.MouseEvent) => {
//   isDraggingRef.current = true;
//   dragStartXRef.current = e.clientX;
//   dragStartWidthRef.current = chatWidth;
//   document.body.style.cursor = 'col-resize';
//   document.body.style.userSelect = 'none';
// };

// useEffect(() => {
//   const handleMouseMove = (e: MouseEvent) => {
//     if (!isDraggingRef.current) return;
//     const delta = dragStartXRef.current - e.clientX;
//     const newWidth = Math.min(
//       MAX_CHAT_WIDTH,
//       Math.max(MIN_CHAT_WIDTH, dragStartWidthRef.current + delta)
//     );
//     setChatWidth(newWidth);
//   };
//   const handleMouseUp = () => {
//     if (!isDraggingRef.current) return;
//     isDraggingRef.current = false;
//     document.body.style.cursor = '';
//     document.body.style.userSelect = '';
//   };
//   window.addEventListener('mousemove', handleMouseMove);
//   window.addEventListener('mouseup', handleMouseUp);
//   return () => {
//     window.removeEventListener('mousemove', handleMouseMove);
//     window.removeEventListener('mouseup', handleMouseUp);
//   };
// }, []);

// ============================================================
// CANVAS ANCHOR MESSAGE — this stays active in App.tsx
// Keeps the canvas anchored to the parent message in a thread
// ============================================================

// const activeMessage = (() => {
//   if (activeThread) {
//     return messages.find((m) => m.id === activeThread.parentMessageId) ?? null;
//   }
//   return [...messages].reverse().find((m) => m.role === 'assistant') ?? null;
// })();

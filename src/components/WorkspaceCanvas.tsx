import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useWorkspaceStore } from '../store/workspace';
import { useSettingsStore } from '../store/settings';
import { SessionPanel } from './SessionPanel';
import { PanelChrome } from './PanelChrome';
import { ResizeHandles } from './ResizeHandles';
import { EmptyCanvas } from './EmptyCanvas';
import { MiniMap } from './MiniMap';
import { TMUX_DRAG_TYPE } from './ExternalSessionItem';
import type { Session } from '../store/types';

const Z_PANEL_RESTING = 10;
const Z_PANEL_FOCUSED = 20;
const Z_PANEL_DRAGGING = 30;

const MIN_PANEL_W = 420;
const MIN_PANEL_H = 300;

export function WorkspaceCanvas() {
  const sessionOrder = useWorkspaceStore((s) => s.sessionOrder);
  const sessionsMap = useWorkspaceStore((s) => s.sessions);
  const draggingId = useWorkspaceStore((s) => s.draggingSessionId);
  const focusedId = useWorkspaceStore((s) => s.focusedSessionId);
  const fullscreenId = useWorkspaceStore((s) => s.fullscreenSessionId);
  const filterTagId = useWorkspaceStore((s) => s.filterTagId);
  const canvasTransform = useWorkspaceStore((s) => s.canvasTransform);
  const moveSession = useWorkspaceStore((s) => s.moveSession);
  const setDragging = useWorkspaceStore((s) => s.setDragging);
  const bringToFront = useWorkspaceStore((s) => s.bringToFront);
  const focusSession = useWorkspaceStore((s) => s.focusSession);
  const exitFullscreen = useWorkspaceStore((s) => s.exitFullscreen);
  const openModal = useWorkspaceStore((s) => s.openModal);
  const panCanvas = useWorkspaceStore((s) => s.panCanvas);
  const zoomCanvasAt = useWorkspaceStore((s) => s.zoomCanvasAt);
  const snapToGrid = useSettingsStore((s) => s.snapToGrid);
  const gridSize = useSettingsStore((s) => s.gridSize);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cleanupPointerRef = useRef<(() => void) | null>(null);
  const [spacePressed, setSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [draggingForDetach, setDraggingForDetach] = useState(false);

  const noteDetached = useWorkspaceStore((s) => s.noteDetached);
  const removeSessionAction = useWorkspaceStore((s) => s.removeSession);
  const setDetachDropActive = useWorkspaceStore((s) => s.setDetachDropActive);

  const setFilterTag = useWorkspaceStore((s) => s.setFilterTag);
  const tagsMap = useWorkspaceStore((s) => s.tags);
  const addSession = useWorkspaceStore((s) => s.addSession);
  const [dropActive, setDropActive] = useState(false);
  // Distinguishes the two drop intents so the overlay shows the right
  // copy: tmux session attach vs folder/cwd → spawn Claude there.
  const [dropKind, setDropKind] = useState<'tmux' | 'folder' | null>(null);

  const sortedSessions = useMemo(
    () => sessionOrder.map((id) => sessionsMap[id]).filter((s): s is Session => Boolean(s)),
    [sessionOrder, sessionsMap],
  );

  const matchingSessions = useMemo(() => {
    if (!filterTagId) return sortedSessions;
    return sortedSessions.filter((s) => s.tags.includes(filterTagId));
  }, [sortedSessions, filterTagId]);

  const draggingSession = draggingId ? sessionsMap[draggingId] : null;
  const fullscreenSession = fullscreenId ? sessionsMap[fullscreenId] : null;
  const filteredOutAll =
    filterTagId !== null && sortedSessions.length > 0 && matchingSessions.length === 0;
  const activeFilterTag = filterTagId ? tagsMap[filterTagId] : null;

  // Esc exits fullscreen.
  useEffect(() => {
    if (!fullscreenId) return;
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        e.stopPropagation();
        exitFullscreen();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreenId, exitFullscreen]);

  // Track Space key for pan affordance.
  useEffect(() => {
    function onDown(e: KeyboardEvent): void {
      if (e.key === ' ' && !isInputElement(e.target)) {
        e.preventDefault();
        setSpacePressed(true);
      }
    }
    function onUp(e: KeyboardEvent): void {
      if (e.key === ' ') setSpacePressed(false);
    }
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
  );

  function handleDragStart(e: DragStartEvent): void {
    const id = e.active.id as string;
    setDragging(id);
    bringToFront(id);
    focusSession(id);

    // Track pointer position throughout the drag — dnd-kit only gives
    // us delta in DragEndEvent, but we need the final viewport-space
    // cursor position to detect a drop onto the sidebar (= detach).
    function trackPointer(ev: PointerEvent): void {
      lastPointerRef.current = { x: ev.clientX, y: ev.clientY };
      const session = useWorkspaceStore.getState().sessions[id];
      const isTmux = session?.kind === 'tmux';
      const root = containerRef.current;
      if (!root || !isTmux) {
        if (draggingForDetach) setDraggingForDetach(false);
        return;
      }
      const rect = root.getBoundingClientRect();
      // Sidebar lives to the LEFT of the canvas container. If the
      // cursor goes left of the canvas's left edge, we're over the
      // sidebar — eligible for drop-to-detach.
      const overSidebar = ev.clientX < rect.left;
      setDraggingForDetach(overSidebar);
      setDetachDropActive(overSidebar);
    }
    window.addEventListener('pointermove', trackPointer);
    // Cleanup: dragEnd fires before pointerup in dnd-kit, but the
    // pointermove listener stays. The dragEnd handler removes it.
    cleanupPointerRef.current = () => window.removeEventListener('pointermove', trackPointer);
  }

  function handleDragEnd(e: DragEndEvent): void {
    cleanupPointerRef.current?.();
    cleanupPointerRef.current = null;

    const id = e.active.id as string;
    const session = useWorkspaceStore.getState().sessions[id];
    if (!session) {
      setDragging(null);
      setDraggingForDetach(false);
      setDetachDropActive(false);
      return;
    }

    // Drop-onto-sidebar = detach (only meaningful for tmux sessions —
    // local PTYs have nowhere to "go" after detach).
    const root = containerRef.current;
    const rect = root?.getBoundingClientRect();
    const overSidebar = rect ? lastPointerRef.current.x < rect.left : false;
    if (overSidebar && session.kind === 'tmux' && session.tmuxName) {
      // Surface the handoff toast so the user knows where the session went.
      noteDetached({ tmuxName: session.tmuxName, sessionName: session.name });
      void window.grove.tmux.detach(id).then(() => removeSessionAction(id));
      setDragging(null);
      setDraggingForDetach(false);
      setDetachDropActive(false);
      return;
    }

    // Otherwise: regular reposition.
    const canvasDx = e.delta.x / canvasTransform.scale;
    const canvasDy = e.delta.y / canvasTransform.scale;
    let nx = session.position.x + canvasDx;
    let ny = session.position.y + canvasDy;
    if (snapToGrid) {
      nx = Math.round(nx / gridSize) * gridSize;
      ny = Math.round(ny / gridSize) * gridSize;
    }
    moveSession(id, { x: nx, y: ny });
    setDragging(null);
    setDraggingForDetach(false);
    setDetachDropActive(false);
  }

  function handleDragCancel(): void {
    cleanupPointerRef.current?.();
    cleanupPointerRef.current = null;
    setDragging(null);
    setDraggingForDetach(false);
    setDetachDropActive(false);
  }

  function handleCanvasMouseDown(e: React.MouseEvent): void {
    if (e.target === e.currentTarget) {
      focusSession(null);
    }
    const shouldPan = e.button === 1 || (e.button === 0 && spacePressed);
    if (!shouldPan) return;
    e.preventDefault();
    setIsPanning(true);

    let lastX = e.clientX;
    let lastY = e.clientY;
    // rAF-batch pan deltas: mousemove fires faster than 60Hz, but the
    // store update + subsequent re-render only need to land once per
    // frame. Without this, every pixel of cursor travel does a full
    // React tree pass — that's the lag the user is feeling.
    let pendingDx = 0;
    let pendingDy = 0;
    let rafId: number | null = null;

    function flush(): void {
      rafId = null;
      if (pendingDx === 0 && pendingDy === 0) return;
      const dx = pendingDx;
      const dy = pendingDy;
      pendingDx = 0;
      pendingDy = 0;
      panCanvas(dx, dy);
    }

    function onMove(ev: globalThis.MouseEvent): void {
      pendingDx += ev.clientX - lastX;
      pendingDy += ev.clientY - lastY;
      lastX = ev.clientX;
      lastY = ev.clientY;
      if (rafId === null) rafId = requestAnimationFrame(flush);
    }
    function onUp(): void {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      if (rafId !== null) cancelAnimationFrame(rafId);
      flush();
      setIsPanning(false);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  // rAF-batched wheel handler. Two intents:
  //   • cmd/ctrl + wheel → zoom at cursor (Figma/Miro convention)
  //   • plain wheel/trackpad scroll → pan the canvas
  // Trackpad two-finger scroll fires high-frequency wheel events; without
  // this batching, every event triggers a Zustand update + React tree
  // pass → the "scrolling is shit" symptom.
  const wheelPendingRef = useRef<{
    panDx: number;
    panDy: number;
    zoomFactor: number;
    zoomX: number;
    zoomY: number;
    rafId: number | null;
  }>({ panDx: 0, panDy: 0, zoomFactor: 1, zoomX: 0, zoomY: 0, rafId: null });

  function handleWheel(e: React.WheelEvent): void {
    e.preventDefault();
    const p = wheelPendingRef.current;
    if (e.ctrlKey || e.metaKey) {
      p.zoomFactor *= Math.exp(-e.deltaY * 0.0015);
      p.zoomX = e.clientX;
      p.zoomY = e.clientY;
    } else {
      // Trackpad horizontal + vertical both relevant. Negative because
      // wheel deltaY positive = page scrolls down → canvas should move
      // up (content moves opposite of scroll). Most canvas apps do
      // this; matches macOS natural scroll on trackpad.
      p.panDx -= e.deltaX;
      p.panDy -= e.deltaY;
    }
    if (p.rafId === null) {
      p.rafId = requestAnimationFrame(() => {
        p.rafId = null;
        if (p.zoomFactor !== 1) {
          zoomCanvasAt(p.zoomX, p.zoomY, p.zoomFactor);
          p.zoomFactor = 1;
        }
        if (p.panDx !== 0 || p.panDy !== 0) {
          panCanvas(p.panDx, p.panDy);
          p.panDx = 0;
          p.panDy = 0;
        }
      });
    }
  }

  // Native HTML5 drag-and-drop receiver. Two accepted drop intents:
  //   1) Sidebar's external tmux item — application/x-grove-tmux-session
  //   2) Folder/file from Finder, Terminal/iTerm proxy icon, VS Code, etc.
  //      → spawn a fresh Claude session with cwd set to the folder.
  // Browsers expose Finder drags as `Files` and/or `text/uri-list`; we
  // accept either at the dragOver gate (we read the actual contents on
  // drop). Without this acceptance the cursor shows the "no drop" badge
  // and the drop event never fires — which is the "nothing happens"
  // symptom the user hit.
  function handleDragOver(e: React.DragEvent): void {
    const types = Array.from(e.dataTransfer.types);
    const isTmux = types.includes(TMUX_DRAG_TYPE);
    const isFolder =
      types.includes('Files') || types.includes('text/uri-list');
    if (!isTmux && !isFolder) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = isTmux ? 'copy' : 'link';
    if (!dropActive) setDropActive(true);
    const nextKind = isTmux ? 'tmux' : 'folder';
    if (dropKind !== nextKind) setDropKind(nextKind);
  }

  function handleDragLeave(e: React.DragEvent): void {
    if (e.currentTarget === e.target) {
      setDropActive(false);
      setDropKind(null);
    }
  }

  function handleDrop(e: React.DragEvent): void {
    setDropActive(false);
    setDropKind(null);
    e.preventDefault();

    // Convert viewport → canvas-world coords once for either intent.
    const root = containerRef.current;
    const rect = root?.getBoundingClientRect();
    const clientX = e.clientX - (rect?.left ?? 0);
    const clientY = e.clientY - (rect?.top ?? 0);
    const worldX = (clientX - canvasTransform.x) / canvasTransform.scale;
    const worldY = (clientY - canvasTransform.y) / canvasTransform.scale;

    // Intent 1: tmux attach (sidebar drag).
    const tmuxRaw = e.dataTransfer.getData(TMUX_DRAG_TYPE);
    if (tmuxRaw) {
      let payload: { tmuxName?: string };
      try {
        payload = JSON.parse(tmuxRaw);
      } catch {
        return;
      }
      if (!payload.tmuxName) return;
      const displayName = payload.tmuxName.startsWith('grove-')
        ? payload.tmuxName.slice(6).replace(/-[a-z0-9]{4}$/, '')
        : payload.tmuxName;
      addSession({
        name: displayName,
        color: '#22C55E',
        kind: 'tmux',
        tmuxName: payload.tmuxName,
        position: { x: worldX - 360, y: worldY - 240 },
      });
      return;
    }

    // Intent 2: folder/file from Finder / Terminal proxy icon / VS Code.
    // Prefer text/uri-list (always present for Finder + Terminal proxy
    // drags, contains file:// URLs). Fall back to dataTransfer.files
    // when uri-list is unavailable.
    const uriList = e.dataTransfer.getData('text/uri-list');
    let firstPath: string | null = null;

    if (uriList) {
      const firstUri = uriList
        .split(/\r?\n/)
        .map((l) => l.trim())
        .find((l) => l && !l.startsWith('#'));
      if (firstUri && firstUri.startsWith('file://')) {
        try {
          firstPath = decodeURIComponent(new URL(firstUri).pathname);
        } catch {
          firstPath = null;
        }
      }
    }

    if (!firstPath && e.dataTransfer.files.length > 0) {
      // Electron's File objects expose .path (kept for renderer use).
      // TypeScript's File type doesn't, so cast through unknown.
      const f = e.dataTransfer.files[0] as unknown as { path?: string };
      if (f.path) firstPath = f.path;
    }

    if (!firstPath) return;

    // Main process stat()s the path and returns the folder to spawn in
    // (the path itself if dir, parent dir if file). Falls back to no-op
    // if the path doesn't exist or can't be stat()ed.
    void window.grove.system.resolveDropFolder(firstPath).then((folder) => {
      if (!folder) return;
      const displayName = folder.split('/').filter(Boolean).pop() ?? 'claude';
      addSession({
        name: displayName,
        color: '#D97745', // accent — locally spawned, "from a folder"
        kind: 'local',
        cwd: folder,
        position: { x: worldX - 360, y: worldY - 240 },
      });
    });
  }

  // Fullscreen short-circuit (no transform).
  if (fullscreenSession) {
    return (
      <div className="relative h-full w-full overflow-hidden bg-canvas">
        {sortedSessions.map((session) => (
          <div
            key={session.id}
            className="absolute"
            style={{
              inset: 16,
              display: session.id === fullscreenSession.id ? 'block' : 'none',
              zIndex: Z_PANEL_FOCUSED,
            }}
          >
            <SessionPanel
              sessionId={session.id}
              name={session.name}
              color={session.color}
              tagIds={session.tags}
              cwd={session.cwd}
              command={session.command}
              kind={session.kind}
              tmuxName={session.tmuxName}
              attachOnly={session.attached === false}
              isFocused
              isFullscreen
            />
          </div>
        ))}
      </div>
    );
  }

  const cursor = isPanning ? 'grabbing' : spacePressed ? 'grab' : 'default';

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div
        ref={containerRef}
        role="region"
        aria-label="Workspace canvas"
        className="relative h-full w-full overflow-hidden bg-canvas"
        onMouseDown={handleCanvasMouseDown}
        onWheel={handleWheel}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        // Auxclick (middle button) doesn't fire onMouseDown reliably in
        // some setups — bind onAuxClick fallback for some macOS mice.
        style={{
          // Background grid follows the canvas transform via background-position.
          backgroundImage:
            'radial-gradient(var(--bg-canvas-dot) 1px, transparent 1px)',
          backgroundSize: `${18 * canvasTransform.scale}px ${18 * canvasTransform.scale}px`,
          backgroundPosition: `${canvasTransform.x}px ${canvasTransform.y}px`,
          cursor,
        }}
      >
        {/* Inner transformed layer holding all panels. */}
        <div
          className="absolute"
          style={{
            top: 0,
            left: 0,
            transform: `translate3d(${canvasTransform.x}px, ${canvasTransform.y}px, 0) scale(${canvasTransform.scale})`,
            transformOrigin: '0 0',
            // 8000×8000 logical canvas (still feels infinite at typical use).
            width: 8000,
            height: 8000,
            willChange: isPanning ? 'transform' : undefined,
          }}
        >
          {sortedSessions.length === 0 ? (
            <div
              className="absolute"
              style={{
                left: 0,
                top: 0,
                width: containerRef.current?.clientWidth ?? 800,
                height: containerRef.current?.clientHeight ?? 600,
              }}
            >
              <EmptyCanvas onCreate={() => openModal({ type: 'newSession' })} />
            </div>
          ) : (
            sortedSessions.map((session) => (
              <DraggableSessionWrapper
                key={session.id}
                session={session}
                isFocused={focusedId === session.id}
                isBeingDragged={draggingId === session.id}
                isFilteredOut={filterTagId !== null && !session.tags.includes(filterTagId)}
              />
            ))
          )}
        </div>

        {/* MiniMap overlay (sits OUTSIDE the transformed layer). */}
        {sortedSessions.length > 0 && containerRef.current && (
          <MiniMap
            viewport={{
              width: containerRef.current.clientWidth,
              height: containerRef.current.clientHeight,
            }}
          />
        )}

        {dropActive && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            style={{
              zIndex: 41,
              border: `3px dashed var(--accent)`,
              background: 'var(--accent-soft)',
            }}
          >
            <div
              className="rounded-panel border border-edge bg-modal px-5 py-3 font-ui text-[14px] font-semibold text-text-primary shadow-modal"
              style={{ color: 'var(--accent)' }}
            >
              {dropKind === 'folder'
                ? 'Drop folder to start Claude here'
                : 'Drop to attach session'}
            </div>
          </div>
        )}

        {filteredOutAll && activeFilterTag && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            style={{ zIndex: 41 }}
          >
            <div className="pointer-events-auto flex flex-col items-center gap-3 rounded-panel border border-edge bg-modal px-8 py-6 shadow-modal">
              <p className="font-ui text-[13px] text-text-secondary">
                No sessions tagged{' '}
                <span style={{ color: activeFilterTag.color, fontWeight: 600 }}>
                  {activeFilterTag.name}
                </span>
                .
              </p>
              <button
                type="button"
                onClick={() => setFilterTag(null)}
                className="cursor-pointer rounded-control bg-accent px-3 py-1.5 font-ui text-[12px] font-semibold text-text-onAccent transition-colors duration-fast ease-out hover:bg-accent-hover"
              >
                Clear filter
              </button>
            </div>
          </div>
        )}
      </div>

      <DragOverlay dropAnimation={null}>
        {draggingSession && <PanelChrome session={draggingSession} isDragging />}
      </DragOverlay>
    </DndContext>
  );
}

function isInputElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
}

interface DraggableWrapperProps {
  session: Session;
  isFocused: boolean;
  isBeingDragged: boolean;
  isFilteredOut: boolean;
}

function DraggableSessionWrapper({
  session,
  isFocused,
  isBeingDragged,
  isFilteredOut,
}: DraggableWrapperProps) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: session.id });
  const moveSession = useWorkspaceStore((s) => s.moveSession);
  const resizeSession = useWorkspaceStore((s) => s.resizeSession);
  const focusSession = useWorkspaceStore((s) => s.focusSession);
  const bringToFront = useWorkspaceStore((s) => s.bringToFront);

  const z = isBeingDragged
    ? Z_PANEL_DRAGGING
    : (isFocused ? Z_PANEL_FOCUSED : Z_PANEL_RESTING) + session.sortOrder;

  function handlePointerDown(): void {
    if (!isFocused) {
      focusSession(session.id);
      bringToFront(session.id);
    }
  }

  return (
    <div
      ref={setNodeRef}
      onPointerDown={handlePointerDown}
      style={{
        position: 'absolute',
        left: session.position.x,
        top: session.position.y,
        width: session.size.width,
        height: session.size.height,
        opacity: isBeingDragged ? 0.4 : isFilteredOut ? 0.4 : 1,
        pointerEvents: isFilteredOut ? 'none' : 'auto',
        transition: 'opacity 200ms ease-in-out',
        zIndex: z,
      }}
    >
      <ResizeHandles
        size={session.size}
        position={session.position}
        minWidth={MIN_PANEL_W}
        minHeight={MIN_PANEL_H}
        onResize={({ size, position }) => {
          resizeSession(session.id, size);
          if (position.x !== session.position.x || position.y !== session.position.y) {
            moveSession(session.id, position);
          }
        }}
      />
      <SessionPanel
        sessionId={session.id}
        name={session.name}
        color={session.color}
        tagIds={session.tags}
        cwd={session.cwd}
        command={session.command}
        kind={session.kind}
        tmuxName={session.tmuxName}
        attachOnly={session.attached === false}
        isFocused={isFocused}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

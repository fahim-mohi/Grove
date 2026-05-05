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
import type { Session } from '../store/types';

const Z_PANEL_RESTING = 10;
const Z_PANEL_FOCUSED = 20;
const Z_PANEL_DRAGGING = 30;

const MIN_PANEL_W = 400;
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
  const [spacePressed, setSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);

  const sortedSessions = useMemo(
    () => sessionOrder.map((id) => sessionsMap[id]).filter((s): s is Session => Boolean(s)),
    [sessionOrder, sessionsMap],
  );

  const draggingSession = draggingId ? sessionsMap[draggingId] : null;
  const fullscreenSession = fullscreenId ? sessionsMap[fullscreenId] : null;

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
  }

  function handleDragEnd(e: DragEndEvent): void {
    const id = e.active.id as string;
    const session = useWorkspaceStore.getState().sessions[id];
    if (session) {
      // dnd-kit reports delta in screen pixels. Canvas may be scaled,
      // so divide by scale to get the canvas-space delta.
      const canvasDx = e.delta.x / canvasTransform.scale;
      const canvasDy = e.delta.y / canvasTransform.scale;
      let nx = session.position.x + canvasDx;
      let ny = session.position.y + canvasDy;
      if (snapToGrid) {
        nx = Math.round(nx / gridSize) * gridSize;
        ny = Math.round(ny / gridSize) * gridSize;
      }
      moveSession(id, { x: nx, y: ny });
    }
    setDragging(null);
  }

  function handleDragCancel(): void {
    setDragging(null);
  }

  function handleCanvasMouseDown(e: React.MouseEvent): void {
    // Empty-canvas click → deselect.
    if (e.target === e.currentTarget) {
      focusSession(null);
    }
    // Pan: middle-mouse OR Space+left-drag.
    const shouldPan = e.button === 1 || (e.button === 0 && spacePressed);
    if (!shouldPan) return;
    e.preventDefault();
    setIsPanning(true);

    let lastX = e.clientX;
    let lastY = e.clientY;

    function onMove(ev: globalThis.MouseEvent): void {
      const dx = ev.clientX - lastX;
      const dy = ev.clientY - lastY;
      lastX = ev.clientX;
      lastY = ev.clientY;
      panCanvas(dx, dy);
    }
    function onUp(): void {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      setIsPanning(false);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  function handleWheel(e: React.WheelEvent): void {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    const factor = Math.exp(-e.deltaY * 0.0015);
    zoomCanvasAt(e.clientX, e.clientY, factor);
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
        className="relative h-full w-full overflow-hidden bg-canvas"
        onMouseDown={handleCanvasMouseDown}
        onWheel={handleWheel}
        // Auxclick (middle button) doesn't fire onMouseDown reliably in
        // some setups — bind onAuxClick fallback for some macOS mice.
        style={{
          // Background grid follows the canvas transform via background-position.
          backgroundImage:
            'radial-gradient(circle, var(--bg-canvas-dot) 1px, transparent 1px)',
          backgroundSize: `${24 * canvasTransform.scale}px ${24 * canvasTransform.scale}px`,
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
        isFocused={isFocused}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

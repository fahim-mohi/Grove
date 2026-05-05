import { useEffect, useMemo } from 'react';
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
import { SessionPanel } from './SessionPanel';
import { PanelChrome } from './PanelChrome';
import { ResizeHandles } from './ResizeHandles';
import type { Session } from '../store/types';

const Z_PANEL_RESTING = 10;
const Z_PANEL_FOCUSED = 20;
const Z_PANEL_DRAGGING = 30;

const MIN_PANEL_W = 400;
const MIN_PANEL_H = 300;

// The freeform canvas. Phase 3: panels live at absolute canvas-space
// coordinates and can be drag-repositioned via @dnd-kit and resized via
// 8 handles. Pan/zoom and minimap arrive in Phase 10.
export function WorkspaceCanvas() {
  const sessionOrder = useWorkspaceStore((s) => s.sessionOrder);
  const sessionsMap = useWorkspaceStore((s) => s.sessions);
  const draggingId = useWorkspaceStore((s) => s.draggingSessionId);
  const focusedId = useWorkspaceStore((s) => s.focusedSessionId);
  const fullscreenId = useWorkspaceStore((s) => s.fullscreenSessionId);
  const moveSession = useWorkspaceStore((s) => s.moveSession);
  const setDragging = useWorkspaceStore((s) => s.setDragging);
  const bringToFront = useWorkspaceStore((s) => s.bringToFront);
  const focusSession = useWorkspaceStore((s) => s.focusSession);
  const exitFullscreen = useWorkspaceStore((s) => s.exitFullscreen);

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

  // Tighter activation distance — feels responsive without false-positives
  // when the user clicks-not-drags on the header.
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
      moveSession(id, {
        x: session.position.x + e.delta.x,
        y: session.position.y + e.delta.y,
      });
    }
    setDragging(null);
  }

  function handleDragCancel(): void {
    setDragging(null);
  }

  function handleCanvasClick(e: React.MouseEvent): void {
    // Click on empty canvas → deselect
    if (e.target === e.currentTarget) {
      focusSession(null);
    }
  }

  // Fullscreen short-circuit: render only the focused panel filling the
  // whole canvas. Other sessions stay mounted (xterm doesn't unmount) by
  // keeping them in the DOM but display:none'd. Esc to exit.
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

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div
        className="relative h-full w-full overflow-hidden bg-canvas"
        onMouseDown={handleCanvasClick}
        style={{
          backgroundImage:
            'radial-gradient(circle, var(--bg-canvas-dot) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        {sortedSessions.map((session) => (
          <DraggableSessionWrapper
            key={session.id}
            session={session}
            isFocused={focusedId === session.id}
            isBeingDragged={draggingId === session.id}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {draggingSession && <PanelChrome session={draggingSession} isDragging />}
      </DragOverlay>
    </DndContext>
  );
}

interface DraggableWrapperProps {
  session: Session;
  isFocused: boolean;
  isBeingDragged: boolean;
}

function DraggableSessionWrapper({ session, isFocused, isBeingDragged }: DraggableWrapperProps) {
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
        opacity: isBeingDragged ? 0.4 : 1,
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
          // Only commit position if W/N edges moved (otherwise it's unchanged)
          if (position.x !== session.position.x || position.y !== session.position.y) {
            moveSession(session.id, position);
          }
        }}
      />
      <SessionPanel
        sessionId={session.id}
        name={session.name}
        color={session.color}
        cwd={session.cwd}
        command={session.command}
        isFocused={isFocused}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

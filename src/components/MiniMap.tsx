import { useMemo } from 'react';
import { useWorkspaceStore } from '../store/workspace';
import type { Session } from '../store/types';

interface MiniMapProps {
  viewport: { width: number; height: number };
}

const MAP_WIDTH = 160;
const MAP_HEIGHT = 100;

// Bottom-right overlay showing all panels as colored rectangles. Click a
// rectangle to pan canvas to center that session. DESIGN.md §6.7.
export function MiniMap({ viewport }: MiniMapProps) {
  const sessionOrder = useWorkspaceStore((s) => s.sessionOrder);
  const sessionsMap = useWorkspaceStore((s) => s.sessions);
  const transform = useWorkspaceStore((s) => s.canvasTransform);
  const setCanvasTransform = useWorkspaceStore((s) => s.setCanvasTransform);

  const sessions = useMemo(
    () => sessionOrder.map((id) => sessionsMap[id]).filter((s): s is Session => Boolean(s)),
    [sessionOrder, sessionsMap],
  );

  // Compute world bounds — area covered by all panels + the visible viewport.
  const bounds = useMemo(() => {
    let minX = -transform.x / transform.scale;
    let minY = -transform.y / transform.scale;
    let maxX = (viewport.width - transform.x) / transform.scale;
    let maxY = (viewport.height - transform.y) / transform.scale;
    for (const s of sessions) {
      minX = Math.min(minX, s.position.x);
      minY = Math.min(minY, s.position.y);
      maxX = Math.max(maxX, s.position.x + s.size.width);
      maxY = Math.max(maxY, s.position.y + s.size.height);
    }
    const padding = 80;
    return {
      x: minX - padding,
      y: minY - padding,
      width: Math.max(1, maxX - minX + padding * 2),
      height: Math.max(1, maxY - minY + padding * 2),
    };
  }, [sessions, transform, viewport]);

  const scale = Math.min(MAP_WIDTH / bounds.width, MAP_HEIGHT / bounds.height);

  function project(x: number, y: number): { x: number; y: number } {
    return {
      x: (x - bounds.x) * scale,
      y: (y - bounds.y) * scale,
    };
  }

  const viewportRect = useMemo(() => {
    const topLeft = project(-transform.x / transform.scale, -transform.y / transform.scale);
    return {
      x: topLeft.x,
      y: topLeft.y,
      width: (viewport.width / transform.scale) * scale,
      height: (viewport.height / transform.scale) * scale,
    };
  }, [transform, viewport, scale]);

  function jumpToSession(s: Session): void {
    // Center the panel in the viewport at current scale.
    const cx = s.position.x + s.size.width / 2;
    const cy = s.position.y + s.size.height / 2;
    setCanvasTransform({
      x: viewport.width / 2 - cx * transform.scale,
      y: viewport.height / 2 - cy * transform.scale,
    });
  }

  return (
    <div
      className="absolute overflow-hidden rounded-control border border-edge bg-modal"
      style={{
        bottom: 16,
        right: 16,
        width: MAP_WIDTH,
        height: MAP_HEIGHT,
        zIndex: 40,
        boxShadow: 'var(--shadow-modal)',
        opacity: 0.92,
      }}
      role="region"
      aria-label="Workspace overview"
    >
      <div className="relative h-full w-full">
        {sessions.map((s) => {
          const tl = project(s.position.x, s.position.y);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => jumpToSession(s)}
              aria-label={`Jump to ${s.name}`}
              className="absolute cursor-pointer rounded-[2px] transition-opacity duration-fast ease-out hover:opacity-80"
              style={{
                left: tl.x,
                top: tl.y,
                width: Math.max(2, s.size.width * scale),
                height: Math.max(2, s.size.height * scale),
                background: s.color,
                opacity: 0.85,
                border: 'none',
              }}
            />
          );
        })}
        {/* Viewport rectangle */}
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            left: viewportRect.x,
            top: viewportRect.y,
            width: viewportRect.width,
            height: viewportRect.height,
            border: `1px solid var(--accent)`,
            background: 'var(--accent-soft)',
            borderRadius: 2,
          }}
        />
      </div>
    </div>
  );
}

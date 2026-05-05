import { useRef, type CSSProperties, type PointerEvent } from 'react';
import type { Size, Vec2 } from '../store/types';

type Direction = 'n' | 'e' | 's' | 'w' | 'ne' | 'se' | 'sw' | 'nw';
const ALL: Direction[] = ['n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw'];

const HANDLE_THICK = 8; // edge strip thickness
const CORNER = 14; // corner hit area (slightly larger than edges)

const CURSOR: Record<Direction, CSSProperties['cursor']> = {
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  nw: 'nwse-resize',
  se: 'nwse-resize',
};

function positionFor(dir: Direction): CSSProperties {
  const base: CSSProperties = { position: 'absolute' };
  switch (dir) {
    case 'n':
      return { ...base, top: -HANDLE_THICK / 2, left: CORNER, right: CORNER, height: HANDLE_THICK };
    case 's':
      return {
        ...base,
        bottom: -HANDLE_THICK / 2,
        left: CORNER,
        right: CORNER,
        height: HANDLE_THICK,
      };
    case 'e':
      return { ...base, right: -HANDLE_THICK / 2, top: CORNER, bottom: CORNER, width: HANDLE_THICK };
    case 'w':
      return { ...base, left: -HANDLE_THICK / 2, top: CORNER, bottom: CORNER, width: HANDLE_THICK };
    case 'ne':
      return { ...base, top: -CORNER / 2, right: -CORNER / 2, width: CORNER, height: CORNER };
    case 'nw':
      return { ...base, top: -CORNER / 2, left: -CORNER / 2, width: CORNER, height: CORNER };
    case 'se':
      return { ...base, bottom: -CORNER / 2, right: -CORNER / 2, width: CORNER, height: CORNER };
    case 'sw':
      return { ...base, bottom: -CORNER / 2, left: -CORNER / 2, width: CORNER, height: CORNER };
  }
}

export interface ResizeHandlesProps {
  size: Size;
  position: Vec2;
  minWidth: number;
  minHeight: number;
  onResize: (next: { size: Size; position: Vec2 }) => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
}

// Wraps a panel's outer div with 8 invisible resize handles. They're
// invisible by default and become a faint accent color on hover/drag.
// Handle drag updates parent state at most once per animation frame.
export function ResizeHandles(props: ResizeHandlesProps) {
  const rafRef = useRef<number | null>(null);
  const lastDeltaRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  function makeHandler(dir: Direction) {
    return (e: PointerEvent<HTMLDivElement>): void => {
      e.preventDefault();
      e.stopPropagation();

      const start = {
        width: props.size.width,
        height: props.size.height,
        x: props.position.x,
        y: props.position.y,
      };
      const startX = e.clientX;
      const startY = e.clientY;

      props.onResizeStart?.();

      const onMove = (ev: globalThis.PointerEvent): void => {
        lastDeltaRef.current = { dx: ev.clientX - startX, dy: ev.clientY - startY };
        if (rafRef.current !== null) return;
        rafRef.current = window.requestAnimationFrame(() => {
          rafRef.current = null;
          const { dx, dy } = lastDeltaRef.current;

          let width = start.width;
          let height = start.height;
          let x = start.x;
          let y = start.y;

          if (dir.includes('e')) width = Math.max(props.minWidth, start.width + dx);
          if (dir.includes('w')) {
            const newW = Math.max(props.minWidth, start.width - dx);
            x = start.x + (start.width - newW);
            width = newW;
          }
          if (dir.includes('s')) height = Math.max(props.minHeight, start.height + dy);
          if (dir.includes('n')) {
            const newH = Math.max(props.minHeight, start.height - dy);
            y = start.y + (start.height - newH);
            height = newH;
          }

          props.onResize({ size: { width, height }, position: { x, y } });
        });
      };

      const onUp = (): void => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        if (rafRef.current !== null) {
          window.cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        props.onResizeEnd?.();
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    };
  }

  return (
    <>
      {ALL.map((dir) => (
        <div
          key={dir}
          aria-hidden
          onPointerDown={makeHandler(dir)}
          style={{
            ...positionFor(dir),
            cursor: CURSOR[dir],
            zIndex: 1,
          }}
          // Faint visual hint on hover (helps discoverability without clutter)
          className="hover:bg-accent-soft transition-colors duration-fast ease-out"
        />
      ))}
    </>
  );
}

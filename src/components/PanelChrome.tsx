import type { Session } from '../store/types';

interface PanelChromeProps {
  session: Session;
  isDragging?: boolean;
}

// A non-xterm clone of SessionPanel used inside @dnd-kit's DragOverlay.
// Rendering the live SessionPanel inside the overlay would re-mount xterm
// and lose scrollback — so during drag the user sees the static chrome.
//
// The original panel stays put (with 40% opacity), and this clone follows
// the cursor with the dragging shadow elevation.
export function PanelChrome({ session, isDragging = false }: PanelChromeProps) {
  return (
    <div
      className={`pointer-events-none flex flex-col overflow-hidden rounded-panel border border-edge bg-panel ${
        isDragging ? 'shadow-panel-dragging' : 'shadow-panel-resting'
      }`}
      style={{
        width: session.size.width,
        height: session.size.height,
      }}
    >
      <div
        className="flex flex-shrink-0 items-center gap-3 border-b border-edge bg-panelHead px-3"
        style={{ height: 'var(--header-height)' }}
      >
        <span
          aria-hidden
          className="block flex-shrink-0 rounded-pill"
          style={{ width: 8, height: 8, backgroundColor: session.color }}
        />
        <span className="font-ui text-[13px] font-medium text-text-primary truncate">
          {session.name}
        </span>
      </div>
      <div className="flex-1 bg-panel" />
    </div>
  );
}

import type { DragEvent } from 'react';
import type { TmuxSessionInfo } from '../../shared/grove-api';

interface ExternalSessionItemProps {
  session: TmuxSessionInfo;
  onClick: () => void;
}

// MIME type Grove uses to identify a tmux-session drag from the sidebar.
// Canvas onDrop checks for it before accepting the payload.
export const TMUX_DRAG_TYPE = 'application/x-grove-tmux-session';

// A tmux session running outside Grove. Native HTML5 draggable so the
// gesture works across React DndContext boundaries (sidebar uses
// dnd-kit/sortable, canvas uses dnd-kit/core — separate state). Click
// to quick-attach without dragging.
export function ExternalSessionItem({ session, onClick }: ExternalSessionItemProps) {
  const ageMin = Math.max(
    0,
    Math.floor((Date.now() / 1000 - session.lastActivity) / 60),
  );
  const lastSeen =
    ageMin < 1 ? 'just now' : ageMin < 60 ? `${ageMin}m ago` : `${Math.floor(ageMin / 60)}h ago`;

  function handleDragStart(e: DragEvent<HTMLDivElement>): void {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData(TMUX_DRAG_TYPE, JSON.stringify({ tmuxName: session.name }));
    // Plain-text fallback for terminals / file systems that may receive
    // the drag accidentally — pastes the attach command.
    e.dataTransfer.setData('text/plain', `tmux attach -t ${session.name}`);
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      className="group flex cursor-grab items-center gap-2 rounded-control px-2 py-1.5 transition-colors duration-fast ease-out hover:bg-sidebarHover active:cursor-grabbing"
      role="button"
      title={`Drag onto canvas or click to attach. Re-attach from terminal: tmux attach -t ${session.name}`}
    >
      <TmuxIcon />
      <div className="min-w-0 flex-1">
        <div className="truncate font-ui text-[12px] font-medium text-text-primary">
          {session.name}
        </div>
        <div className="truncate font-ui text-[10px] text-text-muted">
          {session.windowCount} window{session.windowCount === 1 ? '' : 's'} · {lastSeen}
          {session.attached && ' · attached elsewhere'}
        </div>
      </div>
    </div>
  );
}

function TmuxIcon() {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="flex-shrink-0 text-text-muted"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 9l3 3-3 3M13 15h4" />
    </svg>
  );
}

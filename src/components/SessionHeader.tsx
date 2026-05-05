import type { CSSProperties, HTMLAttributes } from 'react';
import type { SessionStatus } from '../hooks/useSession';

export interface SessionHeaderProps {
  name: string;
  color: string;
  status: SessionStatus;
  onKill: () => void;
  onRestart?: () => void;
  // Drag handle wiring from @dnd-kit (Phase 3+). When provided, the header
  // becomes the panel's drag handle. Controls inside the header stop
  // propagation so they remain clickable during drag.
  dragHandleProps?: HTMLAttributes<HTMLElement>;
  dragHandleStyle?: CSSProperties;
}

export function SessionHeader(props: SessionHeaderProps) {
  return (
    <div
      {...props.dragHandleProps}
      className="flex flex-shrink-0 items-center gap-3 border-b border-edge bg-panelHead px-3 select-none"
      style={{
        height: 'var(--header-height)',
        cursor: props.dragHandleProps ? 'grab' : 'default',
        ...props.dragHandleStyle,
      }}
    >
      <span
        aria-hidden
        className="block flex-shrink-0 rounded-pill"
        style={{ width: 8, height: 8, backgroundColor: props.color }}
      />
      <span
        className="font-ui text-[13px] font-medium text-text-primary truncate"
        title={props.name}
      >
        {props.name}
      </span>
      <StatusBadge status={props.status} />
      <div className="flex-1" />
      {props.status.kind === 'exited' && props.onRestart && (
        <button
          type="button"
          onPointerDown={stopPropagation}
          onClick={props.onRestart}
          aria-label="Restart session"
          className="cursor-pointer rounded-control px-2 py-0.5 font-ui text-[11px] font-medium text-accent transition-colors duration-fast ease-out hover:bg-accent-soft"
        >
          Restart
        </button>
      )}
      <button
        type="button"
        onPointerDown={stopPropagation}
        onClick={props.onKill}
        aria-label="Kill session"
        className="cursor-pointer rounded-control p-1 text-text-muted transition-colors duration-fast ease-out hover:text-danger focus-visible:text-danger"
      >
        <CloseIcon />
      </button>
    </div>
  );
}

function stopPropagation(e: React.PointerEvent): void {
  e.stopPropagation();
}

function StatusBadge({ status }: { status: SessionStatus }) {
  if (status.kind === 'running' || status.kind === 'idle') return null;
  const label =
    status.kind === 'spawning'
      ? 'spawning…'
      : status.kind === 'exited'
        ? `exited (${status.code})`
        : `error: ${status.reason}`;
  const color = status.kind === 'error' ? 'text-danger' : 'text-text-muted';
  return <span className={`font-ui text-[11px] ${color}`}>{label}</span>;
}

function CloseIcon() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M6 6L18 18M18 6L6 18" />
    </svg>
  );
}

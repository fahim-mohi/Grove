import { useEffect, useRef, useState, type CSSProperties, type HTMLAttributes } from 'react';
import type { SessionStatus } from '../hooks/useSession';
import { ColorPicker } from './ColorPicker';
import { InlineRename } from './InlineRename';
import { TagBadge } from './TagBadge';
import type { Tag } from '../store/types';

export interface SessionHeaderProps {
  sessionId: string;
  name: string;
  color: string;
  status: SessionStatus;
  tags?: Tag[];
  isFullscreen?: boolean;
  confirmKill?: boolean;
  onRename: (next: string) => void;
  onRecolor: (next: string) => void;
  onKill: () => void | Promise<void>;
  onRestart?: () => void;
  onSettings?: () => void;
  onToggleFullscreen?: () => void;
  // Drag handle wiring from @dnd-kit. When provided, the header (excluding
  // controls) becomes the panel's drag handle.
  dragHandleProps?: HTMLAttributes<HTMLElement>;
  dragHandleStyle?: CSSProperties;
}

const MAX_INLINE_TAGS = 2;

export function SessionHeader(props: SessionHeaderProps) {
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [renameTrigger, setRenameTrigger] = useState(0);
  const colorButtonRef = useRef<HTMLButtonElement | null>(null);

  // Close color picker if escape is pressed.
  useEffect(() => {
    if (!colorPickerOpen) return;
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') setColorPickerOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [colorPickerOpen]);

  // F2 rename trigger from useShortcuts — fires a custom event scoped to
  // the focused session id. Each header listens for its own.
  useEffect(() => {
    function onRename(e: Event): void {
      const detail = (e as CustomEvent<{ sessionId: string }>).detail;
      if (detail?.sessionId === props.sessionId) {
        setRenameTrigger((n) => n + 1);
      }
    }
    window.addEventListener('grove:rename-session', onRename);
    return () => window.removeEventListener('grove:rename-session', onRename);
  }, [props.sessionId]);

  async function handleKillClick(): Promise<void> {
    if (props.confirmKill) {
      const ok = await window.grove.dialog.confirm({
        title: `Kill ${props.name}?`,
        message: `Kill ${props.name}?`,
        detail: 'The PTY will be terminated. Scrollback in this panel will be lost.',
        danger: true,
        okLabel: 'Kill',
      });
      if (!ok) return;
    }
    await props.onKill();
  }

  return (
    <div
      className="relative flex flex-shrink-0 items-center gap-3 border-b border-edge bg-panelHead px-3 select-none"
      style={{ height: 'var(--header-height)' }}
    >
      {/* Drag handle covers the inert region (color dot + name + status).
          Controls render above with stopPropagation so they remain
          clickable while dragging never starts on them. */}
      <div
        {...props.dragHandleProps}
        className="absolute inset-0"
        style={{
          cursor: props.dragHandleProps ? 'grab' : 'default',
          ...props.dragHandleStyle,
        }}
        aria-hidden
      />

      <button
        ref={colorButtonRef}
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => setColorPickerOpen((o) => !o)}
        aria-label="Change color"
        aria-expanded={colorPickerOpen}
        aria-haspopup="dialog"
        className="relative z-10 flex-shrink-0 cursor-pointer rounded-pill p-0 transition-transform duration-fast ease-out hover:scale-110"
        style={{
          width: 14,
          height: 14,
          backgroundColor: 'transparent',
          border: 'none',
        }}
      >
        <span
          aria-hidden
          className="block rounded-pill"
          style={{ width: 8, height: 8, margin: '3px', backgroundColor: props.color }}
        />
      </button>

      {colorPickerOpen && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute left-0 top-full z-modal mt-1"
        >
          <ColorPicker
            value={props.color}
            onChange={(next) => {
              props.onRecolor(next);
            }}
            onClose={() => setColorPickerOpen(false)}
          />
        </div>
      )}

      <div
        onPointerDown={(e) => e.stopPropagation()}
        className="relative z-10 min-w-0 flex-shrink"
      >
        <InlineRenameWithF2
          key={renameTrigger}
          value={props.name}
          onCommit={props.onRename}
          shouldStartEditing={renameTrigger > 0}
        />
      </div>

      <TagsInline tags={props.tags ?? []} />

      <StatusBadge status={props.status} />
      <div className="flex-1" />

      {props.status.kind === 'exited' && props.onRestart && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={props.onRestart}
          aria-label="Restart session"
          className="relative z-10 cursor-pointer rounded-control px-2 py-0.5 font-ui text-[11px] font-medium text-accent transition-colors duration-fast ease-out hover:bg-accent-soft"
        >
          Restart
        </button>
      )}

      {props.onSettings && (
        <ControlButton aria-label="Session settings" onClick={props.onSettings}>
          <SettingsIcon />
        </ControlButton>
      )}

      {props.onToggleFullscreen && (
        <ControlButton
          aria-label={props.isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          onClick={props.onToggleFullscreen}
        >
          {props.isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
        </ControlButton>
      )}

      <ControlButton aria-label="Kill session" onClick={() => void handleKillClick()} hover="danger">
        <CloseIcon />
      </ControlButton>
    </div>
  );
}

function ControlButton({
  children,
  onClick,
  hover = 'primary',
  ...rest
}: {
  children: React.ReactNode;
  onClick: () => void;
  hover?: 'primary' | 'danger';
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const hoverClass = hover === 'danger' ? 'hover:text-danger' : 'hover:text-text-primary';
  return (
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClick}
      className={`relative z-10 cursor-pointer rounded-control p-1 text-text-muted transition-colors duration-fast ease-out ${hoverClass}`}
      {...rest}
    >
      {children}
    </button>
  );
}

// Bridges F2 trigger from useShortcuts into InlineRename's controlled
// `editing` prop. Re-keyed per F2 press so each invocation enters edit
// fresh. While not editing, renders the same className treatment as the
// inline-text path.
function InlineRenameWithF2({
  value,
  onCommit,
  shouldStartEditing,
}: {
  value: string;
  onCommit: (next: string) => void;
  shouldStartEditing: boolean;
}) {
  const [editing, setEditing] = useState(shouldStartEditing);

  return (
    <InlineRename
      value={value}
      onCommit={onCommit}
      editing={editing}
      onEditingChange={setEditing}
      className="block min-w-0 truncate font-ui text-[13px] font-medium text-text-primary"
      inputClassName="block w-full min-w-0 max-w-[240px] rounded-control border border-edge bg-input px-1 py-0 font-ui text-[13px] font-medium text-text-primary outline-none"
    />
  );
}

function TagsInline({ tags }: { tags: Tag[] }) {
  const [overflowOpen, setOverflowOpen] = useState(false);
  if (tags.length === 0) return null;
  const inline = tags.slice(0, MAX_INLINE_TAGS);
  const overflow = tags.slice(MAX_INLINE_TAGS);
  return (
    <div className="relative z-10 flex items-center gap-1">
      {inline.map((tag) => (
        <TagBadge key={tag.id} tag={tag} size="sm" />
      ))}
      {overflow.length > 0 && (
        <div className="relative">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseEnter={() => setOverflowOpen(true)}
            onMouseLeave={() => setOverflowOpen(false)}
            onClick={() => setOverflowOpen((o) => !o)}
            aria-label={`${overflow.length} more tag${overflow.length > 1 ? 's' : ''}`}
            className="cursor-pointer rounded-pill bg-tag px-1.5 py-0 font-ui text-[10px] font-semibold text-text-secondary transition-colors duration-fast ease-out hover:text-text-primary"
            style={{ height: 16 }}
          >
            +{overflow.length}
          </button>
          {overflowOpen && (
            <div
              onMouseEnter={() => setOverflowOpen(true)}
              onMouseLeave={() => setOverflowOpen(false)}
              className="absolute left-0 top-full z-modal mt-1 flex flex-wrap gap-1 rounded-control border border-edge bg-modal p-1.5 shadow-modal"
              style={{ minWidth: 120 }}
            >
              {overflow.map((tag) => (
                <TagBadge key={tag.id} tag={tag} size="sm" />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
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
  return <span className={`relative z-10 font-ui text-[11px] ${color}`}>{label}</span>;
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

function SettingsIcon() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function FullscreenIcon() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 9V5a2 2 0 0 1 2-2h4M21 9V5a2 2 0 0 0-2-2h-4M3 15v4a2 2 0 0 0 2 2h4M21 15v4a2 2 0 0 1-2 2h-4" />
    </svg>
  );
}

function ExitFullscreenIcon() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 3v4a2 2 0 0 1-2 2H3M21 9h-4a2 2 0 0 1-2-2V3M9 21v-4a2 2 0 0 0-2-2H3M21 15h-4a2 2 0 0 0-2 2v4" />
    </svg>
  );
}

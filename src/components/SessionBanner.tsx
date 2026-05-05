import type { SessionStatus } from '../hooks/useSession';

interface SessionBannerProps {
  status: SessionStatus;
  onRestart: () => void;
  onDismissFallbackWarning?: () => void;
}

// Per DESIGN.md §6.11. Avoids floating toasts — surfaces session-level
// state inline above the xterm viewport. Fallback warning (claude not on
// PATH, fell back to $SHELL) shows in yellow; exit/error shows in red
// with a restart affordance.
export function SessionBanner({ status, onRestart }: SessionBannerProps) {
  if (status.kind === 'error') {
    return (
      <Banner
        kind="danger"
        text={`${status.reason}: ${status.message}`}
        action={{ label: 'Retry', onClick: onRestart }}
      />
    );
  }

  if (status.kind === 'exited') {
    return (
      <Banner
        kind="danger"
        text={`Session ended (exit ${status.code})`}
        action={{ label: 'Restart', onClick: onRestart }}
      />
    );
  }

  if (status.kind === 'running' && status.usedFallback) {
    return (
      <Banner
        kind="warning"
        text={`claude CLI not found on PATH — running ${status.command} instead.`}
      />
    );
  }

  return null;
}

function Banner({
  kind,
  text,
  action,
}: {
  kind: 'warning' | 'danger';
  text: string;
  action?: { label: string; onClick: () => void };
}) {
  const bg = kind === 'warning' ? 'rgba(245, 158, 11, 0.16)' : 'rgba(220, 38, 38, 0.16)';
  const border = kind === 'warning' ? 'rgba(245, 158, 11, 0.55)' : 'rgba(220, 38, 38, 0.55)';
  const fg = kind === 'warning' ? 'var(--warning)' : 'var(--danger)';

  return (
    <div
      role={kind === 'danger' ? 'alert' : 'status'}
      className="flex flex-shrink-0 items-center gap-2 px-3 font-ui text-[12px]"
      style={{
        height: 28,
        background: bg,
        borderBottom: `1px solid ${border}`,
        color: fg,
      }}
    >
      {kind === 'warning' ? <WarningIcon /> : <DangerDotIcon />}
      <span className="flex-1 truncate">{text}</span>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          onPointerDown={(e) => e.stopPropagation()}
          className="cursor-pointer rounded-control px-2 py-0.5 font-ui text-[11px] font-semibold transition-colors duration-fast ease-out hover:brightness-110"
          style={{ color: fg, background: 'rgba(0, 0, 0, 0.06)' }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

function WarningIcon() {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function DangerDotIcon() {
  return (
    <svg width={10} height={10} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="12" cy="12" r="6" />
    </svg>
  );
}

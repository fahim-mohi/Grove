import { useEffect, useState } from 'react';
import { useWorkspaceStore } from '../store/workspace';

const AUTO_DISMISS_MS = 8000;

// Surfaces the tmux re-attach command after a session is detached from
// Grove. Bottom-center, dismissable, copy-on-click.
export function HandoffToast() {
  const detached = useWorkspaceStore((s) => s.lastDetachedTmux);
  const clearDetachedNotice = useWorkspaceStore((s) => s.clearDetachedNotice);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!detached) {
      setCopied(false);
      return;
    }
    const t = window.setTimeout(() => clearDetachedNotice(), AUTO_DISMISS_MS);
    return () => window.clearTimeout(t);
  }, [detached, clearDetachedNotice]);

  if (!detached) return null;

  const command = `tmux attach -t ${detached.tmuxName}`;

  async function copyCommand(): Promise<void> {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard might be unavailable; fall back silently.
    }
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 flex max-w-[520px] -translate-x-1/2 flex-col gap-2 rounded-control border border-edge bg-modal px-4 py-3 shadow-modal"
      style={{ zIndex: 100 }}
    >
      <div className="flex items-center gap-3">
        <span aria-hidden style={{ color: 'var(--success)', display: 'flex' }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5 9-9" />
          </svg>
        </span>
        <span className="font-ui text-[13px] text-text-primary">
          <strong>{detached.sessionName}</strong> is now in tmux. Re-attach from any terminal:
        </span>
        <button
          type="button"
          onClick={clearDetachedNotice}
          aria-label="Dismiss"
          className="ml-auto cursor-pointer rounded-control p-1 text-text-muted transition-colors duration-fast ease-out hover:text-text-primary"
        >
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden>
            <path d="M6 6L18 18M18 6L6 18" />
          </svg>
        </button>
      </div>
      <button
        type="button"
        onClick={() => void copyCommand()}
        className="flex cursor-pointer items-center gap-2 rounded-control border border-edge bg-input px-3 py-1.5 font-terminal text-[12px] text-text-primary transition-colors duration-fast ease-out hover:bg-sidebarHover"
        title="Click to copy"
      >
        <span className="flex-1 truncate text-left">{command}</span>
        <span
          className="font-ui text-[11px] font-semibold"
          style={{ color: copied ? 'var(--success)' : 'var(--text-muted)' }}
        >
          {copied ? 'copied' : 'copy'}
        </span>
      </button>
    </div>
  );
}

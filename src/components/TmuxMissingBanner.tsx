import { useState } from 'react';
import { useWorkspaceStore } from '../store/workspace';

const INSTALL_CMD = 'brew install tmux';
const STORAGE_KEY = 'grove.tmux-banner-dismissed';

// Sticky banner explaining that tmux isn't installed and how to fix it.
// Lets users dismiss it for the session — without tmux, sessions still
// work as local PTYs, just without portability.
export function TmuxMissingBanner() {
  const tmuxAvailable = useWorkspaceStore((s) => s.tmuxAvailable);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return window.sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [copied, setCopied] = useState(false);

  if (tmuxAvailable || dismissed) return null;

  function dismiss(): void {
    setDismissed(true);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore storage errors
    }
  }

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(INSTALL_CMD);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  }

  return (
    <div
      role="status"
      className="flex flex-shrink-0 items-center gap-3 border-b border-edge px-4 py-2 font-ui text-[12px]"
      style={{
        background: 'var(--accent-soft)',
        color: 'var(--accent)',
      }}
    >
      <span aria-hidden style={{ display: 'flex' }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </span>
      <span className="font-medium">tmux not detected.</span>
      <span style={{ color: 'var(--text-secondary)' }}>
        Install it to enable session portability — drag sessions in/out of Grove and pick them up
        in any terminal.
      </span>
      <button
        type="button"
        onClick={() => void copy()}
        className="cursor-pointer rounded-control border border-edge bg-modal px-2.5 py-0.5 font-terminal text-[11px] text-text-primary transition-colors duration-fast ease-out hover:bg-sidebarHover"
        title="Copy"
      >
        <span style={{ color: 'var(--text-secondary)' }}>$</span> {INSTALL_CMD}
        <span className="ml-2 font-ui text-[10px] font-semibold" style={{ color: copied ? 'var(--success)' : 'var(--text-muted)' }}>
          {copied ? 'copied' : 'copy'}
        </span>
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="ml-auto cursor-pointer rounded-control p-1 text-text-muted transition-colors duration-fast ease-out hover:text-text-primary"
      >
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden>
          <path d="M6 6L18 18M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}

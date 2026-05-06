import { useEffect, useState } from 'react';
import { useWorkspaceStore } from '../store/workspace';

const AUTO_DISMISS_MS = 14_000;

// Surfaces after a folder drop spawns a fresh local Claude — i.e. the
// drop succeeded but the user's session isn't adoptable. One-click
// install of the grove-claude shim. After install, future `claude`
// invocations through the shim are tmux-wrapped, and dropping that
// folder onto Grove attaches the existing session in-place.
export function InstallShimToast() {
  const nudge = useWorkspaceStore((s) => s.installShimNudge);
  const clear = useWorkspaceStore((s) => s.clearInstallShimNudge);
  const [installing, setInstalling] = useState(false);
  const [result, setResult] = useState<
    { kind: 'idle' } | { kind: 'ok'; path: string } | { kind: 'err'; message: string }
  >({ kind: 'idle' });

  useEffect(() => {
    if (!nudge) {
      setResult({ kind: 'idle' });
      return;
    }
    const t = window.setTimeout(() => clear(), AUTO_DISMISS_MS);
    return () => window.clearTimeout(t);
  }, [nudge, clear]);

  if (!nudge) return null;

  async function install(): Promise<void> {
    setInstalling(true);
    const r = await window.grove.system.installGroveClaudeShim();
    setInstalling(false);
    if (r.ok) setResult({ kind: 'ok', path: r.path });
    else setResult({ kind: 'err', message: r.error });
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 flex max-w-[560px] -translate-x-1/2 flex-col gap-2 rounded-control border border-edge bg-modal px-4 py-3 shadow-modal"
      style={{ zIndex: 100 }}
    >
      <div className="flex items-start gap-3">
        <span aria-hidden style={{ color: 'var(--accent)', display: 'flex', marginTop: 2 }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v6M9 5l3-3 3 3M5 12h14M5 12v8h14v-8" />
          </svg>
        </span>
        <div className="flex-1 font-ui text-[13px] text-text-primary">
          {result.kind === 'ok' ? (
            <>
              <strong>grove-claude installed</strong> at{' '}
              <code className="font-terminal text-[11px] text-text-secondary">{result.path}</code>.
              Run <code className="font-terminal text-[11px]">grove-claude</code> in any folder, then drag it onto Grove to attach.
            </>
          ) : result.kind === 'err' ? (
            <>
              <strong>Install failed.</strong>{' '}
              <span className="text-text-secondary">{result.message}</span>
            </>
          ) : (
            <>
              Spawned a fresh Claude in this folder. To make your existing terminal Claude sessions adoptable, install{' '}
              <code className="font-terminal text-[11px]">grove-claude</code> — it tmux-wraps each session so dragging the folder back into Grove attaches in-place instead of starting fresh.
            </>
          )}
        </div>
        <button
          type="button"
          onClick={clear}
          aria-label="Dismiss"
          className="cursor-pointer rounded-control p-1 text-text-muted transition-colors duration-fast ease-out hover:text-text-primary"
        >
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden>
            <path d="M6 6L18 18M18 6L6 18" />
          </svg>
        </button>
      </div>
      {result.kind === 'idle' && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void install()}
            disabled={installing}
            className="cursor-pointer rounded-control bg-accent px-3 py-1 font-ui text-[12px] font-semibold text-text-onAccent transition-colors duration-fast ease-out hover:bg-accent-hover disabled:opacity-60"
          >
            {installing ? 'Installing…' : 'Install grove-claude'}
          </button>
          <span className="font-ui text-[11px] text-text-muted">→ ~/.local/bin/grove-claude</span>
        </div>
      )}
    </div>
  );
}

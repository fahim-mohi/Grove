import { useEffect, useState, type ReactNode } from 'react';
import { useWorkspaceStore } from '../store/workspace';

const AUTO_DISMISS_MS = 14_000;

// Surfaces after a folder drop spawns a fresh local Claude — i.e. the
// drop succeeded but the user's session isn't adoptable. One-click
// install of the grove-claude shim. After install, future `claude`
// invocations through the shim are tmux-wrapped, and dropping that
// folder onto Grove attaches the existing session in-place.
export function InstallShimToast() {
  const nudge = useWorkspaceStore((s) => s.installShimNudge);
  const handoffActive = useWorkspaceStore((s) => Boolean(s.lastDetachedTmux));
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

  // When HandoffToast is also visible, stack this one above it so they
  // don't collide bottom-center. Both share the same horizontal anchor.
  const bottomOffset = handoffActive ? 92 : 16;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 flex w-[min(560px,calc(100vw-32px))] -translate-x-1/2 flex-col gap-2.5 rounded-control border border-edge bg-modal px-4 py-3 shadow-modal"
      style={{ zIndex: 100, bottom: bottomOffset }}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          style={{
            color: result.kind === 'ok' ? 'var(--success)' : 'var(--accent)',
            display: 'flex',
            marginTop: 2,
            flexShrink: 0,
          }}
        >
          {result.kind === 'ok' ? <CheckIcon /> : <DownloadIcon />}
        </span>
        <div className="flex-1 min-w-0">
          {result.kind === 'ok' ? (
            <BodyOk path={result.path} />
          ) : result.kind === 'err' ? (
            <BodyErr message={result.message} />
          ) : (
            <BodyIdle />
          )}
        </div>
        <button
          type="button"
          onClick={clear}
          aria-label="Dismiss"
          className="cursor-pointer rounded-control p-1 text-text-muted transition-colors duration-fast ease-out hover:text-text-primary"
          style={{ flexShrink: 0 }}
        >
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden>
            <path d="M6 6L18 18M18 6L6 18" />
          </svg>
        </button>
      </div>
      {result.kind === 'idle' && (
        <div className="flex items-center gap-2 pl-7">
          <button
            type="button"
            onClick={() => void install()}
            disabled={installing}
            className="cursor-pointer rounded-control bg-accent px-3 py-1 font-ui text-[12px] font-semibold text-text-onAccent transition-colors duration-fast ease-out hover:bg-accent-hover disabled:cursor-progress disabled:opacity-60"
          >
            {installing ? 'Installing…' : 'Install grove-claude'}
          </button>
          <span className="font-ui text-[11px] text-text-muted">
            → <Mono>~/.local/bin/grove-claude</Mono>
          </span>
        </div>
      )}
    </div>
  );
}

// Inline-code style — mirrors the asset pack's approach: monospace,
// soft tint, hairline border, slight padding. Not a full chip — just
// enough that "grove-claude" reads as code in flowing text.
function Mono({ children }: { children: ReactNode }) {
  return (
    <code
      className="font-terminal text-[11px] text-text-primary"
      style={{
        background: 'var(--bg-input)',
        border: '1px solid var(--border-default)',
        borderRadius: 4,
        padding: '1px 5px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </code>
  );
}

function BodyIdle() {
  return (
    <div className="flex flex-col gap-1">
      <div className="font-ui text-[13px] font-semibold text-text-primary">
        Make this folder's sessions adoptable
      </div>
      <div className="font-ui text-[12px] leading-snug text-text-secondary">
        Grove spawned a fresh Claude here. Install <Mono>grove-claude</Mono> to
        wrap your terminal sessions in tmux — drop the folder back onto Grove
        next time and it'll attach the same session instead of starting fresh.
      </div>
    </div>
  );
}

function BodyOk({ path }: { path: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="font-ui text-[13px] font-semibold text-text-primary">
        grove-claude installed
      </div>
      <div className="font-ui text-[12px] leading-snug text-text-secondary">
        Run <Mono>grove-claude</Mono> in any folder, then drag it onto Grove.
        Path: <Mono>{path}</Mono>
      </div>
    </div>
  );
}

function BodyErr({ message }: { message: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div
        className="font-ui text-[13px] font-semibold"
        style={{ color: 'var(--danger)' }}
      >
        Install failed
      </div>
      <div className="font-ui text-[12px] leading-snug text-text-secondary break-words">
        {message}
      </div>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12l5 5 9-9" />
    </svg>
  );
}

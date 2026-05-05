import { useEffect, useRef, useState } from 'react';
import type { SessionKind } from '../store/types';

export type SessionStatus =
  | { kind: 'idle' }
  | { kind: 'spawning' }
  | { kind: 'running'; pid: number; command: string; usedFallback: boolean }
  | { kind: 'exited'; code: number }
  | { kind: 'detached' }
  | { kind: 'error'; reason: string; message: string };

export interface UseSessionOptions {
  sessionId: string;
  initialCols?: number;
  initialRows?: number;
  cwd?: string;
  command?: string;
  // 'tmux' routes through window.grove.tmux.{createAndAttach|attach};
  // 'local' routes through window.grove.pty.create. Defaults to 'local'
  // when omitted.
  kind?: SessionKind;
  // For tmux sessions — name of the underlying tmux session.
  tmuxName?: string;
  // When true on a tmux-backed session, skip createSession (the session
  // already exists, e.g. when dragging an external session into Grove).
  attachOnly?: boolean;
  autoStart?: boolean;
}

export interface UseSessionReturn {
  status: SessionStatus;
  start: () => Promise<void>;
  kill: () => Promise<void>;
  restart: () => Promise<void>;
  // Tmux-only: kills the local attach PTY, leaves the tmux session
  // running. For non-tmux sessions, behaves identically to kill().
  detach: () => Promise<void>;
}

export function useSession(opts: UseSessionOptions): UseSessionReturn {
  const [status, setStatus] = useState<SessionStatus>({ kind: 'idle' });
  const exitUnsubRef = useRef<(() => void) | null>(null);
  const startedRef = useRef(false);
  const detachingRef = useRef(false);

  const cols = opts.initialCols ?? 80;
  const rows = opts.initialRows ?? 24;
  const kind: SessionKind = opts.kind ?? 'local';

  async function start(): Promise<void> {
    if (startedRef.current) return;
    startedRef.current = true;
    detachingRef.current = false;
    setStatus({ kind: 'spawning' });

    // Track exit independently so status updates flow even when
    // useTerminal isn't mounted yet.
    exitUnsubRef.current = window.grove.pty.onExit((sId, code) => {
      if (sId === opts.sessionId) {
        // Detach intentionally killed the local pty — surface as
        // 'detached' rather than 'exited' so the UI shows the
        // friendlier banner.
        if (detachingRef.current) {
          setStatus({ kind: 'detached' });
          detachingRef.current = false;
        } else {
          setStatus({ kind: 'exited', code });
        }
      }
    });

    let result: Awaited<ReturnType<typeof window.grove.pty.create>>;
    if (kind === 'tmux' && opts.tmuxName) {
      if (opts.attachOnly) {
        result = await window.grove.tmux.attach(opts.sessionId, {
          tmuxName: opts.tmuxName,
          cols,
          rows,
        });
      } else {
        const command = opts.command?.trim() || 'claude';
        result = await window.grove.tmux.createAndAttach(opts.sessionId, {
          tmuxName: opts.tmuxName,
          command,
          cols,
          rows,
          cwd: opts.cwd,
        });
      }
    } else {
      result = await window.grove.pty.create(opts.sessionId, {
        cols,
        rows,
        cwd: opts.cwd,
        command: opts.command,
      });
    }

    if (result.ok) {
      setStatus({
        kind: 'running',
        pid: result.pid,
        command: result.command,
        usedFallback: result.usedFallback,
      });
    } else {
      startedRef.current = false;
      setStatus({
        kind: 'error',
        reason: result.reason,
        message: result.error,
      });
    }
  }

  async function kill(): Promise<void> {
    detachingRef.current = false;
    await window.grove.pty.kill(opts.sessionId);
    startedRef.current = false;
  }

  // Tmux-aware: detach kills the attach PTY but leaves the tmux session
  // running so it can be re-attached later. For 'local' sessions, falls
  // back to plain kill (since there's nothing to detach to).
  async function detach(): Promise<void> {
    if (kind === 'tmux') {
      detachingRef.current = true;
      await window.grove.tmux.detach(opts.sessionId);
      startedRef.current = false;
    } else {
      await kill();
    }
  }

  async function restart(): Promise<void> {
    await kill();
    await start();
  }

  useEffect(() => {
    if (opts.autoStart !== false) {
      void start();
    }
    return () => {
      exitUnsubRef.current?.();
      exitUnsubRef.current = null;
      // On unmount, tmux sessions detach (preserve), local sessions kill.
      if (kind === 'tmux') {
        void window.grove.tmux.detach(opts.sessionId);
      } else {
        void window.grove.pty.kill(opts.sessionId);
      }
      startedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.sessionId]);

  return { status, start, kill, restart, detach };
}

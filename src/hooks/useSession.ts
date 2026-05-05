import { useEffect, useRef, useState } from 'react';

export type SessionStatus =
  | { kind: 'idle' }
  | { kind: 'spawning' }
  | { kind: 'running'; pid: number; command: string; usedFallback: boolean }
  | { kind: 'exited'; code: number }
  | { kind: 'error'; reason: string; message: string };

export interface UseSessionOptions {
  sessionId: string;
  initialCols?: number;
  initialRows?: number;
  cwd?: string;
  command?: string;
  // If false, caller is responsible for invoking start() explicitly.
  // Defaults to true: spawns the PTY on mount.
  autoStart?: boolean;
}

export interface UseSessionReturn {
  status: SessionStatus;
  start: () => Promise<void>;
  kill: () => Promise<void>;
  restart: () => Promise<void>;
}

// Owns the PTY lifecycle for one Grove session. Calls window.grove.pty.create
// on mount (when autoStart is true), kills the PTY on unmount, and exposes
// status + restart.
//
// Note: this hook does NOT subscribe to pty:data — that's useTerminal's job.
// Order matters: SessionPanel calls useTerminal *before* useSession so the
// data listener is registered before the PTY starts emitting.
export function useSession(opts: UseSessionOptions): UseSessionReturn {
  const [status, setStatus] = useState<SessionStatus>({ kind: 'idle' });
  const exitUnsubRef = useRef<(() => void) | null>(null);
  const startedRef = useRef(false);

  const cols = opts.initialCols ?? 80;
  const rows = opts.initialRows ?? 24;

  async function start(): Promise<void> {
    if (startedRef.current) return;
    startedRef.current = true;
    setStatus({ kind: 'spawning' });

    // Track exit independently of useTerminal so status updates flow even
    // if the panel is rendered without a terminal viewport.
    exitUnsubRef.current = window.grove.pty.onExit((sId, code) => {
      if (sId === opts.sessionId) {
        setStatus({ kind: 'exited', code });
      }
    });

    const result = await window.grove.pty.create(opts.sessionId, {
      cols,
      rows,
      cwd: opts.cwd,
      command: opts.command,
    });

    if (result.ok) {
      setStatus({
        kind: 'running',
        pid: result.pid,
        command: result.command,
        usedFallback: result.usedFallback,
      });
    } else {
      startedRef.current = false; // allow retry
      setStatus({
        kind: 'error',
        reason: result.reason,
        message: result.error,
      });
    }
  }

  async function kill(): Promise<void> {
    await window.grove.pty.kill(opts.sessionId);
    startedRef.current = false;
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
      void window.grove.pty.kill(opts.sessionId);
      startedRef.current = false;
    };
    // sessionId is the only stable identity; other opts are read at start time
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.sessionId]);

  return { status, start, kill, restart };
}

import { useEffect, useRef, useState } from 'react';

interface Versions {
  electron: string;
  node: string;
  chrome: string;
  grove: string;
}

type SpawnStatus =
  | { kind: 'idle' }
  | { kind: 'spawning' }
  | { kind: 'running'; pid: number; command: string; usedFallback: boolean }
  | { kind: 'error'; message: string }
  | { kind: 'exited'; code: number };

// Phase 1 smoke test. This is throwaway UI — Phase 2 replaces it with a
// real SessionPanel using xterm.js. It exists to confirm the PTY <-> IPC
// <-> renderer round-trip works end-to-end before we layer on xterm.
export function App() {
  const [versions, setVersions] = useState<Versions | null>(null);
  const [claudeInstalled, setClaudeInstalled] = useState<boolean | null>(null);
  const [status, setStatus] = useState<SpawnStatus>({ kind: 'idle' });
  const [output, setOutput] = useState('');
  const [input, setInput] = useState('');
  const sessionIdRef = useRef<string | null>(null);
  const dataUnsubRef = useRef<(() => void) | null>(null);
  const exitUnsubRef = useRef<(() => void) | null>(null);
  const outputRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    setVersions(window.grove.system.versions());
    void window.grove.system.isClaudeInstalled().then(setClaudeInstalled);
    return () => {
      dataUnsubRef.current?.();
      exitUnsubRef.current?.();
      const id = sessionIdRef.current;
      if (id) void window.grove.pty.kill(id);
    };
  }, []);

  // Auto-scroll output as it streams.
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  async function handleSpawn(): Promise<void> {
    if (status.kind === 'running' || status.kind === 'spawning') return;

    const id = `debug-${Date.now()}`;
    sessionIdRef.current = id;
    setOutput('');

    dataUnsubRef.current?.();
    exitUnsubRef.current?.();

    dataUnsubRef.current = window.grove.pty.onData((sId, data) => {
      if (sId === id) setOutput((prev) => prev + data);
    });
    exitUnsubRef.current = window.grove.pty.onExit((sId, code) => {
      if (sId === id) setStatus({ kind: 'exited', code });
    });

    setStatus({ kind: 'spawning' });
    const result = await window.grove.pty.create(id, { cols: 100, rows: 30 });
    if (result.ok) {
      setStatus({
        kind: 'running',
        pid: result.pid,
        command: result.command,
        usedFallback: result.usedFallback,
      });
    } else {
      setStatus({ kind: 'error', message: `${result.reason}: ${result.error}` });
    }
  }

  async function handleKill(): Promise<void> {
    const id = sessionIdRef.current;
    if (!id) return;
    await window.grove.pty.kill(id);
    sessionIdRef.current = null;
    setStatus({ kind: 'idle' });
  }

  function handleSendLine(): void {
    const id = sessionIdRef.current;
    if (!id || !input) return;
    window.grove.pty.write(id, input + '\r');
    setInput('');
  }

  function handleInputKey(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter') handleSendLine();
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-canvas text-text-primary">
      {/* Title bar drag region — leaves traffic-light area on the left */}
      <header
        className="drag-region flex items-center justify-between border-b border-edge px-6"
        style={{ height: 'var(--toolbar-height)', paddingLeft: '88px' }}
      >
        <div className="flex items-center gap-3">
          <span className="font-terminal text-lg font-semibold text-accent">{'>_'}</span>
          <span className="font-ui text-sm font-semibold">Grove</span>
          <span className="font-ui text-xs text-text-muted">phase 1 — pty smoke test</span>
        </div>
        <div className="font-ui text-xs text-text-muted">
          claude CLI:{' '}
          {claudeInstalled === null ? (
            'checking…'
          ) : claudeInstalled ? (
            <span className="text-success">detected</span>
          ) : (
            <span className="text-warning">not on PATH (will fall back to $SHELL)</span>
          )}
        </div>
      </header>

      <main className="no-drag flex flex-1 flex-col gap-4 overflow-hidden p-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void handleSpawn()}
            disabled={status.kind === 'spawning' || status.kind === 'running'}
            className="rounded-control bg-accent px-4 py-2 font-ui text-sm font-semibold text-text-onAccent transition-colors duration-fast ease-out hover:bg-accent-hover disabled:opacity-40"
          >
            {status.kind === 'spawning' ? 'Spawning…' : 'Spawn claude'}
          </button>
          <button
            type="button"
            onClick={() => void handleKill()}
            disabled={status.kind !== 'running'}
            className="rounded-control border border-edge bg-panel px-4 py-2 font-ui text-sm font-medium text-text-primary transition-colors duration-fast ease-out hover:bg-sidebarHover disabled:opacity-40"
          >
            Kill
          </button>
          <span className="ml-auto font-ui text-xs text-text-secondary">
            {status.kind === 'running' && (
              <>
                pid <span className="font-terminal">{status.pid}</span>
                {' · '}
                <span className="font-terminal">{status.command}</span>
                {status.usedFallback && <span className="text-warning"> (fallback shell)</span>}
              </>
            )}
            {status.kind === 'exited' && (
              <span className="text-danger">exited with code {status.code}</span>
            )}
            {status.kind === 'error' && <span className="text-danger">{status.message}</span>}
          </span>
        </div>

        <pre
          ref={outputRef}
          className="allow-select flex-1 overflow-auto rounded-panel border border-edge bg-panel p-4 font-terminal text-xs leading-relaxed text-text-primary shadow-panel-resting"
        >
          {output || (
            <span className="text-text-muted">
              Click <span className="text-accent">Spawn claude</span> to start a PTY. Output streams
              here.
            </span>
          )}
        </pre>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleInputKey}
            disabled={status.kind !== 'running'}
            placeholder={
              status.kind === 'running'
                ? 'type a command, press Enter'
                : 'spawn a session to enable input'
            }
            className="flex-1 rounded-control border border-edge bg-input px-3 py-2 font-terminal text-sm text-text-primary placeholder:text-text-muted disabled:opacity-40"
          />
          <button
            type="button"
            onClick={handleSendLine}
            disabled={status.kind !== 'running' || !input}
            className="rounded-control border border-edge bg-panel px-4 py-2 font-ui text-sm font-medium text-text-primary transition-colors duration-fast ease-out hover:bg-sidebarHover disabled:opacity-40"
          >
            Send
          </button>
        </div>

        {versions && (
          <p className="text-center font-terminal text-xs text-text-muted">
            electron {versions.electron} · node {versions.node} · grove {versions.grove}
          </p>
        )}
      </main>
    </div>
  );
}

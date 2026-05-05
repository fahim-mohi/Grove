import { useEffect, useState } from 'react';
import { WorkspaceCanvas } from './components/WorkspaceCanvas';
import { useWorkspaceStore } from './store/workspace';

interface Versions {
  electron: string;
  node: string;
  chrome: string;
  grove: string;
}

// Phase 3: WorkspaceCanvas with two seeded sessions to exercise drag,
// resize, focus, and z-index layering. Phase 5 wires up the real Sidebar
// + NewSessionDialog so users can add sessions themselves.
export function App() {
  const [versions, setVersions] = useState<Versions | null>(null);
  const [claudeInstalled, setClaudeInstalled] = useState<boolean | null>(null);
  const sessionCount = useWorkspaceStore((s) => s.sessionOrder.length);

  useEffect(() => {
    setVersions(window.grove.system.versions());
    void window.grove.system.isClaudeInstalled().then(setClaudeInstalled);
  }, []);

  // Seed two test sessions exactly once. Subsequent HMR reloads keep the
  // existing store state because Zustand stores live outside React state.
  useEffect(() => {
    const state = useWorkspaceStore.getState();
    if (state.sessionOrder.length === 0) {
      state.addSession({
        name: 'claude-1',
        color: '#D97706',
        position: { x: 80, y: 80 },
        size: { width: 720, height: 480 },
      });
      state.addSession({
        name: 'claude-2',
        color: '#6366F1',
        position: { x: 880, y: 200 },
        size: { width: 640, height: 440 },
      });
    }
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col bg-canvas text-text-primary">
      <header
        className="drag-region flex flex-shrink-0 items-center justify-between border-b border-edge px-6 bg-toolbar backdrop-blur"
        style={{ height: 'var(--toolbar-height)', paddingLeft: '88px' }}
      >
        <div className="flex items-center gap-3">
          <span className="font-terminal text-lg font-semibold text-accent">{'>_'}</span>
          <span className="font-ui text-sm font-semibold">Grove</span>
          <span className="font-ui text-xs text-text-muted">phase 3 — workspace canvas</span>
        </div>
        <div className="flex items-center gap-4 font-ui text-xs text-text-muted">
          <span>
            sessions: <span className="text-text-secondary">{sessionCount}</span>
          </span>
          <span>
            claude:{' '}
            {claudeInstalled === null ? (
              'checking…'
            ) : claudeInstalled ? (
              <span className="text-success">detected</span>
            ) : (
              <span className="text-warning">$SHELL fallback</span>
            )}
          </span>
        </div>
      </header>

      <main className="no-drag flex-1 overflow-hidden">
        <WorkspaceCanvas />
      </main>

      {versions && (
        <footer className="flex-shrink-0 border-t border-edge px-6 py-2 text-center font-terminal text-[11px] text-text-muted">
          electron {versions.electron} · node {versions.node} · grove {versions.grove}
        </footer>
      )}
    </div>
  );
}

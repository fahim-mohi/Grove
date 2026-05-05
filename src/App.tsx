import { useEffect, useState } from 'react';
import { SessionPanel } from './components/SessionPanel';

interface Versions {
  electron: string;
  node: string;
  chrome: string;
  grove: string;
}

// Phase 2: a single hardcoded SessionPanel centered on the canvas.
// Phase 3 wraps multiple panels in WorkspaceCanvas with @dnd-kit.
export function App() {
  const [versions, setVersions] = useState<Versions | null>(null);
  const [claudeInstalled, setClaudeInstalled] = useState<boolean | null>(null);

  useEffect(() => {
    setVersions(window.grove.system.versions());
    void window.grove.system.isClaudeInstalled().then(setClaudeInstalled);
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col bg-canvas text-text-primary">
      <header
        className="drag-region flex flex-shrink-0 items-center justify-between border-b border-edge px-6"
        style={{ height: 'var(--toolbar-height)', paddingLeft: '88px' }}
      >
        <div className="flex items-center gap-3">
          <span className="font-terminal text-lg font-semibold text-accent">{'>_'}</span>
          <span className="font-ui text-sm font-semibold">Grove</span>
          <span className="font-ui text-xs text-text-muted">phase 2 — session panel</span>
        </div>
        <div className="font-ui text-xs text-text-muted">
          claude CLI:{' '}
          {claudeInstalled === null ? (
            'checking…'
          ) : claudeInstalled ? (
            <span className="text-success">detected</span>
          ) : (
            <span className="text-warning">not on PATH (using $SHELL)</span>
          )}
        </div>
      </header>

      <main className="no-drag flex flex-1 items-center justify-center overflow-hidden p-8">
        <SessionPanel sessionId="grove-session-1" name="claude-1" color="#D97706" />
      </main>

      {versions && (
        <footer className="flex-shrink-0 border-t border-edge px-6 py-2 text-center font-terminal text-[11px] text-text-muted">
          electron {versions.electron} · node {versions.node} · grove {versions.grove}
        </footer>
      )}
    </div>
  );
}

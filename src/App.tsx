import { useEffect, useState } from 'react';
import { WorkspaceCanvas } from './components/WorkspaceCanvas';
import { Sidebar } from './components/Sidebar';
import { NewSessionDialog } from './components/NewSessionDialog';
import { useWorkspaceStore } from './store/workspace';

interface Versions {
  electron: string;
  node: string;
  chrome: string;
  grove: string;
}

export function App() {
  const [versions, setVersions] = useState<Versions | null>(null);
  const [claudeInstalled, setClaudeInstalled] = useState<boolean | null>(null);
  const sessionCount = useWorkspaceStore((s) => s.sessionOrder.length);
  const modal = useWorkspaceStore((s) => s.modal);
  const openModal = useWorkspaceStore((s) => s.openModal);
  const closeModal = useWorkspaceStore((s) => s.closeModal);
  const toggleSidebar = useWorkspaceStore((s) => s.toggleSidebar);

  useEffect(() => {
    setVersions(window.grove.system.versions());
    void window.grove.system.isClaudeInstalled().then(setClaudeInstalled);
  }, []);

  // Phase 5 keyboard shortcuts. Phase 11 introduces the full set.
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        openModal({ type: 'newSession' });
      } else if (e.key === '\\') {
        e.preventDefault();
        toggleSidebar();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openModal, toggleSidebar]);

  return (
    <div className="flex h-screen w-screen flex-col bg-canvas text-text-primary">
      <header
        className="drag-region flex flex-shrink-0 items-center justify-between border-b border-edge bg-toolbar px-6 backdrop-blur"
        style={{ height: 'var(--toolbar-height)', paddingLeft: '88px' }}
      >
        <div className="flex items-center gap-3">
          <span className="font-terminal text-lg font-semibold text-accent">{'>_'}</span>
          <span className="font-ui text-sm font-semibold">Grove</span>
          <span className="font-ui text-xs text-text-muted">phase 5 — sidebar + sessions</span>
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

      <div className="no-drag flex flex-1 overflow-hidden">
        <Sidebar onOpenNewSession={() => openModal({ type: 'newSession' })} />
        <main className="flex-1 overflow-hidden">
          <WorkspaceCanvas />
        </main>
      </div>

      {versions && (
        <footer className="flex-shrink-0 border-t border-edge px-6 py-2 text-center font-terminal text-[11px] text-text-muted">
          electron {versions.electron} · node {versions.node} · grove {versions.grove}
        </footer>
      )}

      <NewSessionDialog
        open={modal?.type === 'newSession'}
        onClose={closeModal}
      />
    </div>
  );
}

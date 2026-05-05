import { useEffect, useState } from 'react';
import { WorkspaceCanvas } from './components/WorkspaceCanvas';
import { Sidebar } from './components/Sidebar';
import { NewSessionDialog } from './components/NewSessionDialog';
import { Toolbar } from './components/Toolbar';
import { ThemeProvider } from './components/ThemeProvider';
import { useWorkspaceStore } from './store/workspace';
import { useSettingsStore } from './store/settings';

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
  const darkMode = useSettingsStore((s) => s.darkMode);
  const setDarkMode = useSettingsStore((s) => s.setDarkMode);

  useEffect(() => {
    setVersions(window.grove.system.versions());
    void window.grove.system.isClaudeInstalled().then(setClaudeInstalled);
  }, []);

  // Phase 5 + Phase 7 keyboard shortcuts. Phase 11 introduces the full set.
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
      } else if (e.key === 'd' || e.key === 'D') {
        // Toggle light ↔ dark (system mode reachable via Settings).
        e.preventDefault();
        setDarkMode(darkMode === 'dark' ? 'light' : 'dark');
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openModal, toggleSidebar, darkMode, setDarkMode]);

  return (
    <ThemeProvider>
      <div className="flex h-screen w-screen flex-col bg-canvas text-text-primary">
        <Toolbar
          sessionCount={sessionCount}
          claudeInstalled={claudeInstalled}
          onOpenSettings={() => openModal({ type: 'settings' })}
        />

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

        <NewSessionDialog open={modal?.type === 'newSession'} onClose={closeModal} />
      </div>
    </ThemeProvider>
  );
}

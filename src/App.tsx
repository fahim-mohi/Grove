import { useEffect, useState } from 'react';
import { WorkspaceCanvas } from './components/WorkspaceCanvas';
import { Sidebar } from './components/Sidebar';
import { NewSessionDialog } from './components/NewSessionDialog';
import { SettingsModal } from './components/settings/SettingsModal';
import { Toolbar } from './components/Toolbar';
import { HandoffToast } from './components/HandoffToast';
import { TmuxMissingBanner } from './components/TmuxMissingBanner';
import { ThemeProvider } from './components/ThemeProvider';
import { useWorkspaceStore } from './store/workspace';
import { useSettingsStore } from './store/settings';
import { useShortcuts } from './hooks/useShortcuts';
import { setSaveErrorListener } from './store/persistence';

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
  const zoomCanvasAt = useWorkspaceStore((s) => s.zoomCanvasAt);
  const resetCanvas = useWorkspaceStore((s) => s.resetCanvas);
  const fitAllToBounds = useWorkspaceStore((s) => s.fitAllToBounds);

  const [saveError, setSaveError] = useState<string | null>(null);
  const setTmuxAvailable = useWorkspaceStore((s) => s.setTmuxAvailable);
  const setExternalTmuxSessions = useWorkspaceStore((s) => s.setExternalTmuxSessions);

  useEffect(() => {
    setVersions(window.grove.system.versions());
    void window.grove.system.isClaudeInstalled().then(setClaudeInstalled);
    return setSaveErrorListener((message) => {
      setSaveError(message);
    });
  }, []);

  // Detect tmux + poll external sessions every 5s. The list excludes
  // tmux sessions that Grove panels are currently attached to (those
  // already render as panels).
  useEffect(() => {
    let cancelled = false;
    let timer: number | null = null;

    async function refresh(): Promise<void> {
      const ok = await window.grove.tmux.isAvailable();
      if (cancelled) return;
      setTmuxAvailable(ok);
      if (!ok) {
        setExternalTmuxSessions([]);
        return;
      }
      const all = await window.grove.tmux.listSessions();
      if (cancelled) return;
      const groveTmuxNames = new Set(
        Object.values(useWorkspaceStore.getState().sessions)
          .filter((s) => s.kind === 'tmux' && s.attached !== false && s.tmuxName)
          .map((s) => s.tmuxName!),
      );
      setExternalTmuxSessions(all.filter((s) => !groveTmuxNames.has(s.name)));
    }

    void refresh();
    timer = window.setInterval(() => void refresh(), 5000);
    return () => {
      cancelled = true;
      if (timer !== null) window.clearInterval(timer);
    };
  }, [setTmuxAvailable, setExternalTmuxSessions]);

  useShortcuts();

  // Native menu bar actions arrive via IPC. They mirror the keyboard
  // shortcuts but originate from the macOS menu bar; both paths land in
  // the same store actions.
  useEffect(() => {
    const unsub = window.grove.menu.onAction((action) => {
      switch (action) {
        case 'new-session':
          openModal({ type: 'newSession' });
          break;
        case 'open-settings':
          openModal({ type: 'settings' });
          break;
        case 'close-session': {
          const state = useWorkspaceStore.getState();
          const id = state.focusedSessionId;
          if (id) {
            void window.grove.pty.kill(id).then(() => state.removeSession(id));
          }
          break;
        }
        case 'toggle-sidebar':
          toggleSidebar();
          break;
        case 'toggle-dark':
          setDarkMode(useSettingsStore.getState().darkMode === 'dark' ? 'light' : 'dark');
          break;
        case 'fit-all':
          fitAllToBounds({ width: window.innerWidth, height: window.innerHeight });
          break;
        case 'reset-zoom':
          resetCanvas();
          break;
        case 'zoom-in':
          zoomCanvasAt(window.innerWidth / 2, window.innerHeight / 2, 1.1);
          break;
        case 'zoom-out':
          zoomCanvasAt(window.innerWidth / 2, window.innerHeight / 2, 1 / 1.1);
          break;
      }
    });
    return unsub;
  }, [openModal, toggleSidebar, setDarkMode, fitAllToBounds, resetCanvas, zoomCanvasAt]);

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
        e.preventDefault();
        setDarkMode(darkMode === 'dark' ? 'light' : 'dark');
      } else if (e.key === ',') {
        e.preventDefault();
        openModal({ type: 'settings' });
      } else if (e.key === '0') {
        e.preventDefault();
        resetCanvas();
      } else if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        zoomCanvasAt(window.innerWidth / 2, window.innerHeight / 2, 1.1);
      } else if (e.key === '-') {
        e.preventDefault();
        zoomCanvasAt(window.innerWidth / 2, window.innerHeight / 2, 1 / 1.1);
      } else if (e.key === 'f' || e.key === 'F') {
        if (e.shiftKey) {
          e.preventDefault();
          fitAllToBounds({ width: window.innerWidth, height: window.innerHeight });
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openModal, toggleSidebar, darkMode, setDarkMode, resetCanvas, zoomCanvasAt, fitAllToBounds]);

  return (
    <ThemeProvider>
      <div className="flex h-screen w-screen flex-col bg-canvas text-text-primary">
        <Toolbar
          sessionCount={sessionCount}
          claudeInstalled={claudeInstalled}
          onOpenSettings={() => openModal({ type: 'settings' })}
        />

        <TmuxMissingBanner />

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
        <SettingsModal open={modal?.type === 'settings'} onClose={closeModal} />
        <HandoffToast />

        {saveError && (
          <div
            role="alert"
            className="fixed bottom-4 left-1/2 z-tooltip flex -translate-x-1/2 items-center gap-3 rounded-control border border-edge bg-modal px-4 py-2 shadow-modal"
            style={{ color: 'var(--danger)', zIndex: 100 }}
          >
            <span aria-hidden>●</span>
            <span className="font-ui text-[12px]">{saveError}</span>
            <button
              type="button"
              onClick={() => setSaveError(null)}
              aria-label="Dismiss"
              className="cursor-pointer rounded-control p-1 text-text-muted transition-colors duration-fast ease-out hover:text-text-primary"
            >
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden>
                <path d="M6 6L18 18M18 6L6 18" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
}

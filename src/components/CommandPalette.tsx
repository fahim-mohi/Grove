import { useEffect, useMemo, useRef, useState } from 'react';
import { useWorkspaceStore } from '../store/workspace';
import { useSettingsStore } from '../store/settings';
import { themeOrder, themes } from '../themes';
import type { ThemePreset } from '../store/types';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface Action {
  id: string;
  label: string;
  hint?: string;
  shortcut?: string;
  group: string;
  keywords?: string;
  onRun: () => void | Promise<void>;
}

// Cmd+K palette — Raycast/Linear-style. 640px wide, centered, search +
// scrollable results with keyboard nav. Action set covers core flows
// already wired elsewhere (new session, theme switch, fit, settings,
// kill focused, etc).
export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);

  // Build the action list from store/settings on every render so it
  // reflects the live app state (sessions, themes, dark mode, etc).
  const sessions = useWorkspaceStore((s) => s.sessionOrder);
  const sessionsMap = useWorkspaceStore((s) => s.sessions);
  const focusedId = useWorkspaceStore((s) => s.focusedSessionId);
  const focusSession = useWorkspaceStore((s) => s.focusSession);
  const bringToFront = useWorkspaceStore((s) => s.bringToFront);
  const removeSession = useWorkspaceStore((s) => s.removeSession);
  const openModal = useWorkspaceStore((s) => s.openModal);
  const toggleSidebar = useWorkspaceStore((s) => s.toggleSidebar);
  const fitAllToBounds = useWorkspaceStore((s) => s.fitAllToBounds);
  const resetCanvas = useWorkspaceStore((s) => s.resetCanvas);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setDarkMode = useSettingsStore((s) => s.setDarkMode);
  const darkMode = useSettingsStore((s) => s.darkMode);

  const allActions: Action[] = useMemo(() => {
    const a: Action[] = [];

    a.push({
      id: 'new-session',
      label: 'New Session',
      shortcut: '⌘N',
      group: 'Sessions',
      keywords: 'new create spawn claude',
      onRun: () => openModal({ type: 'newSession' }),
    });

    if (focusedId) {
      const session = sessionsMap[focusedId];
      if (session) {
        a.push({
          id: 'rename-focused',
          label: 'Rename Focused Session',
          shortcut: 'F2',
          group: 'Sessions',
          keywords: 'rename label',
          onRun: () => {
            window.dispatchEvent(
              new CustomEvent('grove:rename-session', {
                detail: { sessionId: focusedId },
              }),
            );
          },
        });
        a.push({
          id: 'kill-focused',
          label: `Kill ${session.name}`,
          shortcut: '⌘W',
          group: 'Sessions',
          keywords: 'kill close terminate',
          onRun: () => {
            void window.grove.pty.kill(focusedId).then(() => removeSession(focusedId));
          },
        });
      }
    }

    sessions.slice(0, 9).forEach((id, idx) => {
      const s = sessionsMap[id];
      if (!s) return;
      a.push({
        id: `focus-${id}`,
        label: `Focus ${s.name}`,
        shortcut: `⌘${idx + 1}`,
        group: 'Sessions',
        keywords: `focus jump ${s.name} ${s.tmuxName ?? ''}`,
        onRun: () => {
          focusSession(id);
          bringToFront(id);
        },
      });
    });

    a.push({
      id: 'fit-canvas',
      label: 'Fit Canvas',
      shortcut: '⌘⇧F',
      group: 'View',
      keywords: 'zoom layout overview',
      onRun: () => fitAllToBounds({ width: window.innerWidth, height: window.innerHeight }),
    });
    a.push({
      id: 'reset-zoom',
      label: 'Reset Zoom',
      shortcut: '⌘0',
      group: 'View',
      keywords: 'zoom 100',
      onRun: () => resetCanvas(),
    });
    a.push({
      id: 'toggle-sidebar',
      label: 'Toggle Sidebar',
      shortcut: '⌘\\',
      group: 'View',
      keywords: 'sidebar collapse hide',
      onRun: () => toggleSidebar(),
    });

    a.push({
      id: 'cycle-dark',
      label:
        darkMode === 'dark'
          ? 'Switch to Light Mode'
          : darkMode === 'light'
            ? 'Switch to System Mode'
            : 'Switch to Dark Mode',
      shortcut: '⌘D',
      group: 'Appearance',
      keywords: 'theme dark light system',
      onRun: () => {
        if (darkMode === 'light') setDarkMode('dark');
        else if (darkMode === 'dark') setDarkMode('system');
        else setDarkMode('light');
      },
    });

    themeOrder.forEach((id: ThemePreset) => {
      a.push({
        id: `theme-${id}`,
        label: `Theme: ${themes[id].label}`,
        group: 'Appearance',
        keywords: `theme ${themes[id].label.toLowerCase()}`,
        onRun: () => setTheme(id),
      });
    });

    a.push({
      id: 'open-settings',
      label: 'Open Settings',
      shortcut: '⌘,',
      group: 'App',
      keywords: 'preferences config',
      onRun: () => openModal({ type: 'settings' }),
    });

    return a;
  }, [
    sessions,
    sessionsMap,
    focusedId,
    darkMode,
    focusSession,
    bringToFront,
    removeSession,
    openModal,
    toggleSidebar,
    fitAllToBounds,
    resetCanvas,
    setTheme,
    setDarkMode,
  ]);

  const filtered = useMemo(() => {
    if (!query.trim()) return allActions;
    const q = query.toLowerCase();
    return allActions.filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        a.group.toLowerCase().includes(q) ||
        (a.keywords ?? '').toLowerCase().includes(q),
    );
  }, [allActions, query]);

  // Reset on open + autofocus.
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIdx(0);
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  // Keyboard navigation.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(filtered.length - 1, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const action = filtered[activeIdx];
        if (action) {
          void action.onRun();
          onClose();
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, filtered, activeIdx, onClose]);

  // Keep active item in view.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const el = list.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  if (!open) return null;

  // Group filtered actions by group label, preserving ordering.
  const groups: Array<{ group: string; items: Array<{ action: Action; idx: number }> }> = [];
  const groupIndex = new Map<string, number>();
  filtered.forEach((action, idx) => {
    let i = groupIndex.get(action.group);
    if (i === undefined) {
      i = groups.length;
      groupIndex.set(action.group, i);
      groups.push({ group: action.group, items: [] });
    }
    groups[i]!.items.push({ action, idx });
  });

  return (
    <div
      className="fixed inset-0 flex items-start justify-center"
      style={{
        zIndex: 95,
        background: 'var(--bg-modal-overlay)',
        backdropFilter: 'blur(4px)',
        paddingTop: '14vh',
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-label="Command palette"
        className="overflow-hidden rounded-control border border-edge bg-modal shadow-modal"
        style={{ width: 640, maxHeight: '70vh' }}
      >
        <div className="flex items-center gap-2 border-b border-edge px-4" style={{ height: 48 }}>
          <SearchIcon />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIdx(0);
            }}
            placeholder="Search actions, sessions, themes…"
            spellCheck={false}
            autoCapitalize="none"
            className="flex-1 border-none bg-transparent font-ui text-[14px] text-text-primary outline-none placeholder:text-text-muted"
          />
          <kbd className="rounded-control border border-edge bg-input px-1.5 py-0.5 font-terminal text-[10px] text-text-muted">
            ⌘K
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[58vh] overflow-y-auto py-1.5">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center font-ui text-[13px] text-text-muted">
              No actions match "{query}"
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.group} className="mb-1">
                <div className="px-3 py-1 font-ui text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  {group.group}
                </div>
                {group.items.map(({ action, idx }) => (
                  <button
                    key={action.id}
                    type="button"
                    data-idx={idx}
                    onClick={() => {
                      void action.onRun();
                      onClose();
                    }}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left font-ui text-[13px] transition-colors duration-fast ease-out ${
                      idx === activeIdx
                        ? 'bg-accent-soft text-text-primary'
                        : 'text-text-primary hover:bg-sidebarHover'
                    }`}
                  >
                    <span className="truncate">{action.label}</span>
                    {action.shortcut && (
                      <kbd className="rounded-control border border-edge bg-input px-1.5 py-0.5 font-terminal text-[10px] text-text-muted">
                        {action.shortcut}
                      </kbd>
                    )}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ color: 'var(--text-muted)' }}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

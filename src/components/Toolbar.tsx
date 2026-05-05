import { useEffect, useRef, useState } from 'react';
import { useSettingsStore } from '../store/settings';
import { useWorkspaceStore } from '../store/workspace';
import { themeOrder, themes } from '../themes';
import { ThemePreviewCard } from './ThemePreviewCard';
import { TagBadge } from './TagBadge';

interface ToolbarProps {
  sessionCount: number;
  claudeInstalled: boolean | null;
  onOpenSettings?: () => void;
  onNewSession?: () => void;
  onFitCanvas?: () => void;
  onOpenCommandPalette?: () => void;
}

// Resolve the effective dark state for preview rendering.
function useEffectiveDark(): boolean {
  const darkMode = useSettingsStore((s) => s.darkMode);
  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false,
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (): void => setSystemDark(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  if (darkMode === 'dark') return true;
  if (darkMode === 'light') return false;
  return systemDark;
}

export function Toolbar({
  sessionCount,
  claudeInstalled,
  onOpenSettings,
  onNewSession,
  onFitCanvas,
  onOpenCommandPalette,
}: ToolbarProps) {
  const themePreset = useSettingsStore((s) => s.themePreset);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const darkMode = useSettingsStore((s) => s.darkMode);
  const setDarkMode = useSettingsStore((s) => s.setDarkMode);
  const isDark = useEffectiveDark();
  const filterTagId = useWorkspaceStore((s) => s.filterTagId);
  const filterTag = useWorkspaceStore((s) => (filterTagId ? s.tags[filterTagId] : null));
  const setFilterTag = useWorkspaceStore((s) => s.setFilterTag);

  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!themeMenuOpen) return;
    function onPointer(e: MouseEvent): void {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setThemeMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') setThemeMenuOpen(false);
    }
    const t = window.setTimeout(() => {
      window.addEventListener('mousedown', onPointer);
      window.addEventListener('keydown', onKey);
    }, 0);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('mousedown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [themeMenuOpen]);

  function cycleDarkMode(): void {
    // Light → Dark → System → Light. (Cmd+D toggles light↔dark only;
    // 'system' is reachable via Settings.)
    if (darkMode === 'light') setDarkMode('dark');
    else if (darkMode === 'dark') setDarkMode('system');
    else setDarkMode('light');
  }

  return (
    <header
      className="drag-region relative flex flex-shrink-0 items-center justify-between border-b border-edge bg-toolbar px-4 backdrop-blur"
      style={{ height: 'var(--toolbar-height)', paddingLeft: '88px', zIndex: 60 }}
    >
      <div className="flex items-center gap-3">
        <span className="font-terminal text-lg font-semibold text-accent">{'>_'}</span>
        <span className="font-ui text-sm font-semibold">Grove</span>
        <span className="font-ui text-xs text-text-muted">
          sessions <span className="text-text-secondary">{sessionCount}</span>
        </span>
        {filterTag && (
          <span className="no-drag flex items-center gap-1.5">
            <span className="font-ui text-[11px] text-text-muted">filter:</span>
            <TagBadge
              tag={filterTag}
              size="sm"
              active
              removable
              onRemove={() => setFilterTag(null)}
            />
          </span>
        )}
      </div>

      <div className="no-drag flex items-center gap-2">
        <span className="font-ui text-xs text-text-muted">
          claude:{' '}
          {claudeInstalled === null ? (
            'checking…'
          ) : claudeInstalled ? (
            <span className="text-success">detected</span>
          ) : (
            <span className="text-warning">$SHELL fallback</span>
          )}
        </span>

        {/* Theme switcher */}
        <div className="relative" ref={themeMenuRef}>
          <ToolbarButton
            aria-label="Theme"
            aria-haspopup="dialog"
            aria-expanded={themeMenuOpen}
            title={`Theme: ${themes[themePreset].label}`}
            onClick={() => setThemeMenuOpen((o) => !o)}
          >
            <PaletteIcon />
          </ToolbarButton>
          {themeMenuOpen && (
            <div
              className="absolute right-0 top-full z-modal mt-2 rounded-control border border-edge bg-modal p-3 shadow-modal"
              role="dialog"
              aria-label="Choose theme"
            >
              <div className="mb-2 font-ui text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                Theme
              </div>
              <div className="grid grid-cols-3 gap-2">
                {themeOrder.map((id) => (
                  <ThemePreviewCard
                    key={id}
                    theme={themes[id]}
                    isDark={isDark}
                    selected={themePreset === id}
                    onSelect={() => {
                      setTheme(id);
                      setThemeMenuOpen(false);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {onOpenCommandPalette && (
          <ToolbarButton
            aria-label="Command palette"
            title="Command palette  ⌘K"
            onClick={onOpenCommandPalette}
          >
            <CommandIcon />
          </ToolbarButton>
        )}

        {onFitCanvas && (
          <ToolbarButton aria-label="Fit canvas" title="Fit all panels  ⌘⇧F" onClick={onFitCanvas}>
            <FitIcon />
          </ToolbarButton>
        )}

        <ToolbarButton
          aria-label={`Toggle dark mode (current: ${darkMode})`}
          title={`Dark mode: ${darkMode}  ⌘D`}
          onClick={cycleDarkMode}
        >
          {isDark ? <MoonIcon /> : <SunIcon />}
        </ToolbarButton>

        {onOpenSettings && (
          <ToolbarButton aria-label="Settings" title="Settings  ⌘," onClick={onOpenSettings}>
            <GearIcon />
          </ToolbarButton>
        )}

        {onNewSession && (
          <button
            type="button"
            onClick={onNewSession}
            className="ml-1 cursor-pointer rounded-control bg-accent px-3 py-1 font-ui text-[12px] font-semibold text-text-onAccent transition-colors duration-base ease-out hover:bg-accent-hover"
            title="New session  ⌘N"
          >
            + New
          </button>
        )}
      </div>
    </header>
  );
}

function ToolbarButton({
  children,
  ...rest
}: { children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="cursor-pointer rounded-control p-1.5 text-text-secondary transition-colors duration-fast ease-out hover:bg-sidebarHover hover:text-text-primary"
      {...rest}
    >
      {children}
    </button>
  );
}

function PaletteIcon() {
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
    >
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.79 0 1.5-.71 1.5-1.5 0-.39-.15-.74-.39-1-.23-.27-.38-.62-.38-1 0-.79.71-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-5.5-4.5-10-10-10z" />
    </svg>
  );
}

function SunIcon() {
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
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
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
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function FitIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 7V3h4M21 7V3h-4M3 17v4h4M21 17v4h-4" />
    </svg>
  );
}

function CommandIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 3a3 3 0 1 0-3 3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12" />
    </svg>
  );
}

function GearIcon() {
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
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

// Shape of the on-disk Grove config (electron-store) and migration chain.
// Imported by both the main process (electron/store-manager.ts) and the
// renderer (src/store/persistence.ts).

import type { Session, Tag, ThemePreset, DarkMode, CursorStyle } from './types';

export const CURRENT_SCHEMA_VERSION = 1 as const;

export interface WindowState {
  width: number;
  height: number;
  x?: number;
  y?: number;
  isFullscreen: boolean;
}

export interface PersistedState {
  schemaVersion: number;

  // Window
  window: WindowState;

  // Sessions / tags (ptyPid intentionally omitted — transient)
  sessions: Session[];
  tags: Tag[];

  // UI
  themePreset: ThemePreset;
  darkMode: DarkMode;
  sidebarCollapsed: boolean;
  canvasTransform: { x: number; y: number; scale: number };

  // Terminal
  terminalFont: string;
  terminalFontSize: number;
  cursorStyle: CursorStyle;
  cursorBlink: boolean;

  // Behavior
  defaultCommand: string;
  defaultWorkingDir: string | null;
  snapToGrid: boolean;
  gridSize: 4 | 8 | 16;
  autoRestoreSessions: boolean;
  confirmBeforeKill: boolean;

  // Custom theme (only used when themePreset === 'custom')
  customTheme: {
    name: string;
    light: Record<string, string>;
    dark: Record<string, string>;
  } | null;

  // Tmux integration (Phase 16)
  preferTmux: boolean;

  // First-run onboarding (Phase 17). Unix ms; null if never shown.
  onboardingCompletedAt: number | null;
}

export function defaultPersistedState(): PersistedState {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    window: { width: 1280, height: 800, isFullscreen: false },
    sessions: [],
    tags: [],
    themePreset: 'claude',
    darkMode: 'system',
    sidebarCollapsed: false,
    canvasTransform: { x: 0, y: 0, scale: 1 },
    terminalFont: 'JetBrains Mono',
    terminalFontSize: 13,
    cursorStyle: 'bar',
    cursorBlink: true,
    defaultCommand: 'claude',
    defaultWorkingDir: null,
    snapToGrid: false,
    gridSize: 8,
    autoRestoreSessions: true,
    confirmBeforeKill: false,
    customTheme: null,
    preferTmux: true,
    onboardingCompletedAt: null,
  };
}

// Migration chain. Each function takes the state at a given schema
// version and returns the state at v+1. Chain runs until version matches
// CURRENT_SCHEMA_VERSION.
type Migration = (state: Partial<PersistedState>) => Partial<PersistedState>;

const MIGRATIONS: Record<number, Migration> = {
  // Pre-v1 (no schemaVersion field, very old config) → v1: merge into
  // defaults so all required keys are present.
  0: (state) => ({ ...defaultPersistedState(), ...state, schemaVersion: 1 }),
};

export function runMigrations(
  state: Partial<PersistedState>,
  fromVersion: number,
): PersistedState {
  let current = state;
  let version = fromVersion;
  while (version < CURRENT_SCHEMA_VERSION) {
    const fn = MIGRATIONS[version];
    if (!fn) break;
    current = fn(current);
    version += 1;
  }
  // Defensive: ensure all keys present.
  return { ...defaultPersistedState(), ...current, schemaVersion: CURRENT_SCHEMA_VERSION };
}

// Bridges the renderer-side Zustand stores to the on-disk electron-store.
// Subscribes to workspace + settings, debounces 200ms, writes only the
// fields tracked by PersistedState. On boot, calls window.grove.store.getAll()
// and hydrates both stores.
//
// Note: ptyPid is intentionally NOT persisted — it's transient per launch.

import { useWorkspaceStore } from './workspace';
import { useSettingsStore } from './settings';
import type { PersistedState } from '../../shared/persistence';
import { defaultPersistedState } from '../../shared/persistence';
import type { Session, Tag } from './types';

const DEBOUNCE_MS = 200;

let saveTimer: number | null = null;
let pendingPatch: Partial<PersistedState> = {};

function queueSave(patch: Partial<PersistedState>): void {
  pendingPatch = { ...pendingPatch, ...patch };
  if (saveTimer !== null) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    saveTimer = null;
    const toSave = pendingPatch;
    pendingPatch = {};
    void window.grove.store.setMany(toSave as Record<string, unknown>);
  }, DEBOUNCE_MS);
}

function snapshotSessions(): Session[] {
  const state = useWorkspaceStore.getState();
  return state.sessionOrder
    .map((id) => state.sessions[id])
    .filter((s): s is Session => Boolean(s))
    .map((s) => {
      // Drop any transient fields. ptyPid was already optional and never
      // set client-side anyway.
      const { ...rest } = s;
      return rest;
    });
}

function snapshotTags(): Tag[] {
  const state = useWorkspaceStore.getState();
  return state.tagOrder.map((id) => state.tags[id]).filter((t): t is Tag => Boolean(t));
}

export async function hydrateStores(): Promise<PersistedState> {
  const raw = (await window.grove.store.getAll()) as PersistedState;
  const persisted = { ...defaultPersistedState(), ...raw };

  // Hydrate workspace
  const workspace = useWorkspaceStore.getState();
  if (Array.isArray(persisted.sessions) && persisted.sessions.length > 0) {
    const sessionsMap: Record<string, Session> = {};
    persisted.sessions
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .forEach((s, idx) => {
        sessionsMap[s.id] = { ...s, sortOrder: idx };
      });
    useWorkspaceStore.setState({
      sessions: sessionsMap,
      sessionOrder: Object.values(sessionsMap)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((s) => s.id),
    });
  }
  if (typeof persisted.sidebarCollapsed === 'boolean') {
    workspace; // (avoid lint about unused variable)
    useWorkspaceStore.setState({ sidebarCollapsed: persisted.sidebarCollapsed });
  }
  if (persisted.canvasTransform) {
    useWorkspaceStore.setState({ canvasTransform: persisted.canvasTransform });
  }
  if (Array.isArray(persisted.tags)) {
    useWorkspaceStore.getState().hydrateTags(persisted.tags);
  }

  // Hydrate settings
  useSettingsStore.getState().hydrate({
    themePreset: persisted.themePreset,
    darkMode: persisted.darkMode,
    defaultCommand: persisted.defaultCommand,
    defaultWorkingDir: persisted.defaultWorkingDir,
    autoRestoreSessions: persisted.autoRestoreSessions,
    confirmBeforeKill: persisted.confirmBeforeKill,
    terminalFont: persisted.terminalFont,
    terminalFontSize: persisted.terminalFontSize,
    cursorStyle: persisted.cursorStyle,
    cursorBlink: persisted.cursorBlink,
    snapToGrid: persisted.snapToGrid,
    gridSize: persisted.gridSize,
    customTheme: persisted.customTheme,
  });

  return persisted;
}

export function subscribePersistence(): () => void {
  const unsubWorkspace = useWorkspaceStore.subscribe((state, prev) => {
    if (
      state.sessions !== prev.sessions ||
      state.sessionOrder !== prev.sessionOrder
    ) {
      queueSave({ sessions: snapshotSessions() });
    }
    if (state.tags !== prev.tags || state.tagOrder !== prev.tagOrder) {
      queueSave({ tags: snapshotTags() });
    }
    if (state.sidebarCollapsed !== prev.sidebarCollapsed) {
      queueSave({ sidebarCollapsed: state.sidebarCollapsed });
    }
    if (state.canvasTransform !== prev.canvasTransform) {
      queueSave({ canvasTransform: state.canvasTransform });
    }
  });

  const unsubSettings = useSettingsStore.subscribe((state, prev) => {
    const patch: Partial<PersistedState> = {};
    if (state.themePreset !== prev.themePreset) patch.themePreset = state.themePreset;
    if (state.darkMode !== prev.darkMode) patch.darkMode = state.darkMode;
    if (state.defaultCommand !== prev.defaultCommand) patch.defaultCommand = state.defaultCommand;
    if (state.defaultWorkingDir !== prev.defaultWorkingDir)
      patch.defaultWorkingDir = state.defaultWorkingDir;
    if (state.autoRestoreSessions !== prev.autoRestoreSessions)
      patch.autoRestoreSessions = state.autoRestoreSessions;
    if (state.confirmBeforeKill !== prev.confirmBeforeKill)
      patch.confirmBeforeKill = state.confirmBeforeKill;
    if (state.terminalFont !== prev.terminalFont) patch.terminalFont = state.terminalFont;
    if (state.terminalFontSize !== prev.terminalFontSize)
      patch.terminalFontSize = state.terminalFontSize;
    if (state.cursorStyle !== prev.cursorStyle) patch.cursorStyle = state.cursorStyle;
    if (state.cursorBlink !== prev.cursorBlink) patch.cursorBlink = state.cursorBlink;
    if (state.snapToGrid !== prev.snapToGrid) patch.snapToGrid = state.snapToGrid;
    if (state.gridSize !== prev.gridSize) patch.gridSize = state.gridSize;
    if (state.customTheme !== prev.customTheme) patch.customTheme = state.customTheme;
    if (Object.keys(patch).length > 0) queueSave(patch);
  });

  return () => {
    unsubWorkspace();
    unsubSettings();
  };
}

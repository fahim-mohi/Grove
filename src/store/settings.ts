import { create } from 'zustand';
import type { CursorStyle, DarkMode, ThemePreset } from './types';

export interface SettingsState {
  themePreset: ThemePreset;
  darkMode: DarkMode;
  defaultCommand: string;
  defaultWorkingDir: string | null;
  autoRestoreSessions: boolean;
  confirmBeforeKill: boolean;
  terminalFont: string;
  terminalFontSize: number;
  cursorStyle: CursorStyle;
  cursorBlink: boolean;
  snapToGrid: boolean;
  gridSize: 4 | 8 | 16;
  customTheme: { name: string; light: Record<string, string>; dark: Record<string, string> } | null;
  preferTmux: boolean;

  // Setters
  setTheme: (preset: ThemePreset) => void;
  setDarkMode: (mode: DarkMode) => void;
  setDefaultCommand: (cmd: string) => void;
  setDefaultWorkingDir: (dir: string | null) => void;
  setAutoRestoreSessions: (v: boolean) => void;
  setConfirmBeforeKill: (v: boolean) => void;
  setTerminalFont: (font: string) => void;
  setTerminalFontSize: (size: number) => void;
  setCursorStyle: (s: CursorStyle) => void;
  setCursorBlink: (v: boolean) => void;
  setSnapToGrid: (v: boolean) => void;
  setGridSize: (s: 4 | 8 | 16) => void;
  setCustomTheme: (theme: SettingsState['customTheme']) => void;
  setPreferTmux: (v: boolean) => void;

  // Hydration helper used by the persistence bridge.
  hydrate: (input: Partial<SettingsState>) => void;
}

const DEFAULTS: Omit<
  SettingsState,
  | 'setTheme'
  | 'setDarkMode'
  | 'setDefaultCommand'
  | 'setDefaultWorkingDir'
  | 'setAutoRestoreSessions'
  | 'setConfirmBeforeKill'
  | 'setTerminalFont'
  | 'setTerminalFontSize'
  | 'setCursorStyle'
  | 'setCursorBlink'
  | 'setSnapToGrid'
  | 'setGridSize'
  | 'setCustomTheme'
  | 'setPreferTmux'
  | 'hydrate'
> = {
  themePreset: 'claude',
  darkMode: 'system',
  defaultCommand: 'claude',
  defaultWorkingDir: null,
  autoRestoreSessions: true,
  confirmBeforeKill: false,
  terminalFont: 'JetBrains Mono',
  terminalFontSize: 13,
  cursorStyle: 'bar',
  cursorBlink: true,
  snapToGrid: false,
  gridSize: 8,
  customTheme: null,
  preferTmux: true,
};

export const useSettingsStore = create<SettingsState>((set) => ({
  ...DEFAULTS,
  setTheme: (preset) => set({ themePreset: preset }),
  setDarkMode: (mode) => set({ darkMode: mode }),
  setDefaultCommand: (defaultCommand) => set({ defaultCommand }),
  setDefaultWorkingDir: (defaultWorkingDir) => set({ defaultWorkingDir }),
  setAutoRestoreSessions: (autoRestoreSessions) => set({ autoRestoreSessions }),
  setConfirmBeforeKill: (confirmBeforeKill) => set({ confirmBeforeKill }),
  setTerminalFont: (terminalFont) => set({ terminalFont }),
  setTerminalFontSize: (terminalFontSize) => set({ terminalFontSize }),
  setCursorStyle: (cursorStyle) => set({ cursorStyle }),
  setCursorBlink: (cursorBlink) => set({ cursorBlink }),
  setSnapToGrid: (snapToGrid) => set({ snapToGrid }),
  setGridSize: (gridSize) => set({ gridSize }),
  setCustomTheme: (customTheme) => set({ customTheme }),
  setPreferTmux: (preferTmux) => set({ preferTmux }),
  hydrate: (input) => set((state) => ({ ...state, ...input })),
}));

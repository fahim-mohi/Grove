import type { Theme } from './types';

// Terminal Black — hardcore terminal aesthetic. Per UI spec §13: pure
// black surfaces, sharp green accent (the canonical xterm phosphor),
// monospace-everything feel. Dev tool that doesn't pretend to be a chat
// app.

export const terminalBlackTheme: Theme = {
  id: 'terminal-black',
  label: 'Terminal Black',
  ui: {
    light: {
      // Single-mode theme — light + dark map to identical values.
      '--bg-canvas': '#000000',
      '--bg-canvas-dot': 'rgba(57, 255, 20, 0.10)',
      '--bg-panel': '#0A0A0A',
      '--bg-panel-header': '#050505',
      '--bg-sidebar': '#050505',
      '--bg-sidebar-hover': '#0E0E0E',
      '--bg-sidebar-active': 'rgba(57, 255, 20, 0.14)',
      '--bg-toolbar': 'rgba(0, 0, 0, 0.92)',
      '--bg-modal': '#0A0A0A',
      '--bg-modal-overlay': 'rgba(0, 0, 0, 0.78)',
      '--bg-input': '#050505',
      '--bg-tag': '#101010',

      '--border-default': '#1C1C1C',
      '--border-strong': '#2C2C2C',
      '--border-subtle': '#141414',

      '--text-primary': '#E5E5E5',
      '--text-secondary': '#9A9A9A',
      '--text-muted': '#6A6A6A',
      '--text-on-accent': '#000000',

      // Phosphor-green accent — the universal terminal cursor color.
      '--accent': '#39FF14',
      '--accent-hover': '#5DFF42',
      '--accent-pressed': '#2AC712',
      '--accent-soft': 'rgba(57, 255, 20, 0.10)',
      '--accent-ring': 'rgba(57, 255, 20, 0.40)',

      '--success': '#39FF14',
      '--warning': '#FFD60A',
      '--danger': '#FF453A',
      '--info': '#5AC8FA',

      '--radius-panel': '6px',
      '--radius-control': '4px',
      '--radius-pill': '2px', // pills become rectangles in this theme

      '--shadow-panel-resting': '0 0 0 1px #1C1C1C',
      '--shadow-panel-focused': '0 0 0 1px var(--accent), 0 0 24px rgba(57, 255, 20, 0.18)',
      '--shadow-panel-dragging': '0 0 0 1px var(--accent), 0 16px 40px rgba(0, 0, 0, 0.85)',
      '--shadow-modal': '0 16px 60px rgba(0, 0, 0, 0.85), 0 0 0 1px #2C2C2C',

      '--header-height': '32px',
      '--toolbar-height': '40px',

      '--terminal-bg': '#000000',
      '--terminal-fg': '#E5E5E5',

      // Force monospace UI font in this theme — that's the whole point.
      '--font-ui': '"JetBrains Mono", "SF Mono", Menlo, monospace',
    },
    dark: {
      '--bg-canvas': '#000000',
      '--bg-canvas-dot': 'rgba(57, 255, 20, 0.10)',
      '--bg-panel': '#0A0A0A',
      '--bg-panel-header': '#050505',
      '--bg-sidebar': '#050505',
      '--bg-sidebar-hover': '#0E0E0E',
      '--bg-sidebar-active': 'rgba(57, 255, 20, 0.14)',
      '--bg-toolbar': 'rgba(0, 0, 0, 0.92)',
      '--bg-modal': '#0A0A0A',
      '--bg-modal-overlay': 'rgba(0, 0, 0, 0.78)',
      '--bg-input': '#050505',
      '--bg-tag': '#101010',

      '--border-default': '#1C1C1C',
      '--border-strong': '#2C2C2C',
      '--border-subtle': '#141414',

      '--text-primary': '#E5E5E5',
      '--text-secondary': '#9A9A9A',
      '--text-muted': '#6A6A6A',
      '--text-on-accent': '#000000',

      '--accent': '#39FF14',
      '--accent-hover': '#5DFF42',
      '--accent-pressed': '#2AC712',
      '--accent-soft': 'rgba(57, 255, 20, 0.10)',
      '--accent-ring': 'rgba(57, 255, 20, 0.40)',

      '--success': '#39FF14',
      '--warning': '#FFD60A',
      '--danger': '#FF453A',
      '--info': '#5AC8FA',

      '--radius-panel': '6px',
      '--radius-control': '4px',
      '--radius-pill': '2px',

      '--shadow-panel-resting': '0 0 0 1px #1C1C1C',
      '--shadow-panel-focused': '0 0 0 1px var(--accent), 0 0 24px rgba(57, 255, 20, 0.18)',
      '--shadow-panel-dragging': '0 0 0 1px var(--accent), 0 16px 40px rgba(0, 0, 0, 0.85)',
      '--shadow-modal': '0 16px 60px rgba(0, 0, 0, 0.85), 0 0 0 1px #2C2C2C',

      '--header-height': '32px',
      '--toolbar-height': '40px',

      '--terminal-bg': '#000000',
      '--terminal-fg': '#E5E5E5',

      '--font-ui': '"JetBrains Mono", "SF Mono", Menlo, monospace',
    },
  },
  xterm: {
    light: {
      background: '#000000',
      foreground: '#E5E5E5',
      cursor: '#39FF14',
      cursorAccent: '#000000',
      selectionBackground: 'rgba(57, 255, 20, 0.32)',
      black: '#000000',
      red: '#FF453A',
      green: '#39FF14',
      yellow: '#FFD60A',
      blue: '#5AC8FA',
      magenta: '#FF6BD0',
      cyan: '#64D2FF',
      white: '#E5E5E5',
      brightBlack: '#6A6A6A',
      brightRed: '#FF6961',
      brightGreen: '#5DFF42',
      brightYellow: '#FFE66E',
      brightBlue: '#7DD3FC',
      brightMagenta: '#FF92E0',
      brightCyan: '#90E5FF',
      brightWhite: '#FFFFFF',
    },
    dark: {
      background: '#000000',
      foreground: '#E5E5E5',
      cursor: '#39FF14',
      cursorAccent: '#000000',
      selectionBackground: 'rgba(57, 255, 20, 0.32)',
      black: '#000000',
      red: '#FF453A',
      green: '#39FF14',
      yellow: '#FFD60A',
      blue: '#5AC8FA',
      magenta: '#FF6BD0',
      cyan: '#64D2FF',
      white: '#E5E5E5',
      brightBlack: '#6A6A6A',
      brightRed: '#FF6961',
      brightGreen: '#5DFF42',
      brightYellow: '#FFE66E',
      brightBlue: '#7DD3FC',
      brightMagenta: '#FF92E0',
      brightCyan: '#90E5FF',
      brightWhite: '#FFFFFF',
    },
  },
};

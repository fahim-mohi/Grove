import type { Theme } from './types';

// Paper — light, warm, writing/workspace feel. Per UI spec §13: softer
// off-white, paper-like surfaces, muted ink-on-paper text. Reads like a
// printed manuscript next to a terminal.

export const paperTheme: Theme = {
  id: 'paper',
  label: 'Paper',
  ui: {
    light: {
      '--bg-canvas': '#F7F1E4',
      '--bg-canvas-dot': 'rgba(43, 33, 24, 0.10)',
      '--bg-panel': '#FBF6E9',
      '--bg-panel-header': '#F1EBD8',
      '--bg-sidebar': '#F1EBD8',
      '--bg-sidebar-hover': '#EBE3CD',
      '--bg-sidebar-active': 'rgba(168, 90, 50, 0.14)',
      '--bg-toolbar': 'rgba(247, 241, 228, 0.88)',
      '--bg-modal': '#FBF6E9',
      '--bg-modal-overlay': 'rgba(43, 33, 24, 0.30)',
      '--bg-input': '#FBF6E9',
      '--bg-tag': '#EFE7CF',

      '--border-default': '#DCD2BB',
      '--border-strong': '#C5B89B',
      '--border-subtle': '#E7DEC8',

      '--text-primary': '#3A2F22',
      '--text-secondary': '#7A6A55',
      '--text-muted': '#A39580',
      '--text-on-accent': '#FBF6E9',

      '--accent': '#A8542F',
      '--accent-hover': '#964722',
      '--accent-pressed': '#7C3A1A',
      '--accent-soft': 'rgba(168, 84, 47, 0.10)',
      '--accent-ring': 'rgba(168, 84, 47, 0.36)',

      '--success': '#6B8245',
      '--warning': '#B27B22',
      '--danger': '#A84444',
      '--info': '#4F6F92',

      '--radius-panel': '14px',
      '--radius-control': '9px',
      '--radius-pill': '999px',

      '--shadow-panel-resting':
        '0 12px 30px rgba(74, 55, 35, 0.10), 0 2px 8px rgba(74, 55, 35, 0.06)',
      '--shadow-panel-focused':
        '0 18px 40px rgba(74, 55, 35, 0.14), 0 2px 8px rgba(74, 55, 35, 0.08)',
      '--shadow-panel-dragging':
        '0 28px 60px rgba(74, 55, 35, 0.22), 0 4px 12px rgba(74, 55, 35, 0.14)',
      '--shadow-modal':
        '0 28px 80px rgba(74, 55, 35, 0.24), 0 4px 14px rgba(74, 55, 35, 0.10)',

      '--header-height': '38px',
      '--toolbar-height': '44px',

      '--terminal-bg': '#1F1A17',
      '--terminal-fg': '#F4EEE7',
    },
    // Paper has no real "dark" — fall through to its light values
    // when dark mode is selected (avoids a jarring visual shift).
    dark: {
      '--bg-canvas': '#1A1714',
      '--bg-canvas-dot': 'rgba(244, 238, 231, 0.10)',
      '--bg-panel': '#231F1A',
      '--bg-panel-header': '#1C1915',
      '--bg-sidebar': '#1C1915',
      '--bg-sidebar-hover': '#252119',
      '--bg-sidebar-active': 'rgba(212, 145, 92, 0.18)',
      '--bg-toolbar': 'rgba(26, 23, 20, 0.88)',
      '--bg-modal': '#231F1A',
      '--bg-modal-overlay': 'rgba(0, 0, 0, 0.55)',
      '--bg-input': '#1C1915',
      '--bg-tag': '#2E281F',

      '--border-default': '#3D3326',
      '--border-strong': '#544638',
      '--border-subtle': '#2E281F',

      '--text-primary': '#F2E8D2',
      '--text-secondary': '#B8A886',
      '--text-muted': '#8E7D5E',
      '--text-on-accent': '#1A1410',

      '--accent': '#D4915C',
      '--accent-hover': '#E0A26E',
      '--accent-pressed': '#B97B4A',
      '--accent-soft': 'rgba(212, 145, 92, 0.18)',
      '--accent-ring': 'rgba(212, 145, 92, 0.45)',

      '--success': '#A3B576',
      '--warning': '#E0A647',
      '--danger': '#E58A72',
      '--info': '#9AAFC7',

      '--radius-panel': '14px',
      '--radius-control': '9px',
      '--radius-pill': '999px',

      '--shadow-panel-resting':
        '0 12px 30px rgba(0, 0, 0, 0.30), 0 2px 8px rgba(0, 0, 0, 0.22)',
      '--shadow-panel-focused':
        '0 18px 45px rgba(0, 0, 0, 0.35), 0 2px 8px rgba(0, 0, 0, 0.30)',
      '--shadow-panel-dragging':
        '0 28px 60px rgba(0, 0, 0, 0.55), 0 4px 12px rgba(0, 0, 0, 0.45)',
      '--shadow-modal':
        '0 28px 80px rgba(0, 0, 0, 0.55), 0 4px 14px rgba(0, 0, 0, 0.40)',

      '--header-height': '38px',
      '--toolbar-height': '44px',

      '--terminal-bg': '#151210',
      '--terminal-fg': '#F4EEE7',
    },
  },
  xterm: {
    light: {
      background: '#1F1A17',
      foreground: '#F4EEE7',
      cursor: '#A8542F',
      cursorAccent: '#1F1A17',
      selectionBackground: '#4A2C20',
      black: '#1F1A17',
      red: '#A84444',
      green: '#6B8245',
      yellow: '#B27B22',
      blue: '#4F6F92',
      magenta: '#7A5C90',
      cyan: '#5C8A8A',
      white: '#F4EEE7',
      brightBlack: '#7A6F66',
      brightRed: '#C5615F',
      brightGreen: '#88A165',
      brightYellow: '#D69A3A',
      brightBlue: '#7090B0',
      brightMagenta: '#9C7BB0',
      brightCyan: '#7DA8A8',
      brightWhite: '#FFFDF8',
    },
    dark: {
      background: '#151210',
      foreground: '#F4EEE7',
      cursor: '#D4915C',
      cursorAccent: '#151210',
      selectionBackground: '#4A2C20',
      black: '#151210',
      red: '#C5615F',
      green: '#88A165',
      yellow: '#D69A3A',
      blue: '#7090B0',
      magenta: '#9C7BB0',
      cyan: '#7DA8A8',
      white: '#F4EEE7',
      brightBlack: '#7A6F66',
      brightRed: '#E58A72',
      brightGreen: '#A3B576',
      brightYellow: '#E0A647',
      brightBlue: '#9AAFC7',
      brightMagenta: '#B89BC8',
      brightCyan: '#9CC0C0',
      brightWhite: '#FFFDF8',
    },
  },
};

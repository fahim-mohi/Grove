import type { Theme } from './types';

// "Grove Warm" — the canonical Claude/Anthropic-inspired theme. Per the
// UI design spec: warm off-cream surfaces, deep warm-charcoal text,
// claude-orange accent. Terminal interiors stay dark in BOTH modes
// (devs expect a dark terminal regardless of UI chrome).

export const claudeTheme: Theme = {
  id: 'claude',
  label: 'Grove Warm',
  ui: {
    light: {
      // Surfaces
      '--bg-canvas': '#FAF7F2',
      '--bg-canvas-dot': 'rgba(43, 33, 24, 0.12)',
      '--bg-panel': '#FFFDF8',
      '--bg-panel-header': '#F7F1E8',
      '--bg-sidebar': '#F3EEE7',
      '--bg-sidebar-hover': '#ECE6DC',
      '--bg-sidebar-active': 'rgba(217, 119, 69, 0.12)',
      '--bg-toolbar': 'rgba(255, 253, 248, 0.85)',
      '--bg-modal': '#FFFDF8',
      '--bg-modal-overlay': 'rgba(43, 33, 24, 0.32)',
      '--bg-input': '#FFFDF8',
      '--bg-tag': '#F0E9DE',

      // Borders
      '--border-default': '#E7DDD2',
      '--border-strong': '#D4C7B8',
      '--border-subtle': '#EFE6DA',

      // Text
      '--text-primary': '#2B2118',
      '--text-secondary': '#7A6F66',
      '--text-muted': '#A0958B',
      '--text-on-accent': '#FFFFFF',

      // Accent
      '--accent': '#D97745',
      '--accent-hover': '#C96535',
      '--accent-pressed': '#A8501F',
      '--accent-soft': 'rgba(217, 119, 69, 0.10)',
      '--accent-ring': 'rgba(217, 119, 69, 0.40)',

      // Semantic
      '--success': '#7C9A4C',
      '--warning': '#D97745',
      '--danger': '#C75450',
      '--info': '#5E7FA3',

      // Shape — denser, more spatial
      '--radius-panel': '14px',
      '--radius-control': '9px',
      '--radius-pill': '999px',

      // Elevation — more depth so panels feel like discrete objects
      '--shadow-panel-resting':
        '0 12px 30px rgba(43, 33, 24, 0.08), 0 2px 8px rgba(43, 33, 24, 0.06)',
      '--shadow-panel-focused':
        '0 18px 40px rgba(43, 33, 24, 0.12), 0 2px 8px rgba(43, 33, 24, 0.08)',
      '--shadow-panel-dragging':
        '0 28px 60px rgba(43, 33, 24, 0.20), 0 4px 12px rgba(43, 33, 24, 0.14)',
      '--shadow-modal':
        '0 28px 80px rgba(43, 33, 24, 0.22), 0 4px 14px rgba(43, 33, 24, 0.10)',

      // Density
      '--header-height': '38px',
      '--toolbar-height': '44px',

      // Terminals stay dark even in light mode (devs expect this).
      '--terminal-bg': '#1F1A17',
      '--terminal-fg': '#F4EEE7',
    },
    dark: {
      '--bg-canvas': '#171412',
      '--bg-canvas-dot': 'rgba(244, 238, 231, 0.13)',
      '--bg-panel': '#211D1A',
      '--bg-panel-header': '#1A1714',
      '--bg-sidebar': '#1F1B19',
      '--bg-sidebar-hover': '#231F1B',
      '--bg-sidebar-active': 'rgba(229, 138, 85, 0.16)',
      '--bg-toolbar': 'rgba(23, 20, 18, 0.85)',
      '--bg-modal': '#211D1A',
      '--bg-modal-overlay': 'rgba(0, 0, 0, 0.55)',
      '--bg-input': '#1A1714',
      '--bg-tag': '#2B2521',

      '--border-default': '#3A312B',
      '--border-strong': '#4F4339',
      '--border-subtle': '#2B2521',

      '--text-primary': '#F4EEE7',
      '--text-secondary': '#B8AAA0',
      '--text-muted': '#8E8177',
      '--text-on-accent': '#1A1410',

      '--accent': '#E58A55',
      '--accent-hover': '#F09A67',
      '--accent-pressed': '#D17945',
      '--accent-soft': 'rgba(229, 138, 85, 0.16)',
      '--accent-ring': 'rgba(229, 138, 85, 0.45)',

      '--success': '#A3B576',
      '--warning': '#E0A647',
      '--danger': '#E58A72',
      '--info': '#7D9BC0',

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
  // Spec terminal palette — "warm but distinct" ANSI per UI doc §9.
  // Identical light/dark since terminals stay dark in both modes.
  xterm: {
    light: {
      background: '#1F1A17',
      foreground: '#F4EEE7',
      cursor: '#E58A55',
      cursorAccent: '#1F1A17',
      selectionBackground: '#4A2C20',
      black: '#171412',
      red: '#D16D6D',
      green: '#8A9A5B',
      yellow: '#C98A2E',
      blue: '#5E7FA3',
      magenta: '#7A6DAE',
      cyan: '#6F9A9A',
      white: '#F4EEE7',
      brightBlack: '#7A6F66',
      brightRed: '#E58A72',
      brightGreen: '#A3B576',
      brightYellow: '#E0A647',
      brightBlue: '#7D9BC0',
      brightMagenta: '#9A8BC8',
      brightCyan: '#88BABA',
      brightWhite: '#FFFDF8',
    },
    dark: {
      background: '#151210',
      foreground: '#F4EEE7',
      cursor: '#E58A55',
      cursorAccent: '#151210',
      selectionBackground: '#4A2C20',
      black: '#171412',
      red: '#D16D6D',
      green: '#8A9A5B',
      yellow: '#C98A2E',
      blue: '#5E7FA3',
      magenta: '#7A6DAE',
      cyan: '#6F9A9A',
      white: '#F4EEE7',
      brightBlack: '#7A6F66',
      brightRed: '#E58A72',
      brightGreen: '#A3B576',
      brightYellow: '#E0A647',
      brightBlue: '#7D9BC0',
      brightMagenta: '#9A8BC8',
      brightCyan: '#88BABA',
      brightWhite: '#FFFDF8',
    },
  },
};

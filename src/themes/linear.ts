import type { Theme } from './types';

// Linear Compact — dense, hairline borders, tight density. Adapted to
// Grove's warm-tinted neutrals so it reads as part of the family rather
// than a foreign theme. Per UI design spec §13.

export const linearTheme: Theme = {
  id: 'linear',
  label: 'Linear Compact',
  ui: {
    light: {
      '--bg-canvas': '#FCFAF6',
      '--bg-canvas-dot': 'rgba(43, 33, 24, 0.08)',
      '--bg-panel': '#FFFFFF',
      '--bg-panel-header': '#F8F4ED',
      '--bg-sidebar': '#F4EFE7',
      '--bg-sidebar-hover': '#EDE7DC',
      '--bg-sidebar-active': 'rgba(94, 106, 210, 0.12)',
      '--bg-toolbar': 'rgba(252, 250, 246, 0.94)',
      '--bg-modal': '#FFFFFF',
      '--bg-modal-overlay': 'rgba(43, 33, 24, 0.40)',
      '--bg-input': '#F8F4ED',
      '--bg-tag': '#EDE7DC',

      '--border-default': 'rgba(43, 33, 24, 0.12)',
      '--border-strong': 'rgba(43, 33, 24, 0.22)',
      '--border-subtle': 'rgba(43, 33, 24, 0.06)',

      '--text-primary': '#2B2118',
      '--text-secondary': '#5A4F45',
      '--text-muted': '#8B8077',
      '--text-on-accent': '#FFFFFF',

      '--accent': '#5E6AD2',
      '--accent-hover': '#5057C3',
      '--accent-pressed': '#4147A8',
      '--accent-soft': 'rgba(94, 106, 210, 0.10)',
      '--accent-ring': 'rgba(94, 106, 210, 0.40)',

      '--success': '#7C9A4C',
      '--warning': '#D97745',
      '--danger': '#C75450',
      '--info': '#5E6AD2',

      '--radius-panel': '8px',
      '--radius-control': '6px',
      '--radius-pill': '999px',

      // Linear keeps shadows minimal — just hairlines.
      '--shadow-panel-resting': '0 0 0 1px rgba(43, 33, 24, 0.06), 0 1px 2px rgba(43, 33, 24, 0.04)',
      '--shadow-panel-focused': '0 0 0 1px rgba(94, 106, 210, 0.40), 0 4px 12px rgba(43, 33, 24, 0.08)',
      '--shadow-panel-dragging': '0 12px 32px rgba(43, 33, 24, 0.18)',
      '--shadow-modal': '0 8px 28px rgba(43, 33, 24, 0.22)',

      // Compact density — every dimension a hair tighter.
      '--header-height': '32px',
      '--toolbar-height': '40px',

      '--terminal-bg': '#1F1A17',
      '--terminal-fg': '#F4EEE7',
    },
    dark: {
      '--bg-canvas': '#161311',
      '--bg-canvas-dot': 'rgba(244, 238, 231, 0.08)',
      '--bg-panel': '#1F1B19',
      '--bg-panel-header': '#1A1714',
      '--bg-sidebar': '#19161410',
      '--bg-sidebar-hover': '#221E1B',
      '--bg-sidebar-active': 'rgba(123, 133, 224, 0.18)',
      '--bg-toolbar': 'rgba(22, 19, 17, 0.94)',
      '--bg-modal': '#1F1B19',
      '--bg-modal-overlay': 'rgba(0, 0, 0, 0.62)',
      '--bg-input': '#1A1714',
      '--bg-tag': '#27221E',

      '--border-default': 'rgba(244, 238, 231, 0.10)',
      '--border-strong': 'rgba(244, 238, 231, 0.20)',
      '--border-subtle': 'rgba(244, 238, 231, 0.05)',

      '--text-primary': '#F4EEE7',
      '--text-secondary': '#B8AAA0',
      '--text-muted': '#857771',
      '--text-on-accent': '#FFFFFF',

      '--accent': '#7B85E0',
      '--accent-hover': '#8A93E5',
      '--accent-pressed': '#6770D6',
      '--accent-soft': 'rgba(123, 133, 224, 0.18)',
      '--accent-ring': 'rgba(123, 133, 224, 0.50)',

      '--success': '#A3B576',
      '--warning': '#E0A647',
      '--danger': '#E58A72',
      '--info': '#7B85E0',

      '--radius-panel': '8px',
      '--radius-control': '6px',
      '--radius-pill': '999px',

      '--shadow-panel-resting': '0 0 0 1px rgba(244, 238, 231, 0.06), 0 1px 2px rgba(0, 0, 0, 0.30)',
      '--shadow-panel-focused': '0 0 0 1px rgba(123, 133, 224, 0.50), 0 6px 18px rgba(0, 0, 0, 0.40)',
      '--shadow-panel-dragging': '0 16px 38px rgba(0, 0, 0, 0.55)',
      '--shadow-modal': '0 12px 36px rgba(0, 0, 0, 0.55)',

      '--header-height': '32px',
      '--toolbar-height': '40px',

      '--terminal-bg': '#151210',
      '--terminal-fg': '#F4EEE7',
    },
  },
  xterm: {
    light: {
      background: '#1F1A17',
      foreground: '#F4EEE7',
      cursor: '#5E6AD2',
      cursorAccent: '#1F1A17',
      selectionBackground: 'rgba(94, 106, 210, 0.30)',
      black: '#171412',
      red: '#D16D6D',
      green: '#8A9A5B',
      yellow: '#C98A2E',
      blue: '#5E6AD2',
      magenta: '#7A6DAE',
      cyan: '#6F9A9A',
      white: '#F4EEE7',
      brightBlack: '#7A6F66',
      brightRed: '#E58A72',
      brightGreen: '#A3B576',
      brightYellow: '#E0A647',
      brightBlue: '#818CF8',
      brightMagenta: '#9A8BC8',
      brightCyan: '#88BABA',
      brightWhite: '#FFFDF8',
    },
    dark: {
      background: '#151210',
      foreground: '#F4EEE7',
      cursor: '#7B85E0',
      cursorAccent: '#151210',
      selectionBackground: 'rgba(123, 133, 224, 0.30)',
      black: '#151210',
      red: '#D16D6D',
      green: '#8A9A5B',
      yellow: '#C98A2E',
      blue: '#7B85E0',
      magenta: '#7A6DAE',
      cyan: '#6F9A9A',
      white: '#F4EEE7',
      brightBlack: '#7A6F66',
      brightRed: '#E58A72',
      brightGreen: '#A3B576',
      brightYellow: '#E0A647',
      brightBlue: '#A5B4FC',
      brightMagenta: '#9A8BC8',
      brightCyan: '#88BABA',
      brightWhite: '#FFFDF8',
    },
  },
};

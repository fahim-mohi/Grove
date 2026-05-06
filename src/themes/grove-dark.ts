import type { Theme } from './types';

// Grove Dark — dark-first serious dev mode. Per UI spec §13: deeper
// blacks than Grove Warm dark, slightly more saturated accent. Paired
// with the same dark terminal interior.

export const groveDarkTheme: Theme = {
  id: 'grove-dark',
  label: 'Grove Dark',
  ui: {
    light: {
      // Even when "light mode" is selected, Grove Dark stays dark — it's
      // a one-mode theme. Mirror the dark values so toggling produces
      // sensible behavior without surprising the user.
      '--bg-canvas': '#171412',
      '--bg-canvas-dot': 'rgba(244, 238, 231, 0.14)',
      '--bg-panel': '#211D1A',
      '--bg-panel-header': '#1A1714',
      '--bg-sidebar': '#1F1B19',
      '--bg-sidebar-hover': '#1F1B19',
      '--bg-sidebar-active': 'rgba(229, 138, 85, 0.18)',
      '--bg-toolbar': 'rgba(18, 16, 16, 0.85)',
      '--bg-modal': '#1C1917',
      '--bg-modal-overlay': 'rgba(0, 0, 0, 0.62)',
      '--bg-input': '#161311',
      '--bg-tag': '#26211D',

      '--border-default': '#332C26',
      '--border-strong': '#4A3E36',
      '--border-subtle': '#26211D',

      '--text-primary': '#F4EEE7',
      '--text-secondary': '#B8AAA0',
      '--text-muted': '#857771',
      '--text-on-accent': '#1A1410',

      '--accent': '#E58A55',
      '--accent-hover': '#F09A67',
      '--accent-pressed': '#D17945',
      '--accent-soft': 'rgba(229, 138, 85, 0.18)',
      '--accent-ring': 'rgba(229, 138, 85, 0.50)',

      '--success': '#A3B576',
      '--warning': '#E0A647',
      '--danger': '#E58A72',
      '--info': '#7D9BC0',

      '--radius-panel': '14px',
      '--radius-control': '9px',
      '--radius-pill': '999px',

      '--shadow-panel-resting':
        '0 12px 30px rgba(0, 0, 0, 0.45), 0 2px 8px rgba(0, 0, 0, 0.30)',
      '--shadow-panel-focused':
        '0 18px 45px rgba(0, 0, 0, 0.55), 0 2px 8px rgba(0, 0, 0, 0.35)',
      '--shadow-panel-dragging':
        '0 28px 60px rgba(0, 0, 0, 0.65), 0 4px 12px rgba(0, 0, 0, 0.55)',
      '--shadow-modal':
        '0 28px 80px rgba(0, 0, 0, 0.65), 0 4px 14px rgba(0, 0, 0, 0.50)',

      '--header-height': '38px',
      '--toolbar-height': '44px',

      '--terminal-bg': '#121010',
      '--terminal-fg': '#F4EEE7',
    },
    dark: {
      '--bg-canvas': '#171412',
      '--bg-canvas-dot': 'rgba(244, 238, 231, 0.13)',
      '--bg-panel': '#211D1A',
      '--bg-panel-header': '#1A1714',
      '--bg-sidebar': '#1F1B19',
      '--bg-sidebar-hover': '#1C1916',
      '--bg-sidebar-active': 'rgba(229, 138, 85, 0.20)',
      '--bg-toolbar': 'rgba(14, 12, 11, 0.88)',
      '--bg-modal': '#1A1715',
      '--bg-modal-overlay': 'rgba(0, 0, 0, 0.68)',
      '--bg-input': '#13110F',
      '--bg-tag': '#241F1B',

      '--border-default': '#2E2823',
      '--border-strong': '#453A32',
      '--border-subtle': '#241F1B',

      '--text-primary': '#F4EEE7',
      '--text-secondary': '#B8AAA0',
      '--text-muted': '#857771',
      '--text-on-accent': '#1A1410',

      '--accent': '#E58A55',
      '--accent-hover': '#F09A67',
      '--accent-pressed': '#D17945',
      '--accent-soft': 'rgba(229, 138, 85, 0.20)',
      '--accent-ring': 'rgba(229, 138, 85, 0.55)',

      '--success': '#A3B576',
      '--warning': '#E0A647',
      '--danger': '#E58A72',
      '--info': '#7D9BC0',

      '--radius-panel': '14px',
      '--radius-control': '9px',
      '--radius-pill': '999px',

      '--shadow-panel-resting':
        '0 14px 35px rgba(0, 0, 0, 0.50), 0 2px 8px rgba(0, 0, 0, 0.35)',
      '--shadow-panel-focused':
        '0 20px 50px rgba(0, 0, 0, 0.60), 0 2px 8px rgba(0, 0, 0, 0.40)',
      '--shadow-panel-dragging':
        '0 32px 65px rgba(0, 0, 0, 0.70), 0 4px 12px rgba(0, 0, 0, 0.60)',
      '--shadow-modal':
        '0 32px 90px rgba(0, 0, 0, 0.72), 0 4px 14px rgba(0, 0, 0, 0.55)',

      '--header-height': '38px',
      '--toolbar-height': '44px',

      '--terminal-bg': '#0E0C0B',
      '--terminal-fg': '#F4EEE7',
    },
  },
  xterm: {
    light: {
      background: '#121010',
      foreground: '#F4EEE7',
      cursor: '#E58A55',
      cursorAccent: '#121010',
      selectionBackground: '#4A2C20',
      black: '#0E0C0B',
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
      background: '#0E0C0B',
      foreground: '#F4EEE7',
      cursor: '#E58A55',
      cursorAccent: '#0E0C0B',
      selectionBackground: '#4A2C20',
      black: '#0E0C0B',
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

import type { ITheme } from '@xterm/xterm';

// xterm.js color schemes for the claude theme. Phase 7 adds chatgpt /
// gemini / linear / custom schemes alongside this one and a getXtermTheme()
// resolver. For Phase 2 we only need claude-light to verify the terminal
// renders correctly; dark variant included for completeness.
//
// See DESIGN.md §4.2 for per-theme palette rationale (warm Solarized-leaning
// for claude, neutral high-contrast for the others).

export const xtermClaudeLight: ITheme = {
  background: '#FFFFFF',
  foreground: '#1C1917',
  cursor: '#D97706',
  cursorAccent: '#FFFFFF',
  selectionBackground: 'rgba(217, 119, 6, 0.30)',

  black: '#1C1917',
  red: '#DC2626',
  green: '#16A34A',
  yellow: '#CA8A04',
  blue: '#0284C7',
  magenta: '#A21CAF',
  cyan: '#0891B2',
  white: '#E7E5E4',

  brightBlack: '#57534E',
  brightRed: '#F87171',
  brightGreen: '#4ADE80',
  brightYellow: '#FACC15',
  brightBlue: '#60A5FA',
  brightMagenta: '#E879F9',
  brightCyan: '#22D3EE',
  brightWhite: '#FAF9F6',
};

export const xtermClaudeDark: ITheme = {
  background: '#292524',
  foreground: '#F5F4F0',
  cursor: '#F59E0B',
  cursorAccent: '#292524',
  selectionBackground: 'rgba(245, 158, 11, 0.30)',

  black: '#1C1917',
  red: '#F87171',
  green: '#6EE7B7',
  yellow: '#FCD34D',
  blue: '#93C5FD',
  magenta: '#F0ABFC',
  cyan: '#67E8F9',
  white: '#E7E5E4',

  brightBlack: '#78716C',
  brightRed: '#FCA5A5',
  brightGreen: '#86EFAC',
  brightYellow: '#FDE68A',
  brightBlue: '#BFDBFE',
  brightMagenta: '#F5D0FE',
  brightCyan: '#A5F3FC',
  brightWhite: '#FAF9F6',
};

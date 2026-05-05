import type { ITheme, Terminal } from '@xterm/xterm';

// Live registry of mounted xterm instances. Each useTerminal hook
// register/unregisters its terminal here so the ThemeProvider can update
// every terminal's theme when settings change — without re-mounting xterm
// (which would lose scrollback).
//
// We also remember the *current* active xterm theme so that terminals
// created AFTER a theme switch get the right colors on first paint
// rather than briefly showing the xterm default.

const terminals = new Set<Terminal>();
let currentXtermTheme: ITheme | null = null;

export function setActiveXtermTheme(theme: ITheme): void {
  currentXtermTheme = theme;
  for (const t of terminals) {
    t.options.theme = theme;
  }
}

export function registerTerminal(t: Terminal): () => void {
  if (currentXtermTheme) {
    t.options.theme = currentXtermTheme;
  }
  terminals.add(t);
  return () => {
    terminals.delete(t);
  };
}

export function getRegisteredTerminals(): Terminal[] {
  return Array.from(terminals);
}

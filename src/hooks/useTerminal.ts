import { useEffect, useRef, useState } from 'react';
import { Terminal, type ITheme } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { WebglAddon } from '@xterm/addon-webgl';

export interface UseTerminalOptions {
  sessionId: string;
  theme?: ITheme;
  fontFamily?: string;
  fontSize?: number;
  cursorStyle?: 'block' | 'underline' | 'bar';
  cursorBlink?: boolean;
}

export interface UseTerminalReturn {
  containerRef: (node: HTMLDivElement | null) => void;
  fit: () => { cols: number; rows: number } | null;
  focus: () => void;
  isReady: boolean;
}

const DEFAULT_THEME_FALLBACK: ITheme = {
  background: '#FFFFFF',
  foreground: '#1C1917',
  cursor: '#D97706',
  cursorAccent: '#FFFFFF',
  selectionBackground: 'rgba(217, 119, 6, 0.30)',
};

// Owns one xterm.js instance bound to a Grove sessionId.
// Subscribes to pty:data + pty:exit IPC events on mount BEFORE the PTY
// itself is created (useSession runs in declaration order after this hook),
// so no early bytes are lost.
export function useTerminal(opts: UseTerminalOptions): UseTerminalReturn {
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const containerNodeRef = useRef<HTMLDivElement | null>(null);
  const dataUnsubRef = useRef<(() => void) | null>(null);
  const exitUnsubRef = useRef<(() => void) | null>(null);
  const dataDisposableRef = useRef<{ dispose: () => void } | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Memoize the latest options so we can read them inside the mount effect
  // without re-running the effect when, e.g., the theme changes (theme
  // updates apply via a separate effect below).
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const setContainerRef = (node: HTMLDivElement | null): void => {
    if (node === containerNodeRef.current) return;
    containerNodeRef.current = node;

    if (!node) {
      // Tear-down handled by the unmount effect.
      return;
    }

    // Mount
    const current = optsRef.current;
    const term = new Terminal({
      theme: current.theme ?? DEFAULT_THEME_FALLBACK,
      fontFamily:
        current.fontFamily ??
        (getComputedStyle(document.documentElement).getPropertyValue('--font-terminal').trim() ||
          'JetBrains Mono, SF Mono, Menlo, monospace'),
      fontSize: current.fontSize ?? 13,
      lineHeight: 1.4,
      cursorStyle: current.cursorStyle ?? 'bar',
      cursorBlink: current.cursorBlink ?? true,
      allowProposedApi: true,
      scrollback: 5000,
      smoothScrollDuration: 60,
      macOptionIsMeta: true,
      drawBoldTextInBrightColors: false,
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.loadAddon(new WebLinksAddon());

    // WebGL gives much smoother scrolling on Apple Silicon. Falls through to
    // the canvas renderer on failure.
    try {
      const webgl = new WebglAddon();
      webgl.onContextLoss(() => {
        webgl.dispose();
      });
      term.loadAddon(webgl);
    } catch {
      // canvas fallback — silent
    }

    term.open(node);

    // Subscribe BEFORE the PTY is created so we don't miss the welcome
    // banner. Order is guaranteed because SessionPanel calls useTerminal
    // before useSession.
    dataUnsubRef.current = window.grove.pty.onData((sId, data) => {
      if (sId === current.sessionId) term.write(data);
    });
    exitUnsubRef.current = window.grove.pty.onExit((sId, code) => {
      if (sId === current.sessionId) {
        term.write(
          `\r\n\x1b[2m─────\x1b[0m \x1b[31m[Session ended (exit ${code}) — press any key to restart]\x1b[0m\r\n`,
        );
      }
    });

    dataDisposableRef.current = term.onData((data) => {
      window.grove.pty.write(current.sessionId, data);
    });

    requestAnimationFrame(() => {
      try {
        fit.fit();
      } catch {
        // container may not have layout yet — ResizeObserver in SessionPanel
        // will re-fit on first dimension change
      }
      term.focus();
      setIsReady(true);
    });

    terminalRef.current = term;
    fitAddonRef.current = fit;
  };

  // Apply theme changes without recreating the terminal.
  useEffect(() => {
    const term = terminalRef.current;
    if (term && opts.theme) {
      term.options.theme = opts.theme;
    }
  }, [opts.theme]);

  useEffect(() => {
    const term = terminalRef.current;
    if (!term) return;
    if (opts.fontFamily) term.options.fontFamily = opts.fontFamily;
    if (opts.fontSize) term.options.fontSize = opts.fontSize;
    if (opts.cursorStyle) term.options.cursorStyle = opts.cursorStyle;
    if (typeof opts.cursorBlink === 'boolean') term.options.cursorBlink = opts.cursorBlink;
  }, [opts.fontFamily, opts.fontSize, opts.cursorStyle, opts.cursorBlink]);

  // Unmount cleanup.
  useEffect(() => {
    return () => {
      dataDisposableRef.current?.dispose();
      dataUnsubRef.current?.();
      exitUnsubRef.current?.();
      terminalRef.current?.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
      dataUnsubRef.current = null;
      exitUnsubRef.current = null;
      dataDisposableRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function fit(): { cols: number; rows: number } | null {
    const term = terminalRef.current;
    const fitAddon = fitAddonRef.current;
    if (!term || !fitAddon) return null;
    try {
      fitAddon.fit();
    } catch {
      return null;
    }
    return { cols: term.cols, rows: term.rows };
  }

  function focus(): void {
    terminalRef.current?.focus();
  }

  return {
    containerRef: setContainerRef,
    fit,
    focus,
    isReady,
  };
}

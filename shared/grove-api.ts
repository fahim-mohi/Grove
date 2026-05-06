// Shared contracts between the Electron main/preload (node-side) and the
// React renderer (web-side). This file is included by BOTH tsconfig.node.json
// and tsconfig.web.json so both sides reference the same types without
// crossing project boundaries.
//
// IMPORTANT: this file must remain type-only — no runtime imports from
// 'electron' or 'node-pty' or anything else that would leak into the
// renderer bundle.

export interface PtyCreateOptions {
  cols: number;
  rows: number;
  cwd?: string;
  command?: string;
}

export type PtyCreateResponse =
  | { ok: true; pid: number; usedFallback: boolean; command: string }
  | { ok: false; reason: 'already-exists' | 'spawn-failed'; error: string };

export interface PtyDataEvent {
  sessionId: string;
  data: string;
}

export interface PtyExitEvent {
  sessionId: string;
  code: number;
}

export interface SystemVersions {
  electron: string;
  node: string;
  chrome: string;
  grove: string;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  detail?: string;
  // When true, the destructive button is highlighted in red and the
  // default focus is on Cancel. Used for kill / delete flows.
  danger?: boolean;
  okLabel?: string;
  cancelLabel?: string;
}

// The shape of window.grove. Both preload.ts and the renderer's
// vite-env.d.ts reference this — drift between the two is a type error.
export interface GroveApi {
  pty: {
    create: (sessionId: string, opts: PtyCreateOptions) => Promise<PtyCreateResponse>;
    write: (sessionId: string, data: string) => void;
    resize: (sessionId: string, cols: number, rows: number) => void;
    kill: (sessionId: string) => Promise<{ ok: boolean }>;
    onData: (handler: (sessionId: string, data: string) => void) => () => void;
    onExit: (handler: (sessionId: string, code: number) => void) => () => void;
  };
  system: {
    versions: () => SystemVersions;
    platform: () => NodeJS.Platform;
    isClaudeInstalled: () => Promise<boolean>;
    // Given a filesystem path (typically extracted from a Finder /
    // Terminal proxy-icon drop's text/uri-list), return the directory
    // to spawn Claude in: the path itself if it's a directory, the
    // parent directory if it's a file. Returns null on failure.
    resolveDropFolder: (path: string) => Promise<string | null>;
  };
  dialog: {
    confirm: (opts: ConfirmOptions) => Promise<boolean>;
    chooseDirectory: (opts?: { title?: string; defaultPath?: string }) => Promise<string | null>;
  };
  store: {
    getAll: () => Promise<unknown>;
    setMany: (patch: Record<string, unknown>) => Promise<void>;
    reset: () => Promise<void>;
  };
  menu: {
    onAction: (handler: (action: string) => void) => () => void;
  };
  tmux: {
    isAvailable: () => Promise<boolean>;
    listSessions: () => Promise<TmuxSessionInfo[]>;
    hasSession: (name: string) => Promise<boolean>;
    killSession: (name: string) => Promise<void>;
    // Spawn a new tmux session running `command` then attach a Grove
    // PTY to it. Returns the same shape as pty.create.
    createAndAttach: (
      sessionId: string,
      opts: {
        tmuxName: string;
        command: string;
        cols: number;
        rows: number;
        cwd?: string;
      },
    ) => Promise<PtyCreateResponse>;
    // Attach an existing tmux session to a Grove panel.
    attach: (
      sessionId: string,
      opts: { tmuxName: string; cols: number; rows: number },
    ) => Promise<PtyCreateResponse>;
    // Kill the local attach PTY without killing the tmux session.
    // The session keeps running in tmux; user can re-attach from any
    // terminal via `tmux attach -t <name>`.
    detach: (sessionId: string) => Promise<{ ok: boolean }>;
  };
}

export interface TmuxSessionInfo {
  name: string;
  windowCount: number;
  attached: boolean;
  createdAt: number;
  lastActivity: number;
}

// Centralized IPC channel names. Both main and preload import from here so
// channel strings never drift. Renderer never imports this file directly —
// it only uses the typed window.grove API exposed via contextBridge.

export const IpcChannel = {
  PTY_CREATE: 'pty:create',
  PTY_WRITE: 'pty:write',
  PTY_RESIZE: 'pty:resize',
  PTY_KILL: 'pty:kill',
  PTY_DATA: 'pty:data',
  PTY_EXIT: 'pty:exit',
  SYSTEM_IS_CLAUDE_INSTALLED: 'system:is-claude-installed',
  DIALOG_CONFIRM: 'dialog:confirm',
} as const;

export type IpcChannel = (typeof IpcChannel)[keyof typeof IpcChannel];

// Re-export the renderer-facing payload types from shared/ so main / preload
// can import them under one path. The actual definitions live in shared/
// because the renderer needs them too.
export type {
  PtyCreateOptions,
  PtyCreateResponse,
  PtyDataEvent,
  PtyExitEvent,
} from '../shared/grove-api';

// Main-process-facing wire payloads (renderer → main).
export interface PtyCreateRequest {
  sessionId: string;
  cols: number;
  rows: number;
  cwd?: string;
  command?: string;
}

export interface PtyWritePayload {
  sessionId: string;
  data: string;
}

export interface PtyResizePayload {
  sessionId: string;
  cols: number;
  rows: number;
}

export interface PtyKillRequest {
  sessionId: string;
}

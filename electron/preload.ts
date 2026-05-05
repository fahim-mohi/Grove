import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import {
  IpcChannel,
  type PtyCreateResponse,
  type PtyDataEvent,
  type PtyExitEvent,
} from './ipc-channels';
import type { ConfirmOptions } from '../shared/grove-api';

// Grove can have many concurrent sessions, each with 2-3 listeners on the
// PTY channels. Default Node EventEmitter cap of 10 trips false alarms in
// dev with even a few sessions. Lifting to 0 = unlimited.
ipcRenderer.setMaxListeners(0);

interface PtyCreateOptions {
  cols: number;
  rows: number;
  cwd?: string;
  command?: string;
}

const groveApi = {
  pty: {
    create(sessionId: string, opts: PtyCreateOptions): Promise<PtyCreateResponse> {
      return ipcRenderer.invoke(IpcChannel.PTY_CREATE, { sessionId, ...opts });
    },
    write(sessionId: string, data: string): void {
      ipcRenderer.send(IpcChannel.PTY_WRITE, { sessionId, data });
    },
    resize(sessionId: string, cols: number, rows: number): void {
      ipcRenderer.send(IpcChannel.PTY_RESIZE, { sessionId, cols, rows });
    },
    kill(sessionId: string): Promise<{ ok: boolean }> {
      return ipcRenderer.invoke(IpcChannel.PTY_KILL, { sessionId });
    },
    onData(handler: (sessionId: string, data: string) => void): () => void {
      const listener = (_e: IpcRendererEvent, payload: PtyDataEvent) =>
        handler(payload.sessionId, payload.data);
      ipcRenderer.on(IpcChannel.PTY_DATA, listener);
      return () => ipcRenderer.removeListener(IpcChannel.PTY_DATA, listener);
    },
    onExit(handler: (sessionId: string, code: number) => void): () => void {
      const listener = (_e: IpcRendererEvent, payload: PtyExitEvent) =>
        handler(payload.sessionId, payload.code);
      ipcRenderer.on(IpcChannel.PTY_EXIT, listener);
      return () => ipcRenderer.removeListener(IpcChannel.PTY_EXIT, listener);
    },
  },
  system: {
    versions: () => ({
      electron: process.versions.electron,
      node: process.versions.node,
      chrome: process.versions.chrome,
      grove: '0.1.0',
    }),
    platform: () => process.platform,
    isClaudeInstalled(): Promise<boolean> {
      return ipcRenderer.invoke(IpcChannel.SYSTEM_IS_CLAUDE_INSTALLED);
    },
  },
  dialog: {
    confirm(opts: ConfirmOptions): Promise<boolean> {
      return ipcRenderer.invoke(IpcChannel.DIALOG_CONFIRM, opts);
    },
    chooseDirectory(opts?: { title?: string; defaultPath?: string }): Promise<string | null> {
      return ipcRenderer.invoke(IpcChannel.DIALOG_CHOOSE_DIRECTORY, opts ?? {});
    },
  },
} as const;

export type GroveApi = typeof groveApi;

contextBridge.exposeInMainWorld('grove', groveApi);

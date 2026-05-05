import { app, BrowserWindow, dialog, ipcMain, nativeTheme, shell } from 'electron';
import { join } from 'node:path';
import { PtyManager } from './pty-manager';
import {
  IpcChannel,
  type PtyCreateRequest,
  type PtyKillRequest,
  type PtyResizePayload,
  type PtyWritePayload,
} from './ipc-channels';
import type { ConfirmOptions } from '../shared/grove-api';

const PRELOAD_PATH = join(__dirname, '../preload/index.js');
const RENDERER_DEV_URL = process.env['ELECTRON_RENDERER_URL'];
const RENDERER_PROD_HTML = join(__dirname, '../renderer/index.html');
const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;
const ptyManager = new PtyManager();

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 14 },
    vibrancy: 'sidebar',
    visualEffectState: 'active',
    backgroundColor: '#FAF9F6',
    webPreferences: {
      preload: PRELOAD_PATH,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev && RENDERER_DEV_URL) {
    mainWindow.loadURL(RENDERER_DEV_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(RENDERER_PROD_HTML);
  }
}

function registerIpcHandlers(): void {
  ipcMain.handle(IpcChannel.PTY_CREATE, (_event, payload: PtyCreateRequest) => {
    return ptyManager.create(payload.sessionId, {
      cols: payload.cols,
      rows: payload.rows,
      cwd: payload.cwd,
      command: payload.command,
    });
  });

  ipcMain.on(IpcChannel.PTY_WRITE, (_event, payload: PtyWritePayload) => {
    ptyManager.write(payload.sessionId, payload.data);
  });

  ipcMain.on(IpcChannel.PTY_RESIZE, (_event, payload: PtyResizePayload) => {
    ptyManager.resize(payload.sessionId, payload.cols, payload.rows);
  });

  ipcMain.handle(IpcChannel.PTY_KILL, (_event, payload: PtyKillRequest) => {
    ptyManager.kill(payload.sessionId);
    return { ok: true };
  });

  ipcMain.handle(IpcChannel.SYSTEM_IS_CLAUDE_INSTALLED, () => {
    return ptyManager.isClaudeInstalled();
  });

  ipcMain.handle(IpcChannel.DIALOG_CONFIRM, async (_event, opts: ConfirmOptions) => {
    const parent = BrowserWindow.getFocusedWindow() ?? mainWindow ?? undefined;
    const okLabel = opts.okLabel ?? (opts.danger ? 'Confirm' : 'OK');
    const cancelLabel = opts.cancelLabel ?? 'Cancel';
    const result = await dialog.showMessageBox(parent ?? new BrowserWindow({ show: false }), {
      type: opts.danger ? 'warning' : 'question',
      title: opts.title,
      message: opts.message,
      detail: opts.detail,
      buttons: [okLabel, cancelLabel],
      defaultId: opts.danger ? 1 : 0,
      cancelId: 1,
      noLink: true,
    });
    return result.response === 0;
  });

  ptyManager.on('data', (sessionId, data) => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.webContents.send(IpcChannel.PTY_DATA, { sessionId, data });
  });

  ptyManager.on('exit', (sessionId, code) => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.webContents.send(IpcChannel.PTY_EXIT, { sessionId, code });
  });
}

app.whenReady().then(() => {
  if (process.platform === 'darwin') {
    app.setAboutPanelOptions({
      applicationName: 'Grove',
      applicationVersion: app.getVersion(),
      copyright: 'Copyright © 2026 Fahim',
    });
  }

  nativeTheme.themeSource = 'system';

  registerIpcHandlers();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('before-quit', () => {
  ptyManager.killAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

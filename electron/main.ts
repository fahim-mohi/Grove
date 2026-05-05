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
import * as storeManager from './store-manager';
import type { PersistedState } from '../shared/persistence';

const PRELOAD_PATH = join(__dirname, '../preload/index.js');
const RENDERER_DEV_URL = process.env['ELECTRON_RENDERER_URL'];
const RENDERER_PROD_HTML = join(__dirname, '../renderer/index.html');
const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;
const ptyManager = new PtyManager();
let isQuitting = false;
let windowStateSaveTimer: ReturnType<typeof setTimeout> | null = null;

function clampToDisplays(state: PersistedState['window']): PersistedState['window'] {
  const { screen } = require('electron') as typeof import('electron');
  const displays = screen.getAllDisplays();
  if (state.x === undefined || state.y === undefined) return state;
  const intersects = displays.some((d) => {
    const b = d.bounds;
    const cx = (state.x ?? 0) + state.width / 2;
    const cy = (state.y ?? 0) + state.height / 2;
    return cx >= b.x && cx <= b.x + b.width && cy >= b.y && cy <= b.y + b.height;
  });
  if (intersects) return state;
  // Drop x/y so Electron centers on primary display.
  const { x: _x, y: _y, ...rest } = state;
  return rest;
}

async function createMainWindow(): Promise<void> {
  const persisted = await storeManager.getAll();
  const winState = clampToDisplays(persisted.window);

  mainWindow = new BrowserWindow({
    width: winState.width,
    height: winState.height,
    x: winState.x,
    y: winState.y,
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

  if (winState.isFullscreen) {
    mainWindow.setFullScreen(true);
  }

  function persistWindowState(): void {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (windowStateSaveTimer) clearTimeout(windowStateSaveTimer);
    windowStateSaveTimer = setTimeout(() => {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      const bounds = mainWindow.getBounds();
      void storeManager.setKey('window', {
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
        isFullscreen: mainWindow.isFullScreen(),
      });
    }, 250);
  }

  mainWindow.on('resize', persistWindowState);
  mainWindow.on('move', persistWindowState);
  mainWindow.on('enter-full-screen', persistWindowState);
  mainWindow.on('leave-full-screen', persistWindowState);

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

  ipcMain.handle(IpcChannel.STORE_GET_ALL, async () => {
    return await storeManager.getAll();
  });

  ipcMain.handle(IpcChannel.STORE_SET, async (_event, patch: Record<string, unknown>) => {
    await storeManager.setMany(patch as Partial<PersistedState>);
  });

  ipcMain.handle(IpcChannel.STORE_RESET, async () => {
    await storeManager.reset();
  });

  ipcMain.handle(
    IpcChannel.DIALOG_CHOOSE_DIRECTORY,
    async (_event, opts: { title?: string; defaultPath?: string }) => {
      const parent = BrowserWindow.getFocusedWindow() ?? mainWindow ?? undefined;
      const baseOpts = {
        title: opts.title,
        defaultPath: opts.defaultPath,
        properties: ['openDirectory', 'createDirectory'] as Array<
          'openDirectory' | 'createDirectory'
        >,
      };
      const result = parent
        ? await dialog.showOpenDialog(parent, baseOpts)
        : await dialog.showOpenDialog(baseOpts);
      if (result.canceled || result.filePaths.length === 0) return null;
      return result.filePaths[0] ?? null;
    },
  );

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

app.whenReady().then(async () => {
  if (process.platform === 'darwin') {
    app.setAboutPanelOptions({
      applicationName: 'Grove',
      applicationVersion: app.getVersion(),
      copyright: 'Copyright © 2026 Fahim',
    });
  }

  nativeTheme.themeSource = 'system';

  registerIpcHandlers();
  await createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) void createMainWindow();
  });
});

app.on('before-quit', async (event) => {
  if (isQuitting) return;
  if (ptyManager.size() === 0) {
    ptyManager.killAll();
    return;
  }
  // Block the quit until the user confirms.
  event.preventDefault();
  const parent = BrowserWindow.getFocusedWindow() ?? mainWindow ?? undefined;
  const opts = {
    type: 'warning' as const,
    title: 'Quit Grove?',
    message: `Quit Grove?`,
    detail: `${ptyManager.size()} session${ptyManager.size() === 1 ? ' is' : 's are'} running. Quitting will terminate ${ptyManager.size() === 1 ? 'it' : 'them all'}.`,
    buttons: ['Quit', 'Cancel'],
    defaultId: 1,
    cancelId: 1,
    noLink: true,
  };
  const result = parent
    ? await dialog.showMessageBox(parent, opts)
    : await dialog.showMessageBox(opts);
  if (result.response === 0) {
    isQuitting = true;
    ptyManager.killAll();
    if (windowStateSaveTimer) clearTimeout(windowStateSaveTimer);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

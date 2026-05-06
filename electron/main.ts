import { app, BrowserWindow, Menu, dialog, ipcMain, nativeTheme, shell } from 'electron';
import { join, dirname } from 'node:path';
import { stat } from 'node:fs/promises';
import { PtyManager } from './pty-manager';
import { TmuxManager } from './tmux-manager';
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
const tmuxManager = new TmuxManager();
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

  // Drag-and-drop helper. Renderer hands us a path from text/uri-list
  // (Finder folder, Terminal proxy icon, VS Code file, etc); we stat it
  // and return either the path itself (if dir) or its parent dir (if
  // file). Returns null on failure so the renderer can ignore the drop
  // silently.
  ipcMain.handle(
    IpcChannel.SYSTEM_RESOLVE_DROP_FOLDER,
    async (_event, rawPath: string): Promise<string | null> => {
      if (typeof rawPath !== 'string' || !rawPath) return null;
      try {
        const s = await stat(rawPath);
        return s.isDirectory() ? rawPath : dirname(rawPath);
      } catch {
        return null;
      }
    },
  );

  ipcMain.handle(IpcChannel.STORE_GET_ALL, async () => {
    return await storeManager.getAll();
  });

  ipcMain.handle(IpcChannel.STORE_SET, async (_event, patch: Record<string, unknown>) => {
    await storeManager.setMany(patch as Partial<PersistedState>);
  });

  ipcMain.handle(IpcChannel.STORE_RESET, async () => {
    await storeManager.reset();
  });

  // ── tmux ────────────────────────────────────────────────────────
  ipcMain.handle(IpcChannel.TMUX_AVAILABLE, () => {
    tmuxManager.refresh();
    return tmuxManager.isAvailable();
  });

  ipcMain.handle(IpcChannel.TMUX_LIST_SESSIONS, async () => {
    return await tmuxManager.listSessions();
  });

  ipcMain.handle(IpcChannel.TMUX_HAS_SESSION, async (_e, name: string) => {
    return await tmuxManager.hasSession(name);
  });

  ipcMain.handle(IpcChannel.TMUX_KILL_SESSION, async (_e, name: string) => {
    await tmuxManager.killSession(name);
  });

  ipcMain.handle(
    IpcChannel.TMUX_CREATE_AND_ATTACH,
    async (
      _e,
      payload: {
        sessionId: string;
        tmuxName: string;
        command: string;
        cols: number;
        rows: number;
        cwd?: string;
      },
    ) => {
      if (!tmuxManager.isAvailable()) {
        return {
          ok: false as const,
          reason: 'spawn-failed' as const,
          error: 'tmux is not installed. Sessions will use a local PTY instead.',
        };
      }
      try {
        await tmuxManager.createSession(payload.tmuxName, payload.command, payload.cwd);
      } catch (err) {
        return {
          ok: false as const,
          reason: 'spawn-failed' as const,
          error: err instanceof Error ? err.message : String(err),
        };
      }
      const argv = tmuxManager.buildAttachArgv(payload.tmuxName);
      return ptyManager.create(payload.sessionId, {
        cols: payload.cols,
        rows: payload.rows,
        cwd: payload.cwd,
        argv,
      });
    },
  );

  ipcMain.handle(
    IpcChannel.TMUX_ATTACH,
    async (
      _e,
      payload: { sessionId: string; tmuxName: string; cols: number; rows: number },
    ) => {
      if (!tmuxManager.isAvailable()) {
        return {
          ok: false as const,
          reason: 'spawn-failed' as const,
          error: 'tmux not available',
        };
      }
      if (!(await tmuxManager.hasSession(payload.tmuxName))) {
        return {
          ok: false as const,
          reason: 'spawn-failed' as const,
          error: `tmux session ${payload.tmuxName} no longer exists`,
        };
      }
      const argv = tmuxManager.buildAttachArgv(payload.tmuxName);
      return ptyManager.create(payload.sessionId, {
        cols: payload.cols,
        rows: payload.rows,
        argv,
      });
    },
  );

  ipcMain.handle(IpcChannel.TMUX_DETACH, (_e, payload: { sessionId: string }) => {
    // Just kill the local attach PTY. The tmux server keeps the session
    // running; user can re-attach from any terminal.
    ptyManager.kill(payload.sessionId);
    return { ok: true };
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

function buildMenu(): Menu {
  const sendAction = (action: string): void => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.webContents.send(IpcChannel.MENU_ACTION, action);
  };

  const isMac = process.platform === 'darwin';
  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac
      ? ([
          {
            label: 'Grove',
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              {
                label: 'Settings…',
                accelerator: 'CmdOrCtrl+,',
                click: () => sendAction('open-settings'),
              },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const },
            ],
          },
        ] as Electron.MenuItemConstructorOptions[])
      : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New Session',
          accelerator: 'CmdOrCtrl+N',
          click: () => sendAction('new-session'),
        },
        {
          label: 'Close Session',
          accelerator: 'CmdOrCtrl+W',
          click: () => sendAction('close-session'),
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' as const },
        { role: 'redo' as const },
        { type: 'separator' as const },
        { role: 'cut' as const },
        { role: 'copy' as const },
        { role: 'paste' as const },
        { role: 'selectAll' as const },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Sidebar',
          accelerator: 'CmdOrCtrl+\\',
          click: () => sendAction('toggle-sidebar'),
        },
        {
          label: 'Toggle Dark Mode',
          accelerator: 'CmdOrCtrl+D',
          click: () => sendAction('toggle-dark'),
        },
        { type: 'separator' as const },
        {
          label: 'Fit All Panels',
          accelerator: 'CmdOrCtrl+Shift+F',
          click: () => sendAction('fit-all'),
        },
        {
          label: 'Reset Zoom',
          accelerator: 'CmdOrCtrl+0',
          click: () => sendAction('reset-zoom'),
        },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+=',
          click: () => sendAction('zoom-in'),
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => sendAction('zoom-out'),
        },
        { type: 'separator' as const },
        { role: 'reload' as const },
        { role: 'forceReload' as const },
        { role: 'toggleDevTools' as const },
        { type: 'separator' as const },
        { role: 'togglefullscreen' as const },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' as const },
        { role: 'zoom' as const },
        ...(isMac
          ? ([
              { type: 'separator' as const },
              { role: 'front' as const },
              { type: 'separator' as const },
              { role: 'window' as const },
            ] as Electron.MenuItemConstructorOptions[])
          : ([{ role: 'close' as const }] as Electron.MenuItemConstructorOptions[])),
      ],
    },
    {
      role: 'help' as const,
      submenu: [
        {
          label: 'Grove on GitHub',
          click: () => shell.openExternal('https://github.com/fahim-mohi/Grove'),
        },
      ],
    },
  ];

  return Menu.buildFromTemplate(template);
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

  Menu.setApplicationMenu(buildMenu());

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

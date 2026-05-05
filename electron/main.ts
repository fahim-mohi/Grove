import { app, BrowserWindow, nativeTheme, shell } from 'electron';
import { join } from 'node:path';

const PRELOAD_PATH = join(__dirname, '../preload/index.js');
const RENDERER_DEV_URL = process.env['ELECTRON_RENDERER_URL'];
const RENDERER_PROD_HTML = join(__dirname, '../renderer/index.html');
const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;

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

app.whenReady().then(() => {
  if (process.platform === 'darwin') {
    app.setAboutPanelOptions({
      applicationName: 'Grove',
      applicationVersion: app.getVersion(),
      copyright: 'Copyright © 2026 Fahim',
    });
  }

  nativeTheme.themeSource = 'system';

  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

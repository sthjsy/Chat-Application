const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');

const isDev = !app.isPackaged;
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // show only when ready
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true,
      devTools: isDev
    }
  });

  const startURL = isDev
    // ? 'http://localhost:3000'
    ? 'http://192.168.1.111:3000'
    : path.join(__dirname, '../build/index.html');

  mainWindow.loadURL(startURL);

  // Show window when content is ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools only in dev
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Prevent navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event) => {
    event.preventDefault();
  });

  // Prevent new windows
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  mainWindow.webContents.on("did-fail-load", (e, code, desc) => {
    console.error("LOAD FAILED:", code, desc);
  });
  
  mainWindow.webContents.on("console-message", (_, level, message) => {
    console.log("RENDERER:", message);
  });
  
}

// App lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Notifications (Safe)
ipcMain.on('notification', (_, { title, body }) => {
  if (!Notification.isSupported()) return;

  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'icon.png')
    : path.join(__dirname, 'icon.png');

  new Notification({
    title,
    body,
    icon: iconPath
  }).show();
});

const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');
const fs = require('fs');

// Check if we're in development mode
const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined;

let mainWindow;

function createWindow() {
  try {
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: path.join(__dirname, 'preload.js')
      }
    });

    // Load the app
    const startUrl = isDev 
      ? 'http://localhost:3000' 
      : `file://${path.join(__dirname, '../build/index.html')}`;
    
    console.log('Loading URL:', startUrl);
    console.log('Development mode:', isDev);
    
    mainWindow.loadURL(startUrl);

    // Open DevTools in development
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
    
    // Log when the window is ready
    mainWindow.webContents.on('did-finish-load', () => {
      console.log('Window loaded successfully');
    });
    
    // Log any errors
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('Failed to load:', errorCode, errorDescription);
    });
  } catch (error) {
    console.error('Error creating window:', error);
  }
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle notifications
ipcMain.on('notification', (event, { title, body }) => {
  try {
    const notification = new Notification({
      title,
      body,
      icon: path.join(__dirname, 'icon.png')
    });
    
    notification.show();
  } catch (error) {
    console.error('Error showing notification:', error);
  }
});
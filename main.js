const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false, // Cambiado a false por seguridad
      contextIsolation: true, // Activado para usar preload
      preload: path.join(__dirname, 'preload.js'), // Usar preload
      enableRemoteModule: false
    }
  });

  mainWindow.loadFile('index.html');

  // Abre las herramientas de desarrollo en modo desarrollo
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

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

// Elimina el handler de ejecución de código, ya no es necesario porque la ejecución es en el renderer

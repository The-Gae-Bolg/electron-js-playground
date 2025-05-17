const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'logo.svg'), // Usa el logo.svg como icono de la app
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

// Manejar la apertura de archivos
ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'JavaScript/TypeScript', extensions: ['js', 'ts', 'jsx', 'tsx'] },
      { name: 'Todos los archivos', extensions: ['*'] }
    ]
  });
  
  if (canceled) return null;
  
  const filePath = filePaths[0];
  const content = fs.readFileSync(filePath, 'utf-8');
  return { filePath, content };
});

// Manejar el guardado de archivos
ipcMain.handle('dialog:saveFile', async (event, content) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Guardar archivo',
    filters: [
      { name: 'JavaScript', extensions: ['js'] },
      { name: 'TypeScript', extensions: ['ts'] },
      { name: 'Todos los archivos', extensions: ['*'] }
    ]
  });
  
  if (canceled) return null;
  
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
});

// Manejar la creación de un nuevo archivo
ipcMain.handle('dialog:newFile', () => {
  return { filePath: null, content: '' };
});

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

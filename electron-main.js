const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    // Pantalla completa por defecto para mejor experiencia
    fullscreen: true,
    autoHideMenuBar: true,
    backgroundColor: '#020205',
    title: "Juego de Naves - Aventura Espacial"
  });

  win.loadFile('index.html');
  
  // Opcional: Abrir DevTools en desarrollo
  // win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

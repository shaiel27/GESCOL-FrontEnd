const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

function createWindow() {
  // Crea la ventana del navegador.
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Carga la URL de tu aplicación de Vite.
  win.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../dist/index.html')}`
  );

  // Abre las herramientas de desarrollo si está en modo de desarrollo.
  if (isDev) {
    win.webContents.openDevTools();
  }
}

// Este método se llamará cuando Electron haya terminado de inicializarse
// y esté listo para crear ventanas de navegador.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // En macOS, es común recrear una ventana en la aplicación cuando el
    // icono del dock es clicado y no hay otras ventanas abiertas.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Salir cuando todas las ventanas estén cerradas, excepto en macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

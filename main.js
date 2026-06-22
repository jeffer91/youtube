/*
  Nombre completo: main.js
  Ruta o ubicación: AutoVideoJeff/main.js
  Función:
    - Arrancar AutoVideoJeff en modo Electron.
    - Iniciar el servidor local Express sin abrir navegador externo.
    - Crear una ventana segura de escritorio.
    - Cerrar el servidor cuando se cierre la app.
*/

import path from 'path';
import { fileURLToPath } from 'url';
import { app as electronApp, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import { iniciarServidor, detenerServidor } from './server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let ventanaPrincipal = null;
let servidorLocal = null;

function configurarRutasDeDatos() {
  /*
    En modo Electron no conviene guardar videos/proyectos dentro de la carpeta
    instalada de la app. Esta variable hace que comun/archivos.js use la carpeta
    de datos del usuario y mantenga el resto de módulos compatibles.
  */
  process.env.AUTOVIDEOJEFF_ROOT_DIR = electronApp.getPath('userData');
}

function obtenerIconoSeguro() {
  const posibleIcono = path.join(__dirname, 'assets', 'icon.png');
  return posibleIcono;
}

function crearVentana(urlServidor) {
  ventanaPrincipal = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    show: false,
    backgroundColor: '#101827',
    icon: obtenerIconoSeguro(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true
    }
  });

  ventanaPrincipal.once('ready-to-show', () => {
    if (ventanaPrincipal) {
      ventanaPrincipal.show();
    }
  });

  ventanaPrincipal.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  ventanaPrincipal.webContents.on('will-navigate', (event, url) => {
    const esUrlInterna = url.startsWith(urlServidor);

    if (!esUrlInterna) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  ventanaPrincipal.on('closed', () => {
    ventanaPrincipal = null;
  });

  ventanaPrincipal.loadURL(urlServidor);
}

async function iniciarAplicacion() {
  configurarRutasDeDatos();

  servidorLocal = await iniciarServidor({
    puerto: process.env.PORT || 0,
    host: '127.0.0.1',
    modoElectron: true
  });

  crearVentana(servidorLocal.url);
}

ipcMain.handle('app:estado', () => {
  return {
    ok: true,
    modo: 'electron',
    app: 'AutoVideoJeff',
    url: servidorLocal?.url || null,
    puerto: servidorLocal?.puerto || null,
    datos: process.env.AUTOVIDEOJEFF_ROOT_DIR || null
  };
});

electronApp.whenReady().then(async () => {
  try {
    await iniciarAplicacion();
  } catch (error) {
    console.error('[Electron] No se pudo iniciar AutoVideoJeff:', error);

    dialog.showErrorBox(
      'AutoVideoJeff no pudo iniciar',
      error?.message || 'Error desconocido al iniciar la aplicación.'
    );

    electronApp.quit();
  }

  electronApp.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 && servidorLocal?.url) {
      crearVentana(servidorLocal.url);
    }
  });
});

electronApp.on('window-all-closed', async () => {
  await detenerServidor();

  if (process.platform !== 'darwin') {
    electronApp.quit();
  }
});

electronApp.on('before-quit', async () => {
  await detenerServidor();
});

process.on('uncaughtException', (error) => {
  console.error('[Electron] Error no capturado:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('[Electron] Promesa rechazada sin manejar:', error);
});
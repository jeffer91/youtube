/*
  Nombre completo: main.js
  Ruta o ubicación: AutoVideoJeff/main.js
  Función:
    - Arrancar AutoVideoJeff en modo Electron.
    - Iniciar el servidor local Express sin abrir navegador externo.
    - Crear una ventana segura de escritorio.
    - Evitar que errores de GPU impidan mostrar la ventana.
    - Cerrar el servidor cuando se cierre la app.
*/

import path from 'path';
import { fileURLToPath } from 'url';
import { app as electronApp, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import { iniciarServidor, detenerServidor } from './server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TIEMPO_MAXIMO_ESPERA_VENTANA_MS = 3500;
const PUERTO_DESARROLLO = 3000;

let ventanaPrincipal = null;
let servidorLocal = null;
let cerrandoAplicacion = false;

function prepararElectronSeguro() {
  electronApp.disableHardwareAcceleration();
  electronApp.commandLine.appendSwitch('disable-gpu');
  electronApp.commandLine.appendSwitch('disable-gpu-compositing');
}

prepararElectronSeguro();

function resolverRutaDatosElectron() {
  if (process.env.AUTOVIDEOJEFF_ROOT_DIR) return process.env.AUTOVIDEOJEFF_ROOT_DIR;

  /*
    En desarrollo conviene guardar en la carpeta local del proyecto para que las
    pruebas por terminal coincidan con D:\AutoVideoJeff\datos\proyectos.
    En la app instalada sí se usa userData para no escribir dentro del instalador.
  */
  return electronApp.isPackaged ? electronApp.getPath('userData') : __dirname;
}

function configurarRutasDeDatos() {
  process.env.AUTOVIDEOJEFF_ROOT_DIR = resolverRutaDatosElectron();
  console.log(`[Electron] Carpeta raíz de datos: ${process.env.AUTOVIDEOJEFF_ROOT_DIR}`);
}

function resolverPuertoElectron() {
  const puertoEnv = Number(process.env.PORT);
  if (Number.isFinite(puertoEnv) && puertoEnv > 0) return puertoEnv;
  return electronApp.isPackaged ? 0 : PUERTO_DESARROLLO;
}

function obtenerIconoSeguro() {
  return path.join(__dirname, 'assets', 'icon.png');
}

function mostrarVentanaSiExiste() {
  if (!ventanaPrincipal || ventanaPrincipal.isDestroyed()) return;
  if (!ventanaPrincipal.isVisible()) ventanaPrincipal.show();
  ventanaPrincipal.focus();
}

function mostrarErrorCarga(error) {
  const mensaje = error?.message || String(error || 'Error desconocido al cargar la interfaz.');
  console.error('[Electron] Error al cargar la ventana:', mensaje);
  if (ventanaPrincipal && !ventanaPrincipal.isDestroyed()) mostrarVentanaSiExiste();
  dialog.showErrorBox('AutoVideoJeff no pudo abrir la ventana', mensaje);
}

function crearVentana(urlServidor) {
  ventanaPrincipal = new BrowserWindow({
    title: 'AutoVideoJeff - Editor profesional de escritorio',
    width: 1600,
    height: 940,
    minWidth: 1180,
    minHeight: 720,
    show: false,
    backgroundColor: '#eef3fb',
    icon: obtenerIconoSeguro(),
    autoHideMenuBar: true,
    maximizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true
    }
  });

  const mostrarPorSeguridad = setTimeout(() => {
    mostrarVentanaSiExiste();
  }, TIEMPO_MAXIMO_ESPERA_VENTANA_MS);

  ventanaPrincipal.once('ready-to-show', () => {
    clearTimeout(mostrarPorSeguridad);
    ventanaPrincipal.maximize();
    mostrarVentanaSiExiste();
  });

  ventanaPrincipal.webContents.on('did-finish-load', () => {
    clearTimeout(mostrarPorSeguridad);
    if (!ventanaPrincipal.isMaximized()) ventanaPrincipal.maximize();
    mostrarVentanaSiExiste();
  });

  ventanaPrincipal.webContents.on('did-fail-load', (_event, codigoError, descripcionError, urlFallida) => {
    mostrarErrorCarga(new Error(`No se pudo cargar ${urlFallida}. Código ${codigoError}: ${descripcionError}`));
  });

  ventanaPrincipal.webContents.on('render-process-gone', (_event, detalles) => {
    console.error('[Electron] El proceso visual se cerró:', detalles);
    if (!cerrandoAplicacion) {
      mostrarErrorCarga(new Error(`La ventana se cerró por un problema visual: ${detalles?.reason || 'sin detalle'}`));
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
    clearTimeout(mostrarPorSeguridad);
    ventanaPrincipal = null;
  });

  ventanaPrincipal.loadURL(urlServidor).catch((error) => {
    mostrarErrorCarga(error);
  });
}

async function iniciarAplicacion() {
  configurarRutasDeDatos();

  servidorLocal = await iniciarServidor({
    puerto: resolverPuertoElectron(),
    host: '127.0.0.1',
    modoElectron: true
  });

  console.log(`[Electron] Servidor local: ${servidorLocal.url}`);
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
    dialog.showErrorBox('AutoVideoJeff no pudo iniciar', error?.message || 'Error desconocido al iniciar la aplicación.');
    electronApp.quit();
  }

  electronApp.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 && servidorLocal?.url) {
      crearVentana(servidorLocal.url);
    }
  });
});

electronApp.on('window-all-closed', async () => {
  cerrandoAplicacion = true;
  await detenerServidor();

  if (process.platform !== 'darwin') {
    electronApp.quit();
  }
});

electronApp.on('before-quit', async () => {
  cerrandoAplicacion = true;
  await detenerServidor();
});

process.on('uncaughtException', (error) => {
  console.error('[Electron] Error no capturado:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('[Electron] Promesa rechazada sin manejar:', error);
});
/* =========================================================
Nombre completo: main.js
Ruta o ubicación: /electron/main/main.js
Funciones principales:
- Crear ventana principal de Electron.
- Cargar /src/index.html.
- Crear carpetas base generales del programa.
- Seleccionar videos.
- Registrar módulos Electron de Proyecto local, Audio, Transcripción, Subtítulos, Google Sheets y PendientesSync.
Con qué se conecta:
- proyecto-electron.js
- ma-audio-electron.js
- tr-electron.js
- sa-electron.js
- gs-electron.js
- sync-electron.js
- preload.js
========================================================= */

const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { pathToFileURL } = require("url");

const {
  registrarProyectoLocalElectron
} = require("../services/proyectos/proyecto-electron.js");

const {
  registrarMejorarAudioElectron
} = require("../../src/pantallas/02-mejorar-audio/electron/ma-audio-electron.js");

const {
  registrarTranscripcionElectron
} = require("../../src/pantallas/03-transcribir-video/electron/tr-electron.js");

const {
  registrarSubtitulosAutomaticosElectron
} = require("../../src/pantallas/04-subtitulos-automaticos/electron/sa-electron.js");

const {
  registrarGoogleSheetsElectron
} = require("../services/google-sheets/gs-electron.js");

const {
  registrarPendientesSyncElectron
} = require("../services/sync/sync-electron.js");

const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".avi", ".mkv", ".webm"]);
let ventanaPrincipal = null;

function crearVentanaPrincipal() {
  ventanaPrincipal = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1000,
    minHeight: 680,
    show: false,
    backgroundColor: "#f6f7fb",
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  ventanaPrincipal.loadFile(path.join(__dirname, "../../src/index.html"));
  ventanaPrincipal.once("ready-to-show", () => ventanaPrincipal.show());
  ventanaPrincipal.on("closed", () => {
    ventanaPrincipal = null;
  });
}

function obtenerVentanaPrincipal() {
  return ventanaPrincipal;
}

function obtenerRutaData() {
  if (app.isPackaged) {
    return path.join(app.getPath("userData"), "data");
  }

  return path.join(process.cwd(), "data");
}

function obtenerRutaConfiguracion() {
  return path.join(obtenerRutaData(), "configuracion");
}

function asegurarCarpeta(carpeta) {
  if (!fs.existsSync(carpeta)) {
    fs.mkdirSync(carpeta, { recursive: true });
  }
}

function asegurarCarpetasBase() {
  [obtenerRutaData(), obtenerRutaConfiguracion()].forEach(asegurarCarpeta);
}

function crearIdArchivo(rutaArchivo, stat) {
  return crypto.createHash("sha1").update(`${rutaArchivo}-${stat.size}-${stat.mtimeMs}`).digest("hex");
}

function normalizarVideo(rutaArchivo) {
  const extension = path.extname(rutaArchivo).toLowerCase();
  const nombre = path.basename(rutaArchivo);

  if (!VIDEO_EXTENSIONS.has(extension)) {
    return { ok: false, error: `Formato no compatible: ${nombre}` };
  }

  if (!fs.existsSync(rutaArchivo)) {
    return { ok: false, error: `No se encontró el archivo: ${nombre}` };
  }

  const stat = fs.statSync(rutaArchivo);

  return {
    ok: true,
    video: {
      id: crearIdArchivo(rutaArchivo, stat),
      nombre,
      ruta: rutaArchivo,
      url: pathToFileURL(rutaArchivo).href,
      extension: extension.replace(".", ""),
      pesoBytes: stat.size,
      fechaModificacion: stat.mtimeMs
    }
  };
}

ipcMain.handle("dialog:seleccionar-videos", async () => {
  try {
    const resultado = await dialog.showOpenDialog(ventanaPrincipal, {
      title: "Cargar videos",
      properties: ["openFile", "multiSelections"],
      filters: [{ name: "Videos", extensions: ["mp4", "mov", "avi", "mkv", "webm"] }]
    });

    if (resultado.canceled) {
      return { ok: true, cancelado: true, videos: [], errores: [] };
    }

    const videos = [];
    const errores = [];

    resultado.filePaths.forEach((rutaArchivo) => {
      const normalizado = normalizarVideo(rutaArchivo);
      if (normalizado.ok) videos.push(normalizado.video);
      else errores.push(normalizado.error);
    });

    return { ok: true, cancelado: false, videos, errores };
  } catch (error) {
    return { ok: false, mensaje: "No se pudieron cargar los videos.", detalle: error.message, videos: [], errores: [error.message] };
  }
});

ipcMain.handle("archivo:existe", async (_evento, rutaArchivo) => {
  try {
    return { ok: true, existe: Boolean(rutaArchivo && fs.existsSync(rutaArchivo)) };
  } catch (error) {
    return { ok: false, existe: false, mensaje: error.message };
  }
});

registrarProyectoLocalElectron({
  ipcMain,
  obtenerRutaData,
  asegurarCarpeta,
  shell
});

registrarMejorarAudioElectron({
  ipcMain,
  dialog,
  obtenerVentanaPrincipal,
  obtenerRutaData,
  asegurarCarpeta
});

registrarTranscripcionElectron({
  ipcMain,
  obtenerRutaData,
  asegurarCarpeta
});

registrarSubtitulosAutomaticosElectron({
  ipcMain,
  dialog,
  obtenerVentanaPrincipal,
  obtenerRutaData,
  asegurarCarpeta,
  shell
});

registrarGoogleSheetsElectron({
  ipcMain,
  obtenerRutaData,
  asegurarCarpeta
});

registrarPendientesSyncElectron({
  ipcMain,
  obtenerRutaData,
  asegurarCarpeta
});

app.whenReady().then(() => {
  asegurarCarpetasBase();
  crearVentanaPrincipal();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) crearVentanaPrincipal();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

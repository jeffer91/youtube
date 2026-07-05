/* =========================================================
Nombre completo: main.js
Ruta o ubicación: /electron/main/main.js
Funciones principales:
- Crear ventana principal de Electron.
- Cargar /src/index.html.
- Crear carpetas base del proyecto.
- Seleccionar videos y guardar proyecto base.
- Registrar procesos de Audio, Transcripción, Google Sheets y PendientesSync.
========================================================= */

const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { pathToFileURL } = require("url");

const {
  registrarMejorarAudioElectron
} = require("../../src/pantallas/02-mejorar-audio/electron/ma-audio-electron.js");

const {
  registrarTranscripcionElectron
} = require("../../src/pantallas/03-transcribir-video/electron/tr-electron.js");

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

function obtenerRutaProyectos() {
  return path.join(obtenerRutaData(), "proyectos");
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
  [obtenerRutaData(), obtenerRutaProyectos(), obtenerRutaConfiguracion()].forEach(asegurarCarpeta);
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

function limpiarNombreCarpeta(texto) {
  return String(texto || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "proyecto";
}

function limpiarIdProyecto(texto) {
  return String(texto || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function crearCarpetaProyecto(nombreProyecto, idProyectoExistente = "") {
  const marcaTiempo = new Date().toISOString().replace(/[:.]/g, "-").replace("T", "_").slice(0, 19);
  const idSeguro = limpiarIdProyecto(idProyectoExistente);
  const idProyecto = idSeguro || `${marcaTiempo}_${limpiarNombreCarpeta(nombreProyecto)}`;
  const rutaProyecto = path.join(obtenerRutaProyectos(), idProyecto);
  asegurarCarpeta(rutaProyecto);
  return { idProyecto, rutaProyecto };
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

ipcMain.handle("app:ruta-proyectos", async () => {
  asegurarCarpetasBase();
  return { ok: true, ruta: obtenerRutaProyectos() };
});

ipcMain.handle("app:abrir-carpeta-proyectos", async () => {
  try {
    asegurarCarpetasBase();
    await shell.openPath(obtenerRutaProyectos());
    return { ok: true };
  } catch (error) {
    return { ok: false, mensaje: error.message };
  }
});

ipcMain.handle("proyecto:guardar-json", async (_evento, proyecto) => {
  try {
    asegurarCarpetasBase();

    if (!proyecto || !proyecto.nombre || !proyecto.estilo) {
      return { ok: false, mensaje: "Faltan datos obligatorios del proyecto." };
    }

    const { idProyecto, rutaProyecto } = crearCarpetaProyecto(proyecto.nombre, proyecto.id);
    const rutaArchivoProyecto = path.join(rutaProyecto, "proyecto.json");
    const proyectoFinal = {
      id: idProyecto,
      nombre: proyecto.nombre,
      estilo: proyecto.estilo,
      videos: Array.isArray(proyecto.videos) ? proyecto.videos : [],
      pantallaActual: proyecto.pantallaActual || "02-mejorar-audio",
      capas: Array.isArray(proyecto.capas) ? proyecto.capas : [],
      basePrincipal: proyecto.basePrincipal || "GOOGLE_SHEETS",
      respaldoLocal: "JSON_LOCAL_RESPALDO",
      creadoEn: proyecto.creadoEn || new Date().toISOString(),
      actualizadoEn: new Date().toISOString()
    };

    fs.writeFileSync(rutaArchivoProyecto, JSON.stringify(proyectoFinal, null, 2), "utf8");
    return { ok: true, proyecto: proyectoFinal, rutaProyecto, rutaArchivoProyecto };
  } catch (error) {
    return { ok: false, mensaje: "No se pudo guardar el proyecto.", detalle: error.message };
  }
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

/*
Nombre completo: YTIpc.js
Ruta: 00_base_app/YTIpc.js
Función o funciones:
  - Registrar todos los canales IPC de AutoEdit Studio.
  - Conectar el nuevo flujo maestro 12_flujo_maestro con Electron.
  - Mantener compatibilidad con módulos existentes.
Se conecta con:
  - 00_base_app/YTMain.js
  - 00_base_app/YTPreload.js
  - 02_archivos_y_datos/*
  - 03_carga_y_preview_video/*
  - 04_render_minimo/YTRenderIpc.js
  - 05_diagnostico/YTDiagnosticIpc.js
  - 06_proyectos/YTProjectIpc.js
  - 07_transcripcion_y_analisis/YTTranscriptIpc.js
  - 08_clips_y_timeline/YTClipIpc.js
  - 09_subtitulos_capas_y_estilos/YTStyleIpc.js
  - 10_biblioteca_y_recursos/YTLibraryIpc.js
  - 11_exportacion_y_publicacion/YTExportIpc.js
  - 12_flujo_maestro/YTWorkflowIpc.js
*/

const { ipcMain, app, shell } = require("electron");
const path = require("path");

function fromRoot(folder, fileName) {
  return require(path.join(__dirname, "..", folder, fileName));
}

function safeInvoke(fn) {
  try {
    return fn();
  } catch (error) {
    return {
      ok: false,
      status: "ERROR",
      message: error && error.message ? error.message : String(error),
      error: error && error.stack ? error.stack : String(error),
      timestamp: new Date().toISOString()
    };
  }
}

function safeHandle(channel, handler) {
  if (ipcMain.removeHandler) {
    try { ipcMain.removeHandler(channel); } catch (_error) {}
  }

  ipcMain.handle(channel, async (event, payload) => {
    try {
      return await handler(event, payload || {});
    } catch (error) {
      return {
        ok: false,
        status: "ERROR",
        channel,
        message: error && error.message ? error.message : String(error),
        error: error && error.stack ? error.stack : String(error),
        timestamp: new Date().toISOString()
      };
    }
  });
}

function registerBaseChannels(context = {}) {
  safeHandle("YT_BASE_PING", async () => ({
    ok: true,
    status: "OK",
    message: "AutoEdit Studio activo.",
    timestamp: new Date().toISOString()
  }));

  safeHandle("YT_BASE_APP_INFO", async () => ({
    ok: true,
    status: "OK",
    name: app.getName(),
    version: app.getVersion(),
    platform: process.platform,
    electron: process.versions.electron,
    node: process.versions.node,
    chrome: process.versions.chrome,
    timestamp: new Date().toISOString()
  }));

  safeHandle("YT_BASE_CHECK", async () => safeInvoke(() => require("./YTBaseCheck").runBaseCheck()));

  safeHandle("YT_BASE_OPEN_DEVTOOLS", async () => {
    const mainWindow = typeof context.getMainWindow === "function" ? context.getMainWindow() : null;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.openDevTools({ mode: "detach" });
      return { ok: true, status: "OK", message: "DevTools abierto." };
    }
    return { ok: false, status: "ERROR", message: "No hay ventana principal disponible." };
  });

  safeHandle("YT_BASE_OPEN_PATH", async (_event, payload = {}) => {
    const targetPath = String(payload.path || "").trim();
    if (!targetPath) return { ok: false, status: "ERROR", message: "No se recibió ruta para abrir." };
    const result = await shell.openPath(targetPath);
    return { ok: !result, status: result ? "ERROR" : "OK", path: targetPath, message: result || "Ruta abierta correctamente." };
  });
}

function registerFileChannels() {
  safeHandle("YT_FILES_ENSURE_FOLDERS", async () => safeInvoke(() => fromRoot("02_archivos_y_datos", "YTFolderService").ensureUserDataFolders()));
  safeHandle("YT_FILES_GET_PATHS", async () => safeInvoke(() => fromRoot("02_archivos_y_datos", "YTPathService").getPathSummary()));
  safeHandle("YT_FILES_CHECK", async () => safeInvoke(() => fromRoot("02_archivos_y_datos", "YTFilesCheck").runFilesCheck()));
  safeHandle("YT_DATA_LOAD", async () => safeInvoke(() => fromRoot("02_archivos_y_datos", "YTDataStore").loadData()));
  safeHandle("YT_DATA_SAVE", async (_event, payload = {}) => safeInvoke(() => fromRoot("02_archivos_y_datos", "YTDataStore").saveData(payload.data || {})));
  safeHandle("YT_DATA_BACKUP", async (_event, payload = {}) => safeInvoke(() => fromRoot("02_archivos_y_datos", "YTDataBackup").createDataBackup ? fromRoot("02_archivos_y_datos", "YTDataBackup").createDataBackup(payload.label || "manual") : fromRoot("02_archivos_y_datos", "YTDataBackup").createBackup(payload.label || "manual")));
  safeHandle("YT_TEMP_CLEAN", async () => safeInvoke(() => fromRoot("02_archivos_y_datos", "YTCleanTemp").cleanTemp()));
}

function registerVideoChannels(context = {}) {
  safeHandle("YT_VIDEO_SELECT", async () => safeInvoke(() => fromRoot("03_carga_y_preview_video", "YTVideoDialog").selectVideoDialog(context)));
  safeHandle("YT_VIDEO_SELECT_MULTIPLE", async () => safeInvoke(() => fromRoot("03_carga_y_preview_video", "YTVideoDialog").selectMultipleVideosDialog(context)));
  safeHandle("YT_VIDEO_SELECT_MATERIAL", async () => safeInvoke(() => fromRoot("03_carga_y_preview_video", "YTVideoDialog").selectMaterialDialog(context)));
  safeHandle("YT_VIDEO_GET_CURRENT", async () => safeInvoke(() => fromRoot("03_carga_y_preview_video", "YTVideoStore").loadCurrentVideo()));
  safeHandle("YT_VIDEO_GET_MATERIAL", async () => safeInvoke(() => fromRoot("03_carga_y_preview_video", "YTVideoStore").loadMaterialSession()));
  safeHandle("YT_VIDEO_CLEAR", async () => safeInvoke(() => fromRoot("03_carga_y_preview_video", "YTVideoStore").clearCurrentVideo()));
  safeHandle("YT_VIDEO_CLEAR_CURRENT", async () => safeInvoke(() => fromRoot("03_carga_y_preview_video", "YTVideoStore").clearCurrentVideo()));
  safeHandle("YT_VIDEO_CHECK", async () => safeInvoke(() => fromRoot("03_carga_y_preview_video", "YTVideoCheck").runVideoCheck()));
}

function registerExternalModule(relativeFolder, fileName, registerName, context = {}) {
  try {
    const moduleApi = fromRoot(relativeFolder, fileName);
    if (moduleApi && typeof moduleApi[registerName] === "function") {
      moduleApi[registerName]({ safeHandle, getMainWindow: context.getMainWindow });
      return true;
    }
  } catch (error) {
    console.error("[YTIpc] No se pudo registrar", fileName, error);
  }
  return false;
}

function registerBaseIpc(context = {}) {
  registerBaseChannels(context);
  registerFileChannels();
  registerVideoChannels(context);

  registerExternalModule("04_render_minimo", "YTRenderIpc", "registerRenderIpc", context);
  registerExternalModule("05_diagnostico", "YTDiagnosticIpc", "registerDiagnosticIpc", context);
  registerExternalModule("06_proyectos", "YTProjectIpc", "registerProjectIpc", context);
  registerExternalModule("07_transcripcion_y_analisis", "YTTranscriptIpc", "registerTranscriptIpc", context);
  registerExternalModule("08_clips_y_timeline", "YTClipIpc", "registerClipIpc", context);
  registerExternalModule("09_subtitulos_capas_y_estilos", "YTStyleIpc", "registerStyleIpc", context);
  registerExternalModule("10_biblioteca_y_recursos", "YTLibraryIpc", "registerLibraryIpc", context);
  registerExternalModule("11_exportacion_y_publicacion", "YTExportIpc", "registerExportIpc", context);
  registerExternalModule("12_flujo_maestro", "YTWorkflowIpc", "registerWorkflowIpc", context);

  return { ok: true, status: "OK", message: "IPC registrado correctamente.", timestamp: new Date().toISOString() };
}

module.exports = { registerBaseIpc };

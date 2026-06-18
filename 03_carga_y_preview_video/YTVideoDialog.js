/*
Nombre completo: YTVideoDialog.js
Ruta: 03_carga_y_preview_video/YTVideoDialog.js
Función o funciones:
  - Abrir selector de video único.
  - Abrir selector de múltiples videos.
  - Guardar sesión de material para el flujo maestro.
  - Mantener compatibilidad con selección antigua de un solo video.
Se conecta con:
  - 00_base_app/YTIpc.js
  - 03_carga_y_preview_video/YTVideoService.js
  - 03_carga_y_preview_video/YTVideoStore.js
  - 12_flujo_maestro/YTWorkflowService.js
*/

const { dialog } = require("electron");
const { getVideoInfo, getVideosInfo } = require("./YTVideoService");
const { saveCurrentVideo, saveMaterialSession } = require("./YTVideoStore");

const VIDEO_FILTERS = [
  { name: "Videos", extensions: ["mp4", "mov", "m4v", "webm", "mkv", "avi"] }
];

function getWindow(context = {}) {
  if (context && typeof context.getMainWindow === "function") return context.getMainWindow();
  if (context && typeof context.isDestroyed === "function") return context;
  return null;
}

function openDialog(context, options) {
  const win = getWindow(context);
  return win && !win.isDestroyed() ? dialog.showOpenDialog(win, options) : dialog.showOpenDialog(options);
}

async function selectVideoDialog(context = {}) {
  const result = await openDialog(context, {
    title: "Seleccionar video",
    buttonLabel: "Seleccionar video",
    filters: VIDEO_FILTERS,
    properties: ["openFile"]
  });

  if (result.canceled || !result.filePaths || !result.filePaths[0]) {
    return { ok: false, status: "CANCELLED", message: "Selección cancelada.", currentVideo: null };
  }

  const video = getVideoInfo(result.filePaths[0]);

  if (!video.ok) {
    return { ok: false, status: "ERROR", message: video.message || "El video seleccionado no es válido.", currentVideo: video };
  }

  const saved = saveCurrentVideo(video);

  return {
    ok: true,
    status: video.status || "OK",
    message: "Video seleccionado correctamente.",
    currentVideo: video,
    selectedVideo: video,
    mediaMode: "SINGLE_LONG_VIDEO",
    mediaItems: [video],
    session: saved.session
  };
}

async function selectMultipleVideosDialog(context = {}) {
  const result = await openDialog(context, {
    title: "Seleccionar uno o varios videos",
    buttonLabel: "Cargar videos",
    filters: VIDEO_FILTERS,
    properties: ["openFile", "multiSelections"]
  });

  if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
    return { ok: false, status: "CANCELLED", message: "Selección cancelada.", mediaItems: [] };
  }

  const normalized = getVideosInfo(result.filePaths, { sourceType: "video_dialog" });

  if (!normalized.ok) {
    return { ok: false, status: normalized.status || "ERROR", message: normalized.message || "No se encontraron videos válidos.", ...normalized };
  }

  const saved = saveMaterialSession(normalized.mediaItems, {
    sourceType: "video_dialog",
    mediaMode: normalized.mediaMode
  });

  return {
    ok: true,
    status: normalized.status,
    message: normalized.mediaItems.length === 1 ? "Video cargado correctamente." : "Videos cargados correctamente.",
    ...normalized,
    session: saved.session || null
  };
}

async function selectMaterialDialog(context = {}) {
  return selectMultipleVideosDialog(context);
}

module.exports = {
  selectVideoDialog,
  selectMultipleVideosDialog,
  selectMaterialDialog,
  selectVideo: selectVideoDialog
};

/*
  Nombre completo: YTVideoStore.js
  Ruta: 03_carga_y_preview_video/YTVideoStore.js
  Función o funciones:
    - Guardar sesión de material del proyecto.
    - Mantener currentVideo para compatibilidad con módulos antiguos.
    - Soportar mediaItems, mediaMode, primaryVideo y carga múltiple.
  Se conecta con:
    - 03_carga_y_preview_video/YTVideoService.js
    - 03_carga_y_preview_video/YTVideoDialog.js
    - 06_proyectos/YTProjectService.js
    - 11_exportacion_y_publicacion/YTExportStore.js
    - 12_flujo_maestro/YTWorkflowService.js
*/

const { getDatabaseFilePath } = require("../02_archivos_y_datos/YTPathService");
const { ensureUserDataFolders } = require("../02_archivos_y_datos/YTFolderService");
const { readJsonFile, writeJsonFile, deleteFileIfExists } = require("../02_archivos_y_datos/YTFileService");
const {
  createEmptyVideo,
  createMaterialSession,
  createEmptyMaterialSession,
  getMediaItemsFromPaths
} = require("./YTVideoService");

function getVideoSessionPath() {
  return getDatabaseFilePath("YTVideoSession.json");
}

function createVideoSession(videoInfo) {
  const material = createMaterialSession(videoInfo && videoInfo.path ? [videoInfo] : [], { sourceType: "compat" });
  return {
    ...material,
    currentVideo: videoInfo || createEmptyVideo(),
    primaryVideo: videoInfo || createEmptyVideo(),
    mediaItems: videoInfo && videoInfo.path ? [videoInfo] : [],
    mediaMode: videoInfo && videoInfo.path ? "SINGLE_LONG_VIDEO" : "EMPTY",
    updatedAt: new Date().toISOString()
  };
}

function saveMaterialSession(input = [], options = {}) {
  ensureUserDataFolders();
  const session = createMaterialSession(input, options);
  writeJsonFile(getVideoSessionPath(), session);
  return {
    ok: session.ok,
    status: session.status,
    path: getVideoSessionPath(),
    session,
    materialSession: session,
    currentVideo: session.currentVideo,
    primaryVideo: session.primaryVideo,
    mediaItems: session.mediaItems,
    mediaMode: session.mediaMode,
    message: session.message
  };
}

function saveMediaItemsFromPaths(filePaths = [], options = {}) {
  const mediaItems = getMediaItemsFromPaths(filePaths, options);
  return saveMaterialSession(mediaItems, options);
}

function saveCurrentVideo(videoInfo) {
  ensureUserDataFolders();
  const session = createVideoSession(videoInfo);
  writeJsonFile(getVideoSessionPath(), session);
  return { ok: true, status: "OK", path: getVideoSessionPath(), session, currentVideo: session.currentVideo };
}

function loadMaterialSession() {
  ensureUserDataFolders();
  const fallback = createEmptyMaterialSession();
  const result = readJsonFile(getVideoSessionPath(), fallback);
  if (!result.ok) {
    return {
      ...fallback,
      ok: false,
      status: "ERROR",
      path: getVideoSessionPath(),
      currentVideo: createEmptyVideo(),
      primaryVideo: createEmptyVideo(),
      mediaItems: [],
      session: fallback,
      message: result.error || "No se pudo leer la sesión."
    };
  }
  const data = result.data || fallback;
  const mediaItems = Array.isArray(data.mediaItems) ? data.mediaItems : (data.currentVideo && data.currentVideo.path ? [data.currentVideo] : []);
  const primaryVideo = data.primaryVideo || data.currentVideo || mediaItems[0] || createEmptyVideo();
  const session = {
    ...fallback,
    ...data,
    currentVideo: data.currentVideo || primaryVideo,
    primaryVideo,
    mediaItems,
    mediaMode: data.mediaMode || (mediaItems.length > 1 ? "MULTI_SHORT_VIDEOS" : mediaItems.length === 1 ? "SINGLE_LONG_VIDEO" : "EMPTY"),
    count: mediaItems.length
  };
  return {
    ok: true,
    status: "OK",
    path: getVideoSessionPath(),
    currentVideo: session.currentVideo,
    primaryVideo: session.primaryVideo,
    mediaItems: session.mediaItems,
    mediaMode: session.mediaMode,
    session,
    materialSession: session
  };
}

function loadCurrentVideo() {
  const loaded = loadMaterialSession();
  return {
    ok: loaded.ok,
    status: loaded.status,
    path: loaded.path,
    currentVideo: loaded.currentVideo || createEmptyVideo(),
    session: loaded.session,
    mediaItems: loaded.mediaItems,
    mediaMode: loaded.mediaMode
  };
}

function clearCurrentVideo() {
  ensureUserDataFolders();
  const deleted = deleteFileIfExists(getVideoSessionPath());
  return {
    ok: true,
    status: "OK",
    path: getVideoSessionPath(),
    deleted,
    currentVideo: createEmptyVideo(),
    primaryVideo: createEmptyVideo(),
    mediaItems: [],
    mediaMode: "EMPTY",
    session: createEmptyMaterialSession(),
    message: "Material actual limpiado."
  };
}

module.exports = {
  getVideoSessionPath,
  createVideoSession,
  saveCurrentVideo,
  saveMaterialSession,
  saveMediaItemsFromPaths,
  loadCurrentVideo,
  loadMaterialSession,
  clearCurrentVideo
};

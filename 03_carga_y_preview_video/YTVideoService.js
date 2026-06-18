/*
  Nombre completo: YTVideoService.js
  Ruta: 03_carga_y_preview_video/YTVideoService.js
  Función o funciones:
    - Validar videos individuales.
    - Normalizar uno o varios videos como material de proyecto.
    - Detectar si el material es un video largo o varios videos cortos.
    - Adjuntar metadata técnica para revisión: duración, resolución, calidad y audio.
  Se conecta con:
    - 03_carga_y_preview_video/YTVideoDialog.js
    - 03_carga_y_preview_video/YTVideoStore.js
    - 03_carga_y_preview_video/YTVideoMetadataService.js
    - 06_proyectos/YTProjectService.js
    - 12_flujo_maestro/YTWorkflowService.js
*/

const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const metadataService = require("./YTVideoMetadataService");

const VIDEO_EXTENSIONS = [".mp4", ".mov", ".m4v", ".webm", ".mkv", ".avi"];
const PREVIEW_SAFE_EXTENSIONS = [".mp4", ".mov", ".m4v", ".webm"];

const MEDIA_MODE = Object.freeze({
  EMPTY: "EMPTY",
  SINGLE_LONG_VIDEO: "SINGLE_LONG_VIDEO",
  MULTI_SHORT_VIDEOS: "MULTI_SHORT_VIDEOS"
});

function exists(filePath) {
  try {
    return Boolean(filePath && fs.existsSync(filePath));
  } catch (_error) {
    return false;
  }
}

function formatBytes(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return (value / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 2) + " " + units[index];
}

function isVideoFile(filePath) {
  return VIDEO_EXTENSIONS.includes(path.extname(filePath || "").toLowerCase());
}

function canPreviewInElectron(filePath) {
  return PREVIEW_SAFE_EXTENSIONS.includes(path.extname(filePath || "").toLowerCase());
}

function createMediaId(index = 0) {
  return `media_${Date.now()}_${index + 1}`;
}

function uniqueAlerts(...groups) {
  const result = [];
  groups.flat().filter(Boolean).forEach((item) => {
    const text = String(item || "").trim();
    if (text && !result.includes(text)) result.push(text);
  });
  return result;
}

function normalizeMetadata(filePath, itemMetadata = null, options = {}) {
  if (itemMetadata && typeof itemMetadata === "object" && (itemMetadata.durationSeconds || itemMetadata.width || itemMetadata.height || itemMetadata.audioDetected)) {
    const alerts = Array.isArray(itemMetadata.alerts) ? itemMetadata.alerts : [];
    return {
      ...metadataService.createEmptyMetadata(),
      ...itemMetadata,
      alerts,
      metadataStatus: itemMetadata.status || itemMetadata.metadataStatus || (alerts.length ? "WARNING" : "OK")
    };
  }

  if (options.skipMetadata === true) {
    return metadataService.createEmptyMetadata({
      status: "SKIPPED",
      metadataStatus: "SKIPPED",
      message: "Lectura de metadata omitida por configuración."
    });
  }

  const metadata = metadataService.probeVideoMetadata(filePath, {
    timeoutMs: options.metadataTimeoutMs || 7000
  });

  return {
    ...metadata,
    metadataStatus: metadata.status || "WARNING"
  };
}

function getVideoInfo(filePath, options = {}) {
  if (!filePath || typeof filePath !== "string") {
    return {
      ok: false,
      status: "ERROR",
      message: "Ruta inválida.",
      path: filePath || ""
    };
  }

  if (!exists(filePath)) {
    return {
      ok: false,
      status: "ERROR",
      path: filePath,
      message: "El archivo no existe."
    };
  }

  const stats = fs.statSync(filePath);
  if (!stats.isFile()) {
    return {
      ok: false,
      status: "ERROR",
      path: filePath,
      message: "La ruta no es un archivo."
    };
  }

  const extension = path.extname(filePath).toLowerCase();
  if (!isVideoFile(filePath)) {
    return {
      ok: false,
      status: "ERROR",
      path: filePath,
      extension,
      message: "Extensión no permitida."
    };
  }

  const canPreview = canPreviewInElectron(filePath);
  const index = Number.isFinite(Number(options.index)) ? Number(options.index) : 0;
  const metadata = normalizeMetadata(filePath, options.metadata || null, options);
  const alerts = uniqueAlerts(metadata.alerts || [], canPreview ? [] : ["El archivo es válido, pero se recomienda MP4/MOV/WebM para preview estable."]);

  return {
    ok: true,
    status: alerts.length ? "WARNING" : "OK",
    id: options.id || createMediaId(index),
    order: index + 1,
    role: options.role || (index === 0 ? "PRIMARY" : "SUPPORT"),
    sourceType: options.sourceType || "video",
    name: path.basename(filePath),
    path: filePath,
    fileUrl: pathToFileURL(filePath).href,
    extension,
    sizeBytes: stats.size,
    size: formatBytes(stats.size),
    modifiedAt: stats.mtime.toISOString(),
    canPreview,

    durationSeconds: metadata.durationSeconds || 0,
    duration: metadata.duration || metadataService.formatDuration(metadata.durationSeconds || 0),
    width: metadata.width || 0,
    height: metadata.height || 0,
    fps: metadata.fps || 0,
    quality: metadata.quality || metadata.qualityLabel || "No detectada",
    qualityLabel: metadata.qualityLabel || metadata.quality || "No detectada",
    videoDetected: metadata.videoDetected === true,
    videoCodec: metadata.videoCodec || "",
    audioDetected: metadata.audioDetected === true,
    audioCodec: metadata.audioCodec || "",
    audioSampleRate: metadata.audioSampleRate || 0,
    audioChannels: metadata.audioChannels || "",
    metadataStatus: metadata.metadataStatus || metadata.status || "WARNING",
    metadataMessage: metadata.message || "",
    metadataAlerts: alerts,
    analysisAlerts: alerts,

    message: alerts.length ? "Video válido con advertencias de metadata." : "Video válido para preview y revisión."
  };
}

function createEmptyVideo() {
  return {
    ok: false,
    status: "EMPTY",
    id: "",
    order: 0,
    role: "PRIMARY",
    sourceType: "video",
    name: "",
    path: "",
    fileUrl: "",
    extension: "",
    size: "",
    sizeBytes: 0,
    canPreview: false,
    durationSeconds: 0,
    duration: "0:00",
    width: 0,
    height: 0,
    fps: 0,
    quality: "No detectada",
    qualityLabel: "No detectada",
    videoDetected: false,
    videoCodec: "",
    audioDetected: false,
    audioCodec: "",
    audioSampleRate: 0,
    audioChannels: "",
    metadataStatus: "EMPTY",
    metadataAlerts: [],
    analysisAlerts: [],
    message: "Sin video cargado."
  };
}

function detectMediaMode(mediaItems = [], requestedMode = "") {
  if (requestedMode && Object.values(MEDIA_MODE).includes(requestedMode)) return requestedMode;
  if (!Array.isArray(mediaItems) || mediaItems.length === 0) return MEDIA_MODE.EMPTY;
  return mediaItems.length === 1 ? MEDIA_MODE.SINGLE_LONG_VIDEO : MEDIA_MODE.MULTI_SHORT_VIDEOS;
}

function normalizeExistingItem(item = {}, index = 0, options = {}) {
  const checked = item.ok && item.name && (item.durationSeconds || item.metadataStatus)
    ? item
    : getVideoInfo(item.path, {
        index,
        id: item.id,
        role: item.role,
        sourceType: item.sourceType || options.sourceType || "video",
        metadata: item.metadata || null,
        skipMetadata: options.skipMetadata === true,
        metadataTimeoutMs: options.metadataTimeoutMs
      });

  return {
    ...checked,
    ...item,
    id: item.id || checked.id || createMediaId(index),
    order: index + 1,
    role: item.role || (index === 0 ? "PRIMARY" : "SUPPORT"),
    metadataAlerts: uniqueAlerts(checked.metadataAlerts || [], item.metadataAlerts || [], item.analysisAlerts || []),
    analysisAlerts: uniqueAlerts(checked.analysisAlerts || [], item.analysisAlerts || [], item.metadataAlerts || [])
  };
}

function normalizeMediaItems(input = [], options = {}) {
  const list = Array.isArray(input) ? input : [input];

  return list
    .map((item, index) => {
      if (typeof item === "string") {
        return getVideoInfo(item, {
          index,
          sourceType: options.sourceType || "video",
          skipMetadata: options.skipMetadata === true,
          metadataTimeoutMs: options.metadataTimeoutMs
        });
      }

      if (item && item.path) {
        return normalizeExistingItem(item, index, options);
      }

      return {
        ...createEmptyVideo(),
        id: createMediaId(index),
        order: index + 1,
        status: "ERROR",
        message: "Elemento de material inválido."
      };
    })
    .filter((item) => item && item.status !== "EMPTY");
}

function getMediaItemsFromPaths(filePaths = [], options = {}) {
  const paths = Array.isArray(filePaths) ? filePaths : [filePaths];
  return normalizeMediaItems(paths.filter(Boolean), options);
}

function summarizeMaterial(mediaItems = []) {
  const totalDurationSeconds = mediaItems.reduce((total, item) => total + Number(item.durationSeconds || 0), 0);
  const audioDetectedCount = mediaItems.filter((item) => item.audioDetected).length;
  const qualities = Array.from(new Set(mediaItems.map((item) => item.quality || item.qualityLabel || "No detectada").filter(Boolean)));
  const alerts = [];

  mediaItems.forEach((item) => {
    const itemAlerts = uniqueAlerts(item.metadataAlerts || [], item.analysisAlerts || []);
    itemAlerts.forEach((alert) => alerts.push(`${item.name || "Video"}: ${alert}`));
  });

  return {
    count: mediaItems.length,
    totalDurationSeconds,
    totalDuration: metadataService.formatDuration(totalDurationSeconds),
    audioDetectedCount,
    allHaveAudio: mediaItems.length > 0 && audioDetectedCount === mediaItems.length,
    qualities,
    alerts: uniqueAlerts(alerts)
  };
}

function createMaterialSession(input = [], options = {}) {
  const normalizedItems = normalizeMediaItems(input, options);
  const mediaItems = normalizedItems.filter((item) => item.ok);
  const invalidItems = normalizedItems.filter((item) => !item.ok);
  const primaryVideo = mediaItems[0] || createEmptyVideo();
  const mediaMode = detectMediaMode(mediaItems, options.mediaMode);
  const summary = summarizeMaterial(mediaItems);

  return {
    app: "AutoEdit Studio",
    block: "03_carga_y_preview_video",
    currentVideo: primaryVideo,
    primaryVideo,
    mediaItems,
    invalidItems,
    mediaMode,
    materialSummary: summary,
    sourceType: options.sourceType || "manual",
    count: mediaItems.length,
    invalidCount: invalidItems.length,
    ok: mediaItems.length > 0,
    status: mediaItems.length ? (invalidItems.length || summary.alerts.length ? "WARNING" : "OK") : "ERROR",
    message: mediaItems.length ? `${mediaItems.length} video(s) cargado(s).` : "No se cargó ningún video válido.",
    updatedAt: new Date().toISOString()
  };
}

function getVideosInfo(filePaths = [], options = {}) {
  return createMaterialSession(filePaths, options);
}

function createEmptyMaterialSession() {
  return {
    app: "AutoEdit Studio",
    block: "03_carga_y_preview_video",
    currentVideo: createEmptyVideo(),
    primaryVideo: createEmptyVideo(),
    mediaItems: [],
    invalidItems: [],
    mediaMode: MEDIA_MODE.EMPTY,
    materialSummary: summarizeMaterial([]),
    sourceType: "manual",
    count: 0,
    invalidCount: 0,
    ok: false,
    status: "ERROR",
    message: "No se cargó ningún video válido.",
    updatedAt: new Date().toISOString()
  };
}

module.exports = {
  VIDEO_EXTENSIONS,
  PREVIEW_SAFE_EXTENSIONS,
  MEDIA_MODE,
  exists,
  formatBytes,
  isVideoFile,
  canPreviewInElectron,
  getVideoInfo,
  getVideosInfo,
  createEmptyVideo,
  detectMediaMode,
  normalizeMediaItems,
  getMediaItemsFromPaths,
  summarizeMaterial,
  createMaterialSession,
  createEmptyMaterialSession
};
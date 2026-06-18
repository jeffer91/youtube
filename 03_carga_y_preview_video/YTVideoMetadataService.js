/*
  Nombre completo: YTVideoMetadataService.js
  Ruta: 03_carga_y_preview_video/YTVideoMetadataService.js
  Función o funciones:
    - Obtener metadata técnica de videos locales sin romper el flujo si FFmpeg no está disponible.
    - Detectar duración, resolución, calidad, FPS, códecs y presencia de audio.
    - Generar alertas profesionales para la revisión del Paso 4.
  Se conecta con:
    - 03_carga_y_preview_video/YTVideoService.js
    - ffmpeg-static
*/

const fs = require("fs");
const { execFileSync } = require("child_process");

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function fileExists(filePath) {
  try {
    return Boolean(filePath && fs.existsSync(filePath) && fs.statSync(filePath).isFile());
  } catch (_error) {
    return false;
  }
}

function getFfmpegPath() {
  try {
    const ffmpegPath = require("ffmpeg-static");
    return typeof ffmpegPath === "string" && ffmpegPath.trim() ? ffmpegPath : "";
  } catch (_error) {
    return "";
  }
}

function parseDurationSeconds(output = "") {
  const match = String(output).match(/Duration:\s*(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/i);
  if (!match) return 0;
  const hours = toNumber(match[1]);
  const minutes = toNumber(match[2]);
  const seconds = toNumber(match[3]);
  return Math.round((hours * 3600 + minutes * 60 + seconds) * 100) / 100;
}

function formatDuration(seconds = 0) {
  const total = Math.max(0, Math.round(toNumber(seconds)));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return hours ? `${hours}:${pad(minutes)}:${pad(secs)}` : `${minutes}:${pad(secs)}`;
}

function parseVideoStream(output = "") {
  const lines = String(output).split(/\r?\n/);
  const videoLine = lines.find((line) => /Stream #.*Video:/i.test(line)) || "";
  const resolutionMatch = videoLine.match(/,\s*(\d{2,5})x(\d{2,5})(?:[,\s]|$)/i);
  const fpsMatch = videoLine.match(/(\d+(?:\.\d+)?)\s*fps/i);
  const codecMatch = videoLine.match(/Video:\s*([^,\s]+)/i);

  const width = resolutionMatch ? toNumber(resolutionMatch[1]) : 0;
  const height = resolutionMatch ? toNumber(resolutionMatch[2]) : 0;

  return {
    videoDetected: Boolean(videoLine),
    videoCodec: codecMatch ? codecMatch[1] : "",
    width,
    height,
    fps: fpsMatch ? toNumber(fpsMatch[1]) : 0,
    rawVideoStream: videoLine.trim()
  };
}

function parseAudioStream(output = "") {
  const lines = String(output).split(/\r?\n/);
  const audioLine = lines.find((line) => /Stream #.*Audio:/i.test(line)) || "";
  const codecMatch = audioLine.match(/Audio:\s*([^,\s]+)/i);
  const sampleRateMatch = audioLine.match(/(\d+)\s*Hz/i);
  const channels = /stereo/i.test(audioLine) ? "stereo" : /mono/i.test(audioLine) ? "mono" : "";

  return {
    audioDetected: Boolean(audioLine),
    audioCodec: codecMatch ? codecMatch[1] : "",
    audioSampleRate: sampleRateMatch ? toNumber(sampleRateMatch[1]) : 0,
    audioChannels: channels,
    rawAudioStream: audioLine.trim()
  };
}

function detectQuality(width = 0, height = 0) {
  const w = toNumber(width);
  const h = toNumber(height);
  const maxSide = Math.max(w, h);
  const minSide = Math.min(w, h);

  if (!w || !h) return "No detectada";
  if (maxSide >= 3840 || minSide >= 2160) return "4K";
  if (maxSide >= 2560 || minSide >= 1440) return "2K / 1440p";
  if (maxSide >= 1920 || minSide >= 1080) return "Full HD / 1080p";
  if (maxSide >= 1280 || minSide >= 720) return "HD / 720p";
  return "Baja resolución";
}

function buildAlerts(metadata = {}) {
  const alerts = [];

  if (!metadata.durationSeconds) {
    alerts.push("No se pudo detectar la duración del video.");
  }

  if (!metadata.width || !metadata.height) {
    alerts.push("No se pudo detectar la resolución/calidad del video.");
  } else if (metadata.width < 720 && metadata.height < 720) {
    alerts.push("La resolución detectada es baja para clips verticales profesionales.");
  }

  if (!metadata.audioDetected) {
    alerts.push("No se detectó pista de audio.");
  }

  if (metadata.fps && metadata.fps < 24) {
    alerts.push("Los FPS detectados son bajos; el movimiento puede verse poco fluido.");
  }

  return alerts;
}

function createEmptyMetadata(extra = {}) {
  return {
    ok: false,
    status: "WARNING",
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
    alerts: [],
    message: "Metadata técnica no disponible.",
    ...extra
  };
}

function probeVideoMetadata(filePath, options = {}) {
  if (!fileExists(filePath)) {
    return createEmptyMetadata({
      status: "ERROR",
      alerts: ["El archivo no existe o no es accesible."],
      message: "No se pudo leer el archivo de video."
    });
  }

  const ffmpegPath = options.ffmpegPath || getFfmpegPath();
  if (!ffmpegPath) {
    return createEmptyMetadata({
      alerts: ["FFmpeg no está disponible. Instala dependencias con npm install."],
      message: "No se encontró ffmpeg-static para leer metadata."
    });
  }

  try {
    execFileSync(ffmpegPath, ["-hide_banner", "-i", filePath], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: Number(options.timeoutMs || 7000)
    });

    return createEmptyMetadata({
      alerts: ["FFmpeg no devolvió metadata legible para este archivo."],
      message: "No se pudo interpretar la salida de FFmpeg."
    });
  } catch (error) {
    const output = String((error && error.stdout) || "") + "\n" + String((error && error.stderr) || "");
    const durationSeconds = parseDurationSeconds(output);
    const video = parseVideoStream(output);
    const audio = parseAudioStream(output);
    const quality = detectQuality(video.width, video.height);

    const metadata = {
      ok: Boolean(durationSeconds || video.videoDetected || audio.audioDetected),
      status: "OK",
      durationSeconds,
      duration: formatDuration(durationSeconds),
      ...video,
      ...audio,
      quality,
      qualityLabel: quality,
      message: "Metadata técnica detectada correctamente."
    };

    const alerts = buildAlerts(metadata);
    return {
      ...metadata,
      status: alerts.length ? "WARNING" : "OK",
      alerts,
      message: alerts.length ? "Metadata detectada con advertencias." : metadata.message
    };
  }
}

module.exports = {
  probeVideoMetadata,
  createEmptyMetadata,
  formatDuration,
  detectQuality,
  buildAlerts
};
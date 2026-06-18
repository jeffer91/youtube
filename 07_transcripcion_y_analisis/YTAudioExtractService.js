/*
Nombre completo: YTAudioExtractService.js
Ruta: 07_transcripcion_y_analisis/YTAudioExtractService.js
Función o funciones:
  - Preparar ruta de audio por cada video.
  - Extraer audio con ffmpeg si está disponible.
  - Devolver fallback seguro si todavía no existe ffmpeg.
Se conecta con:
  - YTTranscriptionEngineService.js
  - YTWorkflowService.js
*/

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const USER_DATA_DIR = path.join(ROOT_DIR, "user_data");
const AUDIO_DIR = path.join(USER_DATA_DIR, "temp", "audio");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function safeName(value = "audio") {
  return String(value || "audio").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
}

function getFfmpegPath() {
  try {
    return require("ffmpeg-static") || "ffmpeg";
  } catch (_error) {
    return "ffmpeg";
  }
}

function createAudioPath(video = {}) {
  ensureDir(AUDIO_DIR);
  const id = safeName(video.id || video.name || Date.now());
  return path.join(AUDIO_DIR, `${id}.wav`);
}

function extractAudio(video = {}, options = {}) {
  const videoPath = video.path || video.filePath || "";
  const outputPath = options.outputPath || createAudioPath(video);

  if (!videoPath || !fs.existsSync(videoPath)) {
    return {
      ok: false,
      status: "MISSING_VIDEO",
      message: "No existe la ruta del video para extraer audio.",
      videoId: video.id || "",
      videoName: video.name || "",
      videoPath,
      audioPath: outputPath
    };
  }

  ensureDir(path.dirname(outputPath));
  const ffmpeg = getFfmpegPath();
  const args = ["-y", "-i", videoPath, "-vn", "-ac", "1", "-ar", "16000", outputPath];
  const result = spawnSync(ffmpeg, args, { encoding: "utf8" });

  if (result.error || result.status !== 0 || !fs.existsSync(outputPath)) {
    return {
      ok: false,
      status: "FFMPEG_ERROR",
      message: result.error ? result.error.message : "No se pudo extraer audio con ffmpeg.",
      videoId: video.id || "",
      videoName: video.name || "",
      videoPath,
      audioPath: outputPath,
      stderr: result.stderr || ""
    };
  }

  return {
    ok: true,
    status: "OK",
    message: "Audio extraído correctamente.",
    videoId: video.id || "",
    videoName: video.name || "",
    videoPath,
    audioPath: outputPath,
    createdAt: new Date().toISOString()
  };
}

function prepareAudioForVideo(video = {}, options = {}) {
  const shouldExtract = options.extractAudio === true;
  if (!shouldExtract) {
    return {
      ok: true,
      status: "SKIPPED",
      message: "Extracción real de audio omitida. Se conserva modo básico.",
      videoId: video.id || "",
      videoName: video.name || "",
      audioPath: createAudioPath(video)
    };
  }
  return extractAudio(video, options);
}

module.exports = {
  AUDIO_DIR,
  createAudioPath,
  extractAudio,
  prepareAudioForVideo
};

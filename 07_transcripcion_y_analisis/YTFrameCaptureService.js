/*
Nombre completo: YTFrameCaptureService.js
Ruta: 07_transcripcion_y_analisis/YTFrameCaptureService.js
Función o funciones:
  - Preparar capturas visuales por video.
  - Capturar frames con ffmpeg si se activa extracción real.
  - Devolver escenas básicas cuando no se ejecuta ffmpeg.
Se conecta con:
  - YTVisualDescriptionService.js
  - YTWorkflowService.js
*/

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const USER_DATA_DIR = path.join(ROOT_DIR, "user_data");
const FRAMES_DIR = path.join(USER_DATA_DIR, "temp", "frames");

function ensureDir(dirPath) { fs.mkdirSync(dirPath, { recursive: true }); }
function safeName(value = "video") { return String(value || "video").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80); }
function getFfmpegPath() { try { return require("ffmpeg-static") || "ffmpeg"; } catch (_error) { return "ffmpeg"; } }

function getFrameDir(video = {}) {
  const dir = path.join(FRAMES_DIR, safeName(video.id || video.name || Date.now()));
  ensureDir(dir);
  return dir;
}

function createBasicFrames(video = {}, intervalSeconds = 5) {
  const duration = Number(video.durationSeconds || 0);
  const total = duration > 0 ? Math.max(1, Math.min(12, Math.ceil(duration / intervalSeconds))) : 3;
  return Array.from({ length: total }).map((_, index) => ({
    id: `frame_${index + 1}`,
    second: index * intervalSeconds,
    path: "",
    status: "BASIC_FRAME_PLACEHOLDER",
    note: "Frame real pendiente de captura."
  }));
}

function captureFramesForVideo(video = {}, options = {}) {
  const intervalSeconds = Math.max(1, Number(options.intervalSeconds || 5));
  const videoPath = video.path || video.filePath || "";
  const shouldCapture = options.captureRealFrames === true;

  if (!shouldCapture || !videoPath || !fs.existsSync(videoPath)) {
    return {
      ok: true,
      status: shouldCapture ? "MISSING_VIDEO" : "BASIC_PLACEHOLDER",
      message: shouldCapture ? "No existe el video para capturar frames." : "Captura real omitida. Se generaron frames básicos.",
      videoId: video.id || "",
      videoName: video.name || "",
      frames: createBasicFrames(video, intervalSeconds),
      intervalSeconds
    };
  }

  const outputDir = getFrameDir(video);
  const pattern = path.join(outputDir, "frame_%04d.jpg");
  const ffmpeg = getFfmpegPath();
  const result = spawnSync(ffmpeg, ["-y", "-i", videoPath, "-vf", `fps=1/${intervalSeconds}`, "-q:v", "3", pattern], { encoding: "utf8" });

  if (result.error || result.status !== 0) {
    return {
      ok: false,
      status: "FFMPEG_ERROR",
      message: result.error ? result.error.message : "No se pudieron capturar frames.",
      videoId: video.id || "",
      videoName: video.name || "",
      frames: createBasicFrames(video, intervalSeconds),
      stderr: result.stderr || ""
    };
  }

  const files = fs.readdirSync(outputDir).filter((file) => file.toLowerCase().endsWith(".jpg")).sort();
  const frames = files.map((file, index) => ({ id: `frame_${index + 1}`, second: index * intervalSeconds, path: path.join(outputDir, file), status: "CAPTURED" }));

  return {
    ok: true,
    status: "OK",
    message: `${frames.length} frame(s) capturados.`,
    videoId: video.id || "",
    videoName: video.name || "",
    frames,
    intervalSeconds
  };
}

module.exports = {
  FRAMES_DIR,
  getFrameDir,
  createBasicFrames,
  captureFramesForVideo
};

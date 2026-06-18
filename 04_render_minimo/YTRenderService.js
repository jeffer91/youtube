const fs = require("fs");
const { spawn } = require("child_process");
const { ensureUserDataFolders } = require("../02_archivos_y_datos/YTFolderService");
const { exists, getFileInfo } = require("../02_archivos_y_datos/YTFileService");
const { loadCurrentVideo } = require("../03_carga_y_preview_video/YTVideoStore");
const { getFfmpegPath, buildFiveSecondArgs, testFfmpegAvailable } = require("./YTFfmpegMini");
const { createProgressFromText, createInitialProgress, createFinalProgress } = require("./YTRenderProgress");
const { createRenderJob, saveLastRender, loadLastRender } = require("./YTRenderModel");

async function renderFirstFiveSeconds(options = {}) {
  ensureUserDataFolders();
  const ffmpegCheck = await testFfmpegAvailable();
  if (!ffmpegCheck.ok) return { ok: false, status: "ERROR", message: "No se puede renderizar porque FFmpeg no está disponible.", ffmpeg: ffmpegCheck, recommendation: "Ejecuta npm install para instalar ffmpeg-static." };

  const videoSession = loadCurrentVideo();
  const currentVideo = videoSession.currentVideo || {};
  const inputPath = options.inputPath || currentVideo.path;
  if (!inputPath) return { ok: false, status: "ERROR", message: "No hay video cargado. Primero usa Seleccionar video.", currentVideo };
  if (!exists(inputPath)) return { ok: false, status: "ERROR", message: "El video cargado ya no existe en esa ruta.", inputPath };

  const job = createRenderJob(inputPath, { durationSeconds: options.durationSeconds || 5 });
  job.status = "RUNNING";
  job.startedAt = new Date().toISOString();
  saveLastRender(job, { status: "RUNNING", message: "Render iniciado." });

  const ffmpegPath = getFfmpegPath();
  const args = buildFiveSecondArgs(job.inputPath, job.outputPath, job.durationSeconds);
  const progress = [createInitialProgress(job.durationSeconds)];

  return new Promise((resolve) => {
    let stderr = "";
    let stdout = "";
    const child = spawn(ffmpegPath, args, { windowsHide: true });

    child.stdout.on("data", (chunk) => stdout += chunk.toString());
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      const parsed = createProgressFromText(text, job.durationSeconds);
      if (parsed) progress.push(parsed);
    });

    child.on("error", (error) => {
      const failedJob = { ...job, status: "ERROR", finishedAt: new Date().toISOString() };
      const result = { ok: false, status: "ERROR", message: "FFmpeg no pudo iniciar el render.", job: failedJob, error: error.message || String(error), stderr: stderr.slice(-1200), stdout: stdout.slice(-1200), progress };
      saveLastRender(failedJob, result);
      resolve(result);
    });

    child.on("close", (code) => {
      const outputExists = fs.existsSync(job.outputPath);
      const ok = code === 0 && outputExists;
      const finishedJob = { ...job, status: ok ? "OK" : "ERROR", finishedAt: new Date().toISOString() };
      const finalProgress = ok ? [...progress, createFinalProgress(job.durationSeconds)] : progress;
      const result = { ok, status: ok ? "OK" : "ERROR", message: ok ? "Render mínimo creado correctamente." : "FFmpeg terminó, pero no se pudo confirmar el archivo exportado.", code, job: finishedJob, input: getFileInfo(job.inputPath), output: outputExists ? getFileInfo(job.outputPath) : null, outputPath: job.outputPath, stderr: stderr.slice(-1600), stdout: stdout.slice(-1600), progress: finalProgress, ffmpegPath };
      saveLastRender(finishedJob, result);
      resolve(result);
    });
  });
}

function getLastRender() {
  return loadLastRender();
}

module.exports = { renderFirstFiveSeconds, getLastRender };

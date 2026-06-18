const fs = require("fs");
const { spawn } = require("child_process");
const ffmpegPath = require("ffmpeg-static");
const { exists, getFileInfo } = require("../02_archivos_y_datos/YTFileService");
const { getPlatformExportFolder, loadExportSession, createPlanFromCurrentData, saveRenderResult, createPackageFromCurrentPlan } = require("./YTExportStore");
const { getPlatformPreset } = require("./YTExportModel");

function buildVideoFilter(preset) {
  if (preset.format === "vertical_9_16" || preset.format === "square_1_1") {
    return `scale=${preset.width}:${preset.height}:force_original_aspect_ratio=increase,crop=${preset.width}:${preset.height},setsar=1`;
  }
  return `scale=${preset.width}:${preset.height}:force_original_aspect_ratio=decrease,pad=${preset.width}:${preset.height}:(ow-iw)/2:(oh-ih)/2,setsar=1`;
}

function buildRenderArgs(item, options = {}) {
  const preset = getPlatformPreset(item.platformKey);
  const durationSeconds = Number(options.durationSeconds || 0);
  const args = ["-y", "-i", item.inputPath, "-vf", buildVideoFilter(preset), "-r", String(preset.fps), "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-b:v", preset.videoBitrate, "-c:a", "aac", "-b:a", preset.audioBitrate, "-movflags", "+faststart"];
  if (durationSeconds > 0) args.push("-t", String(durationSeconds));
  args.push(item.outputPath);
  return args;
}

function ensureOutputFolder(item) {
  const folder = getPlatformExportFolder(item.platformKey);
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
}

function getCurrentExport() {
  const session = loadExportSession();
  return { ok: session.ok, status: session.status, currentPlan: session.currentPlan, currentPublicationPackage: session.currentPublicationPackage, lastRender: session.lastRender, sessionPath: session.path, message: session.currentPlan ? "Exportación cargada." : "Todavía no existe plan de exportación." };
}

function createExportPlan(options = {}) {
  return createPlanFromCurrentData(options);
}

async function renderPlatform(item, options = {}) {
  if (!item || !item.inputPath) return { ok: false, status: "ERROR", message: "No hay entrada de video para renderizar.", item };
  if (!exists(item.inputPath)) return { ok: false, status: "ERROR", message: "El video de entrada no existe.", item, inputPath: item.inputPath };
  if (!ffmpegPath) return { ok: false, status: "ERROR", message: "FFmpeg no está disponible. Ejecuta npm install.", item };

  ensureOutputFolder(item);
  const args = buildRenderArgs(item, options);

  return new Promise((resolve) => {
    let stderr = "";
    let stdout = "";
    const child = spawn(ffmpegPath, args, { windowsHide: true });
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", (error) => resolve({ ok: false, status: "ERROR", message: "No se pudo iniciar FFmpeg.", item, outputPath: item.outputPath, error: error.message || String(error), stderr: stderr.slice(-1600), stdout: stdout.slice(-1600) }));
    child.on("close", (code) => {
      const outputExists = fs.existsSync(item.outputPath);
      const ok = code === 0 && outputExists;
      resolve({ ok, status: ok ? "OK" : "ERROR", message: ok ? "Exportación final creada correctamente." : "FFmpeg terminó, pero no se confirmó el archivo final.", code, item, input: getFileInfo(item.inputPath), output: outputExists ? getFileInfo(item.outputPath) : null, outputPath: item.outputPath, stderr: stderr.slice(-2000), stdout: stdout.slice(-1200), ffmpegPath });
    });
  });
}

async function renderFinalExport(options = {}) {
  const session = loadExportSession();
  let plan = session.currentPlan;
  if (!plan) {
    const created = createExportPlan(options);
    if (!created.ok) return created;
    plan = created.plan;
  }
  const platformKey = options.platformKey || "youtube";
  const items = Array.isArray(plan.items) ? plan.items : [];
  const item = items.find((entry) => entry.platformKey === platformKey) || items[0];
  if (!item) return { ok: false, status: "ERROR", message: "No existe ítem de exportación para renderizar.", plan };
  const result = await renderPlatform(item, { durationSeconds: options.durationSeconds || 0 });
  saveRenderResult(result);
  return result;
}

async function renderBatch(options = {}) {
  const session = loadExportSession();
  let plan = session.currentPlan;
  if (!plan) {
    const created = createExportPlan(options);
    if (!created.ok) return created;
    plan = created.plan;
  }
  const selectedPlatforms = Array.isArray(options.platforms) && options.platforms.length ? options.platforms : plan.platforms;
  const items = (plan.items || []).filter((item) => selectedPlatforms.includes(item.platformKey));
  const results = [];
  for (const item of items) {
    const result = await renderPlatform(item, { durationSeconds: options.durationSeconds || 0 });
    saveRenderResult(result);
    results.push(result);
  }
  const okCount = results.filter((item) => item.ok).length;
  return { ok: okCount > 0, status: okCount === results.length ? "OK" : okCount > 0 ? "WARNING" : "ERROR", message: `Exportación por lote finalizada. Correctos: ${okCount}/${results.length}.`, count: results.length, okCount, results };
}

function createPublicationPackage(options = {}) {
  return createPackageFromCurrentPlan(options);
}

module.exports = { buildVideoFilter, buildRenderArgs, getCurrentExport, createExportPlan, renderFinalExport, renderBatch, createPublicationPackage };

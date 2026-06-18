const path = require("path");
const { getExportFilePath, getDatabaseFilePath } = require("../02_archivos_y_datos/YTPathService");
const { writeJsonFile, readJsonFile } = require("../02_archivos_y_datos/YTFileService");
const { ensureUserDataFolders } = require("../02_archivos_y_datos/YTFolderService");

function getRenderOutputPath() {
  return getExportFilePath("render_prueba.mp4");
}

function getRenderSessionPath() {
  return getDatabaseFilePath("YTRenderSession.json");
}

function createRenderJob(inputPath, options = {}) {
  const durationSeconds = Number(options.durationSeconds || 5);
  const outputPath = options.outputPath || getRenderOutputPath();
  return { id: "render_" + Date.now(), block: "04_render_minimo", inputPath, outputPath, outputName: path.basename(outputPath), durationSeconds, mode: "first_seconds", status: "PENDING", createdAt: new Date().toISOString(), startedAt: null, finishedAt: null };
}

function createRenderResult(job, extra = {}) {
  return { app: "AutoEdit Studio", block: "04_render_minimo", currentRender: { ...job, ...extra, updatedAt: new Date().toISOString() } };
}

function saveLastRender(job, extra = {}) {
  ensureUserDataFolders();
  const session = createRenderResult(job, extra);
  writeJsonFile(getRenderSessionPath(), session);
  return { ok: true, status: "OK", path: getRenderSessionPath(), session };
}

function loadLastRender() {
  ensureUserDataFolders();
  const fallback = createRenderResult({ id: "", block: "04_render_minimo", inputPath: "", outputPath: getRenderOutputPath(), outputName: "render_prueba.mp4", durationSeconds: 5, mode: "first_seconds", status: "EMPTY", createdAt: "", startedAt: null, finishedAt: null });
  const result = readJsonFile(getRenderSessionPath(), fallback);
  return { ok: result.ok, status: result.ok ? "OK" : "ERROR", path: getRenderSessionPath(), currentRender: result.data.currentRender || fallback.currentRender, session: result.data, error: result.error || null };
}

module.exports = { getRenderOutputPath, getRenderSessionPath, createRenderJob, createRenderResult, saveLastRender, loadLastRender };

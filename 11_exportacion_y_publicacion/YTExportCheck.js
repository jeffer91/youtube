const fs = require("fs");
const ffmpegPath = require("ffmpeg-static");
const { ensureExportStorage, getFinalExportsRoot, getExportSessionPath, loadExportSession } = require("./YTExportStore");
const { listPlatformPresets, createExportPlan } = require("./YTExportModel");

function checkItem(id, label, ok, message, recommendation = "") {
  return { id, label, status: ok ? "OK" : "ERROR", ok: Boolean(ok), message, recommendation };
}

function runExportCheck() {
  const errors = [];
  const warnings = [];
  const checks = [];
  let storage = null;
  let session = null;
  let samplePlan = null;
  let presets = [];

  try {
    storage = ensureExportStorage();
    session = loadExportSession();
    presets = listPlatformPresets();
    samplePlan = createExportPlan({ project: { id: "check_project", name: "Proyecto de prueba" }, inputVideo: { name: "video_prueba.mp4", path: "" }, outputFolder: getFinalExportsRoot(), platforms: ["youtube", "shorts", "square"] });
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  checks.push(checkItem("export-folder", "Carpeta de exportación final", storage && fs.existsSync(getFinalExportsRoot()), "Debe existir user_data/exports/final.", "Ejecuta npm run check:export."));
  checks.push(checkItem("export-session", "Sesión de exportación", storage && fs.existsSync(getExportSessionPath()), "Debe existir user_data/database/YTExportSession.json.", "Revisar permisos de escritura."));
  checks.push(checkItem("platform-presets", "Presets de plataforma", Array.isArray(presets) && presets.length >= 3, "Debe existir al menos horizontal, vertical y cuadrado.", "Revisar YTExportModel.js."));
  checks.push(checkItem("sample-plan", "Creación de plan", samplePlan && Array.isArray(samplePlan.items) && samplePlan.items.length >= 3, "Debe poder crear un plan de exportación.", "Revisar createExportPlan."));
  checks.push(checkItem("ffmpeg", "FFmpeg disponible", Boolean(ffmpegPath), "FFmpeg debe estar disponible para exportar.", "Ejecuta npm install."));
  checks.push(checkItem("session-load", "Lectura de sesión", session && session.ok, "Debe poder leer YTExportSession.json.", "Revisar YTExportStore.js."));

  if (!ffmpegPath) warnings.push("FFmpeg no está disponible. El plan se puede crear, pero no se podrá renderizar.");
  checks.forEach((item) => { if (!item.ok) errors.push(item.label + ": " + item.message); });
  const status = errors.length ? "ERROR" : warnings.length ? "WARNING" : "OK";

  return { ok: status !== "ERROR", approved: status !== "ERROR", block: "11_exportacion_y_publicacion", title: "Bloque 11 — Exportación y publicación", status, summary: status === "OK" ? "Exportación y publicación funcionan correctamente." : status === "WARNING" ? "Exportación funciona con advertencias." : "Exportación tiene errores críticos.", checks, errors, warnings, finalExportsRoot: getFinalExportsRoot(), sessionPath: getExportSessionPath(), presets, samplePlan, timestamp: new Date().toISOString() };
}

if (require.main === module) {
  const result = runExportCheck();
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

module.exports = { runExportCheck };

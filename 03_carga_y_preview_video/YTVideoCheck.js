const fs = require("fs");
const path = require("path");
const { VIDEO_EXTENSIONS, PREVIEW_SAFE_EXTENSIONS } = require("./YTVideoService");
const { loadCurrentVideo, getVideoSessionPath } = require("./YTVideoStore");

const REQUIRED_FILES = ["YTVideoService.js", "YTVideoDialog.js", "YTVideoStore.js", "YTVideoCheck.js", "YTVideoManual.md"];

function createCheck(id, label, ok, message, recommendation = "") {
  return { id, label, status: ok ? "OK" : "ERROR", ok, message, recommendation };
}

function runVideoCheck() {
  const checks = [];
  const errors = [];
  const warnings = [];

  REQUIRED_FILES.forEach((fileName) => {
    const ok = fs.existsSync(path.join(__dirname, fileName));
    checks.push(createCheck("file:" + fileName, "Archivo " + fileName, ok, ok ? "Archivo encontrado." : "Archivo faltante."));
    if (!ok) errors.push("Falta archivo del Bloque 03: " + fileName);
  });

  const extensionsOk = VIDEO_EXTENSIONS.includes(".mp4") && VIDEO_EXTENSIONS.includes(".mov") && VIDEO_EXTENSIONS.includes(".webm");
  checks.push(createCheck("video:extensions", "Extensiones permitidas", extensionsOk, extensionsOk ? VIDEO_EXTENSIONS.join(", ") : "Lista incompleta."));
  if (!extensionsOk) errors.push("Extensiones de video incompletas.");

  const previewOk = PREVIEW_SAFE_EXTENSIONS.includes(".mp4");
  checks.push(createCheck("video:preview-mp4", "Preview MP4", previewOk, previewOk ? "MP4 compatible para preview." : "MP4 no configurado."));
  if (!previewOk) errors.push("MP4 no está marcado como compatible.");

  let currentVideo = null;
  try {
    const session = loadCurrentVideo();
    currentVideo = session.currentVideo || null;
    checks.push(createCheck("video:session", "Sesión de video", session.ok, session.ok ? "Sesión legible." : "Sesión con error."));
    checks.push(createCheck("video:session-path", "Ruta de sesión", Boolean(getVideoSessionPath()), getVideoSessionPath()));
  } catch (error) {
    errors.push(error.message || String(error));
    checks.push(createCheck("video:session-error", "Error de sesión", false, error.message || String(error)));
  }

  if (!currentVideo || !currentVideo.path) {
    warnings.push("Todavía no hay video cargado. Esto es normal antes de seleccionar un archivo.");
    checks.push({ id: "video:loaded", label: "Video cargado", status: "WARNING", ok: true, message: "Sin video cargado todavía.", recommendation: "Presionar Seleccionar video y escoger un MP4." });
  } else {
    checks.push({ id: "video:loaded", label: "Video cargado", status: currentVideo.ok ? "OK" : "WARNING", ok: Boolean(currentVideo.ok), message: currentVideo.name || currentVideo.path, recommendation: currentVideo.canPreview ? "Sin acción requerida." : "Usar MP4 para preview." });
    if (!currentVideo.canPreview) warnings.push("El video cargado puede no reproducirse en preview. Se recomienda MP4.");
  }

  const status = errors.length ? "ERROR" : warnings.length ? "WARNING" : "OK";
  return { ok: status !== "ERROR", approved: status === "OK", block: "03_carga_y_preview_video", title: "Bloque 03 — Carga y preview de video", status, summary: status === "OK" ? "Carga y preview disponibles." : status === "WARNING" ? "Funciona, pero falta cargar video o hay advertencias." : "Hay errores que corregir.", checks, errors, warnings, currentVideo, timestamp: new Date().toISOString() };
}

if (require.main === module) {
  const result = runVideoCheck();
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

module.exports = { runVideoCheck };

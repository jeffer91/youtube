const fs = require("fs");
const path = require("path");
const { getFolderPath } = require("../02_archivos_y_datos/YTPathService");
const { ensureUserDataFolders } = require("../02_archivos_y_datos/YTFolderService");
const { exists } = require("../02_archivos_y_datos/YTFileService");
const { loadCurrentVideo } = require("../03_carga_y_preview_video/YTVideoStore");
const { testFfmpegAvailable } = require("./YTFfmpegMini");
const { getRenderOutputPath, loadLastRender } = require("./YTRenderModel");

const REQUIRED_FILES = ["YTRenderMini.js", "YTFfmpegMini.js", "YTRenderService.js", "YTRenderIpc.js", "YTRenderModel.js", "YTRenderProgress.js", "YTRenderCheck.js", "YTRenderManual.md"];

function createCheck(id, label, ok, message, recommendation = "") {
  return { id, label, status: ok ? "OK" : "ERROR", ok, message, recommendation };
}

async function runRenderCheck() {
  const checks = [];
  const errors = [];
  const warnings = [];

  try {
    ensureUserDataFolders();

    REQUIRED_FILES.forEach((fileName) => {
      const ok = fs.existsSync(path.join(__dirname, fileName));
      checks.push(createCheck("file:" + fileName, "Archivo " + fileName, ok, ok ? "Archivo encontrado." : "Archivo faltante."));
      if (!ok) errors.push("Falta archivo del Bloque 04: " + fileName);
    });

    const exportsPath = getFolderPath("exports");
    const exportsOk = exists(exportsPath);
    checks.push(createCheck("folder:exports", "Carpeta de exportación", exportsOk, exportsOk ? "La carpeta user_data/exports existe." : "No existe user_data/exports."));
    if (!exportsOk) errors.push("No existe user_data/exports.");

    const ffmpeg = await testFfmpegAvailable();
    checks.push(createCheck("ffmpeg:available", "FFmpeg disponible", ffmpeg.ok, ffmpeg.ok ? "FFmpeg disponible: " + ffmpeg.ffmpegPath : "FFmpeg no está disponible.", "Ejecutar npm install."));
    if (!ffmpeg.ok) errors.push("FFmpeg no está disponible.");

    const videoSession = loadCurrentVideo();
    const currentVideo = videoSession.currentVideo || {};
    const hasVideo = Boolean(currentVideo.path);
    checks.push({ id: "video:current", label: "Video cargado para render", status: hasVideo ? "OK" : "WARNING", ok: true, message: hasVideo ? (currentVideo.name || currentVideo.path) : "Todavía no hay video cargado.", recommendation: hasVideo ? "Sin acción requerida." : "Seleccionar un MP4 antes de renderizar." });
    if (!hasVideo) warnings.push("No hay video cargado. Esto es normal si aún no se seleccionó un video.");
    else if (!exists(currentVideo.path)) {
      errors.push("El video cargado ya no existe en la ruta guardada.");
      checks.push(createCheck("video:path-exists", "Ruta de video existe", false, "El archivo de video no existe.", "Seleccionar nuevamente el video."));
    } else {
      checks.push(createCheck("video:path-exists", "Ruta de video existe", true, "El archivo de video existe."));
    }

    const outputPath = getRenderOutputPath();
    checks.push(createCheck("render:output-path", "Ruta de salida", Boolean(outputPath), outputPath ? "Salida preparada: " + outputPath : "No se pudo crear ruta de salida."));

    const lastRender = loadLastRender();
    checks.push({ id: "render:last-session", label: "Última sesión de render", status: lastRender.ok ? "OK" : "WARNING", ok: true, message: lastRender.ok ? "La sesión de render puede leerse." : "No se pudo leer sesión de render.", recommendation: "Ejecutar un render de prueba." });

    const status = errors.length ? "ERROR" : warnings.length ? "WARNING" : "OK";
    return { ok: status !== "ERROR", approved: status === "OK", block: "04_render_minimo", title: "Bloque 04 — Render mínimo", status, summary: status === "OK" ? "FFmpeg y render mínimo están listos." : status === "WARNING" ? "Funciona, pero falta cargar video o ejecutar render." : "Hay errores que corregir.", checks, errors, warnings, ffmpeg, outputPath, lastRender, timestamp: new Date().toISOString() };
  } catch (error) {
    return { ok: false, approved: false, block: "04_render_minimo", title: "Bloque 04 — Render mínimo", status: "ERROR", summary: "Error crítico ejecutando diagnóstico de render.", checks, errors: [...errors, error.message || String(error)], warnings, timestamp: new Date().toISOString() };
  }
}

if (require.main === module) {
  runRenderCheck().then((result) => { console.log(JSON.stringify(result, null, 2)); if (!result.ok) process.exitCode = 1; }).catch((error) => { console.error(error); process.exitCode = 1; });
}

module.exports = { runRenderCheck };

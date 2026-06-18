const path = require("path");

const BLOCKS = [
  { id: "00_base_app", title: "Bloque 00 — Base app", modulePath: "00_base_app/YTBaseCheck.js", functionName: "runBaseCheck" },
  { id: "01_interfaz_principal", title: "Bloque 01 — Interfaz principal", browserOnly: true, message: "El diagnóstico visual del Bloque 01 se ejecuta desde la interfaz." },
  { id: "02_archivos_y_datos", title: "Bloque 02 — Archivos y datos", modulePath: "02_archivos_y_datos/YTFilesCheck.js", functionName: "runFilesCheck" },
  { id: "03_carga_y_preview_video", title: "Bloque 03 — Carga y preview de video", modulePath: "03_carga_y_preview_video/YTVideoCheck.js", functionName: "runVideoCheck" },
  { id: "04_render_minimo", title: "Bloque 04 — Render mínimo", modulePath: "04_render_minimo/YTRenderCheck.js", functionName: "runRenderCheck" },
  { id: "06_proyectos", title: "Bloque 06 — Proyectos", modulePath: "06_proyectos/YTProjectCheck.js", functionName: "runProjectCheck" },
  { id: "07_transcripcion_y_analisis", title: "Bloque 07 — Transcripción y análisis", modulePath: "07_transcripcion_y_analisis/YTTranscriptCheck.js", functionName: "runTranscriptCheck" },
  { id: "08_clips_y_timeline", title: "Bloque 08 — Clips y timeline", modulePath: "08_clips_y_timeline/YTClipCheck.js", functionName: "runClipCheck" },
  { id: "09_subtitulos_capas_y_estilos", title: "Bloque 09 — Subtítulos, capas y estilos", modulePath: "09_subtitulos_capas_y_estilos/YTStyleCheck.js", functionName: "runStyleCheck" },
  { id: "10_biblioteca_y_recursos", title: "Bloque 10 — Biblioteca y recursos", modulePath: "10_biblioteca_y_recursos/YTLibraryCheck.js", functionName: "runLibraryCheck" },
  { id: "11_exportacion_y_publicacion", title: "Bloque 11 — Exportación y publicación", modulePath: "11_exportacion_y_publicacion/YTExportCheck.js", functionName: "runExportCheck" }
];

function getDiagnosticBlocks() { return BLOCKS.map((block) => ({ ...block })); }
function createSkippedResult(block) { return { ok: true, approved: false, block: block.id, title: block.title, status: "WARNING", summary: block.message || "Diagnóstico omitido.", checks: [{ id: `${block.id}:browser-only`, label: block.title, status: "WARNING", ok: true, message: block.message || "Se ejecuta desde la interfaz.", recommendation: "Usar el botón Diagnóstico dentro de la app." }], errors: [], warnings: [block.message || "Diagnóstico omitido."], timestamp: new Date().toISOString() }; }
function createErrorResult(block, error) { const message = error instanceof Error ? error.message : String(error); return { ok: false, approved: false, block: block.id, title: block.title, status: "ERROR", summary: `No se pudo ejecutar el diagnóstico de ${block.id}.`, checks: [{ id: `${block.id}:load-error`, label: block.title, status: "ERROR", ok: false, message, recommendation: `Revisar ${block.modulePath || "archivo del bloque"}.` }], errors: [message], warnings: [], timestamp: new Date().toISOString() }; }
async function runRegisteredBlockCheck(block) { if (block.browserOnly) return createSkippedResult(block); try { const loaded = require(path.join(__dirname, "..", block.modulePath)); const fn = loaded[block.functionName]; if (typeof fn !== "function") throw new Error(`No existe la función ${block.functionName}.`); return await fn(); } catch (error) { return createErrorResult(block, error); } }

module.exports = { getDiagnosticBlocks, runRegisteredBlockCheck };

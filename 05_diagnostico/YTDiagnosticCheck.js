const fs = require("fs");
const path = require("path");
const { ensureUserDataFolders } = require("../02_archivos_y_datos/YTFolderService");
const { getFolderPath } = require("../02_archivos_y_datos/YTPathService");

const REQUIRED_FILES = [
  "YTDiagnosticRegistry.js",
  "YTDiagnosticService.js",
  "YTDiagnosticReport.js",
  "YTDiagnosticIpc.js",
  "YTDiagnosticCheck.js",
  "YTDiagnosticManual.md"
];

function createCheck(id, label, ok, message, recommendation = "") {
  return { id, label, status: ok ? "OK" : "ERROR", ok, message, recommendation };
}

function runDiagnosticCheck() {
  const checks = [];
  const errors = [];
  const warnings = [];

  try {
    REQUIRED_FILES.forEach((fileName) => {
      const ok = fs.existsSync(path.join(__dirname, fileName));
      checks.push(createCheck("file:" + fileName, "Archivo " + fileName, ok, ok ? "Archivo encontrado." : "Archivo faltante.", "Crear " + fileName + " dentro de 05_diagnostico."));
      if (!ok) errors.push("Falta archivo del Bloque 05: " + fileName);
    });

    ensureUserDataFolders();
    const logsPath = getFolderPath("logs");
    const logsOk = fs.existsSync(logsPath);
    checks.push(createCheck("logs:folder", "Carpeta de reportes", logsOk, logsOk ? "La carpeta user_data/logs existe." : "No existe user_data/logs.", "Ejecutar diagnóstico del Bloque 02."));
    if (!logsOk) errors.push("No existe user_data/logs.");

    const status = errors.length ? "ERROR" : warnings.length ? "WARNING" : "OK";
    return { ok: status !== "ERROR", approved: status === "OK", block: "05_diagnostico", title: "Bloque 05 — Diagnóstico", status, summary: status === "OK" ? "El Bloque 05 está correcto: diagnóstico y reportes disponibles." : "El Bloque 05 tiene errores que deben corregirse.", checks, errors, warnings, timestamp: new Date().toISOString() };
  } catch (error) {
    return { ok: false, approved: false, block: "05_diagnostico", title: "Bloque 05 — Diagnóstico", status: "ERROR", summary: "Error crítico ejecutando diagnóstico del Bloque 05.", checks, errors: [...errors, error.message || String(error)], warnings, timestamp: new Date().toISOString() };
  }
}

if (require.main === module) {
  const result = runDiagnosticCheck();
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

module.exports = { runDiagnosticCheck };

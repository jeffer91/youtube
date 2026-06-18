const fs = require("fs");
const { ensureLibraryStorage, getLibraryFolderPath, getLibrarySessionPath, createCheckResourceFile, importResourcePaths, loadLibrarySession } = require("./YTLibraryStore");
const { scanResourceFolder } = require("./YTResourceScanner");

function checkItem(id, label, ok, message, recommendation = "") {
  return { id, label, status: ok ? "OK" : "ERROR", ok: Boolean(ok), message, recommendation };
}

function runLibraryCheck() {
  const errors = [];
  const warnings = [];
  const checks = [];

  let storage = null;
  let sampleImport = null;
  let scanned = null;
  let session = null;

  try {
    storage = ensureLibraryStorage();
    const samplePath = createCheckResourceFile();
    sampleImport = importResourcePaths([samplePath], { copyToLibrary: false, source: "check", tags: ["check", "biblioteca"] });
    scanned = scanResourceFolder(getLibraryFolderPath(), { supportedOnly: true, source: "check_scan", tags: ["check"] });
    session = loadLibrarySession();
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  checks.push(checkItem("library-folder", "Carpeta de biblioteca", storage && fs.existsSync(getLibraryFolderPath()), "Debe existir user_data/media/library.", "Ejecuta npm run check:library."));
  checks.push(checkItem("library-session", "Sesión de biblioteca", storage && fs.existsSync(getLibrarySessionPath()), "Debe existir user_data/database/YTLibrarySession.json.", "Revisar permisos de escritura."));
  checks.push(checkItem("sample-import", "Importación de recurso de prueba", sampleImport && sampleImport.count >= 1, "Debe poder registrar un recurso de prueba.", "Revisar YTLibraryStore.js."));
  checks.push(checkItem("scan-library", "Escaneo de biblioteca", scanned && Array.isArray(scanned.resources), "Debe poder escanear recursos compatibles.", "Revisar YTResourceScanner.js."));
  checks.push(checkItem("session-load", "Lectura de biblioteca", session && session.ok && session.currentLibrary, "Debe cargar la biblioteca actual.", "Revisar YTLibrarySession.json."));

  if (session && session.currentLibrary && !session.currentLibrary.count) warnings.push("La biblioteca está vacía; importa audio, imágenes, videos o subtítulos para usarla en proyectos reales.");
  checks.forEach((item) => { if (!item.ok) errors.push(item.label + ": " + item.message); });

  const status = errors.length ? "ERROR" : warnings.length ? "WARNING" : "OK";
  return {
    ok: status !== "ERROR",
    approved: status === "OK" || status === "WARNING",
    block: "10_biblioteca_y_recursos",
    title: "Bloque 10 — Biblioteca y recursos",
    status,
    summary: status === "ERROR" ? "La biblioteca tiene errores críticos." : status === "WARNING" ? "La biblioteca funciona con advertencias." : "La biblioteca funciona correctamente.",
    checks,
    errors,
    warnings,
    libraryFolder: getLibraryFolderPath(),
    sessionPath: getLibrarySessionPath(),
    library: session ? session.currentLibrary : null,
    timestamp: new Date().toISOString()
  };
}

if (require.main === module) {
  const result = runLibraryCheck();
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

module.exports = { runLibraryCheck };

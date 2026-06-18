const { getUserDataDir, getUserDataFolders, getTempFilePath } = require("./YTPathService");
const { ensureUserDataFolders, getFolderStatus } = require("./YTFolderService");
const { exists, writeTextFile, readTextFile, deleteFileIfExists } = require("./YTFileService");
const { ensureDataStore } = require("./YTDataStore");
const { createDataBackup } = require("./YTDataBackup");

function check(id, label, ok, message) {
  return { id, label, status: ok ? "OK" : "ERROR", ok, message };
}

function runFilesCheck() {
  const checks = [];
  const errors = [];
  const warnings = [];

  try {
    ensureUserDataFolders();

    const rootOk = exists(getUserDataDir());
    checks.push(check("user_data", "Carpeta user_data", rootOk, rootOk ? "Existe user_data." : "No existe user_data."));
    if (!rootOk) errors.push("No existe user_data.");

    Object.entries(getUserDataFolders()).forEach(([name, folderPath]) => {
      const ok = exists(folderPath);
      checks.push(check("folder_" + name, "Carpeta " + name, ok, ok ? "Existe." : "Falta."));
      if (!ok) errors.push("Falta carpeta " + name);
    });

    const testPath = getTempFilePath("YTWriteTest.txt");
    writeTextFile(testPath, "AutoEdit Studio write test");
    const read = readTextFile(testPath);
    const writeOk = read.ok && read.content.includes("AutoEdit Studio");
    checks.push(check("write_test", "Prueba de escritura", writeOk, writeOk ? "Escritura OK." : "No se pudo escribir."));
    if (!writeOk) errors.push("No se pudo escribir en temp.");
    deleteFileIfExists(testPath);

    const data = ensureDataStore();
    checks.push(check("data_json", "Base JSON local", data.ok, data.ok ? "YTData.json listo." : "YTData.json con error."));
    if (!data.ok) errors.push("No se pudo crear YTData.json.");

    const backup = createDataBackup("check");
    checks.push(check("backup", "Backup", backup.ok, backup.ok ? "Backup creado." : "Backup falló."));
    if (!backup.ok) errors.push("No se pudo crear backup.");

    const status = errors.length ? "ERROR" : warnings.length ? "WARNING" : "OK";

    return {
      ok: status !== "ERROR",
      approved: status === "OK",
      block: "02_archivos_y_datos",
      title: "Bloque 02 — Archivos y datos",
      status,
      summary: status === "OK" ? "user_data, JSON y backup funcionan." : "Hay errores en archivos y datos.",
      checks,
      errors,
      warnings,
      paths: getFolderStatus(),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      ok: false,
      approved: false,
      block: "02_archivos_y_datos",
      title: "Bloque 02 — Archivos y datos",
      status: "ERROR",
      summary: "Error ejecutando diagnóstico.",
      checks,
      errors: [error.message],
      warnings,
      timestamp: new Date().toISOString()
    };
  }
}

if (require.main === module) {
  const result = runFilesCheck();
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

module.exports = { runFilesCheck };

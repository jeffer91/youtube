const fs = require("fs");
const path = require("path");
const { getFolderPath } = require("../02_archivos_y_datos/YTPathService");
const { ensureFolder, ensureUserDataFolders } = require("../02_archivos_y_datos/YTFolderService");
const { writeJsonFile, writeTextFile, getFileInfo } = require("../02_archivos_y_datos/YTFileService");

function createSafeTimestamp() {
  return new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
}

function getDiagnosticLogsDir() {
  ensureUserDataFolders();
  const logsDir = getFolderPath("logs");
  ensureFolder(logsDir);
  return logsDir;
}

function formatReportAsText(report) {
  const lines = [];
  lines.push("AutoEdit Studio — Reporte de diagnóstico");
  lines.push("========================================");
  lines.push("Estado: " + report.status);
  lines.push("Resumen: " + report.summary);
  lines.push("Fecha: " + report.timestamp);
  lines.push("");
  lines.push("Bloques revisados");
  lines.push("-----------------");
  (report.results || []).forEach((item) => lines.push(item.block + " | " + item.status + " | " + item.summary));
  lines.push("");
  lines.push("Errores");
  lines.push("-------");
  (report.errors || []).length ? report.errors.forEach((error) => lines.push("- " + error)) : lines.push("Sin errores.");
  lines.push("");
  lines.push("Advertencias");
  lines.push("------------");
  (report.warnings || []).length ? report.warnings.forEach((warning) => lines.push("- " + warning)) : lines.push("Sin advertencias.");
  lines.push("");
  lines.push("Checks");
  lines.push("------");
  (report.checks || []).forEach((check) => lines.push((check.status || "-") + " | " + (check.label || check.id) + " | " + (check.message || "")));
  return lines.join("\n");
}

function saveDiagnosticReport(report) {
  const logsDir = getDiagnosticLogsDir();
  const baseName = "YTDiagnostic_" + createSafeTimestamp();
  const jsonPath = path.join(logsDir, baseName + ".json");
  const txtPath = path.join(logsDir, baseName + ".txt");
  writeJsonFile(jsonPath, report);
  writeTextFile(txtPath, formatReportAsText(report));
  return { ok: true, status: "OK", jsonPath, txtPath, jsonFile: getFileInfo(jsonPath), txtFile: getFileInfo(txtPath), message: "Reporte de diagnóstico guardado correctamente." };
}

function listDiagnosticReports() {
  const logsDir = getDiagnosticLogsDir();
  const reports = fs.readdirSync(logsDir)
    .filter((fileName) => fileName.startsWith("YTDiagnostic_"))
    .map((fileName) => getFileInfo(path.join(logsDir, fileName)))
    .filter((item) => item.ok)
    .sort((a, b) => String(b.modifiedAt).localeCompare(String(a.modifiedAt)));
  return { ok: true, status: "OK", logsDir, reports };
}

module.exports = { getDiagnosticLogsDir, formatReportAsText, saveDiagnosticReport, listDiagnosticReports };

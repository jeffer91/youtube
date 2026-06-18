const fs = require("fs");
const path = require("path");
const { getFolderPath } = require("./YTPathService");
const { ensureFolder, ensureUserDataFolders } = require("./YTFolderService");
const { ensureDataStore, getDataFilePath } = require("./YTDataStore");
const { getFileInfo } = require("./YTFileService");

function stamp() {
  return new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
}

function createDataBackup(label = "manual") {
  ensureUserDataFolders();
  ensureDataStore();

  const backupDir = getFolderPath("backups");
  ensureFolder(backupDir);

  const safeLabel = String(label || "manual").replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");
  const target = path.join(backupDir, "YTData_" + safeLabel + "_" + stamp() + ".json");

  fs.copyFileSync(getDataFilePath(), target);

  return { ok: true, source: getDataFilePath(), backup: target, file: getFileInfo(target) };
}

function listBackups() {
  const backupDir = getFolderPath("backups");
  ensureFolder(backupDir);
  const backups = fs.readdirSync(backupDir)
    .filter((name) => name.toLowerCase().endsWith(".json"))
    .map((name) => getFileInfo(path.join(backupDir, name)));
  return { ok: true, backups };
}

module.exports = { createDataBackup, listBackups };

const fs = require("fs");
const path = require("path");
const { ensureFolder } = require("./YTFolderService");

function exists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (_error) {
    return false;
  }
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return (bytes / Math.pow(1024, index)).toFixed(index ? 2 : 0) + " " + units[index];
}

function getFileInfo(filePath) {
  if (!exists(filePath)) return { ok: false, exists: false, path: filePath };
  const stats = fs.statSync(filePath);
  return {
    ok: true,
    exists: true,
    path: filePath,
    name: path.basename(filePath),
    extension: path.extname(filePath).toLowerCase(),
    sizeBytes: stats.size,
    size: formatBytes(stats.size),
    modifiedAt: stats.mtime.toISOString()
  };
}

function writeTextFile(filePath, content) {
  ensureFolder(path.dirname(filePath));
  fs.writeFileSync(filePath, String(content || ""), "utf8");
  return getFileInfo(filePath);
}

function readTextFile(filePath) {
  if (!exists(filePath)) return { ok: false, content: "" };
  return { ok: true, content: fs.readFileSync(filePath, "utf8") };
}

function writeJsonFile(filePath, data) {
  return writeTextFile(filePath, JSON.stringify(data, null, 2));
}

function readJsonFile(filePath, fallback = null) {
  if (!exists(filePath)) return { ok: true, exists: false, data: fallback };
  try {
    return { ok: true, exists: true, data: JSON.parse(fs.readFileSync(filePath, "utf8")) };
  } catch (error) {
    return { ok: false, exists: true, data: fallback, error: error.message };
  }
}

function deleteFileIfExists(filePath) {
  if (!exists(filePath)) return { ok: true, deleted: false, path: filePath };
  fs.rmSync(filePath, { force: true, recursive: true });
  return { ok: true, deleted: true, path: filePath };
}

module.exports = {
  exists,
  formatBytes,
  getFileInfo,
  writeTextFile,
  readTextFile,
  writeJsonFile,
  readJsonFile,
  deleteFileIfExists
};

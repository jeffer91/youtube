const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const USER_DATA_DIR = path.join(ROOT_DIR, "user_data");
const FOLDER_NAMES = ["projects", "media", "temp", "exports", "backups", "database", "logs", "cache"];

function getRootDir() {
  return ROOT_DIR;
}

function getUserDataDir() {
  return USER_DATA_DIR;
}

function getUserDataFolders() {
  const folders = {};
  FOLDER_NAMES.forEach((name) => {
    folders[name] = path.join(USER_DATA_DIR, name);
  });
  return folders;
}

function getFolderPath(name) {
  const folders = getUserDataFolders();
  if (!folders[name]) throw new Error("Carpeta no reconocida: " + name);
  return folders[name];
}

function getDatabaseFilePath(fileName = "YTData.json") {
  return path.join(getFolderPath("database"), fileName);
}

function getTempFilePath(fileName) {
  return path.join(getFolderPath("temp"), fileName);
}

function getBackupFilePath(fileName) {
  return path.join(getFolderPath("backups"), fileName);
}

function getExportFilePath(fileName) {
  return path.join(getFolderPath("exports"), fileName);
}

function getPathSummary() {
  return {
    rootDir: ROOT_DIR,
    userDataDir: USER_DATA_DIR,
    folders: getUserDataFolders(),
    databaseFile: getDatabaseFilePath("YTData.json")
  };
}

module.exports = {
  FOLDER_NAMES,
  getRootDir,
  getUserDataDir,
  getUserDataFolders,
  getFolderPath,
  getDatabaseFilePath,
  getTempFilePath,
  getBackupFilePath,
  getExportFilePath,
  getPathSummary
};

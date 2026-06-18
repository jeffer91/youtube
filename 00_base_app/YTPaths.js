const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const BASE_APP_DIR = path.join(ROOT_DIR, "00_base_app");
const INTERFACE_DIR = path.join(ROOT_DIR, "01_interfaz_principal");
const BASE_SCREEN_PATH = path.join(BASE_APP_DIR, "YTBaseScreen.html");
const INTERFACE_SCREEN_PATH = path.join(INTERFACE_DIR, "YTIndex.html");

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (_error) {
    return false;
  }
}

function getRootPath() {
  return ROOT_DIR;
}

function getBaseAppPath() {
  return BASE_APP_DIR;
}

function getConfigPath() {
  return path.join(ROOT_DIR, "YTConfig.json");
}

function getBuilderPath() {
  return path.join(ROOT_DIR, "YTBuilder.json");
}

function getPreferredHtmlEntry() {
  if (fileExists(INTERFACE_SCREEN_PATH)) return INTERFACE_SCREEN_PATH;
  return BASE_SCREEN_PATH;
}

module.exports = {
  fileExists,
  getRootPath,
  getBaseAppPath,
  getConfigPath,
  getBuilderPath,
  getPreferredHtmlEntry
};

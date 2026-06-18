const { getDatabaseFilePath } = require("./YTPathService");
const { ensureUserDataFolders } = require("./YTFolderService");
const { exists, readJsonFile, writeJsonFile } = require("./YTFileService");
const { createDefaultData, createLogEntry } = require("./YTDataModel");

function getDataFilePath() {
  return getDatabaseFilePath("YTData.json");
}

function ensureDataStore() {
  ensureUserDataFolders();
  const filePath = getDataFilePath();

  if (!exists(filePath)) {
    const data = createDefaultData();
    writeJsonFile(filePath, data);
    return { ok: true, created: true, path: filePath, data };
  }

  const result = readJsonFile(filePath, createDefaultData());
  return { ok: result.ok, created: false, path: filePath, data: result.data, error: result.error || null };
}

function loadData() {
  return ensureDataStore();
}

function saveData(data) {
  ensureUserDataFolders();
  const payload = { ...createDefaultData(), ...(data || {}), updatedAt: new Date().toISOString() };
  writeJsonFile(getDataFilePath(), payload);
  return { ok: true, path: getDataFilePath(), data: payload };
}

function appendLog(type, message, extra = {}) {
  const current = loadData().data || createDefaultData();
  current.logs = [createLogEntry(type, message, extra), ...(current.logs || [])].slice(0, 200);
  return saveData(current);
}

module.exports = { getDataFilePath, ensureDataStore, loadData, saveData, appendLog };

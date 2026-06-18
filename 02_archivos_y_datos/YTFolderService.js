const fs = require("fs");
const { getUserDataDir, getUserDataFolders } = require("./YTPathService");

function ensureFolder(folderPath) {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    return { ok: true, path: folderPath, created: true, existed: false };
  }
  return { ok: true, path: folderPath, created: false, existed: true };
}

function ensureUserDataFolders() {
  const root = ensureFolder(getUserDataDir());
  const folders = Object.entries(getUserDataFolders()).map(([name, folderPath]) => ({
    name,
    ...ensureFolder(folderPath)
  }));
  return { ok: true, root, folders };
}

function getFolderStatus() {
  const rootExists = fs.existsSync(getUserDataDir());
  const folders = Object.entries(getUserDataFolders()).map(([name, folderPath]) => {
    const exists = fs.existsSync(folderPath);
    return { name, path: folderPath, exists, status: exists ? "OK" : "ERROR" };
  });
  return {
    ok: rootExists && folders.every((item) => item.exists),
    root: { path: getUserDataDir(), exists: rootExists, status: rootExists ? "OK" : "ERROR" },
    folders
  };
}

module.exports = { ensureFolder, ensureUserDataFolders, getFolderStatus };

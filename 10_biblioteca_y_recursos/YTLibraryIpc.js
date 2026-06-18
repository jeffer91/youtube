function registerLibraryIpc({ safeHandle, getMainWindow }) {
  if (typeof safeHandle !== "function") throw new Error("registerLibraryIpc necesita safeHandle.");

  safeHandle("YT_LIBRARY_GET_CURRENT", async () => require("./YTLibraryService").getCurrentLibrary());
  safeHandle("YT_LIBRARY_SELECT_RESOURCES", async (_event, payload = {}) => {
    const win = typeof getMainWindow === "function" ? getMainWindow() : null;
    return require("./YTLibraryService").selectResourcesDialog(win, payload || {});
  });
  safeHandle("YT_LIBRARY_IMPORT_PATHS", async (_event, payload = {}) => require("./YTLibraryService").importPaths(payload.paths || [], payload || {}));
  safeHandle("YT_LIBRARY_SCAN_DEFAULT", async (_event, payload = {}) => require("./YTLibraryService").scanDefaultLibrary(payload || {}));
  safeHandle("YT_LIBRARY_SCAN_FOLDER", async (_event, payload = {}) => require("./YTLibraryService").scanExternalFolder(payload.folderPath || "", payload || {}));
  safeHandle("YT_LIBRARY_ATTACH_PROJECT", async (_event, payload = {}) => require("./YTLibraryService").attachLibraryToCurrentProject(payload || {}));
  safeHandle("YT_LIBRARY_CHECK", async () => require("./YTLibraryCheck").runLibraryCheck());
}

module.exports = { registerLibraryIpc };

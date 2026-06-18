const { dialog } = require("electron");
const { getLibraryFolderPath, loadLibrarySession, importResourcePaths, addResources, saveProjectResourcesForCurrentProject } = require("./YTLibraryStore");
const { scanResourceFolder } = require("./YTResourceScanner");

function getCurrentLibrary() {
  const session = loadLibrarySession();
  return {
    ok: session.ok,
    status: session.status,
    library: session.currentLibrary,
    currentProjectResources: session.currentProjectResources,
    sessionPath: session.path,
    message: session.currentLibrary.count ? "Biblioteca cargada." : "Biblioteca vacía. Importa recursos para usarlos en el proyecto."
  };
}

async function selectResourcesDialog(win, options = {}) {
  const result = await dialog.showOpenDialog(win || null, {
    title: "Seleccionar recursos para AutoEdit Studio",
    properties: ["openFile", "multiSelections"],
    filters: [
      { name: "Recursos compatibles", extensions: ["mp3", "wav", "m4a", "aac", "ogg", "flac", "png", "jpg", "jpeg", "webp", "gif", "bmp", "mp4", "mov", "mkv", "webm", "avi", "srt", "vtt", "ass", "txt", "md", "json"] },
      { name: "Audio", extensions: ["mp3", "wav", "m4a", "aac", "ogg", "flac"] },
      { name: "Imágenes", extensions: ["png", "jpg", "jpeg", "webp", "gif", "bmp"] },
      { name: "Videos", extensions: ["mp4", "mov", "mkv", "webm", "avi"] },
      { name: "Textos y subtítulos", extensions: ["srt", "vtt", "ass", "txt", "md", "json"] }
    ]
  });

  if (result.canceled || !result.filePaths.length) {
    return { ok: false, status: "CANCELLED", message: "No se seleccionaron recursos." };
  }

  return importResourcePaths(result.filePaths, {
    copyToLibrary: options.copyToLibrary !== false,
    source: "dialog",
    tags: options.tags || ["manual"]
  });
}

function importPaths(paths = [], options = {}) {
  return importResourcePaths(paths, {
    copyToLibrary: options.copyToLibrary !== false,
    source: options.source || "manual",
    tags: options.tags || ["manual"]
  });
}

function scanDefaultLibrary(options = {}) {
  const scanned = scanResourceFolder(getLibraryFolderPath(), { supportedOnly: options.supportedOnly !== false, source: "library_scan", tags: ["biblioteca"] });
  if (!scanned.resources.length) {
    return { ...scanned, ok: true, status: "WARNING", message: "La biblioteca local no tiene recursos compatibles todavía.", library: loadLibrarySession().currentLibrary };
  }
  const saved = addResources(scanned.resources);
  return { ...scanned, ok: true, status: scanned.errors.length ? "WARNING" : "OK", library: saved.currentLibrary };
}

function scanExternalFolder(folderPath, options = {}) {
  const scanned = scanResourceFolder(folderPath, { supportedOnly: options.supportedOnly !== false, source: options.source || "folder_scan", tags: options.tags || ["escaneado"] });
  if (!scanned.resources.length) return { ...scanned, library: loadLibrarySession().currentLibrary };
  const saved = addResources(scanned.resources);
  return { ...scanned, library: saved.currentLibrary };
}

function attachLibraryToCurrentProject(options = {}) {
  const session = loadLibrarySession();
  const resources = Array.isArray(options.resources) && options.resources.length ? options.resources : session.currentLibrary.resources || [];
  return saveProjectResourcesForCurrentProject(resources);
}

module.exports = {
  getCurrentLibrary,
  selectResourcesDialog,
  importPaths,
  scanDefaultLibrary,
  scanExternalFolder,
  attachLibraryToCurrentProject
};

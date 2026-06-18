const fs = require("fs");
const path = require("path");
const { getFolderPath, getDatabaseFilePath } = require("../02_archivos_y_datos/YTPathService");
const { ensureUserDataFolders, ensureFolder } = require("../02_archivos_y_datos/YTFolderService");
const { exists, readJsonFile, writeJsonFile, getFileInfo, writeTextFile } = require("../02_archivos_y_datos/YTFileService");
const { getProjectFolderPath, loadCurrentProject } = require("../06_proyectos/YTProjectStore");
const { createResourceRecord, createLibraryIndex, createLibrarySession, cleanText } = require("./YTResourceModel");

function getLibrarySessionPath() {
  return getDatabaseFilePath("YTLibrarySession.json");
}

function getLibraryFolderPath() {
  return path.join(getFolderPath("media"), "library");
}

function getLibraryTypeFolderPath(type = "otros") {
  return path.join(getLibraryFolderPath(), cleanText(type, "otros").toLowerCase());
}

function getProjectResourcesPath(projectId) {
  return path.join(getProjectFolderPath(projectId), "YTProjectResources.json");
}

function ensureLibraryStorage() {
  ensureUserDataFolders();
  ensureFolder(getLibraryFolderPath());
  ["audio", "image", "video", "subtitle", "document", "unknown"].forEach((type) => ensureFolder(getLibraryTypeFolderPath(type)));
  if (!exists(getLibrarySessionPath())) writeJsonFile(getLibrarySessionPath(), createLibrarySession(createLibraryIndex([]), null));
  return { ok: true, status: "OK", libraryFolder: getLibraryFolderPath(), sessionPath: getLibrarySessionPath() };
}

function loadLibrarySession() {
  ensureLibraryStorage();
  const result = readJsonFile(getLibrarySessionPath(), createLibrarySession(createLibraryIndex([]), null));
  return {
    ok: result.ok,
    status: result.ok ? "OK" : "ERROR",
    path: getLibrarySessionPath(),
    session: result.data,
    currentLibrary: result.data.currentLibrary || createLibraryIndex([]),
    currentProjectResources: result.data.currentProjectResources || null,
    error: result.error || null
  };
}

function saveLibrarySession(index, currentProjectResources = null) {
  ensureLibraryStorage();
  const session = createLibrarySession(index || createLibraryIndex([]), currentProjectResources || loadLibrarySession().currentProjectResources);
  writeJsonFile(getLibrarySessionPath(), session);
  return { ok: true, status: "OK", path: getLibrarySessionPath(), session, currentLibrary: session.currentLibrary, currentProjectResources: session.currentProjectResources };
}

function uniqueResources(resources = []) {
  const map = new Map();
  resources.forEach((resource) => {
    if (!resource || !resource.path) return;
    map.set(path.normalize(resource.path).toLowerCase(), resource);
  });
  return [...map.values()].sort((a, b) => String(a.type).localeCompare(String(b.type)) || String(a.name).localeCompare(String(b.name)));
}

function addResources(resources = [], options = {}) {
  ensureLibraryStorage();
  const session = loadLibrarySession();
  const current = Array.isArray(session.currentLibrary.resources) ? session.currentLibrary.resources : [];
  const incoming = Array.isArray(resources) ? resources : [];
  const merged = uniqueResources(options.replace ? incoming : [...incoming, ...current]);
  const index = createLibraryIndex(merged, { libraryName: options.libraryName || session.currentLibrary.libraryName || "Biblioteca AutoEdit", createdAt: session.currentLibrary.createdAt });
  return saveLibrarySession(index, session.currentProjectResources);
}

function safeFileName(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const base = path.basename(filePath, extension).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "recurso";
  return `${base}_${Date.now()}${extension}`;
}

function copyResourceToLibrary(sourcePath, options = {}) {
  ensureLibraryStorage();
  const originalPath = path.normalize(String(sourcePath || ""));
  if (!fs.existsSync(originalPath)) return { ok: false, status: "ERROR", message: "El archivo de recurso no existe.", sourcePath: originalPath };
  const tempRecord = createResourceRecord(originalPath, { source: options.source || "manual", tags: options.tags || [] });
  const targetFolder = getLibraryTypeFolderPath(tempRecord.type || "unknown");
  ensureFolder(targetFolder);
  const targetPath = path.join(targetFolder, safeFileName(originalPath));
  fs.copyFileSync(originalPath, targetPath);
  const record = createResourceRecord(targetPath, { originalPath, source: options.source || "manual", imported: true, tags: options.tags || [tempRecord.type] });
  return { ok: true, status: "OK", resource: record, sourcePath: originalPath, targetPath, file: getFileInfo(targetPath) };
}

function importResourcePaths(filePaths = [], options = {}) {
  ensureLibraryStorage();
  const paths = Array.isArray(filePaths) ? filePaths : [];
  if (!paths.length) return { ok: false, status: "WARNING", message: "No se recibieron recursos para importar.", imported: [], errors: [] };
  const imported = [];
  const errors = [];

  paths.forEach((filePath, index) => {
    try {
      if (options.copyToLibrary === false) {
        const record = createResourceRecord(filePath, { index, source: options.source || "manual", tags: options.tags || [], imported: false });
        imported.push(record);
      } else {
        const copy = copyResourceToLibrary(filePath, options);
        if (copy.ok) imported.push(copy.resource);
        else errors.push(copy);
      }
    } catch (error) {
      errors.push({ ok: false, status: "ERROR", path: filePath, message: error.message });
    }
  });

  const saved = addResources(imported);
  return { ok: errors.length === 0 && imported.length > 0, status: errors.length ? "WARNING" : "OK", imported, errors, count: imported.length, library: saved.currentLibrary };
}

function saveProjectResourcesForCurrentProject(resources = null) {
  ensureLibraryStorage();
  const current = loadCurrentProject();
  if (!current.currentProject || !current.currentProject.id) return { ok: false, status: "ERROR", message: "No hay proyecto actual. Primero crea o abre un proyecto." };
  const library = loadLibrarySession().currentLibrary;
  const selectedResources = Array.isArray(resources) ? resources : library.resources || [];
  const projectFolder = getProjectFolderPath(current.currentProject.id);
  ensureFolder(projectFolder);
  const payload = {
    app: "AutoEdit Studio",
    block: "10_biblioteca_y_recursos",
    projectId: current.currentProject.id,
    projectName: current.currentProject.name || "Proyecto",
    status: selectedResources.length ? "READY" : "EMPTY",
    count: selectedResources.length,
    resources: selectedResources,
    updatedAt: new Date().toISOString()
  };
  const filePath = getProjectResourcesPath(current.currentProject.id);
  writeJsonFile(filePath, payload);
  saveLibrarySession(library, payload);
  return { ok: true, status: "OK", projectResources: payload, projectResourcesPath: filePath, file: getFileInfo(filePath) };
}

function createCheckResourceFile() {
  ensureLibraryStorage();
  const checkFolder = path.join(getLibraryFolderPath(), "document");
  ensureFolder(checkFolder);
  const checkFile = path.join(checkFolder, "YTLibraryCheckSample.txt");
  writeTextFile(checkFile, "Recurso de prueba de AutoEdit Studio para validar la biblioteca.");
  return checkFile;
}

module.exports = {
  getLibrarySessionPath,
  getLibraryFolderPath,
  getLibraryTypeFolderPath,
  getProjectResourcesPath,
  ensureLibraryStorage,
  loadLibrarySession,
  saveLibrarySession,
  addResources,
  copyResourceToLibrary,
  importResourcePaths,
  saveProjectResourcesForCurrentProject,
  createCheckResourceFile
};

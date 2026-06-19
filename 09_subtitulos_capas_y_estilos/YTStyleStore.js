/*
Nombre completo: YTStyleStore.js
Ruta: 09_subtitulos_capas_y_estilos/YTStyleStore.js
Función o funciones:
  - Guardar subtítulos, capas, preset de estilo y recursos de temática por proyecto.
Se conecta con:
  - YTStyleModel.js
  - YTLayerService.js
  - YTProjectStore.js
*/

const path = require("path");
const { getDatabaseFilePath } = require("../02_archivos_y_datos/YTPathService");
const { ensureUserDataFolders, ensureFolder } = require("../02_archivos_y_datos/YTFolderService");
const { exists, readJsonFile, writeJsonFile, getFileInfo } = require("../02_archivos_y_datos/YTFileService");
const { getProjectFolderPath, loadCurrentProject } = require("../06_proyectos/YTProjectStore");
const { createStyleSession } = require("./YTStyleModel");

function getStyleSessionPath() { return getDatabaseFilePath("YTStyleSession.json"); }
function getProjectSubtitlesPath(projectId) { return path.join(getProjectFolderPath(projectId), "YTSubtitles.json"); }
function getProjectLayersPath(projectId) { return path.join(getProjectFolderPath(projectId), "YTLayers.json"); }
function getProjectStylePath(projectId) { return path.join(getProjectFolderPath(projectId), "YTStylePreset.json"); }
function getProjectThemeResourcesPath(projectId) { return path.join(getProjectFolderPath(projectId), "YTThemeResources.json"); }

function ensureStyleSession() {
  ensureUserDataFolders();
  if (!exists(getStyleSessionPath())) writeJsonFile(getStyleSessionPath(), createStyleSession(null, null, null));
  return { ok: true, status: "OK", path: getStyleSessionPath() };
}

function getCurrentProjectRequired() {
  const current = loadCurrentProject();
  if (!current.currentProject || !current.currentProject.id) return { ok: false, status: "ERROR", message: "No hay proyecto actual. Primero crea un proyecto.", currentProject: null };
  return { ok: true, status: "OK", currentProject: current.currentProject };
}

function loadStyleSession() {
  ensureStyleSession();
  const result = readJsonFile(getStyleSessionPath(), createStyleSession(null, null, null));
  return { ok: result.ok, status: result.ok ? "OK" : "ERROR", path: getStyleSessionPath(), currentSubtitles: result.data.currentSubtitles || null, currentLayers: result.data.currentLayers || null, currentStylePreset: result.data.currentStylePreset || null, themeResources: result.data.themeResources || null, session: result.data, error: result.error || null };
}

function saveStyleSession(subtitles, layers, preset, extras = {}) {
  ensureStyleSession();
  const current = loadStyleSession().session || createStyleSession(null, null, null);
  const session = createStyleSession(subtitles === undefined ? current.currentSubtitles : subtitles || null, layers === undefined ? current.currentLayers : layers || null, preset === undefined ? current.currentStylePreset : preset || null, { themeResources: extras.themeResources === undefined ? current.themeResources : extras.themeResources });
  writeJsonFile(getStyleSessionPath(), session);
  return { ok: true, status: "OK", path: getStyleSessionPath(), session };
}

function saveSubtitlesToProject(subtitlesCollection) {
  ensureStyleSession();
  const current = getCurrentProjectRequired();
  if (!current.ok) return current;
  const project = current.currentProject;
  ensureFolder(getProjectFolderPath(project.id));
  const payload = { ...subtitlesCollection, projectId: project.id, projectName: project.name, updatedAt: new Date().toISOString() };
  const subtitlesPath = getProjectSubtitlesPath(project.id);
  writeJsonFile(subtitlesPath, payload);
  const session = loadStyleSession();
  saveStyleSession(payload, session.currentLayers, session.currentStylePreset);
  return { ok: true, status: "OK", subtitles: payload, subtitlesPath, file: getFileInfo(subtitlesPath) };
}

function saveLayersToProject(layerCollection) {
  ensureStyleSession();
  const current = getCurrentProjectRequired();
  if (!current.ok) return current;
  const project = current.currentProject;
  ensureFolder(getProjectFolderPath(project.id));
  const payload = { ...layerCollection, projectId: project.id, projectName: project.name, updatedAt: new Date().toISOString() };
  const layersPath = getProjectLayersPath(project.id);
  writeJsonFile(layersPath, payload);
  const session = loadStyleSession();
  saveStyleSession(session.currentSubtitles, payload, session.currentStylePreset);
  return { ok: true, status: "OK", layers: payload, layersPath, file: getFileInfo(layersPath) };
}

function saveStylePresetToProject(stylePreset) {
  ensureStyleSession();
  const current = getCurrentProjectRequired();
  if (!current.ok) return current;
  const project = current.currentProject;
  ensureFolder(getProjectFolderPath(project.id));
  const payload = { ...stylePreset, projectId: project.id, projectName: project.name, updatedAt: new Date().toISOString() };
  const stylePath = getProjectStylePath(project.id);
  writeJsonFile(stylePath, payload);
  const session = loadStyleSession();
  saveStyleSession(session.currentSubtitles, session.currentLayers, payload);
  return { ok: true, status: "OK", stylePreset: payload, stylePath, file: getFileInfo(stylePath) };
}

function saveThemeResourcesToProject(themeResources) {
  ensureStyleSession();
  const current = getCurrentProjectRequired();
  if (!current.ok) return current;
  const project = current.currentProject;
  ensureFolder(getProjectFolderPath(project.id));
  const payload = { app: "AutoEdit Studio", block: "09_subtitulos_capas_y_estilos", projectId: project.id, projectName: project.name, themeResources: themeResources || null, updatedAt: new Date().toISOString() };
  const themeResourcesPath = getProjectThemeResourcesPath(project.id);
  writeJsonFile(themeResourcesPath, payload);
  const session = loadStyleSession();
  saveStyleSession(session.currentSubtitles, session.currentLayers, session.currentStylePreset, { themeResources: payload });
  return { ok: true, status: "OK", themeResources: payload, themeResourcesPath, file: getFileInfo(themeResourcesPath) };
}

function loadProjectSubtitles(projectId) {
  const subtitlesPath = getProjectSubtitlesPath(projectId);
  if (!exists(subtitlesPath)) return { ok: false, status: "EMPTY", projectId, subtitles: null, message: "El proyecto todavía no tiene subtítulos." };
  const result = readJsonFile(subtitlesPath, null);
  return { ok: result.ok, status: result.ok ? "OK" : "ERROR", projectId, subtitlesPath, subtitles: result.data, error: result.error || null };
}

function loadProjectLayers(projectId) {
  const layersPath = getProjectLayersPath(projectId);
  if (!exists(layersPath)) return { ok: false, status: "EMPTY", projectId, layers: null, message: "El proyecto todavía no tiene capas." };
  const result = readJsonFile(layersPath, null);
  return { ok: result.ok, status: result.ok ? "OK" : "ERROR", projectId, layersPath, layers: result.data, error: result.error || null };
}

function loadProjectStylePreset(projectId) {
  const stylePath = getProjectStylePath(projectId);
  if (!exists(stylePath)) return { ok: false, status: "EMPTY", projectId, stylePreset: null, message: "El proyecto todavía no tiene preset de estilo." };
  const result = readJsonFile(stylePath, null);
  return { ok: result.ok, status: result.ok ? "OK" : "ERROR", projectId, stylePath, stylePreset: result.data, error: result.error || null };
}

module.exports = { getStyleSessionPath, getProjectSubtitlesPath, getProjectLayersPath, getProjectStylePath, getProjectThemeResourcesPath, ensureStyleSession, getCurrentProjectRequired, loadStyleSession, saveStyleSession, saveSubtitlesToProject, saveLayersToProject, saveStylePresetToProject, saveThemeResourcesToProject, loadProjectSubtitles, loadProjectLayers, loadProjectStylePreset };

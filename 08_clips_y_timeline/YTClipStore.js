/*
Nombre completo: YTClipStore.js
Ruta: 08_clips_y_timeline/YTClipStore.js
Función o funciones:
  - Guardar clips, timeline, orden aprobado y clips descartados.
  - Mantener sesión local de clips.
Se conecta con:
  - YTClipModel.js
  - YTClipService.js
  - YTProjectStore.js
*/

const path = require("path");
const { getDatabaseFilePath } = require("../02_archivos_y_datos/YTPathService");
const { ensureUserDataFolders, ensureFolder } = require("../02_archivos_y_datos/YTFolderService");
const { exists, readJsonFile, writeJsonFile, getFileInfo } = require("../02_archivos_y_datos/YTFileService");
const { getProjectFolderPath, loadCurrentProject } = require("../06_proyectos/YTProjectStore");

function createClipSession(clips = null, timeline = null, extras = {}) {
  return { app: "AutoEdit Studio", block: "08_clips_y_timeline", currentClips: clips, currentTimeline: timeline, approvedOrder: extras.approvedOrder || null, discardedClips: extras.discardedClips || null, updatedAt: new Date().toISOString() };
}

function getClipSessionPath() { return getDatabaseFilePath("YTClipSession.json"); }
function getProjectClipsPath(projectId) { return path.join(getProjectFolderPath(projectId), "YTClips.json"); }
function getProjectTimelinePath(projectId) { return path.join(getProjectFolderPath(projectId), "YTTimeline.json"); }
function getProjectApprovedOrderPath(projectId) { return path.join(getProjectFolderPath(projectId), "YTApprovedOrder.json"); }
function getProjectDiscardedClipsPath(projectId) { return path.join(getProjectFolderPath(projectId), "YTDiscardedClips.json"); }

function ensureClipSession() {
  ensureUserDataFolders();
  if (!exists(getClipSessionPath())) writeJsonFile(getClipSessionPath(), createClipSession(null, null));
  return { ok: true, status: "OK", path: getClipSessionPath() };
}

function getCurrentProjectRequired() {
  const current = loadCurrentProject();
  if (!current.currentProject || !current.currentProject.id) return { ok: false, status: "ERROR", message: "No hay proyecto actual. Primero crea un proyecto.", currentProject: null };
  return { ok: true, status: "OK", currentProject: current.currentProject };
}

function loadClipSession() {
  ensureClipSession();
  const r = readJsonFile(getClipSessionPath(), createClipSession(null, null));
  return { ok: r.ok, status: r.ok ? "OK" : "ERROR", path: getClipSessionPath(), currentClips: r.data.currentClips || null, currentTimeline: r.data.currentTimeline || null, approvedOrder: r.data.approvedOrder || null, discardedClips: r.data.discardedClips || null, session: r.data, error: r.error || null };
}

function saveClipSession(clips, timeline, extras = {}) {
  ensureClipSession();
  const current = loadClipSession().session || createClipSession(null, null);
  const session = createClipSession(clips === undefined ? current.currentClips : clips, timeline === undefined ? current.currentTimeline : timeline, { approvedOrder: extras.approvedOrder === undefined ? current.approvedOrder : extras.approvedOrder, discardedClips: extras.discardedClips === undefined ? current.discardedClips : extras.discardedClips });
  writeJsonFile(getClipSessionPath(), session);
  return { ok: true, status: "OK", path: getClipSessionPath(), session };
}

function saveClipsToProject(clipsCollection) {
  ensureClipSession();
  const current = getCurrentProjectRequired();
  if (!current.ok) return current;
  const project = current.currentProject;
  ensureFolder(getProjectFolderPath(project.id));
  const payload = { ...clipsCollection, projectId: project.id, projectName: project.name, updatedAt: new Date().toISOString() };
  const clipsPath = getProjectClipsPath(project.id);
  writeJsonFile(clipsPath, payload);
  const session = loadClipSession();
  saveClipSession(payload, session.currentTimeline || null);
  return { ok: true, status: "OK", clips: payload, clipsPath, file: getFileInfo(clipsPath) };
}

function saveTimelineToProject(timeline) {
  ensureClipSession();
  const current = getCurrentProjectRequired();
  if (!current.ok) return current;
  const project = current.currentProject;
  ensureFolder(getProjectFolderPath(project.id));
  const payload = { ...timeline, projectId: project.id, projectName: project.name, updatedAt: new Date().toISOString() };
  const timelinePath = getProjectTimelinePath(project.id);
  writeJsonFile(timelinePath, payload);
  const session = loadClipSession();
  saveClipSession(session.currentClips || null, payload);
  return { ok: true, status: "OK", timeline: payload, timelinePath, file: getFileInfo(timelinePath) };
}

function saveApprovedOrderToProject(approvedOrder = []) {
  ensureClipSession();
  const current = getCurrentProjectRequired();
  if (!current.ok) return current;
  const project = current.currentProject;
  ensureFolder(getProjectFolderPath(project.id));
  const payload = { app: "AutoEdit Studio", block: "08_clips_y_timeline", projectId: project.id, projectName: project.name, approvedOrder: Array.isArray(approvedOrder) ? approvedOrder : [], count: Array.isArray(approvedOrder) ? approvedOrder.length : 0, updatedAt: new Date().toISOString() };
  const approvedOrderPath = getProjectApprovedOrderPath(project.id);
  writeJsonFile(approvedOrderPath, payload);
  const session = loadClipSession();
  saveClipSession(session.currentClips || null, session.currentTimeline || null, { approvedOrder: payload });
  return { ok: true, status: "OK", approvedOrder: payload, approvedOrderPath, file: getFileInfo(approvedOrderPath) };
}

function saveDiscardedClipsToProject(discardedClips = []) {
  ensureClipSession();
  const current = getCurrentProjectRequired();
  if (!current.ok) return current;
  const project = current.currentProject;
  ensureFolder(getProjectFolderPath(project.id));
  const payload = { app: "AutoEdit Studio", block: "08_clips_y_timeline", projectId: project.id, projectName: project.name, discardedClips: Array.isArray(discardedClips) ? discardedClips : [], count: Array.isArray(discardedClips) ? discardedClips.length : 0, updatedAt: new Date().toISOString() };
  const discardedClipsPath = getProjectDiscardedClipsPath(project.id);
  writeJsonFile(discardedClipsPath, payload);
  const session = loadClipSession();
  saveClipSession(session.currentClips || null, session.currentTimeline || null, { discardedClips: payload });
  return { ok: true, status: "OK", discardedClips: payload, discardedClipsPath, file: getFileInfo(discardedClipsPath) };
}

function loadProjectClips(projectId) {
  const clipsPath = getProjectClipsPath(projectId);
  if (!exists(clipsPath)) return { ok: false, status: "EMPTY", projectId, clips: null, message: "El proyecto todavía no tiene clips." };
  const r = readJsonFile(clipsPath, null);
  return { ok: r.ok, status: r.ok ? "OK" : "ERROR", projectId, clipsPath, clips: r.data, error: r.error || null };
}

function loadProjectTimeline(projectId) {
  const timelinePath = getProjectTimelinePath(projectId);
  if (!exists(timelinePath)) return { ok: false, status: "EMPTY", projectId, timeline: null, message: "El proyecto todavía no tiene timeline." };
  const r = readJsonFile(timelinePath, null);
  return { ok: r.ok, status: r.ok ? "OK" : "ERROR", projectId, timelinePath, timeline: r.data, error: r.error || null };
}

module.exports = { createClipSession, getClipSessionPath, getProjectClipsPath, getProjectTimelinePath, getProjectApprovedOrderPath, getProjectDiscardedClipsPath, ensureClipSession, getCurrentProjectRequired, loadClipSession, saveClipSession, saveClipsToProject, saveTimelineToProject, saveApprovedOrderToProject, saveDiscardedClipsToProject, loadProjectClips, loadProjectTimeline };

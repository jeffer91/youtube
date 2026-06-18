/*
  Nombre completo: YTProjectService.js
  Ruta: 06_proyectos/YTProjectService.js
  Función o funciones:
    - Crear proyectos por nombre sin exigir video inicial.
    - Mantener compatibilidad con creación de proyecto desde video actual.
    - Guardar cambios del proyecto actual durante el flujo maestro.
  Se conecta con:
    - 06_proyectos/YTProjectModel.js
    - 06_proyectos/YTProjectStore.js
    - 03_carga_y_preview_video/YTVideoStore.js
    - 12_flujo_maestro/YTWorkflowService.js
*/

const { loadCurrentVideo, loadMaterialSession } = require("../03_carga_y_preview_video/YTVideoStore");
const { createProjectRecord, sanitizeProjectName } = require("./YTProjectModel");
const {
  ensureProjectStorage,
  saveProject,
  loadProject,
  listProjects,
  saveCurrentProject,
  loadCurrentProject
} = require("./YTProjectStore");

function createProjectByName(options = {}) {
  ensureProjectStorage();
  const name = sanitizeProjectName(options.name || options.projectName || "Proyecto AutoEdit");
  const project = createProjectRecord({
    name,
    notes: options.notes || "",
    source: options.source || "manual",
    status: options.status || "ACTIVE",
    mediaMode: "EMPTY"
  });
  const saved = saveProject(project);
  const current = saveCurrentProject(saved.project);
  return {
    ok: true,
    status: "OK",
    message: "Proyecto creado correctamente. Ahora puedes cargar uno o varios videos.",
    project: saved.project,
    projectFolder: saved.projectFolder,
    projectFile: saved.projectFile,
    currentProject: current.currentProject
  };
}

function createProjectFromCurrentVideo(options = {}) {
  ensureProjectStorage();
  const videoSession = loadCurrentVideo();
  const materialSession = loadMaterialSession();
  const currentVideo = videoSession.currentVideo || materialSession.primaryVideo || {};

  if (!currentVideo.path) {
    return {
      ok: false,
      status: "ERROR",
      message: "No hay video cargado. Puedes crear un proyecto por nombre o cargar material primero.",
      currentVideo
    };
  }

  const project = createProjectRecord({
    name: sanitizeProjectName(options.name || currentVideo.name || "Proyecto de video"),
    video: currentVideo,
    primaryVideo: currentVideo,
    mediaItems: materialSession.mediaItems && materialSession.mediaItems.length ? materialSession.mediaItems : [currentVideo],
    mediaMode: materialSession.mediaMode || "SINGLE_LONG_VIDEO",
    notes: options.notes || "",
    source: "current_video"
  });
  const saved = saveProject(project);
  const current = saveCurrentProject(saved.project);
  return {
    ok: true,
    status: "OK",
    message: "Proyecto creado correctamente desde el video actual.",
    project: saved.project,
    projectFolder: saved.projectFolder,
    projectFile: saved.projectFile,
    currentProject: current.currentProject
  };
}

function openProject(projectId) {
  if (!projectId) return { ok: false, status: "ERROR", message: "No se recibió projectId." };
  const loaded = loadProject(projectId);
  if (!loaded.ok) return loaded;
  saveCurrentProject(loaded.project);
  return { ok: true, status: "OK", message: "Proyecto abierto correctamente.", project: loaded.project };
}

function getCurrentProject() {
  return loadCurrentProject();
}

function getProjects() {
  return listProjects();
}

function saveCurrentProjectChanges(changes = {}) {
  const current = loadCurrentProject();
  if (!current.currentProject || !current.currentProject.id) {
    return { ok: false, status: "ERROR", message: "No hay proyecto actual para guardar." };
  }
  const updated = {
    ...current.currentProject,
    ...changes,
    updatedAt: new Date().toISOString()
  };
  const saved = saveProject(updated);
  saveCurrentProject(saved.project);
  return { ok: true, status: "OK", message: "Proyecto actual actualizado.", project: saved.project };
}

module.exports = {
  createProjectByName,
  createProjectFromCurrentVideo,
  openProject,
  getCurrentProject,
  getProjects,
  saveCurrentProjectChanges
};

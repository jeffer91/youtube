/*
  Nombre completo: YTWorkflowStore.js
  Ruta: 12_flujo_maestro/YTWorkflowStore.js
  Función o funciones:
    - Guardar y recuperar la sesión del flujo maestro en YTWorkflowSession.json.
    - Guardar una copia del flujo dentro de la carpeta del proyecto actual.
    - Permitir que la app recupere la etapa correcta al reiniciar.
  Se conecta con:
    - 12_flujo_maestro/YTWorkflowModel.js
    - 12_flujo_maestro/YTWorkflowService.js
    - 02_archivos_y_datos/YTPathService.js
    - 02_archivos_y_datos/YTFolderService.js
    - 02_archivos_y_datos/YTFileService.js
    - 06_proyectos/YTProjectStore.js
*/

const path = require("path");
const { getDatabaseFilePath } = require("../02_archivos_y_datos/YTPathService");
const { ensureUserDataFolders, ensureFolder } = require("../02_archivos_y_datos/YTFolderService");
const { exists, readJsonFile, writeJsonFile, deleteFileIfExists, getFileInfo } = require("../02_archivos_y_datos/YTFileService");
const { getProjectFolderPath, loadCurrentProject } = require("../06_proyectos/YTProjectStore");
const { createEmptyWorkflowSession, createWorkflowSession, patchWorkflowSession } = require("./YTWorkflowModel");

function getWorkflowSessionPath() {
  return getDatabaseFilePath("YTWorkflowSession.json");
}

function getProjectWorkflowPath(projectId) {
  return path.join(getProjectFolderPath(projectId), "YTWorkflowSession.json");
}

function ensureWorkflowStorage() {
  ensureUserDataFolders();
  const sessionPath = getWorkflowSessionPath();
  if (!exists(sessionPath)) writeJsonFile(sessionPath, createEmptyWorkflowSession());
  return { ok: true, status: "OK", sessionPath };
}

function loadWorkflowSession() {
  ensureWorkflowStorage();
  const fallback = createEmptyWorkflowSession();
  const result = readJsonFile(getWorkflowSessionPath(), fallback);
  const session = createWorkflowSession(result.data || fallback);
  return {
    ok: result.ok,
    status: result.ok ? "OK" : "ERROR",
    path: getWorkflowSessionPath(),
    session,
    error: result.error || null
  };
}

function saveWorkflowSession(sessionData = {}) {
  ensureWorkflowStorage();
  const session = createWorkflowSession(sessionData);
  writeJsonFile(getWorkflowSessionPath(), session);
  return {
    ok: true,
    status: "OK",
    path: getWorkflowSessionPath(),
    session,
    file: getFileInfo(getWorkflowSessionPath())
  };
}

function patchCurrentWorkflow(patch = {}) {
  const current = loadWorkflowSession().session;
  return saveWorkflowSession(patchWorkflowSession(current, patch));
}

function saveProjectWorkflow(sessionData = {}) {
  const session = createWorkflowSession(sessionData);
  if (!session.projectId) {
    return { ok: false, status: "ERROR", message: "No se recibió projectId para guardar el flujo del proyecto.", session };
  }
  const projectFolder = getProjectFolderPath(session.projectId);
  const workflowPath = getProjectWorkflowPath(session.projectId);
  ensureFolder(projectFolder);
  writeJsonFile(workflowPath, session);
  return {
    ok: true,
    status: "OK",
    path: workflowPath,
    session,
    file: getFileInfo(workflowPath)
  };
}

function loadProjectWorkflow(projectId) {
  if (!projectId) return { ok: false, status: "ERROR", message: "No se recibió projectId.", session: null };
  const workflowPath = getProjectWorkflowPath(projectId);
  if (!exists(workflowPath)) {
    return { ok: false, status: "EMPTY", message: "El proyecto todavía no tiene sesión de flujo.", path: workflowPath, session: null };
  }
  const result = readJsonFile(workflowPath, null);
  return {
    ok: result.ok,
    status: result.ok ? "OK" : "ERROR",
    path: workflowPath,
    session: result.data ? createWorkflowSession(result.data) : null,
    error: result.error || null
  };
}

function saveWorkflowEverywhere(sessionData = {}) {
  const saved = saveWorkflowSession(sessionData);
  const projectSaved = saved.session.projectId ? saveProjectWorkflow(saved.session) : null;
  return {
    ...saved,
    projectWorkflow: projectSaved
  };
}

function loadWorkflowForCurrentProject() {
  const currentProjectSession = loadCurrentProject();
  const currentProject = currentProjectSession.currentProject || null;
  if (!currentProject || !currentProject.id) return loadWorkflowSession();
  const projectWorkflow = loadProjectWorkflow(currentProject.id);
  if (projectWorkflow.ok && projectWorkflow.session) {
    saveWorkflowSession(projectWorkflow.session);
    return { ok: true, status: "OK", path: projectWorkflow.path, session: projectWorkflow.session, source: "project" };
  }
  return loadWorkflowSession();
}

function clearWorkflowSession() {
  ensureUserDataFolders();
  const deleted = deleteFileIfExists(getWorkflowSessionPath());
  const empty = createEmptyWorkflowSession();
  writeJsonFile(getWorkflowSessionPath(), empty);
  return {
    ok: true,
    status: "OK",
    deleted,
    path: getWorkflowSessionPath(),
    session: empty,
    message: "Sesión de flujo reiniciada."
  };
}

module.exports = {
  getWorkflowSessionPath,
  getProjectWorkflowPath,
  ensureWorkflowStorage,
  loadWorkflowSession,
  saveWorkflowSession,
  patchCurrentWorkflow,
  saveProjectWorkflow,
  loadProjectWorkflow,
  saveWorkflowEverywhere,
  loadWorkflowForCurrentProject,
  clearWorkflowSession
};

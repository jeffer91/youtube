/*
Nombre completo: YTTranscriptStore.js
Ruta: 07_transcripcion_y_analisis/YTTranscriptStore.js
Función o funciones:
  - Guardar transcripción actual, análisis, transcripciones por video y transcripción organizada.
  - Mantener sesión local de transcripción.
Se conecta con:
  - YTTranscriptModel.js
  - YTTranscriptService.js
  - YTProjectStore.js
*/

const path = require("path");
const { getDatabaseFilePath } = require("../02_archivos_y_datos/YTPathService");
const { ensureUserDataFolders, ensureFolder } = require("../02_archivos_y_datos/YTFolderService");
const { exists, readJsonFile, writeJsonFile, getFileInfo } = require("../02_archivos_y_datos/YTFileService");
const { getProjectFolderPath, loadCurrentProject } = require("../06_proyectos/YTProjectStore");
const { createTranscriptSession } = require("./YTTranscriptModel");

function getTranscriptSessionPath() { return getDatabaseFilePath("YTTranscriptSession.json"); }
function getProjectTranscriptPath(projectId) { return path.join(getProjectFolderPath(projectId), "YTTranscript.json"); }
function getProjectAnalysisPath(projectId) { return path.join(getProjectFolderPath(projectId), "YTAnalysis.json"); }
function getProjectTranscriptsByVideoPath(projectId) { return path.join(getProjectFolderPath(projectId), "YTTranscriptsByVideo.json"); }
function getProjectOrganizedTranscriptPath(projectId) { return path.join(getProjectFolderPath(projectId), "YTOrganizedTranscript.json"); }

function ensureTranscriptSession() {
  ensureUserDataFolders();
  if (!exists(getTranscriptSessionPath())) writeJsonFile(getTranscriptSessionPath(), createTranscriptSession(null, null));
  return { ok: true, status: "OK", path: getTranscriptSessionPath() };
}

function getCurrentProjectRequired() {
  const current = loadCurrentProject();
  if (!current.currentProject || !current.currentProject.id) return { ok: false, status: "ERROR", message: "No hay proyecto actual. Primero crea un proyecto.", currentProject: null };
  return { ok: true, status: "OK", currentProject: current.currentProject };
}

function loadTranscriptSession() {
  ensureTranscriptSession();
  const r = readJsonFile(getTranscriptSessionPath(), createTranscriptSession(null, null));
  return { ok: r.ok, status: r.ok ? "OK" : "ERROR", path: getTranscriptSessionPath(), currentTranscript: r.data.currentTranscript || null, currentAnalysis: r.data.currentAnalysis || null, transcriptsByVideo: r.data.transcriptsByVideo || null, organizedTranscript: r.data.organizedTranscript || null, session: r.data, error: r.error || null };
}

function writeSessionPatch(patch = {}) {
  const current = loadTranscriptSession().session || createTranscriptSession(null, null);
  const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
  writeJsonFile(getTranscriptSessionPath(), next);
  return next;
}

function saveTranscriptToProject(transcript) {
  ensureTranscriptSession();
  const current = getCurrentProjectRequired();
  if (!current.ok) return current;
  const project = current.currentProject;
  ensureFolder(getProjectFolderPath(project.id));
  const payload = { ...transcript, projectId: project.id, projectName: project.name, updatedAt: new Date().toISOString() };
  const transcriptPath = getProjectTranscriptPath(project.id);
  writeJsonFile(transcriptPath, payload);
  const session = writeSessionPatch({ currentTranscript: payload });
  return { ok: true, status: "OK", transcript: payload, transcriptPath, file: getFileInfo(transcriptPath), session };
}

function saveAnalysisToProject(analysis) {
  ensureTranscriptSession();
  const current = getCurrentProjectRequired();
  if (!current.ok) return current;
  const project = current.currentProject;
  ensureFolder(getProjectFolderPath(project.id));
  const payload = { ...analysis, projectId: project.id, projectName: project.name, updatedAt: new Date().toISOString() };
  const analysisPath = getProjectAnalysisPath(project.id);
  writeJsonFile(analysisPath, payload);
  const session = writeSessionPatch({ currentAnalysis: payload });
  return { ok: true, status: "OK", analysis: payload, analysisPath, file: getFileInfo(analysisPath), session };
}

function saveTranscriptsByVideoToProject(collection) {
  ensureTranscriptSession();
  const current = getCurrentProjectRequired();
  if (!current.ok) return current;
  const project = current.currentProject;
  ensureFolder(getProjectFolderPath(project.id));
  const payload = { ...collection, projectId: project.id, projectName: project.name, updatedAt: new Date().toISOString() };
  const transcriptsByVideoPath = getProjectTranscriptsByVideoPath(project.id);
  writeJsonFile(transcriptsByVideoPath, payload);
  const session = writeSessionPatch({ transcriptsByVideo: payload });
  return { ok: true, status: "OK", transcriptsByVideo: payload, transcriptsByVideoPath, file: getFileInfo(transcriptsByVideoPath), session };
}

function saveOrganizedTranscriptToProject(organizedTranscript) {
  ensureTranscriptSession();
  const current = getCurrentProjectRequired();
  if (!current.ok) return current;
  const project = current.currentProject;
  ensureFolder(getProjectFolderPath(project.id));
  const payload = { ...organizedTranscript, projectId: project.id, projectName: project.name, updatedAt: new Date().toISOString() };
  const organizedTranscriptPath = getProjectOrganizedTranscriptPath(project.id);
  writeJsonFile(organizedTranscriptPath, payload);
  const session = writeSessionPatch({ organizedTranscript: payload });
  return { ok: true, status: "OK", organizedTranscript: payload, organizedTranscriptPath, file: getFileInfo(organizedTranscriptPath), session };
}

function loadProjectTranscript(projectId) {
  const transcriptPath = getProjectTranscriptPath(projectId);
  if (!exists(transcriptPath)) return { ok: false, status: "EMPTY", projectId, transcript: null, message: "El proyecto todavía no tiene transcripción." };
  const r = readJsonFile(transcriptPath, null);
  return { ok: r.ok, status: r.ok ? "OK" : "ERROR", projectId, transcriptPath, transcript: r.data, error: r.error || null };
}

function loadProjectAnalysis(projectId) {
  const analysisPath = getProjectAnalysisPath(projectId);
  if (!exists(analysisPath)) return { ok: false, status: "EMPTY", projectId, analysis: null, message: "El proyecto todavía no tiene análisis." };
  const r = readJsonFile(analysisPath, null);
  return { ok: r.ok, status: r.ok ? "OK" : "ERROR", projectId, analysisPath, analysis: r.data, error: r.error || null };
}

function loadProjectTranscriptsByVideo(projectId) {
  const transcriptsByVideoPath = getProjectTranscriptsByVideoPath(projectId);
  if (!exists(transcriptsByVideoPath)) return { ok: false, status: "EMPTY", projectId, transcriptsByVideo: null, message: "El proyecto todavía no tiene transcripciones por video." };
  const r = readJsonFile(transcriptsByVideoPath, null);
  return { ok: r.ok, status: r.ok ? "OK" : "ERROR", projectId, transcriptsByVideoPath, transcriptsByVideo: r.data, error: r.error || null };
}

function loadProjectOrganizedTranscript(projectId) {
  const organizedTranscriptPath = getProjectOrganizedTranscriptPath(projectId);
  if (!exists(organizedTranscriptPath)) return { ok: false, status: "EMPTY", projectId, organizedTranscript: null, message: "El proyecto todavía no tiene transcripción organizada." };
  const r = readJsonFile(organizedTranscriptPath, null);
  return { ok: r.ok, status: r.ok ? "OK" : "ERROR", projectId, organizedTranscriptPath, organizedTranscript: r.data, error: r.error || null };
}

module.exports = { getTranscriptSessionPath, getProjectTranscriptPath, getProjectAnalysisPath, getProjectTranscriptsByVideoPath, getProjectOrganizedTranscriptPath, ensureTranscriptSession, getCurrentProjectRequired, loadTranscriptSession, saveTranscriptToProject, saveAnalysisToProject, saveTranscriptsByVideoToProject, saveOrganizedTranscriptToProject, loadProjectTranscript, loadProjectAnalysis, loadProjectTranscriptsByVideo, loadProjectOrganizedTranscript };

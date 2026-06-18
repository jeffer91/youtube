const path = require("path");
const { getFolderPath, getDatabaseFilePath } = require("../02_archivos_y_datos/YTPathService");
const { ensureUserDataFolders, ensureFolder } = require("../02_archivos_y_datos/YTFolderService");
const { exists, readJsonFile, writeJsonFile, getFileInfo } = require("../02_archivos_y_datos/YTFileService");
const { loadCurrentProject, getProjectFolderPath } = require("../06_proyectos/YTProjectStore");
const { loadCurrentVideo } = require("../03_carga_y_preview_video/YTVideoStore");
const { createExportPlan, createPublicationPackage } = require("./YTExportModel");

function getFinalExportsRoot() { return path.join(getFolderPath("exports"), "final"); }
function getPlatformExportFolder(platformKey = "youtube") { return path.join(getFinalExportsRoot(), platformKey); }
function getExportSessionPath() { return getDatabaseFilePath("YTExportSession.json"); }
function getProjectExportPlanPath(projectId) { return path.join(getProjectFolderPath(projectId), "YTExportPlan.json"); }
function getProjectPublicationPackagePath(projectId) { return path.join(getProjectFolderPath(projectId), "YTPublicationPackage.json"); }

function createEmptyExportSession() {
  return { app: "AutoEdit Studio", block: "11_exportacion_y_publicacion", currentPlan: null, currentPublicationPackage: null, lastRender: null, updatedAt: new Date().toISOString() };
}

function ensureExportStorage() {
  ensureUserDataFolders();
  ensureFolder(getFinalExportsRoot());
  ["youtube", "shorts", "reels", "square"].forEach((platform) => ensureFolder(getPlatformExportFolder(platform)));
  if (!exists(getExportSessionPath())) writeJsonFile(getExportSessionPath(), createEmptyExportSession());
  return { ok: true, status: "OK", finalExportsRoot: getFinalExportsRoot(), sessionPath: getExportSessionPath() };
}

function loadExportSession() {
  ensureExportStorage();
  const fallback = createEmptyExportSession();
  const result = readJsonFile(getExportSessionPath(), fallback);
  const session = result.data || fallback;
  return { ok: result.ok, status: result.ok ? "OK" : "ERROR", path: getExportSessionPath(), session, currentPlan: session.currentPlan || null, currentPublicationPackage: session.currentPublicationPackage || null, lastRender: session.lastRender || null, error: result.error || null };
}

function saveExportSession(changes = {}) {
  ensureExportStorage();
  const current = loadExportSession().session;
  const session = { ...current, ...changes, app: "AutoEdit Studio", block: "11_exportacion_y_publicacion", updatedAt: new Date().toISOString() };
  writeJsonFile(getExportSessionPath(), session);
  return { ok: true, status: "OK", path: getExportSessionPath(), session, currentPlan: session.currentPlan || null, currentPublicationPackage: session.currentPublicationPackage || null, lastRender: session.lastRender || null };
}

function getCurrentProjectAndVideo() {
  ensureExportStorage();
  const projectSession = loadCurrentProject();
  const videoSession = loadCurrentVideo();
  const project = projectSession.currentProject || null;
  const video = videoSession.currentVideo || null;
  if (!video || !video.path) return { ok: false, status: "ERROR", message: "No hay video cargado. Primero selecciona un video.", project, video };
  return { ok: true, status: "OK", project: project || { id: "", name: video.name || "Proyecto sin nombre", status: "TEMP" }, video };
}

function saveExportPlan(plan) {
  ensureExportStorage();
  saveExportSession({ currentPlan: plan });
  let projectPlanPath = null;
  let projectFile = null;
  if (plan && plan.projectId) {
    projectPlanPath = getProjectExportPlanPath(plan.projectId);
    writeJsonFile(projectPlanPath, plan);
    projectFile = getFileInfo(projectPlanPath);
  }
  return { ok: true, status: "OK", plan, sessionPath: getExportSessionPath(), projectPlanPath, projectFile };
}

function createPlanFromCurrentData(options = {}) {
  const current = getCurrentProjectAndVideo();
  if (!current.ok) return current;
  const plan = createExportPlan({ project: current.project, inputVideo: current.video, outputFolder: getFinalExportsRoot(), platforms: options.platforms });
  return saveExportPlan(plan);
}

function saveRenderResult(renderResult) {
  const session = loadExportSession().session;
  const plan = session.currentPlan || null;
  if (plan && renderResult && renderResult.item) {
    const items = Array.isArray(plan.items) ? plan.items : [];
    plan.items = items.map((item) => item.platformKey !== renderResult.item.platformKey ? item : { ...item, status: renderResult.ok ? "OK" : "ERROR", message: renderResult.message, outputPath: renderResult.outputPath || item.outputPath, output: renderResult.output || null, updatedAt: new Date().toISOString() });
    plan.status = plan.items.some((item) => item.status === "OK") ? "PARTIAL" : plan.status;
    plan.updatedAt = new Date().toISOString();
  }
  return saveExportSession({ currentPlan: plan, lastRender: renderResult });
}

function savePublicationPackage(publicationPackage) {
  ensureExportStorage();
  saveExportSession({ currentPublicationPackage: publicationPackage });
  let packagePath = null;
  let packageFile = null;
  if (publicationPackage && publicationPackage.projectId) {
    packagePath = getProjectPublicationPackagePath(publicationPackage.projectId);
    writeJsonFile(packagePath, publicationPackage);
    packageFile = getFileInfo(packagePath);
  }
  return { ok: true, status: "OK", publicationPackage, packagePath, packageFile, sessionPath: getExportSessionPath() };
}

function createPackageFromCurrentPlan(options = {}) {
  const session = loadExportSession();
  const plan = session.currentPlan;
  if (!plan) return { ok: false, status: "ERROR", message: "No hay plan de exportación. Primero crea el plan." };
  const exportedFiles = Array.isArray(plan.items) ? plan.items.filter((item) => item.status === "OK").map((item) => ({ platformKey: item.platformKey, platformName: item.platformName, outputPath: item.outputPath, format: item.format, width: item.width, height: item.height })) : [];
  const publicationPackage = createPublicationPackage({ plan, exportedFiles, title: options.title, description: options.description, tags: options.tags });
  return savePublicationPackage(publicationPackage);
}

module.exports = { getFinalExportsRoot, getPlatformExportFolder, getExportSessionPath, getProjectExportPlanPath, getProjectPublicationPackagePath, ensureExportStorage, loadExportSession, saveExportSession, getCurrentProjectAndVideo, saveExportPlan, createPlanFromCurrentData, saveRenderResult, savePublicationPackage, createPackageFromCurrentPlan };

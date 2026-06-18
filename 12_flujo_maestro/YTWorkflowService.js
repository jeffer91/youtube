/*
Nombre completo: YTWorkflowService.js
Ruta: 12_flujo_maestro/YTWorkflowService.js
Función o funciones:
  - Orquestar proyecto, material, temática, procesamiento, revisión, clips, exportación y paquete.
  - Preparar organización inteligente por temática con propuesta principal y alternativa.
Se conecta con:
  - YTWorkflowModel.js
  - YTWorkflowStore.js
  - 06_proyectos/YTProjectService.js
  - 03_carga_y_preview_video/YTVideoStore.js
  - 13_organizacion_inteligente/YTThemeService.js
  - 13_organizacion_inteligente/YTSmartOrganizerModel.js
*/

const {
  WORKFLOW_STEPS,
  WORKFLOW_STATUS,
  TASK_STATUS,
  MEDIA_MODE,
  EXPORT_TARGETS,
  getNextStep,
  updateTask,
  patchWorkflowSession,
  createWorkflowSession,
  createEmptyWorkflowSession,
  normalizeTheme,
  normalizeThemeMode,
  getThemeLabel,
  nowIso
} = require("./YTWorkflowModel");

const store = require("./YTWorkflowStore");
const projectService = require("../06_proyectos/YTProjectService");
const videoStore = require("../03_carga_y_preview_video/YTVideoStore");

function optionalRequire(modulePath) {
  try { return require(modulePath); } catch (_error) { return null; }
}

function ok(message, patch = {}) { return { ok: true, status: patch.status || "OK", message, ...patch }; }
function fail(message, patch = {}) { return { ok: false, status: "ERROR", message, ...patch }; }

function loadSession() {
  const loaded = store.loadWorkflowForCurrentProject ? store.loadWorkflowForCurrentProject() : null;
  return loaded && loaded.session ? loaded.session : createEmptyWorkflowSession();
}

function saveSession(session) {
  const saved = store.saveWorkflowEverywhere ? store.saveWorkflowEverywhere(session) : { session };
  return saved.session || saved.workflow || session;
}

function normalizeMediaItems(items = []) {
  return (Array.isArray(items) ? items : []).map((item, index) => ({
    id: item.id || item.videoId || item.path || `video_${index + 1}`,
    name: item.name || item.fileName || `Video ${index + 1}`,
    path: item.path || item.filePath || "",
    order: Number.isFinite(Number(item.order)) ? Number(item.order) : index + 1,
    duration: item.duration || item.durationLabel || "",
    durationSeconds: Number(item.durationSeconds || item.seconds || 0),
    size: item.size || item.sizeLabel || "",
    sizeBytes: Number(item.sizeBytes || item.bytes || 0),
    status: item.status || "READY"
  }));
}

function resolveMediaMode(items = [], requested = "") {
  if (requested && Object.values(MEDIA_MODE).includes(requested)) return requested;
  if (!items.length) return MEDIA_MODE.EMPTY;
  return items.length === 1 ? MEDIA_MODE.SINGLE_LONG_VIDEO : MEDIA_MODE.MULTI_SHORT_VIDEOS;
}

function progressFor(items, status = TASK_STATUS.PENDING, message = "Pendiente") {
  return items.map((video, index) => ({ id: video.id, name: video.name, index, status, percent: status === TASK_STATUS.OK ? 100 : 0, message }));
}

function placeholderTranscripts(items) {
  return items.map((video, index) => ({
    id: `transcript_${index + 1}`,
    videoId: video.id,
    videoName: video.name,
    status: "PENDING_REAL_TRANSCRIPTION",
    text: "",
    summary: "Transcripción pendiente de motor real.",
    wordCount: 0,
    createdAt: nowIso()
  }));
}

function placeholderVisual(items, seconds = 5) {
  return items.map((video, index) => ({
    id: `visual_${index + 1}`,
    videoId: video.id,
    videoName: video.name,
    status: "BASIC_DESCRIPTION",
    frameCaptureSeconds: seconds,
    summary: `Descripción visual preliminar. Capturas reales cada ${seconds} segundos se conectarán en el bloque visual.`,
    scenes: [{ second: 0, description: "Inicio del video pendiente de análisis real.", movement: "unknown", energy: "unknown" }],
    createdAt: nowIso()
  }));
}

function getCurrentWorkflow() {
  const loaded = store.loadWorkflowForCurrentProject ? store.loadWorkflowForCurrentProject() : { ok: true, session: loadSession() };
  return { ok: true, status: "OK", session: loaded.session, workflow: loaded.session, message: loaded.session && loaded.session.projectId ? "Flujo actual cargado." : "Todavía no hay flujo activo." };
}

function createWorkflowProject(options = {}) {
  const created = projectService.createProjectByName({ name: options.name || options.projectName || "Proyecto AutoEdit", notes: options.notes || "", source: "workflow" });
  if (!created.ok) return created;
  let session = createWorkflowSession({ projectId: created.project.id, projectName: created.project.name, currentStep: WORKFLOW_STEPS.LOAD_MATERIAL, workflowStatus: WORKFLOW_STATUS.DRAFT, mediaMode: MEDIA_MODE.EMPTY, message: "Proyecto creado. Ahora carga uno o varios videos." });
  session.tasks = updateTask(session.tasks, "project", { status: TASK_STATUS.OK, message: "Proyecto creado correctamente." });
  session = saveSession(session);
  if (projectService.saveCurrentProjectChanges) projectService.saveCurrentProjectChanges({ workflow: { id: session.id, currentStep: session.currentStep, workflowStatus: session.workflowStatus, updatedAt: session.updatedAt } });
  return ok("Proyecto creado desde el flujo maestro.", { project: created.project, projectFolder: created.projectFolder, workflow: session, session });
}

function ensureProject(options = {}) {
  const current = projectService.getCurrentProject ? projectService.getCurrentProject() : {};
  if (current.currentProject && current.currentProject.id) return ok("Proyecto actual encontrado.", { project: current.currentProject });
  return createWorkflowProject(options);
}

function attachMaterialToWorkflow(options = {}) {
  const ensured = ensureProject(options);
  if (!ensured.ok) return ensured;
  const project = ensured.project;
  const incoming = normalizeMediaItems(options.mediaItems || []);
  const materialResult = incoming.length
    ? videoStore.saveMaterialSession(incoming, { mediaMode: options.mediaMode, sourceType: options.sourceType || "manual" })
    : videoStore.saveMediaItemsFromPaths(options.filePaths || options.paths || [], { mediaMode: options.mediaMode, sourceType: options.sourceType || "dialog" });
  if (!materialResult.ok) return materialResult;
  const material = materialResult.session || materialResult.materialSession;
  const items = normalizeMediaItems(material.mediaItems || incoming);
  let session = patchWorkflowSession(loadSession(), { projectId: project.id, projectName: project.name, currentStep: WORKFLOW_STEPS.PROCESSING, workflowStatus: WORKFLOW_STATUS.READY, mediaMode: resolveMediaMode(items, material.mediaMode), mediaItems: items, primaryVideo: items[0] || null, videoProgress: progressFor(items), message: "Material cargado. Elige temática y procesa." });
  session.tasks = updateTask(session.tasks, "material", { status: TASK_STATUS.OK, message: `${items.length} video(s) cargado(s).` });
  session = saveSession(session);
  if (projectService.saveCurrentProjectChanges) projectService.saveCurrentProjectChanges({ mediaMode: session.mediaMode, mediaItems: items, primaryVideo: items[0] || null, workflow: { id: session.id, currentStep: session.currentStep, workflowStatus: session.workflowStatus, updatedAt: session.updatedAt } });
  return ok("Material cargado en el flujo maestro.", { project, material, mediaItems: items, mediaMode: session.mediaMode, workflow: session, session });
}

function setThemeForWorkflow(options = {}) {
  const theme = normalizeTheme(options.selectedTheme || options.theme || "generico");
  const themeMode = normalizeThemeMode(theme, options.selectedThemeMode || options.themeMode || "standard");
  const themeLabel = options.selectedThemeLabel || options.themeLabel || getThemeLabel(theme, themeMode);
  const themeService = optionalRequire("../13_organizacion_inteligente/YTThemeService");
  const resourcePlan = themeService && themeService.getThemeResourcePlan ? themeService.getThemeResourcePlan(theme, themeMode) : null;
  if (themeService && themeService.saveSelectedTheme) themeService.saveSelectedTheme({ theme, themeMode, themeLabel });
  let session = patchWorkflowSession(loadSession(), { selectedTheme: theme, selectedThemeMode: themeMode, selectedThemeLabel: themeLabel, themeResources: resourcePlan, message: `Temática lista: ${themeLabel}.` });
  session.tasks = updateTask(session.tasks, "theme", { status: TASK_STATUS.OK, message: `Temática seleccionada: ${themeLabel}.` });
  session = saveSession(session);
  return ok("Temática guardada en el flujo.", { workflow: session, session });
}

async function startAutomaticProcessing(options = {}) {
  const currentProject = projectService.getCurrentProject ? projectService.getCurrentProject().currentProject : null;
  const material = videoStore.loadMaterialSession ? videoStore.loadMaterialSession() : {};
  const items = normalizeMediaItems((options.mediaItems && options.mediaItems.length ? options.mediaItems : material.mediaItems) || []);
  if (!items.length) return fail("No hay videos cargados. Primero carga el material del proyecto.");

  const theme = normalizeTheme(options.selectedTheme || options.theme || "generico");
  const themeMode = normalizeThemeMode(theme, options.selectedThemeMode || options.themeMode || "standard");
  const themeLabel = options.selectedThemeLabel || options.themeLabel || getThemeLabel(theme, themeMode);
  const frameSeconds = Number(options.frameCaptureSeconds || 5);
  const themeService = optionalRequire("../13_organizacion_inteligente/YTThemeService");
  const smartModel = optionalRequire("../13_organizacion_inteligente/YTSmartOrganizerModel");
  const transcriptsByVideo = placeholderTranscripts(items);
  const visualDescriptions = placeholderVisual(items, frameSeconds);
  const proposal = smartModel && smartModel.createSmartProposal ? smartModel.createSmartProposal({ mediaItems: items, mediaMode: resolveMediaMode(items, options.mediaMode || material.mediaMode), selectedTheme: theme, selectedThemeMode: themeMode, selectedThemeLabel: themeLabel, transcriptsByVideo, visualDescriptions }) : { mainProposal: null, alternativeProposal: null, warnings: ["Smart model no disponible."] };
  const resourcePlan = themeService && themeService.getThemeResourcePlan ? themeService.getThemeResourcePlan(theme, themeMode) : null;

  let session = patchWorkflowSession(loadSession(), {
    projectId: currentProject ? currentProject.id : options.projectId || "",
    projectName: currentProject ? currentProject.name : options.projectName || "",
    currentStep: WORKFLOW_STEPS.REVIEW_LONG_VIDEO,
    workflowStatus: WORKFLOW_STATUS.WAITING_REVIEW,
    mediaMode: resolveMediaMode(items, options.mediaMode || material.mediaMode),
    mediaItems: items,
    primaryVideo: items[0] || null,
    selectedTheme: theme,
    selectedThemeMode: themeMode,
    selectedThemeLabel: themeLabel,
    themeResources: resourcePlan,
    smartProcessing: { enabled: true, status: "WAITING_REVIEW", currentVideoIndex: items.length, totalVideos: items.length, percent: 100, message: "Organización preliminar lista para revisión." },
    videoProgress: progressFor(items, TASK_STATUS.OK, "Procesado en modo preliminar."),
    transcriptsByVideo,
    visualDescriptions,
    organizedTranscript: { status: "PENDING_REAL_TRANSCRIPTION", summary: "Transcripción final organizada pendiente de motor real.", text: "" },
    smartProposal: proposal,
    mainProposal: proposal.mainProposal,
    alternativeProposal: proposal.alternativeProposal,
    approvedOrder: proposal.mainProposal && Array.isArray(proposal.mainProposal.order) ? proposal.mainProposal.order : [],
    warnings: proposal.warnings || [],
    message: "Organización inteligente preliminar lista. Revisa y aprueba."
  });
  session.tasks = updateTask(session.tasks, "theme", { status: TASK_STATUS.OK, message: `Temática aplicada: ${themeLabel}.` });
  session.tasks = updateTask(session.tasks, "transcript", { status: TASK_STATUS.WARNING, message: "Estructura de transcripción preparada. Falta motor real." });
  session.tasks = updateTask(session.tasks, "visual_analysis", { status: TASK_STATUS.WARNING, message: "Estructura visual preparada. Falta captura real." });
  session.tasks = updateTask(session.tasks, "gemini_organization", { status: TASK_STATUS.WARNING, message: "Gemini queda preparado para el siguiente bloque." });
  session.tasks = updateTask(session.tasks, "proposal_review", { status: TASK_STATUS.OK, message: "Propuesta lista para revisión." });
  session = saveSession(session);
  if (projectService.saveCurrentProjectChanges) projectService.saveCurrentProjectChanges({ workflow: { id: session.id, currentStep: session.currentStep, workflowStatus: session.workflowStatus, updatedAt: session.updatedAt }, smartProposal: proposal });
  return ok("Procesamiento preliminar completado.", { status: "WARNING", workflow: session, session, smartProposal: proposal, transcriptsByVideo, visualDescriptions, themeResources: resourcePlan });
}

function approveWorkflowReview(options = {}) {
  let session = patchWorkflowSession(loadSession(), { currentStep: options.nextStep || WORKFLOW_STEPS.SELECT_CLIPS, workflowStatus: WORKFLOW_STATUS.APPROVED, reviewStatus: "APPROVED", approvedOrder: Array.isArray(options.approvedOrder) ? options.approvedOrder : loadSession().approvedOrder, message: "Revisión aprobada. Continúa con selección de clips." });
  session.tasks = updateTask(session.tasks, "proposal_review", { status: TASK_STATUS.OK, message: "Revisión aprobada por el usuario." });
  session = saveSession(session);
  return ok("Revisión aprobada.", { workflow: session, session });
}

function approveCurrentStep(options = {}) { return approveWorkflowReview(options); }

function saveClipSelections(options = {}) {
  const selectedClips = Array.isArray(options.selectedClips) ? options.selectedClips : [];
  let session = patchWorkflowSession(loadSession(), { currentStep: WORKFLOW_STEPS.AUTO_EDIT, workflowStatus: WORKFLOW_STATUS.READY, clipSelections: selectedClips, message: selectedClips.length ? "Clips seleccionados." : "No se seleccionaron clips todavía." });
  session.tasks = updateTask(session.tasks, "clips", { status: selectedClips.length ? TASK_STATUS.OK : TASK_STATUS.WARNING, message: `${selectedClips.length} clip(s) seleccionado(s).` });
  session = saveSession(session);
  return ok("Clips confirmados.", { workflow: session, session, selectedClips });
}

function selectWorkflowClips(options = {}) { return saveClipSelections(options); }

function advanceWorkflowStep(step, options = {}) {
  let session = patchWorkflowSession(loadSession(), { currentStep: step || options.step || loadSession().currentStep, workflowStatus: options.status || WORKFLOW_STATUS.READY, message: options.message || "Flujo actualizado." });
  session = saveSession(session);
  return ok("Flujo actualizado.", { workflow: session, session });
}

function reorderWorkflowVideos(options = {}) {
  let session = patchWorkflowSession(loadSession(), { approvedOrder: Array.isArray(options.order) ? options.order : loadSession().approvedOrder, message: "Orden del video actualizado." });
  session = saveSession(session);
  return ok("Orden actualizado.", { workflow: session, session });
}

function exportAll(options = {}) {
  let session = patchWorkflowSession(loadSession(), { currentStep: WORKFLOW_STEPS.FINAL_PACKAGE, workflowStatus: WORKFLOW_STATUS.READY, exportTargets: Array.isArray(options.exportTargets) && options.exportTargets.length ? options.exportTargets : EXPORT_TARGETS, exportStatus: "READY", message: "Exportación preparada para todas las redes." });
  session.tasks = updateTask(session.tasks, "export", { status: TASK_STATUS.OK, message: "Plan de exportación preparado." });
  session = saveSession(session);
  return ok("Exportación preparada.", { workflow: session, session });
}

function createFinalPackage(options = {}) {
  let session = patchWorkflowSession(loadSession(), { currentStep: WORKFLOW_STEPS.FINAL_PACKAGE, workflowStatus: WORKFLOW_STATUS.COMPLETED, finalPackage: { status: "READY", createdAt: nowIso(), ...options }, message: "Paquete final preparado." });
  session.tasks = updateTask(session.tasks, "package", { status: TASK_STATUS.OK, message: "Paquete final creado." });
  session = saveSession(session);
  return ok("Paquete final preparado.", { workflow: session, session });
}

function resetWorkflow() {
  if (store.clearWorkflowSession) store.clearWorkflowSession();
  const session = saveSession(createEmptyWorkflowSession());
  return ok("Flujo reiniciado.", { workflow: session, session });
}

module.exports = {
  getCurrentWorkflow,
  createWorkflowProject,
  attachMaterialToWorkflow,
  setThemeForWorkflow,
  startAutomaticProcessing,
  approveWorkflowReview,
  approveCurrentStep,
  saveClipSelections,
  selectWorkflowClips,
  advanceWorkflowStep,
  reorderWorkflowVideos,
  exportAll,
  createFinalPackage,
  resetWorkflow,
  startProject: createWorkflowProject,
  attachMaterial: attachMaterialToWorkflow,
  processAutomatically: startAutomaticProcessing,
  approveReview: approveWorkflowReview,
  selectClips: selectWorkflowClips,
  advanceStep: advanceWorkflowStep,
  reorderVideos: reorderWorkflowVideos,
  reset: resetWorkflow,
  getCurrent: getCurrentWorkflow
};

/*
Nombre completo: YTWorkflowService.js
Ruta: 12_flujo_maestro/YTWorkflowService.js
Función o funciones:
  - Orquestar proyecto, material, temática, procesamiento, revisión, clips, exportación y paquete.
  - Procesar videos uno por uno con transcripción básica, descripciones visuales y organización Gemini/local.
Se conecta con:
  - YTWorkflowModel.js
  - YTWorkflowStore.js
  - YTProjectService.js
  - YTVideoStore.js
  - YTTranscriptionEngineService.js
  - YTFrameCaptureService.js
  - YTVisualDescriptionService.js
  - YTSmartOrganizerService.js
*/

const {
  WORKFLOW_STEPS,
  WORKFLOW_STATUS,
  TASK_STATUS,
  MEDIA_MODE,
  EXPORT_TARGETS,
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

async function processVideosOneByOne(items, options) {
  const transcriber = optionalRequire("../07_transcripcion_y_analisis/YTTranscriptionEngineService");
  const frameService = optionalRequire("../07_transcripcion_y_analisis/YTFrameCaptureService");
  const visualService = optionalRequire("../07_transcripcion_y_analisis/YTVisualDescriptionService");
  const transcriptsByVideo = [];
  const visualDescriptions = [];
  const frameCaptureSeconds = Number(options.frameCaptureSeconds || 5);

  for (let index = 0; index < items.length; index += 1) {
    const video = items[index];
    const transcript = transcriber && transcriber.transcribeVideoBasic
      ? await transcriber.transcribeVideoBasic(video, { index, language: options.language || "es" })
      : { videoId: video.id, videoName: video.name, text: "", summary: "Transcripción pendiente.", status: "PENDING_REAL_TRANSCRIPTION" };
    transcriptsByVideo.push(transcript);

    const frames = frameService && frameService.captureFramesForVideo
      ? await frameService.captureFramesForVideo(video, { intervalSeconds: frameCaptureSeconds, index })
      : { frames: [], status: "PENDING_FRAME_CAPTURE" };

    const visual = visualService && visualService.describeVideoFrames
      ? visualService.describeVideoFrames(video, frames.frames || [], { frameCaptureSeconds, index })
      : { videoId: video.id, videoName: video.name, summary: "Descripción visual pendiente.", scenes: [], status: "PENDING_VISUAL_DESCRIPTION" };
    visualDescriptions.push(visual);
  }

  return { transcriptsByVideo, visualDescriptions };
}

async function startAutomaticProcessing(options = {}) {
  const currentProject = projectService.getCurrentProject ? projectService.getCurrentProject().currentProject : null;
  const material = videoStore.loadMaterialSession ? videoStore.loadMaterialSession() : {};
  const items = normalizeMediaItems((options.mediaItems && options.mediaItems.length ? options.mediaItems : material.mediaItems) || []);
  if (!items.length) return fail("No hay videos cargados. Primero carga el material del proyecto.");

  const theme = normalizeTheme(options.selectedTheme || options.theme || "generico");
  const themeMode = normalizeThemeMode(theme, options.selectedThemeMode || options.themeMode || "standard");
  const themeLabel = options.selectedThemeLabel || options.themeLabel || getThemeLabel(theme, themeMode);
  const themeService = optionalRequire("../13_organizacion_inteligente/YTThemeService");
  const organizerService = optionalRequire("../13_organizacion_inteligente/YTSmartOrganizerService");
  const resourcePlan = themeService && themeService.getThemeResourcePlan ? themeService.getThemeResourcePlan(theme, themeMode) : null;

  let session = patchWorkflowSession(loadSession(), {
    projectId: currentProject ? currentProject.id : options.projectId || "",
    projectName: currentProject ? currentProject.name : options.projectName || "",
    currentStep: WORKFLOW_STEPS.PROCESSING,
    workflowStatus: WORKFLOW_STATUS.RUNNING,
    mediaMode: resolveMediaMode(items, options.mediaMode || material.mediaMode),
    mediaItems: items,
    primaryVideo: items[0] || null,
    selectedTheme: theme,
    selectedThemeMode: themeMode,
    selectedThemeLabel: themeLabel,
    themeResources: resourcePlan,
    smartProcessing: { enabled: true, status: "RUNNING", currentVideoIndex: 0, totalVideos: items.length, percent: 0, message: "Procesando videos uno por uno." },
    videoProgress: progressFor(items, TASK_STATUS.RUNNING, "En proceso."),
    message: "Procesando videos uno por uno."
  });
  session.tasks = updateTask(session.tasks, "theme", { status: TASK_STATUS.OK, message: `Temática aplicada: ${themeLabel}.` });
  session.tasks = updateTask(session.tasks, "transcript", { status: TASK_STATUS.RUNNING, message: "Procesando transcripción por video." });
  session.tasks = updateTask(session.tasks, "visual_analysis", { status: TASK_STATUS.RUNNING, message: "Procesando descripciones visuales." });
  session = saveSession(session);

  const processed = await processVideosOneByOne(items, options);
  session.tasks = updateTask(session.tasks, "transcript", { status: TASK_STATUS.WARNING, message: "Transcripción básica preparada. Motor real se conectará en el siguiente ajuste." });
  session.tasks = updateTask(session.tasks, "visual_analysis", { status: TASK_STATUS.OK, message: "Descripciones visuales básicas preparadas." });
  session.tasks = updateTask(session.tasks, "gemini_organization", { status: TASK_STATUS.RUNNING, message: "Organizando con Gemini o fallback local." });

  const smartResult = organizerService && organizerService.organizeWithGemini
    ? await organizerService.organizeWithGemini({ ...options, projectId: session.projectId, projectName: session.projectName, mediaItems: items, mediaMode: session.mediaMode, selectedTheme: theme, selectedThemeMode: themeMode, selectedThemeLabel: themeLabel, transcriptsByVideo: processed.transcriptsByVideo, visualDescriptions: processed.visualDescriptions, workflow: session })
    : { status: "WARNING", message: "Organizador inteligente no disponible.", smartProposal: null, proposal: null, usedFallback: true };

  const proposal = smartResult.smartProposal || smartResult.proposal || null;
  session = patchWorkflowSession(session, {
    currentStep: WORKFLOW_STEPS.REVIEW_LONG_VIDEO,
    workflowStatus: WORKFLOW_STATUS.WAITING_REVIEW,
    transcriptsByVideo: processed.transcriptsByVideo,
    visualDescriptions: processed.visualDescriptions,
    organizedTranscript: { status: "BASIC", summary: "Transcripción final organizada pendiente de edición avanzada.", text: processed.transcriptsByVideo.map((item) => item.text || item.summary || "").join("\n\n") },
    smartProposal: proposal,
    mainProposal: proposal ? proposal.mainProposal : null,
    alternativeProposal: proposal ? proposal.alternativeProposal : null,
    approvedOrder: proposal && proposal.mainProposal && Array.isArray(proposal.mainProposal.order) ? proposal.mainProposal.order : [],
    smartProcessing: { enabled: true, status: "WAITING_REVIEW", currentVideoIndex: items.length, totalVideos: items.length, percent: 100, message: "Organización lista para revisión." },
    videoProgress: progressFor(items, TASK_STATUS.OK, "Procesado."),
    warnings: smartResult.usedFallback ? [smartResult.message || "Se usó fallback local."] : [],
    message: "Organización inteligente lista. Revisa y aprueba."
  });
  session.tasks = updateTask(session.tasks, "gemini_organization", { status: smartResult.status === "OK" ? TASK_STATUS.OK : TASK_STATUS.WARNING, message: smartResult.message || "Organización completada." });
  session.tasks = updateTask(session.tasks, "proposal_review", { status: TASK_STATUS.OK, message: "Propuesta lista para revisión." });
  session = saveSession(session);
  if (projectService.saveCurrentProjectChanges) projectService.saveCurrentProjectChanges({ workflow: { id: session.id, currentStep: session.currentStep, workflowStatus: session.workflowStatus, updatedAt: session.updatedAt }, smartProposal: proposal });
  return ok("Procesamiento inteligente completado.", { status: smartResult.status === "OK" ? "OK" : "WARNING", workflow: session, session, smartProposal: proposal, transcriptsByVideo: processed.transcriptsByVideo, visualDescriptions: processed.visualDescriptions, themeResources: resourcePlan });
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

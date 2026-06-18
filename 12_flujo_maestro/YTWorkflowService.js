/*
  Nombre completo: YTWorkflowService.js
  Ruta: 12_flujo_maestro/YTWorkflowService.js
  Función o funciones:
    - Orquestar el proceso maestro: proyecto, carga, procesamiento, revisión, clips, edición, exportación y paquete.
    - Evitar que la interfaz coordine manualmente transcripción, análisis, clips, subtítulos, capas, recursos y exportación.
    - Mantener compatibilidad con los servicios actuales mientras se reemplaza la pantalla técnica.
  Se conecta con:
    - 12_flujo_maestro/YTWorkflowModel.js
    - 12_flujo_maestro/YTWorkflowStore.js
    - 06_proyectos/YTProjectService.js
    - 03_carga_y_preview_video/YTVideoStore.js
    - 07_transcripcion_y_analisis/YTTranscriptService.js
    - 08_clips_y_timeline/YTClipService.js
    - 09_subtitulos_capas_y_estilos/YTSubtitleService.js
    - 09_subtitulos_capas_y_estilos/YTLayerService.js
    - 10_biblioteca_y_recursos/YTLibraryService.js
    - 11_exportacion_y_publicacion/YTExportService.js
*/

const {
  WORKFLOW_STEPS,
  WORKFLOW_STATUS,
  TASK_STATUS,
  MEDIA_MODE,
  getNextStep,
  updateTask,
  patchWorkflowSession,
  createWorkflowSession
} = require("./YTWorkflowModel");
const {
  loadWorkflowForCurrentProject,
  saveWorkflowEverywhere,
  clearWorkflowSession
} = require("./YTWorkflowStore");
const projectService = require("../06_proyectos/YTProjectService");
const videoStore = require("../03_carga_y_preview_video/YTVideoStore");

function ok(message, patch = {}) {
  return { ok: true, status: patch.status || "OK", message, ...patch };
}

function fail(message, patch = {}) {
  return { ok: false, status: "ERROR", message, ...patch };
}

function safeCall(label, fn) {
  try {
    const result = fn();
    return result && typeof result.then === "function"
      ? result.catch((error) => fail(label + ": " + (error.message || String(error))))
      : result;
  } catch (error) {
    return fail(label + ": " + (error.message || String(error)));
  }
}

function saveSession(session) {
  const saved = saveWorkflowEverywhere(session);
  return saved.session;
}

function getCurrentWorkflow() {
  const loaded = loadWorkflowForCurrentProject();
  return {
    ok: loaded.ok,
    status: loaded.status,
    session: loaded.session,
    workflow: loaded.session,
    path: loaded.path,
    message: loaded.session && loaded.session.projectId ? "Flujo actual cargado." : "Todavía no hay flujo activo."
  };
}

function createWorkflowProject(options = {}) {
  const created = projectService.createProjectByName({
    name: options.name || options.projectName || "Proyecto AutoEdit",
    notes: options.notes || "",
    source: "workflow"
  });
  if (!created.ok) return created;

  const session = createWorkflowSession({
    projectId: created.project.id,
    projectName: created.project.name,
    currentStep: WORKFLOW_STEPS.LOAD_MATERIAL,
    workflowStatus: WORKFLOW_STATUS.DRAFT,
    mediaMode: MEDIA_MODE.EMPTY,
    message: "Proyecto creado. Ahora carga uno o varios videos."
  });
  session.tasks = updateTask(session.tasks, "project", { status: TASK_STATUS.OK, message: "Proyecto creado correctamente." });

  const savedSession = saveSession(session);
  projectService.saveCurrentProjectChanges({ workflow: { id: savedSession.id, currentStep: savedSession.currentStep, workflowStatus: savedSession.workflowStatus, updatedAt: savedSession.updatedAt } });

  return ok("Proyecto creado desde el flujo maestro.", {
    project: created.project,
    projectFolder: created.projectFolder,
    workflow: savedSession,
    session: savedSession
  });
}

function ensureProjectForWorkflow(options = {}) {
  const current = projectService.getCurrentProject();
  if (current.currentProject && current.currentProject.id) return ok("Proyecto actual encontrado.", { project: current.currentProject });
  return createWorkflowProject(options);
}

function attachMaterialToWorkflow(options = {}) {
  const ensured = ensureProjectForWorkflow(options);
  if (!ensured.ok) return ensured;
  const project = ensured.project || ensured.currentProject || ensured.project;
  const filePaths = options.filePaths || options.paths || [];
  const mediaItems = options.mediaItems || [];

  const materialResult = mediaItems.length
    ? videoStore.saveMaterialSession(mediaItems, { mediaMode: options.mediaMode, sourceType: options.sourceType || "manual" })
    : videoStore.saveMediaItemsFromPaths(filePaths, { mediaMode: options.mediaMode, sourceType: options.sourceType || "dialog" });

  if (!materialResult.ok) return materialResult;

  const material = materialResult.session || materialResult.materialSession;
  const primaryVideo = material.primaryVideo || material.currentVideo || null;
  const workflowLoaded = loadWorkflowForCurrentProject().session;
  let session = patchWorkflowSession(workflowLoaded, {
    projectId: project.id,
    projectName: project.name,
    currentStep: WORKFLOW_STEPS.PROCESSING,
    workflowStatus: WORKFLOW_STATUS.READY,
    mediaMode: material.mediaMode,
    mediaItems: material.mediaItems,
    primaryVideo,
    message: "Material cargado. El proyecto está listo para procesarse."
  });
  session.tasks = updateTask(session.tasks, "material", { status: TASK_STATUS.OK, message: `${material.mediaItems.length} archivo(s) cargado(s).` });
  session = saveSession(session);

  projectService.saveCurrentProjectChanges({
    video: primaryVideo || {},
    mediaMode: material.mediaMode,
    mediaItems: material.mediaItems,
    primaryVideo,
    workflow: { id: session.id, currentStep: session.currentStep, workflowStatus: session.workflowStatus, updatedAt: session.updatedAt }
  });

  return ok("Material cargado en el flujo maestro.", {
    project,
    material,
    workflow: session,
    session
  });
}

async function startAutomaticProcessing(options = {}) {
  const current = projectService.getCurrentProject();
  if (!current.currentProject || !current.currentProject.id) return fail("No hay proyecto actual. Primero crea un proyecto.");

  const material = videoStore.loadMaterialSession();
  if (!material.mediaItems || !material.mediaItems.length) return fail("No hay videos cargados. Primero carga el material del proyecto.", { project: current.currentProject });

  let session = patchWorkflowSession(loadWorkflowForCurrentProject().session, {
    projectId: current.currentProject.id,
    projectName: current.currentProject.name,
    currentStep: WORKFLOW_STEPS.PROCESSING,
    workflowStatus: WORKFLOW_STATUS.RUNNING,
    mediaMode: material.mediaMode,
    mediaItems: material.mediaItems,
    primaryVideo: material.primaryVideo,
    message: "Procesando automáticamente el proyecto."
  });
  session.tasks = updateTask(session.tasks, "transcript", { status: TASK_STATUS.RUNNING, message: "Preparando transcripción." });
  session = saveSession(session);

  const steps = [];
  const transcriptService = require("../07_transcripcion_y_analisis/YTTranscriptService");
  const clipService = require("../08_clips_y_timeline/YTClipService");
  const subtitleService = require("../09_subtitulos_capas_y_estilos/YTSubtitleService");
  const layerService = require("../09_subtitulos_capas_y_estilos/YTLayerService");
  const libraryService = require("../10_biblioteca_y_recursos/YTLibraryService");

  const transcriptText = String(options.transcriptText || options.text || "").trim();
  if (transcriptText) {
    const transcriptResult = await safeCall("Transcripción", () => transcriptService.saveTranscriptForCurrentProject({ text: transcriptText, source: options.transcriptSource || "workflow", language: options.language || "es" }));
    steps.push({ id: "transcript", result: transcriptResult });
    session.tasks = updateTask(session.tasks, "transcript", { status: transcriptResult.ok ? TASK_STATUS.OK : TASK_STATUS.ERROR, message: transcriptResult.message || "Transcripción procesada." });

    const analysisResult = await safeCall("Análisis", () => transcriptService.analyzeCurrentTranscript());
    steps.push({ id: "analysis", result: analysisResult });
    session.tasks = updateTask(session.tasks, "analysis", { status: analysisResult.ok ? TASK_STATUS.OK : TASK_STATUS.ERROR, message: analysisResult.message || "Análisis finalizado." });

    const clipsResult = await safeCall("Clips", () => clipService.generateClipsFromAnalysis({ maxClips: options.maxClips || 8 }));
    steps.push({ id: "clips", result: clipsResult });
    session.tasks = updateTask(session.tasks, "clips", { status: clipsResult.ok ? TASK_STATUS.OK : TASK_STATUS.WARNING, message: clipsResult.message || "Clips sugeridos." });

    const timelineResult = await safeCall("Timeline", () => clipService.createTimelineFromCurrentClips());
    steps.push({ id: "timeline", result: timelineResult });
    session.tasks = updateTask(session.tasks, "timeline", { status: timelineResult.ok ? TASK_STATUS.OK : TASK_STATUS.WARNING, message: timelineResult.message || "Timeline generado." });

    const subtitlesResult = await safeCall("Subtítulos", () => subtitleService.generateSubtitlesFromTranscript({ maxLines: options.maxSubtitleLines || 80 }));
    steps.push({ id: "subtitles", result: subtitlesResult });
    session.tasks = updateTask(session.tasks, "subtitles", { status: subtitlesResult.ok ? TASK_STATUS.OK : TASK_STATUS.WARNING, message: subtitlesResult.message || "Subtítulos generados." });
  } else {
    session.tasks = updateTask(session.tasks, "transcript", { status: TASK_STATUS.WARNING, message: "No se recibió texto de transcripción. El motor automático quedará pendiente para el siguiente bloque." });
    session.tasks = updateTask(session.tasks, "analysis", { status: TASK_STATUS.SKIPPED, message: "Análisis omitido hasta tener transcripción." });
    session.tasks = updateTask(session.tasks, "clips", { status: TASK_STATUS.SKIPPED, message: "Clips omitidos hasta tener análisis." });
    session.tasks = updateTask(session.tasks, "timeline", { status: TASK_STATUS.SKIPPED, message: "Timeline omitido hasta tener clips." });
    session.tasks = updateTask(session.tasks, "subtitles", { status: TASK_STATUS.SKIPPED, message: "Subtítulos omitidos hasta tener transcripción." });
  }

  const layersResult = await safeCall("Capas", () => layerService.generateLayersFromProjectData());
  steps.push({ id: "layers", result: layersResult });
  session.tasks = updateTask(session.tasks, "layers", { status: layersResult.ok ? TASK_STATUS.OK : TASK_STATUS.WARNING, message: layersResult.message || "Capas preparadas." });

  const styleResult = await safeCall("Estilo", () => layerService.applyDefaultStylePreset({ format: options.format || "vertical_9_16" }));
  steps.push({ id: "style", result: styleResult });

  const resourcesResult = await safeCall("Recursos", () => libraryService.attachLibraryToCurrentProject({ resources: options.resources || [] }));
  steps.push({ id: "resources", result: resourcesResult });
  session.tasks = updateTask(session.tasks, "resources", { status: resourcesResult.ok ? TASK_STATUS.OK : TASK_STATUS.WARNING, message: resourcesResult.message || "Recursos revisados." });

  const hasErrors = steps.some((item) => item.result && item.result.status === "ERROR");
  const hasWarnings = steps.some((item) => item.result && (item.result.status === "WARNING" || item.result.ok === false));
  session = patchWorkflowSession(session, {
    currentStep: hasErrors ? WORKFLOW_STEPS.PROCESSING : WORKFLOW_STEPS.REVIEW_LONG_VIDEO,
    workflowStatus: hasErrors ? WORKFLOW_STATUS.ERROR : hasWarnings ? WORKFLOW_STATUS.PARTIAL : WORKFLOW_STATUS.WAITING_REVIEW,
    longVideoPlan: { status: hasErrors ? "ERROR" : "READY_FOR_REVIEW", generatedAt: new Date().toISOString(), steps },
    message: hasErrors ? "El procesamiento terminó con errores." : hasWarnings ? "Procesamiento parcial listo para revisar." : "Procesamiento automático listo para revisión."
  });
  session = saveSession(session);
  projectService.saveCurrentProjectChanges({ workflow: { id: session.id, currentStep: session.currentStep, workflowStatus: session.workflowStatus, updatedAt: session.updatedAt }, longVideoPlan: session.longVideoPlan });

  return ok(session.message, { status: session.workflowStatus === WORKFLOW_STATUS.ERROR ? "ERROR" : session.workflowStatus === WORKFLOW_STATUS.PARTIAL ? "WARNING" : "OK", workflow: session, session, steps });
}

function approveCurrentStep(options = {}) {
  const loaded = loadWorkflowForCurrentProject().session;
  const nextStep = options.nextStep || getNextStep(loaded.currentStep);
  const session = saveSession(patchWorkflowSession(loaded, {
    currentStep: nextStep,
    workflowStatus: WORKFLOW_STATUS.APPROVED,
    reviewStatus: "APPROVED",
    message: options.message || "Etapa aprobada."
  }));
  projectService.saveCurrentProjectChanges({ workflow: { id: session.id, currentStep: session.currentStep, workflowStatus: session.workflowStatus, updatedAt: session.updatedAt } });
  return ok("Etapa aprobada en el flujo maestro.", { workflow: session, session });
}

function saveClipSelections(options = {}) {
  const selectedClips = Array.isArray(options.selectedClips) ? options.selectedClips : [];
  const loaded = loadWorkflowForCurrentProject().session;
  let session = patchWorkflowSession(loaded, {
    currentStep: WORKFLOW_STEPS.AUTO_EDIT,
    workflowStatus: WORKFLOW_STATUS.READY,
    clipSelections: selectedClips,
    message: selectedClips.length ? "Clips seleccionados. Listos para edición automática." : "No se seleccionaron clips todavía."
  });
  session.tasks = updateTask(session.tasks, "clips", { status: selectedClips.length ? TASK_STATUS.OK : TASK_STATUS.WARNING, message: `${selectedClips.length} clip(s) seleccionado(s).` });
  session = saveSession(session);
  projectService.saveCurrentProjectChanges({ selectedClips, workflow: { id: session.id, currentStep: session.currentStep, workflowStatus: session.workflowStatus, updatedAt: session.updatedAt } });
  return ok("Selección de clips guardada.", { workflow: session, session, selectedClips });
}

async function exportAll(options = {}) {
  const exportService = require("../11_exportacion_y_publicacion/YTExportService");
  let session = patchWorkflowSession(loadWorkflowForCurrentProject().session, {
    currentStep: WORKFLOW_STEPS.EXPORT_ALL,
    workflowStatus: WORKFLOW_STATUS.RUNNING,
    exportStatus: "RUNNING",
    message: "Exportando todas las salidas."
  });
  session.tasks = updateTask(session.tasks, "export", { status: TASK_STATUS.RUNNING, message: "Exportación en proceso." });
  session = saveSession(session);

  const result = await safeCall("Exportación", () => exportService.renderBatch(options));
  const finalStatus = result.ok ? WORKFLOW_STATUS.WAITING_REVIEW : WORKFLOW_STATUS.ERROR;
  session = patchWorkflowSession(session, {
    workflowStatus: finalStatus,
    exportStatus: result.ok ? "READY" : "ERROR",
    outputs: Array.isArray(result.results) ? result.results : [],
    message: result.message || "Exportación finalizada."
  });
  session.tasks = updateTask(session.tasks, "export", { status: result.ok ? TASK_STATUS.OK : TASK_STATUS.ERROR, message: result.message || "Exportación finalizada." });
  session = saveSession(session);
  return { ...result, workflow: session, session };
}

function createFinalPackage(options = {}) {
  const exportService = require("../11_exportacion_y_publicacion/YTExportService");
  const result = safeCall("Paquete final", () => exportService.createPublicationPackage(options));
  const loaded = loadWorkflowForCurrentProject().session;
  let session = patchWorkflowSession(loaded, {
    currentStep: WORKFLOW_STEPS.FINAL_PACKAGE,
    workflowStatus: result.ok ? WORKFLOW_STATUS.COMPLETED : WORKFLOW_STATUS.ERROR,
    finalPackage: result.currentPublicationPackage || result.package || result.publicationPackage || null,
    message: result.message || "Paquete final actualizado."
  });
  session.tasks = updateTask(session.tasks, "package", { status: result.ok ? TASK_STATUS.OK : TASK_STATUS.ERROR, message: result.message || "Paquete final actualizado." });
  session = saveSession(session);
  return { ...result, workflow: session, session };
}

function resetWorkflow() {
  return clearWorkflowSession();
}

module.exports = {
  getCurrentWorkflow,
  createWorkflowProject,
  ensureProjectForWorkflow,
  attachMaterialToWorkflow,
  startAutomaticProcessing,
  approveCurrentStep,
  saveClipSelections,
  exportAll,
  createFinalPackage,
  resetWorkflow
};

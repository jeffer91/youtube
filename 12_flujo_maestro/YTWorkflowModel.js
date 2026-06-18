/*
  Nombre completo: YTWorkflowModel.js
  Ruta: 12_flujo_maestro/YTWorkflowModel.js
  Función o funciones:
    - Modelo central del flujo maestro.
    - Soportar temática, organización inteligente, propuesta principal y alternativa.
  Se conecta con:
    - YTWorkflowStore.js
    - YTWorkflowService.js
    - YTWorkflowCheck.js
*/

const WORKFLOW_STEPS = Object.freeze({
  CREATE_PROJECT: "CREATE_PROJECT",
  LOAD_MATERIAL: "LOAD_MATERIAL",
  PROCESSING: "PROCESSING",
  REVIEW_LONG_VIDEO: "REVIEW_LONG_VIDEO",
  SELECT_CLIPS: "SELECT_CLIPS",
  AUTO_EDIT: "AUTO_EDIT",
  REVIEW_RESULTS: "REVIEW_RESULTS",
  EXPORT_ALL: "EXPORT_ALL",
  FINAL_PACKAGE: "FINAL_PACKAGE"
});

const WORKFLOW_STEP_ORDER = Object.freeze([
  WORKFLOW_STEPS.CREATE_PROJECT,
  WORKFLOW_STEPS.LOAD_MATERIAL,
  WORKFLOW_STEPS.PROCESSING,
  WORKFLOW_STEPS.REVIEW_LONG_VIDEO,
  WORKFLOW_STEPS.SELECT_CLIPS,
  WORKFLOW_STEPS.AUTO_EDIT,
  WORKFLOW_STEPS.REVIEW_RESULTS,
  WORKFLOW_STEPS.EXPORT_ALL,
  WORKFLOW_STEPS.FINAL_PACKAGE
]);

const WORKFLOW_STATUS = Object.freeze({ EMPTY: "EMPTY", DRAFT: "DRAFT", READY: "READY", RUNNING: "RUNNING", WAITING_REVIEW: "WAITING_REVIEW", APPROVED: "APPROVED", COMPLETED: "COMPLETED", PARTIAL: "PARTIAL", ERROR: "ERROR", CANCELLED: "CANCELLED" });
const TASK_STATUS = Object.freeze({ PENDING: "PENDING", RUNNING: "RUNNING", OK: "OK", WARNING: "WARNING", ERROR: "ERROR", SKIPPED: "SKIPPED" });
const MEDIA_MODE = Object.freeze({ EMPTY: "EMPTY", SINGLE_LONG_VIDEO: "SINGLE_LONG_VIDEO", MULTI_SHORT_VIDEOS: "MULTI_SHORT_VIDEOS" });
const EDITION_THEMES = Object.freeze({ ELEVEN_VS_ELEVEN: "11_contra_11", CRECE_AULA: "crece_aula", GENERIC: "generico", INSTITUTIONAL: "institucional", BOCA_ROSA: "boca_rosa" });
const BOCA_ROSA_MODES = Object.freeze({ MUSIC: "musica", SPOKEN: "hablado" });
const EXPORT_TARGETS = Object.freeze(["youtube_horizontal", "youtube_shorts", "tiktok", "instagram_reels", "facebook_reels", "instagram_facebook_square"]);

const STEP_LABELS = Object.freeze({
  [WORKFLOW_STEPS.CREATE_PROJECT]: "Crear proyecto",
  [WORKFLOW_STEPS.LOAD_MATERIAL]: "Cargar videos",
  [WORKFLOW_STEPS.PROCESSING]: "Organización inteligente del video",
  [WORKFLOW_STEPS.REVIEW_LONG_VIDEO]: "Revisar propuesta inteligente",
  [WORKFLOW_STEPS.SELECT_CLIPS]: "Elegir clips",
  [WORKFLOW_STEPS.AUTO_EDIT]: "Editar automáticamente",
  [WORKFLOW_STEPS.REVIEW_RESULTS]: "Revisar resultados",
  [WORKFLOW_STEPS.EXPORT_ALL]: "Exportar todo",
  [WORKFLOW_STEPS.FINAL_PACKAGE]: "Paquete final"
});

function nowIso() { return new Date().toISOString(); }
function cleanText(value, fallback = "") { return String(value ?? fallback ?? "").replace(/\s+/g, " ").trim(); }
function createWorkflowId() { return "workflow_" + nowIso().replaceAll(":", "-").replaceAll(".", "-"); }
function normalizeStep(step) { return WORKFLOW_STEP_ORDER.includes(step) ? step : WORKFLOW_STEPS.CREATE_PROJECT; }
function getStepIndex(step) { return WORKFLOW_STEP_ORDER.indexOf(normalizeStep(step)); }
function getNextStep(step) { const index = getStepIndex(step); return WORKFLOW_STEP_ORDER[Math.min(index + 1, WORKFLOW_STEP_ORDER.length - 1)] || WORKFLOW_STEPS.CREATE_PROJECT; }
function getPreviousStep(step) { const index = getStepIndex(step); return index <= 0 ? WORKFLOW_STEPS.CREATE_PROJECT : WORKFLOW_STEP_ORDER[index - 1]; }
function getStepLabel(step) { return STEP_LABELS[normalizeStep(step)] || "Flujo maestro"; }

function normalizeTheme(theme) {
  const value = cleanText(theme, EDITION_THEMES.GENERIC).toLowerCase();
  return Object.values(EDITION_THEMES).includes(value) ? value : EDITION_THEMES.GENERIC;
}

function normalizeThemeMode(theme, mode) {
  const themeId = normalizeTheme(theme);
  if (themeId !== EDITION_THEMES.BOCA_ROSA) return "standard";
  const value = cleanText(mode, BOCA_ROSA_MODES.MUSIC).toLowerCase();
  return Object.values(BOCA_ROSA_MODES).includes(value) ? value : BOCA_ROSA_MODES.MUSIC;
}

function getThemeLabel(theme, mode) {
  const themeId = normalizeTheme(theme);
  const themeMode = normalizeThemeMode(themeId, mode);
  const labels = {
    [EDITION_THEMES.ELEVEN_VS_ELEVEN]: "11 contra 11",
    [EDITION_THEMES.CRECE_AULA]: "Crece Aula",
    [EDITION_THEMES.GENERIC]: "Genérico",
    [EDITION_THEMES.INSTITUTIONAL]: "Institucional",
    [EDITION_THEMES.BOCA_ROSA]: themeMode === BOCA_ROSA_MODES.SPOKEN ? "Boca Rosa hablado" : "Boca Rosa música"
  };
  return labels[themeId] || "Genérico";
}

function createWorkflowTask(id, label, status = TASK_STATUS.PENDING, patch = {}) {
  return { id: cleanText(id, "task"), label: cleanText(label, "Tarea"), status, message: cleanText(patch.message, ""), startedAt: patch.startedAt || null, finishedAt: patch.finishedAt || null, updatedAt: patch.updatedAt || nowIso(), ...patch };
}

function createDefaultTasks() {
  return [
    createWorkflowTask("project", "Proyecto creado"),
    createWorkflowTask("material", "Material cargado"),
    createWorkflowTask("theme", "Temática seleccionada"),
    createWorkflowTask("transcript", "Transcripción por video"),
    createWorkflowTask("visual_analysis", "Descripción visual"),
    createWorkflowTask("gemini_organization", "Organización con Gemini"),
    createWorkflowTask("proposal_review", "Propuesta lista para revisión"),
    createWorkflowTask("clips", "Clips sugeridos"),
    createWorkflowTask("timeline", "Timeline generado"),
    createWorkflowTask("subtitles", "Subtítulos automáticos"),
    createWorkflowTask("layers", "Capas y estilo"),
    createWorkflowTask("resources", "Recursos por temática"),
    createWorkflowTask("export", "Exportación para todas las redes"),
    createWorkflowTask("package", "Paquete final")
  ];
}

function normalizeTasks(tasks) {
  const incoming = Array.isArray(tasks) ? tasks : [];
  return createDefaultTasks().map((task) => ({ ...task, ...(incoming.find((item) => item && item.id === task.id) || {}) }));
}

function updateTask(tasks, taskId, patch = {}) {
  return normalizeTasks(tasks).map((task) => task.id === taskId ? { ...task, ...patch, updatedAt: nowIso(), finishedAt: [TASK_STATUS.OK, TASK_STATUS.WARNING, TASK_STATUS.ERROR, TASK_STATUS.SKIPPED].includes(patch.status) ? nowIso() : task.finishedAt } : task);
}

function createWorkflowProgress(step = WORKFLOW_STEPS.CREATE_PROJECT, tasks = []) {
  const currentStep = normalizeStep(step);
  const currentIndex = getStepIndex(currentStep);
  return { currentStep, currentStepLabel: getStepLabel(currentStep), currentIndex, totalSteps: WORKFLOW_STEP_ORDER.length, percent: Math.round(((currentIndex + 1) / WORKFLOW_STEP_ORDER.length) * 100), tasks: normalizeTasks(tasks) };
}

function normalizeVideoProgress(mediaItems = [], incoming = []) {
  const list = Array.isArray(mediaItems) ? mediaItems : [];
  const progress = Array.isArray(incoming) ? incoming : [];
  return list.map((item, index) => {
    const found = progress.find((row) => row && (row.id === item.id || row.path === item.path || row.name === item.name));
    return { id: item.id || item.path || `video_${index + 1}`, name: item.name || `Video ${index + 1}`, index, status: found ? found.status || TASK_STATUS.PENDING : TASK_STATUS.PENDING, percent: found ? Number(found.percent || 0) : 0, message: found ? found.message || "Pendiente" : "Pendiente" };
  });
}

function createEmptyWorkflowSession() { return createWorkflowSession({ currentStep: WORKFLOW_STEPS.CREATE_PROJECT, workflowStatus: WORKFLOW_STATUS.EMPTY, message: "Crea un proyecto para iniciar." }); }

function createWorkflowSession(data = {}) {
  const currentStep = normalizeStep(data.currentStep || data.step);
  const selectedTheme = normalizeTheme(data.selectedTheme || data.theme);
  const selectedThemeMode = normalizeThemeMode(selectedTheme, data.selectedThemeMode || data.themeMode);
  const mediaItems = Array.isArray(data.mediaItems) ? data.mediaItems : [];
  const tasks = normalizeTasks(data.tasks);
  return {
    app: "AutoEdit Studio",
    block: "12_flujo_maestro",
    id: data.id || createWorkflowId(),
    projectId: cleanText(data.projectId, ""),
    projectName: cleanText(data.projectName, ""),
    currentStep,
    workflowStatus: Object.values(WORKFLOW_STATUS).includes(data.workflowStatus) ? data.workflowStatus : WORKFLOW_STATUS.DRAFT,
    mediaMode: Object.values(MEDIA_MODE).includes(data.mediaMode) ? data.mediaMode : MEDIA_MODE.EMPTY,
    mediaItems,
    primaryVideo: data.primaryVideo || null,
    selectedTheme,
    selectedThemeMode,
    selectedThemeLabel: cleanText(data.selectedThemeLabel || data.themeLabel, getThemeLabel(selectedTheme, selectedThemeMode)),
    themeResources: data.themeResources || null,
    smartProcessing: data.smartProcessing || { enabled: true, status: "EMPTY", currentVideoIndex: 0, totalVideos: mediaItems.length, percent: 0, message: "" },
    videoProgress: normalizeVideoProgress(mediaItems, data.videoProgress),
    transcriptsByVideo: Array.isArray(data.transcriptsByVideo) ? data.transcriptsByVideo : [],
    visualDescriptions: Array.isArray(data.visualDescriptions) ? data.visualDescriptions : [],
    organizedTranscript: data.organizedTranscript || null,
    smartProposal: data.smartProposal || null,
    mainProposal: data.mainProposal || (data.smartProposal ? data.smartProposal.mainProposal : null) || null,
    alternativeProposal: data.alternativeProposal || (data.smartProposal ? data.smartProposal.alternativeProposal : null) || null,
    approvedOrder: Array.isArray(data.approvedOrder) ? data.approvedOrder : [],
    clipSelections: Array.isArray(data.clipSelections) ? data.clipSelections : [],
    exportTargets: Array.isArray(data.exportTargets) && data.exportTargets.length ? data.exportTargets : EXPORT_TARGETS,
    exportStatus: data.exportStatus || "PENDING",
    outputs: Array.isArray(data.outputs) ? data.outputs : [],
    finalPackage: data.finalPackage || null,
    tasks,
    progress: createWorkflowProgress(currentStep, tasks),
    warnings: Array.isArray(data.warnings) ? data.warnings : [],
    errors: Array.isArray(data.errors) ? data.errors : [],
    message: cleanText(data.message, getStepLabel(currentStep)),
    error: data.error || null,
    createdAt: data.createdAt || nowIso(),
    updatedAt: nowIso()
  };
}

function patchWorkflowSession(session, patch = {}) {
  const base = createWorkflowSession(session || {});
  return createWorkflowSession({ ...base, ...patch, tasks: patch.tasks || base.tasks, warnings: patch.warnings || base.warnings, errors: patch.errors || base.errors, createdAt: base.createdAt, updatedAt: nowIso() });
}

module.exports = { WORKFLOW_STEPS, WORKFLOW_STEP_ORDER, WORKFLOW_STATUS, TASK_STATUS, MEDIA_MODE, EDITION_THEMES, BOCA_ROSA_MODES, EXPORT_TARGETS, STEP_LABELS, nowIso, cleanText, createWorkflowId, normalizeStep, getStepIndex, getNextStep, getPreviousStep, getStepLabel, normalizeTheme, normalizeThemeMode, getThemeLabel, createWorkflowTask, createDefaultTasks, normalizeTasks, updateTask, createWorkflowProgress, normalizeVideoProgress, createWorkflowSession, createEmptyWorkflowSession, patchWorkflowSession };

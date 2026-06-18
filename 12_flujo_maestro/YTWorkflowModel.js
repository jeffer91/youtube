/*
  Nombre completo: YTWorkflowModel.js
  Ruta: 12_flujo_maestro/YTWorkflowModel.js
  Función o funciones:
    - Definir el modelo central del flujo maestro de AutoEdit Studio.
    - Unificar etapas, estados, progreso, tareas y salidas del proceso guiado.
    - Evitar que la interfaz y los botones técnicos inventen estados distintos.
  Se conecta con:
    - 12_flujo_maestro/YTWorkflowStore.js
    - 12_flujo_maestro/YTWorkflowService.js
    - 12_flujo_maestro/YTWorkflowCheck.js
    - 01_interfaz_principal/YTState.js
    - 01_interfaz_principal/YTScreenRouter.js
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

const WORKFLOW_STATUS = Object.freeze({
  EMPTY: "EMPTY",
  DRAFT: "DRAFT",
  READY: "READY",
  RUNNING: "RUNNING",
  WAITING_REVIEW: "WAITING_REVIEW",
  APPROVED: "APPROVED",
  COMPLETED: "COMPLETED",
  PARTIAL: "PARTIAL",
  ERROR: "ERROR",
  CANCELLED: "CANCELLED"
});

const TASK_STATUS = Object.freeze({
  PENDING: "PENDING",
  RUNNING: "RUNNING",
  OK: "OK",
  WARNING: "WARNING",
  ERROR: "ERROR",
  SKIPPED: "SKIPPED"
});

const MEDIA_MODE = Object.freeze({
  EMPTY: "EMPTY",
  SINGLE_LONG_VIDEO: "SINGLE_LONG_VIDEO",
  MULTI_SHORT_VIDEOS: "MULTI_SHORT_VIDEOS"
});

const STEP_LABELS = Object.freeze({
  [WORKFLOW_STEPS.CREATE_PROJECT]: "Crear proyecto",
  [WORKFLOW_STEPS.LOAD_MATERIAL]: "Cargar videos",
  [WORKFLOW_STEPS.PROCESSING]: "Procesar automáticamente",
  [WORKFLOW_STEPS.REVIEW_LONG_VIDEO]: "Revisar video largo y sugerencias",
  [WORKFLOW_STEPS.SELECT_CLIPS]: "Elegir clips",
  [WORKFLOW_STEPS.AUTO_EDIT]: "Editar automáticamente",
  [WORKFLOW_STEPS.REVIEW_RESULTS]: "Revisar resultados",
  [WORKFLOW_STEPS.EXPORT_ALL]: "Exportar todo",
  [WORKFLOW_STEPS.FINAL_PACKAGE]: "Paquete final"
});

function nowIso() {
  return new Date().toISOString();
}

function cleanText(value, fallback = "") {
  return String(value ?? fallback ?? "").replace(/\s+/g, " ").trim();
}

function createWorkflowId() {
  return "workflow_" + nowIso().replaceAll(":", "-").replaceAll(".", "-");
}

function normalizeStep(step) {
  return WORKFLOW_STEP_ORDER.includes(step) ? step : WORKFLOW_STEPS.CREATE_PROJECT;
}

function getStepIndex(step) {
  return WORKFLOW_STEP_ORDER.indexOf(normalizeStep(step));
}

function getNextStep(step) {
  const index = getStepIndex(step);
  if (index < 0) return WORKFLOW_STEPS.CREATE_PROJECT;
  return WORKFLOW_STEP_ORDER[Math.min(index + 1, WORKFLOW_STEP_ORDER.length - 1)];
}

function getPreviousStep(step) {
  const index = getStepIndex(step);
  if (index <= 0) return WORKFLOW_STEPS.CREATE_PROJECT;
  return WORKFLOW_STEP_ORDER[index - 1];
}

function getStepLabel(step) {
  return STEP_LABELS[normalizeStep(step)] || "Flujo maestro";
}

function createWorkflowTask(id, label, status = TASK_STATUS.PENDING, patch = {}) {
  return {
    id: cleanText(id, "task"),
    label: cleanText(label, "Tarea"),
    status: Object.values(TASK_STATUS).includes(status) ? status : TASK_STATUS.PENDING,
    message: cleanText(patch.message, ""),
    startedAt: patch.startedAt || null,
    finishedAt: patch.finishedAt || null,
    updatedAt: patch.updatedAt || nowIso(),
    ...patch
  };
}

function createDefaultTasks() {
  return [
    createWorkflowTask("project", "Proyecto creado"),
    createWorkflowTask("material", "Material cargado"),
    createWorkflowTask("transcript", "Transcripción preparada"),
    createWorkflowTask("analysis", "Análisis editorial"),
    createWorkflowTask("clips", "Clips sugeridos"),
    createWorkflowTask("timeline", "Timeline generado"),
    createWorkflowTask("subtitles", "Subtítulos automáticos"),
    createWorkflowTask("layers", "Capas y estilo"),
    createWorkflowTask("resources", "Recursos aplicados"),
    createWorkflowTask("export", "Exportación completa"),
    createWorkflowTask("package", "Paquete final")
  ];
}

function normalizeTasks(tasks) {
  const base = createDefaultTasks();
  const incoming = Array.isArray(tasks) ? tasks : [];
  return base.map((task) => {
    const found = incoming.find((item) => item && item.id === task.id);
    return found ? { ...task, ...found, updatedAt: found.updatedAt || nowIso() } : task;
  });
}

function updateTask(tasks, taskId, patch = {}) {
  const normalized = normalizeTasks(tasks);
  return normalized.map((task) => {
    if (task.id !== taskId) return task;
    const nextStatus = patch.status || task.status;
    return {
      ...task,
      ...patch,
      status: Object.values(TASK_STATUS).includes(nextStatus) ? nextStatus : task.status,
      updatedAt: nowIso(),
      startedAt: patch.status === TASK_STATUS.RUNNING && !task.startedAt ? nowIso() : patch.startedAt || task.startedAt,
      finishedAt: [TASK_STATUS.OK, TASK_STATUS.WARNING, TASK_STATUS.ERROR, TASK_STATUS.SKIPPED].includes(patch.status) ? nowIso() : patch.finishedAt || task.finishedAt
    };
  });
}

function createWorkflowProgress(step = WORKFLOW_STEPS.CREATE_PROJECT, tasks = []) {
  const currentStep = normalizeStep(step);
  const currentIndex = getStepIndex(currentStep);
  const totalSteps = WORKFLOW_STEP_ORDER.length;
  return {
    currentStep,
    currentStepLabel: getStepLabel(currentStep),
    currentIndex,
    totalSteps,
    percent: Math.round(((currentIndex + 1) / totalSteps) * 100),
    tasks: normalizeTasks(tasks)
  };
}

function createEmptyWorkflowSession() {
  return createWorkflowSession({
    id: createWorkflowId(),
    currentStep: WORKFLOW_STEPS.CREATE_PROJECT,
    workflowStatus: WORKFLOW_STATUS.EMPTY,
    message: "Crea un proyecto para iniciar."
  });
}

function createWorkflowSession(data = {}) {
  const currentStep = normalizeStep(data.currentStep || data.step);
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
    mediaItems: Array.isArray(data.mediaItems) ? data.mediaItems : [],
    primaryVideo: data.primaryVideo || null,
    longVideoPlan: data.longVideoPlan || null,
    reviewStatus: data.reviewStatus || "PENDING",
    clipSelections: Array.isArray(data.clipSelections) ? data.clipSelections : [],
    exportStatus: data.exportStatus || "PENDING",
    outputs: Array.isArray(data.outputs) ? data.outputs : [],
    finalPackage: data.finalPackage || null,
    tasks,
    progress: createWorkflowProgress(currentStep, tasks),
    message: cleanText(data.message, getStepLabel(currentStep)),
    error: data.error || null,
    createdAt: data.createdAt || nowIso(),
    updatedAt: nowIso()
  };
}

function patchWorkflowSession(session, patch = {}) {
  const base = createWorkflowSession(session || {});
  return createWorkflowSession({
    ...base,
    ...patch,
    tasks: patch.tasks || base.tasks,
    createdAt: base.createdAt,
    updatedAt: nowIso()
  });
}

module.exports = {
  WORKFLOW_STEPS,
  WORKFLOW_STEP_ORDER,
  WORKFLOW_STATUS,
  TASK_STATUS,
  MEDIA_MODE,
  STEP_LABELS,
  nowIso,
  cleanText,
  createWorkflowId,
  normalizeStep,
  getStepIndex,
  getNextStep,
  getPreviousStep,
  getStepLabel,
  createWorkflowTask,
  createDefaultTasks,
  normalizeTasks,
  updateTask,
  createWorkflowProgress,
  createWorkflowSession,
  createEmptyWorkflowSession,
  patchWorkflowSession
};

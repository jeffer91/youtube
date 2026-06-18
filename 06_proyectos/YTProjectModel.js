/*
  Nombre completo: YTProjectModel.js
  Ruta: 06_proyectos/YTProjectModel.js
  Función o funciones:
    - Definir el modelo de proyecto de AutoEdit Studio.
    - Permitir crear proyecto sin video inicial.
    - Guardar material múltiple, video principal, selección de clips, salidas y estado de workflow.
  Se conecta con:
    - 06_proyectos/YTProjectService.js
    - 06_proyectos/YTProjectStore.js
    - 12_flujo_maestro/YTWorkflowService.js
    - 03_carga_y_preview_video/YTVideoStore.js
*/

function nowIso() {
  return new Date().toISOString();
}

function createProjectId() {
  return "project_" + nowIso().replaceAll(":", "-").replaceAll(".", "-");
}

function safeName(name) {
  return String(name || "Proyecto sin nombre")
    .trim()
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/\s+/g, " ")
    .slice(0, 80) || "Proyecto sin nombre";
}

function slug(name) {
  return safeName(name)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60) || "proyecto";
}

function normalizeVideo(video = {}) {
  return {
    name: video.name || "",
    path: video.path || "",
    fileUrl: video.fileUrl || "",
    extension: video.extension || "",
    size: video.size || "",
    sizeBytes: Number(video.sizeBytes || 0),
    canPreview: Boolean(video.canPreview),
    ok: Boolean(video.ok)
  };
}

function normalizeMediaItems(items = []) {
  return Array.isArray(items)
    ? items.map((item, index) => ({
        id: item.id || `media_${index + 1}`,
        order: Number.isFinite(Number(item.order)) ? Number(item.order) : index + 1,
        role: item.role || (index === 0 ? "PRIMARY" : "SUPPORT"),
        sourceType: item.sourceType || "video",
        ...normalizeVideo(item),
        status: item.status || (item.ok ? "OK" : "ERROR"),
        message: item.message || ""
      }))
    : [];
}

function createEmptyWorkflowSummary() {
  return {
    id: "",
    currentStep: "CREATE_PROJECT",
    workflowStatus: "EMPTY",
    updatedAt: nowIso()
  };
}

function createProjectRecord(data = {}) {
  const mediaItems = normalizeMediaItems(data.mediaItems || []);
  const primaryVideo = data.primaryVideo || data.video || mediaItems[0] || {};
  const video = normalizeVideo(primaryVideo);
  const name = safeName(data.name || video.name || "Proyecto sin nombre");
  const createdAt = data.createdAt || nowIso();

  return {
    id: data.id || createProjectId(),
    name,
    slug: data.slug || slug(name),
    block: "06_proyectos",
    status: data.status || "ACTIVE",
    source: data.source || "manual",
    video,
    primaryVideo: video,
    mediaMode: data.mediaMode || (mediaItems.length > 1 ? "MULTI_SHORT_VIDEOS" : video.path ? "SINGLE_LONG_VIDEO" : "EMPTY"),
    mediaItems,
    longVideoPlan: data.longVideoPlan || null,
    selectedClips: Array.isArray(data.selectedClips) ? data.selectedClips : [],
    clipSelections: Array.isArray(data.clipSelections) ? data.clipSelections : [],
    timeline: data.timeline || { clips: [], durationSeconds: 0 },
    transcript: data.transcript || null,
    analysis: data.analysis || null,
    subtitles: data.subtitles || null,
    layers: data.layers || null,
    stylePreset: data.stylePreset || null,
    resources: data.resources || null,
    exports: Array.isArray(data.exports) ? data.exports : [],
    outputs: Array.isArray(data.outputs) ? data.outputs : [],
    finalPackage: data.finalPackage || null,
    workflow: data.workflow || createEmptyWorkflowSummary(),
    notes: data.notes || "",
    createdAt,
    updatedAt: nowIso()
  };
}

function createProjectsIndex() {
  return {
    app: "AutoEdit Studio",
    block: "06_proyectos",
    projects: [],
    updatedAt: nowIso()
  };
}

function createCurrentProjectSession(project = null) {
  return {
    app: "AutoEdit Studio",
    block: "06_proyectos",
    currentProject: project,
    updatedAt: nowIso()
  };
}

module.exports = {
  createProjectId,
  sanitizeProjectName: safeName,
  createProjectSlug: slug,
  normalizeVideo,
  normalizeMediaItems,
  createEmptyWorkflowSummary,
  createProjectRecord,
  createProjectsIndex,
  createCurrentProjectSession
};

/*
Nombre completo: YTSmartOrganizerModel.js
Ruta: 13_organizacion_inteligente/YTSmartOrganizerModel.js
Función o funciones:
  - Crear modelos de propuesta inteligente.
  - Generar propuesta principal y alternativa en modo local básico.
  - Preparar estructura compatible con Gemini.
Se conecta con:
  - YTWorkflowService.js
  - YTThemeConfig.js
*/

const { getThemeConfig } = require("./YTThemeConfig");

function nowIso() { return new Date().toISOString(); }
function cleanText(value, fallback = "") { return String(value ?? fallback ?? "").replace(/\s+/g, " ").trim(); }
function createOrganizerId(prefix = "smart") { return `${prefix}_${Date.now()}`; }

function normalizeVideo(video = {}, index = 0) {
  return {
    id: video.id || video.videoId || video.path || `video_${index + 1}`,
    videoId: video.id || video.videoId || video.path || `video_${index + 1}`,
    name: video.name || video.fileName || `Video ${index + 1}`,
    path: video.path || video.filePath || "",
    order: Number.isFinite(Number(video.order)) ? Number(video.order) : index + 1,
    duration: video.duration || video.durationLabel || "",
    durationSeconds: Number(video.durationSeconds || 0),
    status: video.status || "READY"
  };
}

function getRoleForIndex(index, total, themeConfig) {
  if (total <= 1) return "Video principal";
  if (index === 0) return themeConfig.id === "institucional" ? "Apertura formal" : "Gancho inicial";
  if (index === total - 1) return "Cierre";
  if (index === 1) return "Desarrollo 1";
  return `Desarrollo ${index}`;
}

function getReasonForTheme(_video, index, total, themeConfig) {
  if (themeConfig.id === "11_contra_11") {
    if (index === 0) return "Se usa al inicio para generar energía futbolera y enganchar rápido.";
    if (index === total - 1) return "Funciona como cierre o remate de la secuencia deportiva.";
    return "Mantiene continuidad visual y ritmo dinámico para fútbol.";
  }
  if (themeConfig.id === "crece_aula") {
    if (index === 0) return "Se usa como introducción para ordenar la explicación.";
    if (index === total - 1) return "Funciona como cierre educativo o conclusión.";
    return "Continúa el desarrollo del tema de forma clara.";
  }
  if (themeConfig.id === "institucional") {
    if (index === 0) return "Aporta apertura seria y ordenada para tono institucional.";
    if (index === total - 1) return "Sirve para cierre sobrio y profesional.";
    return "Mantiene continuidad formal y evita cambios bruscos.";
  }
  if (themeConfig.id === "boca_rosa" && themeConfig.selectedMode === "musica") {
    if (index === 0) return "Se usa como entrada visual para marcar energía musical.";
    if (index === total - 1) return "Cierra con presencia visual del grupo.";
    return "Aporta ritmo, baile, energía o continuidad de escena para Boca Rosa música.";
  }
  if (themeConfig.id === "boca_rosa" && themeConfig.selectedMode === "hablado") {
    if (index === 0) return "Introduce el mensaje hablado de Boca Rosa.";
    if (index === total - 1) return "Cierra el mensaje o llamado final.";
    return "Continúa el mensaje hablado con apoyo visual.";
  }
  if (index === 0) return "Inicio sugerido para edición genérica.";
  if (index === total - 1) return "Cierre sugerido para edición genérica.";
  return "Clip intermedio para mantener continuidad.";
}

function createOrderItem(video, index, total, themeConfig) {
  const normalized = normalizeVideo(video, index);
  return {
    id: normalized.id,
    videoId: normalized.videoId,
    name: normalized.name,
    path: normalized.path,
    order: index + 1,
    originalOrder: normalized.order,
    role: getRoleForIndex(index, total, themeConfig),
    reason: getReasonForTheme(normalized, index, total, themeConfig),
    duration: normalized.duration,
    durationSeconds: normalized.durationSeconds,
    confidence: "medium",
    status: "SUGGESTED"
  };
}

function createAlternativeOrder(mediaItems = [], themeConfig) {
  const videos = mediaItems.map(normalizeVideo);
  if (videos.length <= 2) return videos.map((video, index) => createOrderItem(video, index, videos.length, themeConfig));
  const first = videos[0];
  const last = videos[videos.length - 1];
  const middle = videos.slice(1, -1).reverse();
  return [first, ...middle, last].map((video, index) => ({ ...createOrderItem(video, index, videos.length, themeConfig), reason: `Alternativa: ${getReasonForTheme(video, index, videos.length, themeConfig)}` }));
}

function createSuggestedClips(order = [], themeConfig) {
  return order.map((item, index) => ({
    id: `suggested_clip_${index + 1}`,
    sourceVideoId: item.videoId,
    sourceVideoName: item.name,
    title: `${item.role}: ${item.name}`,
    role: item.role,
    reason: item.reason,
    theme: themeConfig.id,
    themeMode: themeConfig.selectedMode,
    startSecond: 0,
    endSecond: item.durationSeconds && item.durationSeconds > 0 ? Math.min(item.durationSeconds, 45) : 30,
    platforms: ["youtube_horizontal", "youtube_shorts", "tiktok", "instagram_reels", "facebook_reels", "instagram_facebook_square"],
    status: "SUGGESTED"
  }));
}

function createSmartProposal(payload = {}) {
  const mediaItems = Array.isArray(payload.mediaItems) ? payload.mediaItems : [];
  const themeConfig = getThemeConfig(payload.selectedTheme || payload.theme, payload.selectedThemeMode || payload.themeMode);
  const order = mediaItems.map((video, index) => createOrderItem(video, index, mediaItems.length, themeConfig));
  const alternativeOrder = createAlternativeOrder(mediaItems, themeConfig);
  const warnings = [];
  if (!mediaItems.length) warnings.push("No hay videos para organizar.");
  warnings.push("Propuesta generada en modo local básico. Gemini se conectará en el bloque correspondiente.");

  const mainProposal = {
    id: createOrganizerId("main_proposal"),
    type: "MAIN",
    theme: themeConfig.id,
    themeMode: themeConfig.selectedMode,
    themeLabel: themeConfig.selectedLabel,
    summary: `Propuesta principal para ${themeConfig.selectedLabel}. Se mantiene el orden de carga y se asigna función narrativa a cada video.`,
    order,
    suggestedClips: createSuggestedClips(order, themeConfig),
    editRules: themeConfig.editRules,
    createdAt: nowIso()
  };

  const alternativeProposal = {
    id: createOrganizerId("alternative_proposal"),
    type: "ALTERNATIVE",
    theme: themeConfig.id,
    themeMode: themeConfig.selectedMode,
    themeLabel: themeConfig.selectedLabel,
    summary: `Propuesta alternativa para ${themeConfig.selectedLabel}. Mantiene inicio y cierre, pero reorganiza clips intermedios.`,
    order: alternativeOrder,
    suggestedClips: createSuggestedClips(alternativeOrder, themeConfig),
    editRules: themeConfig.editRules,
    createdAt: nowIso()
  };

  return { id: createOrganizerId("smart_organization"), status: "READY_FOR_REVIEW", mode: "BASIC_LOCAL", theme: themeConfig.id, themeMode: themeConfig.selectedMode, themeLabel: themeConfig.selectedLabel, mediaMode: payload.mediaMode || "", videoCount: mediaItems.length, mainProposal, alternativeProposal, warnings, createdAt: nowIso(), updatedAt: nowIso() };
}

function normalizeGeminiProposal(raw = {}, fallbackPayload = {}) {
  const local = createSmartProposal(fallbackPayload);
  return { ...local, mode: "GEMINI", mainProposal: raw.mainProposal || raw.main || local.mainProposal, alternativeProposal: raw.alternativeProposal || raw.alternative || local.alternativeProposal, warnings: Array.isArray(raw.warnings) ? raw.warnings : local.warnings, raw, updatedAt: nowIso() };
}

module.exports = { cleanText, createOrganizerId, normalizeVideo, createOrderItem, createSuggestedClips, createSmartProposal, normalizeGeminiProposal };

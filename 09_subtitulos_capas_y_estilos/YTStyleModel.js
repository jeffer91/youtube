/*
Nombre completo: YTStyleModel.js
Ruta: 09_subtitulos_capas_y_estilos/YTStyleModel.js
Función o funciones:
  - Modelar subtítulos, capas y presets de estilo.
  - Crear presets por temática para edición automática.
Se conecta con:
  - YTStyleStore.js
  - YTLayerService.js
  - YTWorkflowService.js
*/

function cleanText(text) { return String(text || "").replace(/\r/g, "").replace(/[ \t]+/g, " ").trim(); }
function splitSentences(text) { return cleanText(text).split(/(?<=[.!?¿¡])\s+|\n+/).map((x) => x.trim()).filter(Boolean); }
function roundSecond(value) { const n = Number(value); if (!Number.isFinite(n) || n < 0) return 0; return Math.round(n * 100) / 100; }

function createSubtitleLine(sentence = "", index = 1, startSecond = 0, durationSeconds = 4) {
  const start = roundSecond(startSecond);
  const duration = Math.max(1.5, roundSecond(durationSeconds));
  return { id: `subtitle_${index}`, index, text: cleanText(sentence), startSecond: start, endSecond: roundSecond(start + duration), durationSeconds: duration, status: "READY" };
}

function createSubtitleCollection(lines = [], context = {}) {
  return { app: "AutoEdit Studio", block: "09_subtitulos_capas_y_estilos", projectId: context.projectId || "", projectName: context.projectName || "", status: lines.length ? "READY" : "EMPTY", count: lines.length, language: context.language || "es", format: "internal-json", theme: context.theme || "", themeMode: context.themeMode || "", subtitles: lines, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}

const THEME_PRESETS = Object.freeze({
  "11_contra_11": { name: "11 contra 11 dinámico", format: "vertical_9_16", typography: { fontFamily: "Arial", titleSize: 64, subtitleSize: 50, subtitleWeight: "bold", subtitleCase: "uppercase" }, colors: { primary: "#ffffff", accent: "#22d3ee", shadow: "#000000", panel: "rgba(0,0,0,0.55)" }, rhythm: "fast", effects: "sports" },
  crece_aula: { name: "Crece Aula educativo", format: "vertical_9_16", typography: { fontFamily: "Arial", titleSize: 54, subtitleSize: 44, subtitleWeight: "bold", subtitleCase: "normal" }, colors: { primary: "#ffffff", accent: "#38bdf8", shadow: "#000000", panel: "rgba(15,23,42,0.62)" }, rhythm: "medium", effects: "minimal" },
  generico: { name: "Genérico limpio", format: "vertical_9_16", typography: { fontFamily: "Arial", titleSize: 56, subtitleSize: 46, subtitleWeight: "bold", subtitleCase: "normal" }, colors: { primary: "#ffffff", accent: "#facc15", shadow: "#000000", panel: "rgba(0,0,0,0.55)" }, rhythm: "medium", effects: "basic" },
  institucional: { name: "Institucional formal", format: "horizontal_16_9", typography: { fontFamily: "Arial", titleSize: 48, subtitleSize: 36, subtitleWeight: "600", subtitleCase: "normal" }, colors: { primary: "#ffffff", accent: "#93c5fd", shadow: "#000000", panel: "rgba(15,23,42,0.72)" }, rhythm: "slow_medium", effects: "minimal" },
  boca_rosa_musica: { name: "Boca Rosa música", format: "vertical_9_16", typography: { fontFamily: "Arial", titleSize: 66, subtitleSize: 44, subtitleWeight: "bold", subtitleCase: "uppercase" }, colors: { primary: "#ffffff", accent: "#fb7185", shadow: "#000000", panel: "rgba(0,0,0,0.48)" }, rhythm: "music_sync", effects: "music" },
  boca_rosa_hablado: { name: "Boca Rosa hablado", format: "vertical_9_16", typography: { fontFamily: "Arial", titleSize: 58, subtitleSize: 46, subtitleWeight: "bold", subtitleCase: "normal" }, colors: { primary: "#ffffff", accent: "#fb7185", shadow: "#000000", panel: "rgba(0,0,0,0.55)" }, rhythm: "medium_fast", effects: "moderate" }
});

function getPresetKey(theme = "generico", themeMode = "standard") {
  if (theme === "boca_rosa") return themeMode === "hablado" ? "boca_rosa_hablado" : "boca_rosa_musica";
  return THEME_PRESETS[theme] ? theme : "generico";
}

function createThemeStylePreset(data = {}) {
  const key = getPresetKey(data.theme || data.selectedTheme || "generico", data.themeMode || data.selectedThemeMode || "standard");
  const base = THEME_PRESETS[key] || THEME_PRESETS.generico;
  return createDefaultStylePreset({ ...base, id: data.id || `preset_${key}`, theme: data.theme || data.selectedTheme || "generico", themeMode: data.themeMode || data.selectedThemeMode || "standard", name: data.name || base.name, format: data.format || base.format });
}

function createDefaultStylePreset(data = {}) {
  return {
    app: "AutoEdit Studio",
    block: "09_subtitulos_capas_y_estilos",
    id: data.id || "preset_default_vertical",
    name: data.name || "Preset vertical profesional",
    theme: data.theme || "generico",
    themeMode: data.themeMode || "standard",
    format: data.format || "vertical_9_16",
    canvas: data.canvas || { width: data.format === "horizontal_16_9" ? 1920 : 1080, height: data.format === "horizontal_16_9" ? 1080 : 1920, background: "#000000" },
    typography: data.typography || { fontFamily: "Arial", titleSize: 56, subtitleSize: 46, subtitleWeight: "bold", subtitleCase: "normal" },
    colors: data.colors || { primary: "#ffffff", accent: "#facc15", shadow: "#000000", panel: "rgba(0,0,0,0.55)" },
    subtitleBox: data.subtitleBox || { position: "bottom", bottomMargin: 230, maxWidthPercent: 86, padding: 24, radius: 18 },
    safeArea: data.safeArea || { top: 120, bottom: 220, left: 80, right: 80 },
    rhythm: data.rhythm || "medium",
    effects: data.effects || "basic",
    status: "READY",
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function createLayer(data = {}) {
  return { id: data.id || `layer_${Date.now()}`, type: data.type || "text", name: data.name || "Capa", text: data.text || "", position: data.position || "center", startSecond: roundSecond(data.startSecond || 0), endSecond: roundSecond(data.endSecond || 5), zIndex: Number(data.zIndex || 1), styleRef: data.styleRef || "preset_default_vertical", resourceRole: data.resourceRole || "", status: data.status || "READY", createdAt: data.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
}

function createLayerCollection(layers = [], context = {}) {
  return { app: "AutoEdit Studio", block: "09_subtitulos_capas_y_estilos", projectId: context.projectId || "", projectName: context.projectName || "", theme: context.theme || "", themeMode: context.themeMode || "", status: layers.length ? "READY" : "EMPTY", count: layers.length, layers, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}

function createStyleSession(subtitles = null, layers = null, preset = null, extras = {}) {
  return { app: "AutoEdit Studio", block: "09_subtitulos_capas_y_estilos", currentSubtitles: subtitles, currentLayers: layers, currentStylePreset: preset, themeResources: extras.themeResources || null, updatedAt: new Date().toISOString() };
}

module.exports = { cleanText, splitSentences, roundSecond, createSubtitleLine, createSubtitleCollection, THEME_PRESETS, getPresetKey, createDefaultStylePreset, createThemeStylePreset, createLayer, createLayerCollection, createStyleSession };

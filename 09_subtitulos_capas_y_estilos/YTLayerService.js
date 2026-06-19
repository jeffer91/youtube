/*
Nombre completo: YTLayerService.js
Ruta: 09_subtitulos_capas_y_estilos/YTLayerService.js
Función o funciones:
  - Generar capas visuales automáticas desde datos del proyecto.
  - Aplicar preset de estilo por temática.
  - Guardar recursos usados por temática.
Se conecta con:
  - YTStyleModel.js
  - YTStyleStore.js
  - YTTranscriptStore.js
  - YTClipStore.js
  - YTProjectService.js
*/

const { saveCurrentProjectChanges } = require("../06_proyectos/YTProjectService");
const { loadProjectAnalysis } = require("../07_transcripcion_y_analisis/YTTranscriptStore");
const { loadProjectClips, loadProjectTimeline } = require("../08_clips_y_timeline/YTClipStore");
const { createLayer, createLayerCollection, createThemeStylePreset } = require("./YTStyleModel");
const { getCurrentProjectRequired, saveLayersToProject, saveStylePresetToProject, saveThemeResourcesToProject, loadStyleSession, loadProjectLayers, loadProjectStylePreset, loadProjectSubtitles } = require("./YTStyleStore");

function optionalRequire(modulePath) {
  try { return require(modulePath); } catch (_error) { return null; }
}

function getPrimaryKeyword(analysis) {
  const keywords = analysis && Array.isArray(analysis.keywords) ? analysis.keywords : [];
  if (!keywords.length) return "Contenido clave";
  return keywords[0].word || keywords[0].text || String(keywords[0]);
}

function getThemeFromOptions(options = {}) {
  const theme = options.selectedTheme || options.theme || "generico";
  const themeMode = options.selectedThemeMode || options.themeMode || "standard";
  return { theme, themeMode };
}

function getThemeResources(options = {}) {
  if (options.themeResources) return options.themeResources;
  const themeService = optionalRequire("../13_organizacion_inteligente/YTThemeService");
  if (!themeService || !themeService.getThemeResourcePlan) return null;
  const { theme, themeMode } = getThemeFromOptions(options);
  return themeService.getThemeResourcePlan(theme, themeMode);
}

function createThemeLayers({ project, analysis, clips, totalDuration, preset, themeResources }) {
  const keyword = getPrimaryKeyword(analysis);
  const layers = [
    createLayer({ id: "layer_hook", type: "text", name: "Gancho inicial", text: keyword.toUpperCase(), position: "top", startSecond: 0, endSecond: Math.min(5, totalDuration), zIndex: 5, styleRef: preset.id }),
    createLayer({ id: "layer_subtitles", type: "subtitles", name: "Subtítulos principales", text: "Subtítulos activos", position: "bottom", startSecond: 0, endSecond: totalDuration, zIndex: 10, styleRef: preset.id }),
    createLayer({ id: "layer_clip_badge", type: "badge", name: "Etiqueta de clip", text: clips.length ? `${clips.length} clips sugeridos` : "Clip sugerido", position: "upper-right", startSecond: 0, endSecond: totalDuration, zIndex: 7, styleRef: preset.id }),
    createLayer({ id: "layer_safe_frame", type: "guide", name: "Guía de zona segura", text: "safe-area", position: "full", startSecond: 0, endSecond: totalDuration, zIndex: 1, styleRef: preset.id, status: "GUIDE" })
  ];

  if (themeResources && Array.isArray(themeResources.items)) {
    const logo = themeResources.items.find((item) => item.role === "logos");
    const overlay = themeResources.items.find((item) => item.role === "overlays");
    if (logo) layers.push(createLayer({ id: "layer_theme_logo", type: "resource", name: "Logo temático", text: logo.preferredPath || "logos", position: "upper-left", startSecond: 0, endSecond: totalDuration, zIndex: 12, styleRef: preset.id, resourceRole: "logos" }));
    if (overlay) layers.push(createLayer({ id: "layer_theme_overlay", type: "resource", name: "Overlay temático", text: overlay.preferredPath || "overlays", position: "full", startSecond: 0, endSecond: totalDuration, zIndex: 3, styleRef: preset.id, resourceRole: "overlays" }));
  }

  return createLayerCollection(layers, { projectId: project.id, projectName: project.name, theme: preset.theme, themeMode: preset.themeMode });
}

function generateLayersFromProjectData(options = {}) {
  const current = getCurrentProjectRequired();
  if (!current.ok) return current;
  const project = current.currentProject;
  const analysisResult = loadProjectAnalysis(project.id);
  const clipsResult = loadProjectClips(project.id);
  const timelineResult = loadProjectTimeline(project.id);
  const analysis = analysisResult.analysis || {};
  const clips = clipsResult.clips && Array.isArray(clipsResult.clips.clips) ? clipsResult.clips.clips : [];
  const totalDuration = timelineResult.timeline ? Number(timelineResult.timeline.totalDurationSeconds || 30) : 30;
  const { theme, themeMode } = getThemeFromOptions(options);
  const preset = createThemeStylePreset({ theme, themeMode });
  const themeResources = getThemeResources(options);
  const collection = createThemeLayers({ project, analysis, clips, totalDuration, preset, themeResources });
  const saved = saveLayersToProject(collection);
  if (!saved.ok) return saved;
  if (themeResources) saveThemeResourcesToProject(themeResources);
  saveCurrentProjectChanges({ layers: { status: collection.status, count: collection.count, layersPath: saved.layersPath, updatedAt: collection.updatedAt }, themeResources });
  return { ok: true, status: "OK", message: "Capas visuales generadas correctamente según la temática.", layers: saved.layers, layersPath: saved.layersPath, themeResources };
}

function applyDefaultStylePreset(options = {}) {
  const current = getCurrentProjectRequired();
  if (!current.ok) return current;
  const project = current.currentProject;
  const { theme, themeMode } = getThemeFromOptions(options);
  const preset = createThemeStylePreset({ theme, themeMode, name: options.name, format: options.format });
  const saved = saveStylePresetToProject(preset);
  if (!saved.ok) return saved;
  const themeResources = getThemeResources(options);
  if (themeResources) saveThemeResourcesToProject(themeResources);
  saveCurrentProjectChanges({ stylePreset: { id: preset.id, name: preset.name, format: preset.format, theme: preset.theme, themeMode: preset.themeMode, stylePath: saved.stylePath, updatedAt: preset.updatedAt }, themeResources });
  return { ok: true, status: "OK", message: "Preset de estilo aplicado correctamente según la temática.", stylePreset: saved.stylePreset, stylePath: saved.stylePath, themeResources, project };
}

function applyThemeStyleAndLayers(options = {}) {
  const preset = applyDefaultStylePreset(options);
  if (!preset.ok) return preset;
  const layers = generateLayersFromProjectData(options);
  return { ok: layers.ok, status: layers.status || "OK", message: layers.ok ? "Estilo y capas por temática aplicados." : layers.message, stylePreset: preset.stylePreset, stylePath: preset.stylePath, layers: layers.layers || null, layersPath: layers.layersPath || "", themeResources: preset.themeResources || layers.themeResources || null };
}

function getCurrentStyleSession() { return loadStyleSession(); }

function getStyleProjectDataForCurrentProject() {
  const current = getCurrentProjectRequired();
  if (!current.ok) return current;
  const project = current.currentProject;
  return { ok: true, status: "OK", project, subtitles: loadProjectSubtitles(project.id), layers: loadProjectLayers(project.id), stylePreset: loadProjectStylePreset(project.id), session: loadStyleSession() };
}

module.exports = { generateLayersFromProjectData, applyDefaultStylePreset, applyThemeStyleAndLayers, getCurrentStyleSession, getStyleProjectDataForCurrentProject };

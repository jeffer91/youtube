/*
Nombre completo: YTClipService.js
Ruta: 08_clips_y_timeline/YTClipService.js
Función o funciones:
  - Generar clips desde análisis, manuales y propuesta inteligente.
  - Crear timeline desde clips actuales.
Se conecta con:
  - YTClipModel.js
  - YTClipStore.js
  - YTTranscriptStore.js
  - YTProjectService.js
*/

const { createClipFromSegment, createManualClip, createClipFromSmartOrderItem, createClipsCollection, createTimelineFromClips } = require("./YTClipModel");
const clipStore = require("./YTClipStore");
const { loadProjectAnalysis, loadProjectTranscript } = require("../07_transcripcion_y_analisis/YTTranscriptStore");
const { saveCurrentProjectChanges } = require("../06_proyectos/YTProjectService");

function ok(message, patch = {}) { return { ok: true, status: patch.status || "OK", message, ...patch }; }
function fail(message, patch = {}) { return { ok: false, status: patch.status || "ERROR", message, ...patch }; }
function toPositiveInt(value, fallback = 8) { const n = Number(value); return !Number.isFinite(n) || n <= 0 ? fallback : Math.max(1, Math.floor(n)); }
function uniqueStrings(list = []) { return Array.from(new Set(list.map((item) => String(item || "").trim()).filter(Boolean))); }
function safeSaveCurrentProjectChanges(patch = {}) { try { if (typeof saveCurrentProjectChanges === "function") saveCurrentProjectChanges(patch); } catch (_error) {} }
function getProjectContext(project, extra = {}) { return { projectId: project && project.id ? project.id : "", projectName: project && project.name ? project.name : "", theme: extra.theme || "", themeMode: extra.themeMode || "" }; }

function normalizeSegment(segment = {}, index = 0) {
  const startSecond = segment.startSecond ?? segment.start ?? segment.startTime ?? segment.fromSecond ?? index * 10;
  const endSecond = segment.endSecond ?? segment.end ?? segment.endTime ?? segment.toSecond ?? Number(startSecond || 0) + 8;
  return { ...segment, startSecond, endSecond, title: segment.title || segment.name || `Clip ${index + 1}`, text: segment.text || segment.phrase || segment.description || segment.summary || "", reason: segment.reason || segment.hook || segment.explanation || "Segmento sugerido desde el análisis textual.", score: Number(segment.score || segment.relevance || segment.priority || 0) };
}

function loadCurrentProjectAnalysis(project, options = {}) {
  if (options.analysis && typeof options.analysis === "object") return { ok: true, status: "OK", analysis: options.analysis, source: "payload" };
  const loaded = loadProjectAnalysis(project.id);
  if (!loaded.ok || !loaded.analysis) return { ok: false, status: "WARNING", analysis: null, source: "project", message: loaded.message || "El proyecto todavía no tiene análisis guardado." };
  return { ok: true, status: "OK", analysis: loaded.analysis, source: "project", analysisPath: loaded.analysisPath };
}

function getBestProjectClips(project) {
  const loadedProjectClips = clipStore.loadProjectClips(project.id);
  if (loadedProjectClips.ok && loadedProjectClips.clips && Array.isArray(loadedProjectClips.clips.clips)) return { ok: true, status: "OK", source: "project", clipsCollection: loadedProjectClips.clips, clips: loadedProjectClips.clips.clips, clipsPath: loadedProjectClips.clipsPath };
  const session = clipStore.loadClipSession();
  if (session.ok && session.currentClips && Array.isArray(session.currentClips.clips) && (!session.currentClips.projectId || session.currentClips.projectId === project.id)) return { ok: true, status: "OK", source: "session", clipsCollection: session.currentClips, clips: session.currentClips.clips, clipsPath: "" };
  return { ok: false, status: "EMPTY", source: "none", clipsCollection: null, clips: [], clipsPath: "", message: "El proyecto todavía no tiene clips." };
}

function generateClipsFromAnalysis(options = {}) {
  const current = clipStore.getCurrentProjectRequired();
  if (!current.ok) return current;
  const project = current.currentProject;
  const context = getProjectContext(project, options);
  const loadedAnalysis = loadCurrentProjectAnalysis(project, options);
  if (!loadedAnalysis.ok || !loadedAnalysis.analysis) return fail("No hay análisis guardado para generar clips.", { status: "WARNING", project, analysis: null, clips: createClipsCollection([], context), clipCount: 0, warnings: ["Primero guarda una transcripción real y genera el análisis antes de crear clips."] });
  const rawSegments = Array.isArray(options.segments) ? options.segments : Array.isArray(loadedAnalysis.analysis.suggestedSegments) ? loadedAnalysis.analysis.suggestedSegments : [];
  if (!rawSegments.length) return fail("No se generaron clips porque el análisis no contiene segmentos sugeridos.", { status: "WARNING", project, analysis: loadedAnalysis.analysis, clips: createClipsCollection([], context), clipCount: 0, warnings: uniqueStrings(["El análisis no tiene segmentos sugeridos para convertir en clips.", ...(loadedAnalysis.analysis.warnings || [])]) });
  const clips = rawSegments.map((segment, index) => normalizeSegment(segment, index)).sort((a, b) => Number(b.score || 0) - Number(a.score || 0)).slice(0, toPositiveInt(options.maxClips, 8)).map((segment, index) => createClipFromSegment(segment, index + 1, context));
  const clipsCollection = { ...createClipsCollection(clips, { ...context, source: "analysis" }), analysisSource: loadedAnalysis.source, analysisPath: loadedAnalysis.analysisPath || "", warnings: uniqueStrings(loadedAnalysis.analysis.warnings || []) };
  const saved = clipStore.saveClipsToProject(clipsCollection);
  if (!saved.ok) return fail(saved.message || "No se pudieron guardar los clips del proyecto.", { status: saved.status || "ERROR", project, error: saved.error || null });
  safeSaveCurrentProjectChanges({ clips: { status: saved.clips.status, count: saved.clips.count, clipCount: saved.clips.count, clipsPath: saved.clipsPath, updatedAt: saved.clips.updatedAt }, suggestedClips: saved.clips.clips });
  return ok("Clips generados correctamente desde el análisis.", { project, clips: saved.clips, clipsPath: saved.clipsPath, clipCount: saved.clips.count, analysis: loadedAnalysis.analysis, warnings: clipsCollection.warnings, session: clipStore.loadClipSession() });
}

function generateClipsFromSmartProposal(options = {}) {
  const current = clipStore.getCurrentProjectRequired();
  if (!current.ok) return current;
  const project = current.currentProject;
  const proposal = options.proposal || options.smartProposal || {};
  const mainProposal = proposal.mainProposal || proposal.main || proposal;
  const order = Array.isArray(options.approvedOrder) && options.approvedOrder.length ? options.approvedOrder : Array.isArray(mainProposal.order) ? mainProposal.order : [];
  const context = getProjectContext(project, { theme: mainProposal.theme || proposal.theme || options.theme, themeMode: mainProposal.themeMode || proposal.themeMode || options.themeMode });
  if (!order.length) return fail("No hay orden inteligente para crear clips.", { status: "WARNING", project, clips: createClipsCollection([], context), clipCount: 0, warnings: ["Primero genera o aprueba una propuesta inteligente."] });
  const clips = order.map((item, index) => createClipFromSmartOrderItem(item, index + 1, context));
  const clipsCollection = createClipsCollection(clips, { ...context, source: "smart_proposal", approvedOrder: order });
  const saved = clipStore.saveClipsToProject(clipsCollection);
  const orderSaved = clipStore.saveApprovedOrderToProject(order);
  if (!saved.ok) return fail(saved.message || "No se pudieron guardar clips inteligentes.", { status: saved.status || "ERROR", project });
  safeSaveCurrentProjectChanges({ clips: { status: saved.clips.status, count: saved.clips.count, clipCount: saved.clips.count, clipsPath: saved.clipsPath, updatedAt: saved.clips.updatedAt }, approvedOrder: orderSaved.approvedOrder, suggestedClips: saved.clips.clips });
  return ok("Clips generados desde la propuesta inteligente.", { project, clips: saved.clips, clipsPath: saved.clipsPath, clipCount: saved.clips.count, approvedOrder: orderSaved.approvedOrder, session: clipStore.loadClipSession() });
}

function addManualClip(options = {}) {
  const current = clipStore.getCurrentProjectRequired();
  if (!current.ok) return current;
  const project = current.currentProject;
  const context = getProjectContext(project, options);
  const loadedClips = getBestProjectClips(project);
  const existingClips = loadedClips.ok ? loadedClips.clips : [];
  const manualClip = createManualClip(options, context);
  const clipsCollection = createClipsCollection([...existingClips, manualClip], { ...context, source: "manual_and_existing" });
  const saved = clipStore.saveClipsToProject(clipsCollection);
  if (!saved.ok) return fail(saved.message || "No se pudo guardar el clip manual.", { status: saved.status || "ERROR", project, error: saved.error || null });
  safeSaveCurrentProjectChanges({ clips: { status: saved.clips.status, count: saved.clips.count, clipCount: saved.clips.count, clipsPath: saved.clipsPath, updatedAt: saved.clips.updatedAt }, suggestedClips: saved.clips.clips });
  return ok("Clip manual agregado correctamente.", { project, clip: manualClip, clips: saved.clips, clipsPath: saved.clipsPath, clipCount: saved.clips.count, session: clipStore.loadClipSession() });
}

function createTimelineFromCurrentClips() {
  const current = clipStore.getCurrentProjectRequired();
  if (!current.ok) return current;
  const project = current.currentProject;
  const context = getProjectContext(project);
  const loadedClips = getBestProjectClips(project);
  if (!loadedClips.ok || !loadedClips.clips.length) return fail("No hay clips para crear el timeline.", { status: "WARNING", project, clips: loadedClips.clipsCollection, timeline: null, clipCount: 0, warnings: ["Primero genera clips desde el análisis, propuesta inteligente o agrega clips manuales."] });
  const timeline = createTimelineFromClips(loadedClips.clips, context);
  const saved = clipStore.saveTimelineToProject(timeline);
  if (!saved.ok) return fail(saved.message || "No se pudo guardar el timeline del proyecto.", { status: saved.status || "ERROR", project, error: saved.error || null });
  safeSaveCurrentProjectChanges({ timeline: { status: saved.timeline.status, clipCount: saved.timeline.clipCount, totalDurationSeconds: saved.timeline.totalDurationSeconds, timelinePath: saved.timelinePath, updatedAt: saved.timeline.updatedAt } });
  return ok("Timeline creado correctamente desde los clips actuales.", { project, clips: loadedClips.clipsCollection, timeline: saved.timeline, timelinePath: saved.timelinePath, clipCount: saved.timeline.clipCount, session: clipStore.loadClipSession() });
}

function saveApprovedOrder(options = {}) {
  const saved = clipStore.saveApprovedOrderToProject(options.approvedOrder || options.order || []);
  return saved.ok ? ok("Orden aprobado guardado.", saved) : saved;
}

function saveDiscardedClips(options = {}) {
  const saved = clipStore.saveDiscardedClipsToProject(options.discardedClips || []);
  return saved.ok ? ok("Clips descartados guardados.", saved) : saved;
}

function getCurrentClipSession() { return clipStore.loadClipSession(); }

function getClipsAndTimelineForCurrentProject() {
  const current = clipStore.getCurrentProjectRequired();
  if (!current.ok) return current;
  const project = current.currentProject;
  return ok("Datos de clips y timeline cargados.", { project, clips: clipStore.loadProjectClips(project.id), timeline: clipStore.loadProjectTimeline(project.id), transcript: loadProjectTranscript(project.id), analysis: loadProjectAnalysis(project.id), session: clipStore.loadClipSession() });
}

module.exports = { generateClipsFromAnalysis, generateClipsFromSmartProposal, addManualClip, createTimelineFromCurrentClips, saveApprovedOrder, saveDiscardedClips, getCurrentClipSession, getClipsAndTimelineForCurrentProject };

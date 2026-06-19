/*
Nombre completo: YTTranscriptService.js
Ruta: 07_transcripcion_y_analisis/YTTranscriptService.js
Función o funciones:
  - Guardar y analizar transcripciones del proyecto actual.
  - Guardar transcripciones individuales por video y transcripción final organizada.
Se conecta con:
  - YTTranscriptModel.js
  - YTTranscriptStore.js
  - YTAnalysisService.js
  - YTProjectService.js
*/

const { saveCurrentProjectChanges } = require("../06_proyectos/YTProjectService");
const { cleanText, countWords, createTranscriptRecord, createTranscriptsByVideoCollection, createOrganizedTranscript } = require("./YTTranscriptModel");
const { analyzeTranscriptText } = require("./YTAnalysisService");
const store = require("./YTTranscriptStore");

function normalizeLanguage(language = "es") {
  const value = String(language || "es").trim().toLowerCase();
  return value || "es";
}

function createTextQuality(text = "") {
  const cleaned = cleanText(text);
  const words = countWords(cleaned);
  const warnings = [];
  if (!cleaned) warnings.push("No hay texto de transcripción para analizar.");
  if (cleaned && words < 20) warnings.push("La transcripción es muy corta; las sugerencias serán limitadas.");
  if (cleaned && !/[.!?¿¡]/.test(cleaned)) warnings.push("La transcripción no contiene puntuación clara; puede reducir la calidad del análisis.");
  return { hasText: Boolean(cleaned), text: cleaned, wordCount: words, status: cleaned ? (warnings.length ? "WARNING" : "READY") : "EMPTY", warnings };
}

function saveTranscriptForCurrentProject(options = {}) {
  const current = store.getCurrentProjectRequired();
  if (!current.ok) return current;
  const project = current.currentProject;
  const quality = createTextQuality(options.text || options.transcriptText || "");
  if (!quality.hasText && options.allowEmpty !== true) return { ok: false, status: "WARNING", message: "No se recibió texto de transcripción. No se guardó una transcripción falsa.", transcript: null, warnings: quality.warnings, project };
  const transcript = createTranscriptRecord({ projectId: project.id, projectName: project.name, source: options.source || "manual", language: normalizeLanguage(options.language || "es"), text: quality.text, qualityStatus: quality.status, warnings: quality.warnings });
  const saved = store.saveTranscriptToProject(transcript);
  if (!saved.ok) return saved;
  saveCurrentProjectChanges({ transcript: { status: transcript.status, qualityStatus: quality.status, wordCount: transcript.wordCount, source: transcript.source, language: transcript.language, transcriptPath: saved.transcriptPath, warnings: quality.warnings, updatedAt: transcript.updatedAt } });
  return { ok: quality.hasText, status: quality.hasText ? (quality.warnings.length ? "WARNING" : "OK") : "WARNING", message: quality.hasText ? "Transcripción guardada correctamente." : "Transcripción vacía guardada como pendiente.", transcript: saved.transcript, transcriptPath: saved.transcriptPath, warnings: quality.warnings, session: saved.session };
}

function normalizeAnalysis(analysis = {}, transcript = null) {
  const warnings = Array.isArray(analysis.warnings) ? analysis.warnings.slice() : [];
  const suggestedSegments = Array.isArray(analysis.suggestedSegments) ? analysis.suggestedSegments : [];
  const importantPhrases = Array.isArray(analysis.importantPhrases) ? analysis.importantPhrases : [];
  if (!suggestedSegments.length) warnings.push("No se detectaron segmentos sugeridos suficientes.");
  if (!importantPhrases.length) warnings.push("No se detectaron frases fuertes suficientes.");
  if (transcript && Number(transcript.wordCount || 0) < 20) warnings.push("La transcripción es corta; el análisis puede ser poco preciso.");
  return { ...analysis, status: suggestedSegments.length ? (warnings.length ? "WARNING" : "READY") : "WARNING", suggestedSegments, importantPhrases, warnings: Array.from(new Set(warnings)) };
}

function analyzeCurrentTranscript() {
  const current = store.getCurrentProjectRequired();
  if (!current.ok) return current;
  const project = current.currentProject;
  const loaded = store.loadProjectTranscript(project.id);
  if (!loaded.ok || !loaded.transcript || !cleanText(loaded.transcript.text)) return { ok: false, status: "WARNING", message: "No hay una transcripción real guardada para analizar.", project, transcript: loaded.transcript || null, warnings: ["La app necesita texto de transcripción antes de crear ganchos, frases y clips reales."] };
  const baseAnalysis = analyzeTranscriptText(loaded.transcript.text, { projectId: project.id, projectName: project.name });
  const analysis = normalizeAnalysis(baseAnalysis, loaded.transcript);
  const saved = store.saveAnalysisToProject(analysis);
  if (!saved.ok) return saved;
  saveCurrentProjectChanges({ analysis: { status: analysis.status, summary: analysis.summary, wordCount: analysis.wordCount, sentenceCount: analysis.sentenceCount, keywords: analysis.keywords, importantPhrases: analysis.importantPhrases, suggestedSegments: analysis.suggestedSegments, warnings: analysis.warnings, analysisPath: saved.analysisPath, updatedAt: analysis.updatedAt } });
  return { ok: true, status: analysis.status === "READY" ? "OK" : "WARNING", message: analysis.suggestedSegments.length ? "Análisis generado correctamente." : "Análisis generado con advertencias.", transcript: loaded.transcript, analysis: saved.analysis, analysisPath: saved.analysisPath, warnings: analysis.warnings, session: saved.session };
}

function saveAndAnalyzeTranscriptForCurrentProject(options = {}) {
  const saved = saveTranscriptForCurrentProject(options);
  if (!saved.ok) return saved;
  const analyzed = analyzeCurrentTranscript();
  return { ok: analyzed.ok, status: analyzed.status, message: analyzed.message, transcript: saved.transcript, transcriptPath: saved.transcriptPath, analysis: analyzed.analysis || null, analysisPath: analyzed.analysisPath || "", warnings: [...(saved.warnings || []), ...(analyzed.warnings || [])], session: analyzed.session || saved.session };
}

function saveTranscriptsByVideoForCurrentProject(options = {}) {
  const current = store.getCurrentProjectRequired();
  if (!current.ok) return current;
  const project = current.currentProject;
  const collection = createTranscriptsByVideoCollection(options.transcriptsByVideo || options.items || [], { projectId: project.id, projectName: project.name });
  const saved = store.saveTranscriptsByVideoToProject(collection);
  if (!saved.ok) return saved;
  saveCurrentProjectChanges({ transcriptsByVideo: { status: collection.status, count: collection.count, wordCount: collection.wordCount, path: saved.transcriptsByVideoPath, updatedAt: collection.updatedAt } });
  return { ok: true, status: collection.status === "READY" ? "OK" : "WARNING", message: "Transcripciones por video guardadas.", transcriptsByVideo: saved.transcriptsByVideo, transcriptsByVideoPath: saved.transcriptsByVideoPath, session: saved.session };
}

function saveOrganizedTranscriptForCurrentProject(options = {}) {
  const current = store.getCurrentProjectRequired();
  if (!current.ok) return current;
  const project = current.currentProject;
  const organized = createOrganizedTranscript({ ...options, projectId: project.id, projectName: project.name });
  const saved = store.saveOrganizedTranscriptToProject(organized);
  if (!saved.ok) return saved;
  saveCurrentProjectChanges({ organizedTranscript: { status: organized.status, wordCount: organized.wordCount, path: saved.organizedTranscriptPath, updatedAt: organized.updatedAt } });
  return { ok: true, status: organized.status === "READY" ? "OK" : "WARNING", message: "Transcripción organizada guardada.", organizedTranscript: saved.organizedTranscript, organizedTranscriptPath: saved.organizedTranscriptPath, session: saved.session };
}

function buildOrganizedTranscriptFromVideos(options = {}) {
  const items = Array.isArray(options.transcriptsByVideo) ? options.transcriptsByVideo : [];
  const order = Array.isArray(options.order) && options.order.length ? options.order : items.map((item, index) => ({ videoId: item.videoId, order: index + 1, name: item.videoName }));
  const ordered = order.map((entry) => items.find((item) => item.videoId === entry.videoId || item.videoName === entry.name)).filter(Boolean);
  const remaining = items.filter((item) => !ordered.includes(item));
  const finalItems = [...ordered, ...remaining];
  const text = finalItems.map((item, index) => `Video ${index + 1}: ${item.videoName || item.name || "Sin nombre"}\n${item.text || item.summary || "Transcripción pendiente."}`).join("\n\n");
  return createOrganizedTranscript({ text, summary: options.summary || `${finalItems.length} video(s) organizados para revisión.`, order });
}

function getCurrentTranscriptSession() { return store.loadTranscriptSession(); }

function getTranscriptAndAnalysisForCurrentProject() {
  const current = store.getCurrentProjectRequired();
  if (!current.ok) return current;
  const project = current.currentProject;
  return { ok: true, status: "OK", project, transcript: store.loadProjectTranscript(project.id), analysis: store.loadProjectAnalysis(project.id), transcriptsByVideo: store.loadProjectTranscriptsByVideo(project.id), organizedTranscript: store.loadProjectOrganizedTranscript(project.id), session: store.loadTranscriptSession() };
}

module.exports = { saveTranscriptForCurrentProject, saveAndAnalyzeTranscriptForCurrentProject, analyzeCurrentTranscript, saveTranscriptsByVideoForCurrentProject, saveOrganizedTranscriptForCurrentProject, buildOrganizedTranscriptFromVideos, getCurrentTranscriptSession, getTranscriptAndAnalysisForCurrentProject, createTextQuality };

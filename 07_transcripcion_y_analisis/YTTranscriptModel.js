/*
Nombre completo: YTTranscriptModel.js
Ruta: 07_transcripcion_y_analisis/YTTranscriptModel.js
Función o funciones:
  - Modelar transcripciones individuales por video.
  - Modelar transcripción final organizada.
  - Mantener compatibilidad con transcripción y análisis actuales.
Se conecta con:
  - YTTranscriptService.js
  - YTTranscriptStore.js
  - YTWorkflowService.js
*/

function cleanText(text) {
  return String(text || "").replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function countWords(text) {
  const cleaned = cleanText(text);
  return cleaned ? cleaned.split(/\s+/).filter(Boolean).length : 0;
}

function createTranscriptRecord(data = {}) {
  const text = cleanText(data.text || "");
  return {
    id: data.id || "transcript_" + Date.now(),
    block: "07_transcripcion_y_analisis",
    projectId: data.projectId || "",
    projectName: data.projectName || "",
    source: data.source || "manual",
    language: data.language || "es",
    text,
    wordCount: countWords(text),
    qualityStatus: data.qualityStatus || (text ? "READY" : "EMPTY"),
    status: data.status || (text ? "READY" : "EMPTY"),
    warnings: Array.isArray(data.warnings) ? data.warnings : [],
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function createVideoTranscriptRecord(data = {}, index = 0) {
  const text = cleanText(data.text || data.transcript || "");
  const summary = cleanText(data.summary || (text ? text.slice(0, 280) : "Transcripción pendiente."));
  return {
    id: data.id || `video_transcript_${index + 1}_${Date.now()}`,
    block: "07_transcripcion_y_analisis",
    projectId: data.projectId || "",
    projectName: data.projectName || "",
    videoId: data.videoId || data.idVideo || `video_${index + 1}`,
    videoName: data.videoName || data.name || `Video ${index + 1}`,
    videoPath: data.videoPath || data.path || "",
    order: Number.isFinite(Number(data.order)) ? Number(data.order) : index + 1,
    source: data.source || "workflow_video",
    language: data.language || "es",
    text,
    summary,
    wordCount: countWords(text),
    audioStatus: data.audioStatus || "UNKNOWN",
    audioPath: data.audioPath || "",
    status: data.status || (text ? "READY" : "PENDING_REAL_TRANSCRIPTION"),
    warnings: Array.isArray(data.warnings) ? data.warnings : [],
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function createTranscriptsByVideoCollection(items = [], context = {}) {
  const transcriptsByVideo = (Array.isArray(items) ? items : []).map((item, index) => createVideoTranscriptRecord({ ...item, projectId: context.projectId || item.projectId, projectName: context.projectName || item.projectName }, index));
  const fullText = transcriptsByVideo.map((item) => item.text).filter(Boolean).join("\n\n");
  return {
    app: "AutoEdit Studio",
    block: "07_transcripcion_y_analisis",
    projectId: context.projectId || "",
    projectName: context.projectName || "",
    status: transcriptsByVideo.some((item) => item.text) ? "READY" : "PENDING_REAL_TRANSCRIPTION",
    count: transcriptsByVideo.length,
    transcriptsByVideo,
    wordCount: countWords(fullText),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function createOrganizedTranscript(data = {}) {
  const text = cleanText(data.text || "");
  return {
    id: data.id || "organized_transcript_" + Date.now(),
    block: "07_transcripcion_y_analisis",
    projectId: data.projectId || "",
    projectName: data.projectName || "",
    status: data.status || (text ? "READY" : "PENDING_REAL_TRANSCRIPTION"),
    summary: cleanText(data.summary || "Transcripción final organizada pendiente."),
    text,
    wordCount: countWords(text),
    order: Array.isArray(data.order) ? data.order : [],
    warnings: Array.isArray(data.warnings) ? data.warnings : [],
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function createAnalysisRecord(data = {}) {
  return {
    id: data.id || "analysis_" + Date.now(),
    block: "07_transcripcion_y_analisis",
    projectId: data.projectId || "",
    projectName: data.projectName || "",
    status: data.status || "READY",
    summary: data.summary || "",
    wordCount: data.wordCount || 0,
    sentenceCount: data.sentenceCount || 0,
    keywords: Array.isArray(data.keywords) ? data.keywords : [],
    importantPhrases: Array.isArray(data.importantPhrases) ? data.importantPhrases : [],
    suggestedSegments: Array.isArray(data.suggestedSegments) ? data.suggestedSegments : [],
    warnings: Array.isArray(data.warnings) ? data.warnings : [],
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function createTranscriptSession(transcript = null, analysis = null, extras = {}) {
  return {
    app: "AutoEdit Studio",
    block: "07_transcripcion_y_analisis",
    currentTranscript: transcript,
    currentAnalysis: analysis,
    transcriptsByVideo: extras.transcriptsByVideo || null,
    organizedTranscript: extras.organizedTranscript || null,
    updatedAt: new Date().toISOString()
  };
}

module.exports = {
  cleanText,
  countWords,
  createTranscriptRecord,
  createVideoTranscriptRecord,
  createTranscriptsByVideoCollection,
  createOrganizedTranscript,
  createAnalysisRecord,
  createTranscriptSession
};

/*
Nombre completo: YTTranscriptionEngineService.js
Ruta: 07_transcripcion_y_analisis/YTTranscriptionEngineService.js
Función o funciones:
  - Preparar transcripción por video.
  - Usar texto manual si llega desde la interfaz.
  - Devolver estructura segura hasta conectar motor real de audio.
Se conecta con:
  - YTAudioExtractService.js
  - YTWorkflowService.js
  - YTTranscriptStore.js
*/

const audioService = require("./YTAudioExtractService");

function countWords(text = "") {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}

function normalizeManualTranscript(video = {}, options = {}) {
  const byVideo = options.transcriptsByVideo || options.manualTranscripts || [];
  const found = Array.isArray(byVideo)
    ? byVideo.find((item) => item.videoId === video.id || item.videoName === video.name || item.name === video.name)
    : null;
  return String((found && (found.text || found.transcript)) || options.transcriptText || options.text || "").trim();
}

async function transcribeVideoBasic(video = {}, options = {}) {
  const manualText = normalizeManualTranscript(video, options);
  const audio = audioService.prepareAudioForVideo(video, { extractAudio: options.extractAudio === true });

  if (manualText) {
    return {
      id: `transcript_${video.id || Date.now()}`,
      videoId: video.id || "",
      videoName: video.name || "Video",
      status: "MANUAL_TEXT",
      text: manualText,
      summary: manualText.slice(0, 260),
      wordCount: countWords(manualText),
      audio,
      language: options.language || "es",
      createdAt: new Date().toISOString()
    };
  }

  return {
    id: `transcript_${video.id || Date.now()}`,
    videoId: video.id || "",
    videoName: video.name || "Video",
    status: "PENDING_REAL_TRANSCRIPTION",
    text: "",
    summary: "Transcripción real pendiente. Se preparó la estructura por video para Gemini y revisión.",
    wordCount: 0,
    audio,
    language: options.language || "es",
    createdAt: new Date().toISOString()
  };
}

async function transcribeVideoList(videos = [], options = {}) {
  const results = [];
  for (let index = 0; index < videos.length; index += 1) {
    results.push(await transcribeVideoBasic(videos[index], { ...options, index }));
  }
  return {
    ok: true,
    status: "OK",
    message: `${results.length} transcripción(es) preparadas.`,
    transcriptsByVideo: results
  };
}

module.exports = {
  countWords,
  transcribeVideoBasic,
  transcribeVideoList
};

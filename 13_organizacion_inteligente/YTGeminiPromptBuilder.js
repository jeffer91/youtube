/*
Nombre completo: YTGeminiPromptBuilder.js
Ruta: 13_organizacion_inteligente/YTGeminiPromptBuilder.js
Función o funciones:
  - Construir el prompt que se envía a Gemini.
  - Incluir temática, videos, transcripciones y descripciones visuales.
  - Pedir respuesta JSON estricta para usarla en la app.
Se conecta con:
  - YTGeminiClient.js
  - YTThemeConfig.js
  - YTSmartOrganizerService.js
*/

const { getThemeConfig } = require("./YTThemeConfig");
const { getGeminiInternalConfig } = require("./YTGeminiConfigStore");

function clampText(text, maxLength) {
  const value = String(text || "");
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength) + "\n[Texto recortado por límite de seguridad]";
}

function summarizeVideo(video = {}, index = 0, transcripts = [], visuals = []) {
  const transcript = transcripts.find((item) => item.videoId === video.id || item.videoName === video.name) || {};
  const visual = visuals.find((item) => item.videoId === video.id || item.videoName === video.name) || {};

  return {
    index: index + 1,
    id: video.id || `video_${index + 1}`,
    name: video.name || `Video ${index + 1}`,
    originalOrder: video.order || index + 1,
    duration: video.duration || "",
    durationSeconds: Number(video.durationSeconds || 0),
    transcription: transcript.text || transcript.summary || "Sin transcripción real disponible.",
    visualDescription: visual.summary || "Sin descripción visual real disponible.",
    scenes: Array.isArray(visual.scenes) ? visual.scenes.slice(0, 12) : []
  };
}

function buildExpectedJsonSchema() {
  return {
    mainProposal: {
      summary: "Resumen corto de la propuesta principal.",
      order: [
        {
          videoId: "id del video",
          name: "nombre del video",
          order: 1,
          role: "Gancho inicial | Desarrollo | Cierre | Visual fuerte | Otro",
          reason: "Explicación corta de por qué va en esta posición.",
          confidence: "high | medium | low"
        }
      ],
      hooks: ["ganchos sugeridos"],
      suggestedCuts: ["cortes o secciones sugeridas"],
      warnings: ["advertencias"]
    },
    alternativeProposal: {
      summary: "Resumen corto de alternativa.",
      order: []
    }
  };
}

function buildGeminiPrompt(payload = {}) {
  const config = getGeminiInternalConfig();
  const mediaItems = Array.isArray(payload.mediaItems) ? payload.mediaItems : [];
  const transcripts = Array.isArray(payload.transcriptsByVideo) ? payload.transcriptsByVideo : [];
  const visuals = Array.isArray(payload.visualDescriptions) ? payload.visualDescriptions : [];
  const themeConfig = getThemeConfig(payload.selectedTheme || payload.theme, payload.selectedThemeMode || payload.themeMode);

  const videos = mediaItems.map((video, index) => summarizeVideo(video, index, transcripts, visuals));
  const instruction = {
    app: "AutoEdit Studio",
    task: "Organizar un video final a partir de uno o varios videos cargados.",
    importantRules: [
      "No inventes videos que no estén en la lista.",
      "Respeta todos los videoId recibidos.",
      "Devuelve una propuesta principal y una alternativa.",
      "Explica de forma corta por qué cada video va en esa posición.",
      "Si el contenido es hablado, prioriza transcripción y continuidad del mensaje.",
      "Si el contenido es musical o visual, prioriza energía visual, ritmo, cambios de plano y presencia.",
      "La exportación será para todas las redes; no limites la propuesta a una sola plataforma.",
      "Devuelve solo JSON válido. No uses markdown."
    ],
    theme: {
      id: themeConfig.id,
      mode: themeConfig.selectedMode,
      label: themeConfig.selectedLabel,
      description: themeConfig.selectedDescription,
      editRules: themeConfig.editRules
    },
    videos,
    expectedJson: buildExpectedJsonSchema()
  };

  return clampText(JSON.stringify(instruction, null, 2), Number(config.maxInputCharacters || 28000));
}

module.exports = {
  buildGeminiPrompt,
  buildExpectedJsonSchema
};

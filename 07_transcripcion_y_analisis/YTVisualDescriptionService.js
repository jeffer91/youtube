/*
Nombre completo: YTVisualDescriptionService.js
Ruta: 07_transcripcion_y_analisis/YTVisualDescriptionService.js
Función o funciones:
  - Convertir frames en descripciones visuales ligeras para Gemini.
  - Preparar escenas por segundo, energía y movimiento estimados.
  - Evitar enviar videos completos a Gemini.
Se conecta con:
  - YTFrameCaptureService.js
  - YTWorkflowService.js
  - YTGeminiPromptBuilder.js
*/

function estimateEnergy(video = {}, frames = []) {
  const name = String(video.name || "").toLowerCase();
  if (name.includes("musica") || name.includes("baile") || name.includes("show") || name.includes("boca")) return "alta";
  if (name.includes("institucional") || name.includes("formal")) return "moderada";
  if (frames.length > 8) return "media";
  return "desconocida";
}

function estimateMovement(video = {}, frames = []) {
  const name = String(video.name || "").toLowerCase();
  if (name.includes("futbol") || name.includes("11") || name.includes("partido")) return "alto";
  if (name.includes("clase") || name.includes("aula") || name.includes("institucional")) return "bajo_medio";
  if (frames.length > 6) return "medio";
  return "desconocido";
}

function describeFrame(video = {}, frame = {}, index = 0, context = {}) {
  const theme = String(context.selectedTheme || context.theme || "generico");
  let base = "Escena del video pendiente de análisis visual avanzado.";

  if (theme === "11_contra_11") base = "Posible escena deportiva o de fútbol; revisar jugada, movimiento y energía.";
  if (theme === "crece_aula") base = "Posible escena educativa; revisar claridad del expositor, pizarra, diapositiva o explicación.";
  if (theme === "institucional") base = "Posible escena institucional; revisar formalidad, encuadre, iluminación y limpieza visual.";
  if (theme === "boca_rosa") base = "Posible escena de Boca Rosa; revisar presencia del grupo, ritmo, baile, escenario o mensaje.";

  return {
    id: frame.id || `scene_${index + 1}`,
    second: Number(frame.second || 0),
    framePath: frame.path || "",
    description: base,
    movement: estimateMovement(video, [frame]),
    energy: estimateEnergy(video, [frame]),
    quality: frame.path ? "captured" : "placeholder"
  };
}

function describeVideoFrames(video = {}, frames = [], options = {}) {
  const list = Array.isArray(frames) ? frames : [];
  const scenes = list.map((frame, index) => describeFrame(video, frame, index, options));
  const energy = estimateEnergy(video, list);
  const movement = estimateMovement(video, list);

  return {
    id: `visual_${video.id || Date.now()}`,
    videoId: video.id || "",
    videoName: video.name || "Video",
    status: list.some((frame) => frame.path) ? "DESCRIBED_FROM_CAPTURED_FRAMES" : "BASIC_DESCRIPTION",
    frameCaptureSeconds: Number(options.frameCaptureSeconds || options.intervalSeconds || 5),
    summary: `Descripción visual básica: energía ${energy}, movimiento ${movement}, ${scenes.length} escena(s) analizada(s).`,
    scenes,
    energy,
    movement,
    createdAt: new Date().toISOString()
  };
}

function describeVideoList(videos = [], frameResults = [], options = {}) {
  const results = videos.map((video, index) => {
    const found = frameResults.find((item) => item.videoId === video.id || item.videoName === video.name) || frameResults[index] || {};
    return describeVideoFrames(video, found.frames || [], options);
  });

  return {
    ok: true,
    status: "OK",
    message: `${results.length} descripción(es) visual(es) generadas.`,
    visualDescriptions: results
  };
}

module.exports = {
  estimateEnergy,
  estimateMovement,
  describeFrame,
  describeVideoFrames,
  describeVideoList
};

/*
Nombre completo: YTGeminiResponseParser.js
Ruta: 13_organizacion_inteligente/YTGeminiResponseParser.js
Función o funciones:
  - Convertir la respuesta de Gemini en JSON usable.
  - Validar propuesta principal y alternativa.
  - Usar propuesta local si Gemini responde mal.
Se conecta con:
  - YTGeminiClient.js
  - YTSmartOrganizerModel.js
  - YTSmartOrganizerService.js
*/

const { normalizeGeminiProposal, createSmartProposal } = require("./YTSmartOrganizerModel");

function stripCodeFence(text) {
  return String(text || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function extractJsonText(text) {
  const value = stripCodeFence(text);
  if (!value) return "";
  if (value.startsWith("{") && value.endsWith("}")) return value;
  const first = value.indexOf("{");
  const last = value.lastIndexOf("}");
  if (first >= 0 && last > first) return value.slice(first, last + 1);
  return value;
}

function safeParseJson(text) {
  try {
    const jsonText = extractJsonText(text);
    return { ok: true, data: JSON.parse(jsonText) };
  } catch (error) {
    return { ok: false, error: error.message || String(error), data: null };
  }
}

function normalizeOrder(order = [], mediaItems = []) {
  const list = Array.isArray(order) ? order : [];
  return list.map((item, index) => {
    const videoId = item.videoId || item.id || item.sourceVideoId || "";
    const found = mediaItems.find((video) => video.id === videoId || video.name === item.name) || {};
    return {
      id: videoId || found.id || `video_${index + 1}`,
      videoId: videoId || found.id || `video_${index + 1}`,
      name: item.name || found.name || `Video ${index + 1}`,
      order: Number(item.order || index + 1),
      role: item.role || "Desarrollo",
      reason: item.reason || "Sugerido por Gemini.",
      confidence: item.confidence || "medium",
      status: "SUGGESTED"
    };
  });
}

function normalizeProposalShape(raw = {}, fallbackPayload = {}) {
  const mediaItems = Array.isArray(fallbackPayload.mediaItems) ? fallbackPayload.mediaItems : [];
  const main = raw.mainProposal || raw.main || {};
  const alternative = raw.alternativeProposal || raw.alternative || {};

  const normalizedRaw = {
    ...raw,
    mainProposal: {
      ...main,
      summary: main.summary || "Propuesta principal generada con Gemini.",
      order: normalizeOrder(main.order || main.videoOrder || [], mediaItems),
      hooks: Array.isArray(main.hooks) ? main.hooks : [],
      suggestedCuts: Array.isArray(main.suggestedCuts) ? main.suggestedCuts : [],
      warnings: Array.isArray(main.warnings) ? main.warnings : []
    },
    alternativeProposal: {
      ...alternative,
      summary: alternative.summary || "Propuesta alternativa generada con Gemini.",
      order: normalizeOrder(alternative.order || alternative.videoOrder || [], mediaItems)
    },
    warnings: Array.isArray(raw.warnings) ? raw.warnings : []
  };

  if (!normalizedRaw.mainProposal.order.length) {
    return createSmartProposal({ ...fallbackPayload, warnings: ["Gemini no devolvió orden principal usable."] });
  }

  if (!normalizedRaw.alternativeProposal.order.length) {
    normalizedRaw.alternativeProposal.order = normalizedRaw.mainProposal.order;
    normalizedRaw.alternativeProposal.summary = "Alternativa no diferenciada; se conserva orden principal.";
  }

  return normalizeGeminiProposal(normalizedRaw, fallbackPayload);
}

function parseGeminiOrganizationResponse(text, fallbackPayload = {}) {
  const parsed = safeParseJson(text);
  if (!parsed.ok) {
    const local = createSmartProposal(fallbackPayload);
    return {
      ok: false,
      status: "PARSE_ERROR",
      message: "No se pudo interpretar la respuesta JSON de Gemini. Se usó propuesta local.",
      error: parsed.error,
      proposal: local,
      usedFallback: true
    };
  }

  const proposal = normalizeProposalShape(parsed.data, fallbackPayload);
  return {
    ok: true,
    status: "OK",
    message: "Respuesta de Gemini interpretada correctamente.",
    proposal,
    usedFallback: false
  };
}

module.exports = {
  stripCodeFence,
  extractJsonText,
  safeParseJson,
  normalizeOrder,
  normalizeProposalShape,
  parseGeminiOrganizationResponse
};

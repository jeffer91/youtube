/*
Nombre completo: YTSmartOrganizerService.js
Ruta: 13_organizacion_inteligente/YTSmartOrganizerService.js
Función o funciones:
  - Organizar videos por temática usando Gemini cuando esté disponible.
  - Usar modo local básico si Gemini falla, no tiene clave o no hay internet.
  - Guardar propuesta principal y alternativa.
Se conecta con:
  - YTGeminiPromptBuilder.js
  - YTGeminiClient.js
  - YTGeminiResponseParser.js
  - YTSmartOrganizerModel.js
  - YTSmartOrganizerStore.js
*/

const { buildGeminiPrompt } = require("./YTGeminiPromptBuilder");
const { generateOrganization } = require("./YTGeminiClient");
const { parseGeminiOrganizationResponse } = require("./YTGeminiResponseParser");
const { createSmartProposal } = require("./YTSmartOrganizerModel");
const store = require("./YTSmartOrganizerStore");
const { getGeminiInternalConfig } = require("./YTGeminiConfigStore");

function normalizePayload(payload = {}) {
  return {
    projectId: payload.projectId || "",
    projectName: payload.projectName || "",
    mediaItems: Array.isArray(payload.mediaItems) ? payload.mediaItems : [],
    mediaMode: payload.mediaMode || "",
    selectedTheme: payload.selectedTheme || payload.theme || "generico",
    selectedThemeMode: payload.selectedThemeMode || payload.themeMode || "standard",
    selectedThemeLabel: payload.selectedThemeLabel || payload.themeLabel || "",
    transcriptsByVideo: Array.isArray(payload.transcriptsByVideo) ? payload.transcriptsByVideo : [],
    visualDescriptions: Array.isArray(payload.visualDescriptions) ? payload.visualDescriptions : [],
    useGemini: payload.useGemini !== false,
    workflow: payload.workflow || null
  };
}

async function organizeWithGemini(payload = {}) {
  const normalized = normalizePayload(payload);
  const config = getGeminiInternalConfig();
  const prompt = buildGeminiPrompt(normalized);

  if (!normalized.useGemini || !config.enabled || !config.apiKey) {
    const localProposal = createSmartProposal(normalized);
    const saved = store.saveSmartOrganization({
      projectId: normalized.projectId,
      projectName: normalized.projectName,
      organization: localProposal,
      source: "basic_local",
      prompt,
      workflow: normalized.workflow
    });
    return {
      ok: true,
      status: "WARNING",
      message: "Gemini no está disponible. Se generó propuesta local básica.",
      proposal: localProposal,
      smartProposal: localProposal,
      usedFallback: true,
      prompt,
      saved
    };
  }

  const gemini = await generateOrganization(prompt, config);

  if (!gemini.ok) {
    const localProposal = createSmartProposal(normalized);
    const saved = store.saveSmartOrganization({
      projectId: normalized.projectId,
      projectName: normalized.projectName,
      organization: localProposal,
      source: "basic_local_after_gemini_failure",
      prompt,
      gemini,
      workflow: normalized.workflow
    });
    return {
      ok: true,
      status: "WARNING",
      message: "Gemini falló. Se generó propuesta local básica.",
      proposal: localProposal,
      smartProposal: localProposal,
      usedFallback: true,
      gemini,
      prompt,
      saved
    };
  }

  const parsed = parseGeminiOrganizationResponse(gemini.text, normalized);
  const proposal = parsed.proposal;
  const saved = store.saveSmartOrganization({
    projectId: normalized.projectId,
    projectName: normalized.projectName,
    organization: proposal,
    source: parsed.usedFallback ? "parsed_with_fallback" : "gemini",
    prompt,
    gemini,
    workflow: normalized.workflow
  });

  return {
    ok: true,
    status: parsed.usedFallback ? "WARNING" : "OK",
    message: parsed.usedFallback ? "Gemini respondió, pero se usó fallback por formato inválido." : "Organización inteligente generada con Gemini.",
    proposal,
    smartProposal: proposal,
    usedFallback: parsed.usedFallback,
    gemini,
    parser: parsed,
    prompt,
    saved
  };
}

function organizeLocal(payload = {}) {
  const normalized = normalizePayload(payload);
  const proposal = createSmartProposal(normalized);
  const saved = store.saveSmartOrganization({
    projectId: normalized.projectId,
    projectName: normalized.projectName,
    organization: proposal,
    source: "basic_local",
    workflow: normalized.workflow
  });
  return {
    ok: true,
    status: "OK",
    message: "Organización local básica generada.",
    proposal,
    smartProposal: proposal,
    usedFallback: true,
    saved
  };
}

function getCurrentOrganization() {
  return store.loadCurrentSmartOrganization();
}

function getProjectOrganization(projectId = "") {
  return store.loadSmartOrganizationByProject(projectId);
}

module.exports = {
  normalizePayload,
  organizeWithGemini,
  organizeLocal,
  getCurrentOrganization,
  getProjectOrganization
};

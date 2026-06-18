/*
Nombre completo: YTGeminiClient.js
Ruta: 13_organizacion_inteligente/YTGeminiClient.js
Función o funciones:
  - Comunicarse con Gemini usando la API key local.
  - Enviar solo texto preparado: transcripciones, datos de videos y descripciones visuales.
  - Devolver respuesta segura o fallback si no hay internet/API key.
Se conecta con:
  - YTGeminiConfigStore.js
  - YTGeminiPromptBuilder.js
  - YTSmartOrganizerService.js
*/

const https = require("https");
const { getGeminiInternalConfig } = require("./YTGeminiConfigStore");

function createResult(ok, status, message, extra = {}) {
  return { ok, status, message, ...extra, createdAt: new Date().toISOString() };
}

function postJson(url, body, timeoutMs = 45000) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const data = JSON.stringify(body);

    const req = https.request({
      hostname: target.hostname,
      path: target.pathname + target.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data)
      },
      timeout: timeoutMs
    }, (res) => {
      let raw = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { raw += chunk; });
      res.on("end", () => {
        let parsed = null;
        try { parsed = raw ? JSON.parse(raw) : null; } catch (_error) { parsed = { raw }; }
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
        else reject(new Error(parsed && parsed.error && parsed.error.message ? parsed.error.message : `Gemini respondió HTTP ${res.statusCode}`));
      });
    });

    req.on("timeout", () => {
      req.destroy(new Error("Tiempo de espera agotado al consultar Gemini."));
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function extractGeminiText(response) {
  const candidates = response && Array.isArray(response.candidates) ? response.candidates : [];
  const parts = candidates[0] && candidates[0].content && Array.isArray(candidates[0].content.parts) ? candidates[0].content.parts : [];
  return parts.map((part) => part.text || "").join("\n").trim();
}

async function generateOrganization(prompt, options = {}) {
  const config = getGeminiInternalConfig();

  if (!config.enabled) {
    return createResult(false, "DISABLED", "Gemini está desactivado. Se debe usar organización local.", { shouldFallback: true });
  }

  if (!config.apiKey) {
    return createResult(false, "NO_API_KEY", "No hay API key de Gemini configurada. Se debe usar organización local.", { shouldFallback: true });
  }

  const model = options.model || config.model || "gemini-1.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(config.apiKey)}`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: String(prompt || "") }]
      }
    ],
    generationConfig: {
      temperature: Number(options.temperature ?? config.temperature),
      topP: Number(options.topP ?? config.topP),
      responseMimeType: "application/json"
    }
  };

  try {
    const response = await postJson(endpoint, body, Number(options.timeoutMs || config.timeoutMs));
    const text = extractGeminiText(response);
    if (!text) {
      return createResult(false, "EMPTY_RESPONSE", "Gemini no devolvió texto usable.", { shouldFallback: true, raw: response });
    }
    return createResult(true, "OK", "Gemini generó una propuesta de organización.", { text, raw: response, model });
  } catch (error) {
    return createResult(false, "ERROR", error.message || String(error), { shouldFallback: true });
  }
}

module.exports = {
  generateOrganization,
  extractGeminiText
};

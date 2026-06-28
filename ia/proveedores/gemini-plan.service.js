/*
  Bloque 3 - Proveedor Gemini gratis para Plan
  Función: enviar contexto de Plan a Gemini y normalizar la respuesta.
*/

import { obtenerConfigIAPlan } from '../ia.config.js';
import { extraerJsonDesdeTexto, normalizarRespuestaPlanIA } from '../normalizar-respuesta-ia.service.js';

async function fetchConTimeout(url, opcionesFetch = {}, timeoutMs = 90000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opcionesFetch, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function crearEndpoint({ endpointBase, modelo, apiKey }) {
  return `${endpointBase}/${encodeURIComponent(modelo)}:generateContent?key=${encodeURIComponent(apiKey)}`;
}

function extraerTextoGemini(json = {}) {
  return json.candidates?.[0]?.content?.parts?.map((parte) => parte.text || '').join('\n').trim() || '';
}

export async function ejecutarGeminiPlan(contextoPlan = {}, opciones = {}) {
  const config = obtenerConfigIAPlan(opciones);
  const proveedor = config.proveedores.gemini;
  if (!proveedor.activo) throw new Error('Gemini está desactivado.');
  if (!proveedor.apiKey) throw new Error('Gemini requiere GEMINI_API_KEY o geminiApiKey.');

  const prompt = contextoPlan.contextoIA?.promptBase || contextoPlan.promptBase || JSON.stringify(contextoPlan).slice(0, 12000);
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: config.temperatura,
      maxOutputTokens: config.maxTokens,
      responseMimeType: 'application/json'
    }
  };

  const respuesta = await fetchConTimeout(crearEndpoint(proveedor), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }, config.timeoutMs);
  const json = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(json.error?.message || `Gemini respondió HTTP ${respuesta.status}`);
  const texto = extraerTextoGemini(json);
  const data = extraerJsonDesdeTexto(texto);
  return normalizarRespuestaPlanIA({
    proveedor: 'gemini',
    modelo: proveedor.modelo,
    respuesta: data,
    textoOriginal: texto,
    contexto: contextoPlan,
    real: true,
    fallback: false
  });
}

export default ejecutarGeminiPlan;

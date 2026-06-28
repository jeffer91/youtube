/*
  Bloque 3 - Proveedor LM Studio local para Plan
  Función: usar endpoint local compatible con OpenAI.
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

export async function ejecutarLmStudioPlan(contextoPlan = {}, opciones = {}) {
  const config = obtenerConfigIAPlan(opciones);
  const proveedor = config.proveedores.lmstudio;
  if (!proveedor.activo) throw new Error('LM Studio está desactivado.');
  const prompt = contextoPlan.contextoIA?.promptBase || contextoPlan.promptBase || JSON.stringify(contextoPlan).slice(0, 12000);
  const respuesta = await fetchConTimeout(`${proveedor.endpointBase.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: proveedor.modelo,
      temperature: config.temperatura,
      max_tokens: config.maxTokens,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'Eres un editor profesional de video. Responde solo JSON válido.' },
        { role: 'user', content: prompt }
      ]
    })
  }, config.timeoutMs);
  const json = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(json.error?.message || `LM Studio respondió HTTP ${respuesta.status}`);
  const texto = json.choices?.[0]?.message?.content || '';
  const data = extraerJsonDesdeTexto(texto);
  return normalizarRespuestaPlanIA({
    proveedor: 'lmstudio',
    modelo: proveedor.modelo,
    respuesta: data,
    textoOriginal: texto,
    contexto: contextoPlan,
    real: true,
    fallback: false
  });
}

export default ejecutarLmStudioPlan;

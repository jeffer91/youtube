/*
  Bloque 3 - Proveedor GPT4All local para Plan
  Función: usar servidor local compatible con OpenAI cuando GPT4All lo exponga.
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

export async function ejecutarGpt4AllPlan(contextoPlan = {}, opciones = {}) {
  const config = obtenerConfigIAPlan(opciones);
  const proveedor = config.proveedores.gpt4all;
  if (!proveedor.activo) throw new Error('GPT4All está desactivado.');
  const prompt = contextoPlan.contextoIA?.promptBase || contextoPlan.promptBase || JSON.stringify(contextoPlan).slice(0, 12000);
  const respuesta = await fetchConTimeout(`${proveedor.endpointBase.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: proveedor.modelo,
      temperature: config.temperatura,
      max_tokens: config.maxTokens,
      messages: [
        { role: 'system', content: 'Eres un editor profesional de video. Responde solo JSON válido.' },
        { role: 'user', content: prompt }
      ]
    })
  }, config.timeoutMs);
  const json = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(json.error?.message || `GPT4All respondió HTTP ${respuesta.status}`);
  const texto = json.choices?.[0]?.message?.content || '';
  const data = extraerJsonDesdeTexto(texto);
  return normalizarRespuestaPlanIA({
    proveedor: 'gpt4all',
    modelo: proveedor.modelo,
    respuesta: data,
    textoOriginal: texto,
    contexto: contextoPlan,
    real: true,
    fallback: false
  });
}

export default ejecutarGpt4AllPlan;

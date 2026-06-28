/*
  Bloque 3 - Proveedor Ollama local para Plan
  Función: usar modelos locales por API HTTP de Ollama.
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

export async function ejecutarOllamaPlan(contextoPlan = {}, opciones = {}) {
  const config = obtenerConfigIAPlan(opciones);
  const proveedor = config.proveedores.ollama;
  if (!proveedor.activo) throw new Error('Ollama está desactivado.');
  const prompt = contextoPlan.contextoIA?.promptBase || contextoPlan.promptBase || JSON.stringify(contextoPlan).slice(0, 12000);
  const respuesta = await fetchConTimeout(`${proveedor.endpointBase.replace(/\/$/, '')}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: proveedor.modelo,
      prompt,
      stream: false,
      format: 'json',
      options: { temperature: config.temperatura }
    })
  }, config.timeoutMs);
  const json = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(json.error || `Ollama respondió HTTP ${respuesta.status}`);
  const texto = json.response || json.message?.content || '';
  const data = extraerJsonDesdeTexto(texto);
  return normalizarRespuestaPlanIA({
    proveedor: 'ollama',
    modelo: proveedor.modelo,
    respuesta: data,
    textoOriginal: texto,
    contexto: contextoPlan,
    real: true,
    fallback: false
  });
}

export default ejecutarOllamaPlan;

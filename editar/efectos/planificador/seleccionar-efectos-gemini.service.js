/*
  Bloque 7: UI de control de efectos
  Funcion: pedir a Gemini una seleccion controlada de efectos y normalizarla.
*/

import { ejecutarTareaGeminiReal } from '../../../gemini/cliente-gemini.service.js';
import { construirTareaEfectosGemini } from './prompt-efectos-gemini.service.js';
import { normalizarRespuestaEfectosGemini } from './normalizar-respuesta-gemini.service.js';

function booleano(valor, defecto = false) {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'string') return ['true', '1', 'si', 'sí', 'on', 'yes'].includes(valor.trim().toLowerCase());
  return defecto;
}

function obtenerSelector(opciones = {}) {
  return String(opciones?.selectorEfectos || opciones?.motorEfectosIA || 'automatico').trim().toLowerCase();
}

export async function seleccionarEfectosGemini(contexto = {}, { opciones = {}, maxEfectos = 12 } = {}) {
  const selector = obtenerSelector(opciones);
  if (selector === 'local') {
    return { ok: false, omitido: true, origen: 'gemini', motivo: 'Selector local activado desde la interfaz.' };
  }

  const usarGemini = selector === 'gemini' || booleano(opciones?.usarGemini, false);

  if (!usarGemini) {
    return { ok: false, omitido: true, origen: 'gemini', motivo: 'Gemini no esta activado para efectos.' };
  }

  const tarea = construirTareaEfectosGemini(contexto, { maxEfectos });
  const respuesta = await ejecutarTareaGeminiReal(tarea, {
    ...opciones,
    usarGemini: true,
    usarFallbackGemini: true,
    geminiTemperatura: opciones?.geminiTemperatura ?? 0.25,
    geminiMaxTokens: opciones?.geminiMaxTokens ?? 2048
  });

  if (!respuesta?.real || respuesta?.fallback) {
    return { ok: false, omitido: true, origen: 'gemini', motivo: respuesta?.motivo || 'Gemini uso fallback.', respuesta };
  }

  const normalizado = normalizarRespuestaEfectosGemini({ respuesta, contexto, maxEfectos });
  return {
    ...normalizado,
    respuestaGemini: {
      real: respuesta.real,
      modelo: respuesta.modelo,
      creadoEn: respuesta.creadoEn
    }
  };
}

export default seleccionarEfectosGemini;

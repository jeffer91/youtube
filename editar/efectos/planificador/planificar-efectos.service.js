/*
  Bloque 6: Selector Gemini de efectos
  Funcion: generar un plan de efectos con Gemini cuando este disponible y fallback local seguro.
*/

import { analizarContextoVideoEfectos } from '../analisis/index.js';
import { seleccionarEfectosLocal } from './seleccionar-efectos-local.service.js';
import { seleccionarEfectosGemini } from './seleccionar-efectos-gemini.service.js';
import { validarPlanEfectos } from './validar-plan-efectos.service.js';

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

async function seleccionarPlanBase(contexto, { opciones = {}, maxEfectos = 12 } = {}) {
  const gemini = await seleccionarEfectosGemini(contexto, { opciones, maxEfectos }).catch((error) => ({ ok: false, omitido: true, origen: 'gemini', motivo: error.message }));
  if (gemini?.ok && Array.isArray(gemini.efectos) && gemini.efectos.length > 0) {
    return { seleccion: gemini, fallbackLocal: false, intentoGemini: gemini };
  }

  const local = seleccionarEfectosLocal(contexto, { maxEfectos });
  return { seleccion: local, fallbackLocal: true, intentoGemini: gemini };
}

export async function planificarEfectos({ entrada = null, entendimiento = null, transcripcion = null, edicionDinamica = null, opciones = {} } = {}) {
  const contexto = analizarContextoVideoEfectos({ entrada, entendimiento, transcripcion, edicionDinamica, opciones });
  const maxEfectos = numero(opciones?.maxEfectosVisuales || opciones?.maxEfectos || contexto?.perfil?.maxEfectosPorVideo, contexto?.perfil?.maxEfectosPorVideo || 12);
  const { seleccion, fallbackLocal, intentoGemini } = await seleccionarPlanBase(contexto, { opciones, maxEfectos });
  const validacion = validarPlanEfectos(seleccion, { duracionVideo: contexto.duracionSegundos, maxEfectos });
  const origen = seleccion?.origen || 'local';

  return {
    ok: validacion.ok,
    tipo: origen === 'gemini' ? 'plan-efectos-gemini' : 'plan-efectos-local',
    origen,
    fallbackLocal,
    intentoGemini: intentoGemini ? { ok: intentoGemini.ok, omitido: intentoGemini.omitido, motivo: intentoGemini.motivo || null, total: intentoGemini.total || 0 } : null,
    perfil: contexto.perfil,
    intensidad: contexto.intensidad,
    duracionSegundos: contexto.duracionSegundos,
    maxEfectos,
    contexto,
    efectos: validacion.efectos,
    total: validacion.totalValido,
    advertencias: [...(seleccion?.advertencias || []), ...validacion.advertencias],
    errores: validacion.errores,
    mensaje: validacion.ok ? `Plan ${origen} listo con ${validacion.totalValido} efectos.` : `Plan ${origen} con errores.`,
    creadoEn: new Date().toISOString()
  };
}

export default planificarEfectos;

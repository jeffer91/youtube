import { analizarContextoVideoEfectos } from '../analisis/index.js';
import { aplicarAprendizajeEfectos } from '../aprendizaje/index.js';
import { optimizarPlanEfectos } from '../optimizador/index.js';
import { aplicarPresetVisualAContexto, aplicarPresetVisualASeleccion } from '../presets/index.js';
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
  const contextoBase = analizarContextoVideoEfectos({ entrada, entendimiento, transcripcion, edicionDinamica, opciones });
  const preset = aplicarPresetVisualAContexto(contextoBase, opciones);
  const contexto = preset.contexto;
  const opcionesPlan = preset.opciones;
  const maxEfectos = numero(opcionesPlan?.maxEfectosVisuales || opcionesPlan?.maxEfectos || contexto?.perfil?.maxEfectosPorVideo, contexto?.perfil?.maxEfectosPorVideo || 12);
  const { seleccion, fallbackLocal, intentoGemini } = await seleccionarPlanBase(contexto, { opciones: opcionesPlan, maxEfectos });
  const conPreset = aplicarPresetVisualASeleccion(seleccion, contexto, { ...opcionesPlan, maxEfectosVisuales: maxEfectos });
  const aprendido = await aplicarAprendizajeEfectos(conPreset, contexto, { ...opcionesPlan, maxEfectosVisuales: maxEfectos });
  const optimizado = optimizarPlanEfectos(aprendido, contexto, { maxEfectos });
  const validacion = validarPlanEfectos(optimizado, { duracionVideo: contexto.duracionSegundos, maxEfectos });
  const origen = seleccion?.origen || 'local';

  return {
    ok: validacion.ok,
    tipo: origen === 'gemini' ? 'plan-efectos-gemini' : 'plan-efectos-local',
    origen,
    fallbackLocal,
    presetVisual: contexto.presetVisual || null,
    presetVisualAplicado: conPreset?.presetVisualAplicado || null,
    aprendizajeAplicado: Boolean(aprendido?.aprendizajeAplicado),
    memoriaPerfil: aprendido?.memoriaPerfil || contexto?.perfil?.id || 'general',
    favoritosAprendidos: aprendido?.totalFavoritosAgregados || 0,
    optimizado: true,
    intentoGemini: intentoGemini ? { ok: intentoGemini.ok, omitido: intentoGemini.omitido, motivo: intentoGemini.motivo || null, total: intentoGemini.total || 0 } : null,
    perfil: contexto.perfil,
    intensidad: contexto.intensidad,
    duracionSegundos: contexto.duracionSegundos,
    maxEfectos,
    contexto,
    efectos: validacion.efectos,
    total: validacion.totalValido,
    totalAntesOptimizar: optimizado.totalEntrada || aprendido?.efectos?.length || conPreset?.efectos?.length || seleccion?.efectos?.length || 0,
    reglasOptimizacion: optimizado.reglas || null,
    advertencias: [...(optimizado?.advertencias || []), ...validacion.advertencias],
    errores: validacion.errores,
    mensaje: validacion.ok ? `Plan ${origen} con preset visual y ${validacion.totalValido} efectos.` : `Plan ${origen} con errores.`,
    creadoEn: new Date().toISOString()
  };
}

export default planificarEfectos;

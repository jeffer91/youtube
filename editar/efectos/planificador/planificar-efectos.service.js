/*
  Bloque 3: Planificador local de efectos
  Funcion: generar un plan de efectos usando contexto visual y selector local.
*/

import { analizarContextoVideoEfectos } from '../analisis/index.js';
import { seleccionarEfectosLocal } from './seleccionar-efectos-local.service.js';
import { validarPlanEfectos } from './validar-plan-efectos.service.js';

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

export function planificarEfectos({ entrada = null, entendimiento = null, transcripcion = null, edicionDinamica = null, opciones = {} } = {}) {
  const contexto = analizarContextoVideoEfectos({ entrada, entendimiento, transcripcion, edicionDinamica, opciones });
  const maxEfectos = numero(opciones?.maxEfectosVisuales || opciones?.maxEfectos || contexto?.perfil?.maxEfectosPorVideo, contexto?.perfil?.maxEfectosPorVideo || 12);
  const planLocal = seleccionarEfectosLocal(contexto, { maxEfectos });
  const validacion = validarPlanEfectos(planLocal, { duracionVideo: contexto.duracionSegundos, maxEfectos });

  return {
    ok: validacion.ok,
    tipo: 'plan-efectos-local',
    origen: 'local',
    perfil: contexto.perfil,
    intensidad: contexto.intensidad,
    duracionSegundos: contexto.duracionSegundos,
    maxEfectos,
    contexto,
    efectos: validacion.efectos,
    total: validacion.totalValido,
    advertencias: validacion.advertencias,
    errores: validacion.errores,
    mensaje: validacion.ok ? `Plan local listo con ${validacion.totalValido} efectos.` : 'Plan local con errores.',
    creadoEn: new Date().toISOString()
  };
}

export default planificarEfectos;

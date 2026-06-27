/*
  Bloque 4: Compilador FFmpeg de efectos
  Funcion: convertir un plan completo de efectos en un filtro final.
*/

import { compilarEfectoFfmpeg } from './compilar-efecto-ffmpeg.service.js';
import { validarFiltroFinalFfmpeg } from './validar-filtro-final.service.js';

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function ordenarEfectos(efectos = []) {
  return [...(Array.isArray(efectos) ? efectos : [])].sort((a, b) => numero(a.inicio, 0) - numero(b.inicio, 0) || numero(a.prioridad, 50) - numero(b.prioridad, 50));
}

export function compilarPlanFfmpeg({ filtroBase = '', plan = null, width = 1080, height = 1920, duracionSegundos = 0 } = {}) {
  const filtrosCompilados = [];
  const omitidos = [];
  const contexto = { width, height, duracionSegundos: duracionSegundos || plan?.duracionSegundos || 0 };

  for (const efecto of ordenarEfectos(plan?.efectos || [])) {
    const compilado = compilarEfectoFfmpeg(efecto, contexto);
    if (compilado.ok && compilado.filtro) filtrosCompilados.push(compilado);
    else omitidos.push(compilado);
  }

  const filtros = filtrosCompilados.map((item) => item.filtro);
  const filtroFinal = [filtroBase, ...filtros].filter(Boolean).join(',');
  const validacion = validarFiltroFinalFfmpeg({ filtroBase, filtros, filtroFinal });

  return {
    ok: validacion.ok,
    filtroVideo: filtroFinal,
    filtroBase,
    filtros,
    filtrosAplicados: filtros.length,
    compilados: filtrosCompilados,
    omitidos,
    validacion,
    planResumen: {
      totalPlan: plan?.efectos?.length || 0,
      totalCompilado: filtros.length,
      totalOmitido: omitidos.length,
      perfil: plan?.perfil?.id || plan?.perfil || 'general',
      origen: plan?.origen || 'local'
    },
    mensaje: validacion.ok ? `Plan FFmpeg compilado con ${filtros.length} filtros.` : 'No se pudo validar el filtro FFmpeg final.'
  };
}

export default compilarPlanFfmpeg;

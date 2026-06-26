/*
  Modulo: visual
  Funcion: crear zoom in / zoom out segun perfil, plataforma y momentos importantes.
*/

import { VISUAL_CONFIG, obtenerIntensidadVisual } from './visual.config.js';

function nivelZoomPorIntensidad(intensidad) {
  if (['muy_dinamica', 'dinamica', 'cinematica'].includes(intensidad)) return 'dinamico';
  if (intensidad === 'limpia') return 'suave';
  return 'suave';
}

export function crearPlanZoom({ momentos = [], perfil = 'general', sujeto = {} } = {}) {
  const intensidad = obtenerIntensidadVisual(perfil);
  const nivel = nivelZoomPorIntensidad(intensidad);
  const config = VISUAL_CONFIG.zooms[nivel];

  const zooms = momentos.slice(0, 12).map((momento, indice) => {
    const inicio = Number(momento.inicio ?? momento.start ?? indice * 5);
    const duracion = Number(momento.duracion ?? config.duracion);
    return {
      id: `zoom-${indice + 1}`,
      tipo: indice % 2 === 0 ? 'zoom_in' : 'zoom_out',
      inicio,
      fin: inicio + duracion,
      escalaDesde: indice % 2 === 0 ? config.escalaMin : config.escalaMax,
      escalaHasta: indice % 2 === 0 ? config.escalaMax : config.escalaMin,
      centro: sujeto.centro || { x: 540, y: 960 },
      suavizado: true
    };
  });

  return {
    ok: true,
    perfil,
    intensidad,
    nivel,
    total: zooms.length,
    zooms,
    creadoEn: new Date().toISOString()
  };
}

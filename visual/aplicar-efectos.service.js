/*
  Modulo: visual
  Funcion: crear efectos visuales controlados por perfil.
*/

import { obtenerIntensidadVisual } from './visual.config.js';

export function crearPlanEfectos({ momentos = [], perfil = 'general' } = {}) {
  const intensidad = obtenerIntensidadVisual(perfil);
  const efectosPermitidos = intensidad === 'limpia'
    ? ['transicion_suave', 'resalte_limpio']
    : ['transicion_suave', 'resalte_limpio', 'flash_suave', 'enfoque_dato', 'cambio_fondo'];

  const efectos = momentos.slice(0, 14).map((momento, indice) => {
    const inicio = Number(momento.inicio ?? momento.start ?? indice * 4);
    return {
      id: `efecto-${indice + 1}`,
      tipo: efectosPermitidos[indice % efectosPermitidos.length],
      inicio,
      fin: inicio + Number(momento.duracion ?? 1.2),
      motivo: momento.motivo || momento.texto || 'momento_visual',
      intensidad
    };
  });

  return {
    ok: true,
    perfil,
    intensidad,
    total: efectos.length,
    efectos,
    creadoEn: new Date().toISOString()
  };
}

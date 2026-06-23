export function validarPlanCortes({ planCortes, duracionSegundos = null, config } = {}) {
  const errores = [];
  const advertencias = [];
  if (!planCortes || typeof planCortes !== 'object') return { ok: false, mensaje: 'No existe plan de cortes.', errores: ['plan-cortes-vacio'], advertencias };
  if (!Array.isArray(planCortes.cortes) || planCortes.cortes.length === 0) return { ok: true, sinCortes: true, mensaje: 'No se encontraron silencios suficientes para cortar.', errores, advertencias };
  if (!Array.isArray(planCortes.segmentosConservados) || planCortes.segmentosConservados.length === 0) errores.push('sin-segmentos-conservados');
  if (planCortes.cortes.length > config.cortes.maximoCortes) errores.push('demasiados-cortes');
  if (planCortes.porcentajeEliminado > config.cortes.porcentajeMaximoEliminacion) errores.push('porcentaje-eliminado-excesivo');
  const duracionOriginal = Number(duracionSegundos || planCortes.duracionOriginal || 0);
  const duracionEditada = Number(planCortes.duracionEditada || 0);
  if (duracionOriginal > 0 && duracionEditada < Math.min(5, duracionOriginal * 0.2)) errores.push('duracion-final-demasiado-corta');
  for (const segmento of planCortes.segmentosConservados || []) {
    if (Number(segmento.fin) <= Number(segmento.inicio)) errores.push(`segmento-invalido-${segmento.id || 'sin-id'}`);
    if (Number(segmento.duracion) < config.cortes.duracionMinimaSegmento) advertencias.push(`segmento-muy-corto-${segmento.id || 'sin-id'}`);
  }
  if (planCortes.cortes.length > 100) advertencias.push('muchos-cortes-puede-ser-lento');
  const ok = errores.length === 0;
  return { ok, mensaje: ok ? 'Plan de cortes válido.' : `Plan de cortes no seguro: ${errores.join(', ')}`, errores, advertencias, resumen: { cantidadCortes: planCortes.cortes.length, cantidadSegmentosConservados: planCortes.segmentosConservados?.length || 0, segundosEliminados: planCortes.segundosEliminados || 0, porcentajeEliminado: planCortes.porcentajeEliminado || 0 } };
}

export default validarPlanCortes;

import { redondearTiempo } from '../edicion-dinamica.config.js';

function crearBloqueMapa(segmento, acumuladoEditado) {
  const duracion = redondearTiempo(Number(segmento.fin) - Number(segmento.inicio));
  const editadoInicio = redondearTiempo(acumuladoEditado);
  const editadoFin = redondearTiempo(editadoInicio + duracion);

  return {
    id: segmento.id,
    originalInicio: redondearTiempo(segmento.inicio),
    originalFin: redondearTiempo(segmento.fin),
    editadoInicio,
    editadoFin,
    duracion,
    desplazamiento: redondearTiempo(Number(segmento.inicio) - editadoInicio)
  };
}

export function crearMapaTiempoDesdeSegmentos({ segmentosConservados = [], duracionOriginal = null, duracionEditada = null, cortes = [] } = {}) {
  const bloques = [];
  let acumulado = 0;

  for (const segmento of segmentosConservados) {
    const bloque = crearBloqueMapa(segmento, acumulado);
    bloques.push(bloque);
    acumulado = bloque.editadoFin;
  }

  const duracionCalculada = redondearTiempo(acumulado);
  const original = redondearTiempo(duracionOriginal || 0);
  const editada = redondearTiempo(duracionEditada || duracionCalculada);

  return {
    ok: true,
    etapa: 'crear-mapa-tiempo',
    tipo: 'original-a-editado',
    duracionOriginal: original,
    duracionEditada: editada,
    segundosReducidos: redondearTiempo(original - editada),
    bloques,
    cortes,
    creadoEn: new Date().toISOString()
  };
}

export function convertirTiempoOriginalAEditado(tiempoOriginal, mapaTiempo) {
  const tiempo = Number(tiempoOriginal);

  if (!Number.isFinite(tiempo)) {
    return null;
  }

  const bloque = mapaTiempo?.bloques?.find((item) => tiempo >= item.originalInicio && tiempo <= item.originalFin);

  if (!bloque) {
    return null;
  }

  const offsetDentroBloque = tiempo - bloque.originalInicio;
  return redondearTiempo(bloque.editadoInicio + offsetDentroBloque);
}

export function convertirRangoOriginalAEditado({ inicio, fin, mapaTiempo }) {
  const nuevoInicio = convertirTiempoOriginalAEditado(inicio, mapaTiempo);
  const nuevoFin = convertirTiempoOriginalAEditado(fin, mapaTiempo);

  if (nuevoInicio === null || nuevoFin === null || nuevoFin <= nuevoInicio) {
    return null;
  }

  return {
    inicio: nuevoInicio,
    fin: nuevoFin,
    duracion: redondearTiempo(nuevoFin - nuevoInicio)
  };
}

export default crearMapaTiempoDesdeSegmentos;

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
    if (bloque.duracion > 0) {
      bloques.push(bloque);
      acumulado = bloque.editadoFin;
    }
  }

  const duracionCalculada = redondearTiempo(acumulado);
  const original = redondearTiempo(duracionOriginal || 0);
  const editada = redondearTiempo(duracionEditada || duracionCalculada);
  const eliminados = redondearTiempo(Math.max(0, original - editada));

  return {
    ok: true,
    etapa: 'crear-mapa-tiempo',
    tipo: 'original-a-editado',
    duracionOriginal: original,
    duracionEditada: editada,
    segundosReducidos: eliminados,
    segundosEliminados: eliminados,
    bloques,
    cortes,
    creadoEn: new Date().toISOString()
  };
}

export function convertirTiempoOriginalAEditado(tiempoOriginal, mapaTiempo) {
  const tiempo = Number(tiempoOriginal);

  if (!Number.isFinite(tiempo)) return null;

  const bloque = mapaTiempo?.bloques?.find((item) => tiempo >= item.originalInicio && tiempo <= item.originalFin);
  if (!bloque) return null;

  const offsetDentroBloque = tiempo - bloque.originalInicio;
  return redondearTiempo(bloque.editadoInicio + offsetDentroBloque);
}

export function convertirRangosOriginalesAEditados({ inicio, fin, mapaTiempo, duracionMinima = 0.05 } = {}) {
  const inicioOriginal = Number(inicio);
  const finOriginal = Number(fin);

  if (!Number.isFinite(inicioOriginal) || !Number.isFinite(finOriginal) || finOriginal <= inicioOriginal) {
    return [];
  }

  const rangos = [];

  for (const bloque of mapaTiempo?.bloques || []) {
    const interInicioOriginal = Math.max(inicioOriginal, bloque.originalInicio);
    const interFinOriginal = Math.min(finOriginal, bloque.originalFin);

    if (interFinOriginal <= interInicioOriginal) continue;

    const inicioEditado = redondearTiempo(bloque.editadoInicio + (interInicioOriginal - bloque.originalInicio));
    const finEditado = redondearTiempo(bloque.editadoInicio + (interFinOriginal - bloque.originalInicio));
    const duracion = redondearTiempo(finEditado - inicioEditado);

    if (duracion >= duracionMinima) {
      rangos.push({ inicio: inicioEditado, fin: finEditado, duracion });
    }
  }

  return rangos;
}

export function convertirRangoOriginalAEditado({ inicio, fin, mapaTiempo }) {
  const rangos = convertirRangosOriginalesAEditados({ inicio, fin, mapaTiempo });

  if (rangos.length === 0) return null;

  const inicioFinal = rangos[0].inicio;
  const finFinal = rangos[rangos.length - 1].fin;

  if (finFinal <= inicioFinal) return null;

  return {
    inicio: inicioFinal,
    fin: finFinal,
    duracion: redondearTiempo(finFinal - inicioFinal),
    rangos
  };
}

export default crearMapaTiempoDesdeSegmentos;

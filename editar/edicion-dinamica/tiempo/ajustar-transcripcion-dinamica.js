import { convertirRangoSeguro } from './convertir-tiempo-original-a-editado.js';

function obtenerTranscripcionInterna(paqueteTranscripcion) {
  if (!paqueteTranscripcion) return null;
  if (paqueteTranscripcion.transcripcion && typeof paqueteTranscripcion.transcripcion === 'object') return paqueteTranscripcion.transcripcion;
  return paqueteTranscripcion;
}

function obtenerSegmentos(transcripcionInterna) {
  if (Array.isArray(transcripcionInterna?.segmentos)) return transcripcionInterna.segmentos;
  return [];
}

function ajustarSegmento(segmento, mapaTiempo) {
  const inicioOriginal = Number(segmento.inicio ?? segmento.start ?? 0);
  const finOriginal = Number(segmento.fin ?? segmento.end ?? inicioOriginal + 0.5);
  const rango = convertirRangoSeguro({ inicio: inicioOriginal, fin: finOriginal, mapaTiempo, duracionMinima: 0.08 });

  if (!rango) return null;

  return {
    ...segmento,
    id: null,
    inicio: rango.inicio,
    fin: rango.fin,
    duracion: rango.duracion,
    tiempoOriginal: {
      inicio: inicioOriginal,
      fin: finOriginal
    },
    ajustadoPorEdicionDinamica: true
  };
}

export function ajustarTranscripcionDinamica({ paqueteTranscripcion = null, mapaTiempo } = {}) {
  const transcripcionInterna = obtenerTranscripcionInterna(paqueteTranscripcion);
  const segmentos = obtenerSegmentos(transcripcionInterna);

  if (!mapaTiempo?.bloques?.length || segmentos.length === 0) {
    return {
      ok: true,
      omitido: true,
      mensaje: 'No hay transcripción o mapa de tiempo para ajustar.',
      paquete: paqueteTranscripcion,
      transcripcion: transcripcionInterna,
      segmentosAjustados: [],
      descartados: segmentos.length,
      creadoEn: new Date().toISOString()
    };
  }

  const segmentosAjustados = [];
  let descartados = 0;

  for (const segmento of segmentos) {
    const ajustado = ajustarSegmento(segmento, mapaTiempo);
    if (!ajustado) {
      descartados += 1;
      continue;
    }

    segmentosAjustados.push({
      ...ajustado,
      id: segmentosAjustados.length + 1
    });
  }

  const textoCompleto = segmentosAjustados.map((segmento) => segmento.texto || '').filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

  const transcripcionAjustada = {
    ...transcripcionInterna,
    ok: true,
    omitido: false,
    fuente: transcripcionInterna?.fuente || 'desconocida',
    textoCompleto: textoCompleto || transcripcionInterna?.textoCompleto || '',
    segmentos: segmentosAjustados,
    cantidadSegmentos: segmentosAjustados.length,
    duracionSegundos: mapaTiempo.duracionEditada || transcripcionInterna?.duracionSegundos || null,
    edicionDinamica: {
      ajustada: true,
      segmentosOriginales: segmentos.length,
      segmentosConservados: segmentosAjustados.length,
      segmentosDescartados: descartados,
      duracionOriginal: mapaTiempo.duracionOriginal,
      duracionEditada: mapaTiempo.duracionEditada
    }
  };

  const paqueteAjustado = paqueteTranscripcion?.transcripcion
    ? {
        ...paqueteTranscripcion,
        transcripcion: transcripcionAjustada,
        mensaje: 'Transcripción ajustada al video sin silencios.',
        edicionDinamica: {
          ...(paqueteTranscripcion.edicionDinamica || {}),
          transcripcionAjustada: true
        }
      }
    : transcripcionAjustada;

  return {
    ok: true,
    omitido: false,
    mensaje: 'Transcripción ajustada al mapa de tiempo dinámico.',
    paquete: paqueteAjustado,
    transcripcion: transcripcionAjustada,
    segmentosAjustados,
    descartados,
    creadoEn: new Date().toISOString()
  };
}

export default ajustarTranscripcionDinamica;

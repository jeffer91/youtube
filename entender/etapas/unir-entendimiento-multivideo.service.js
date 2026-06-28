import path from 'path';
import { escribirJson } from '../../comun/archivos.js';

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function redondear(valor, decimales = 2) {
  return Number(numero(valor, 0).toFixed(decimales));
}

function texto(valor, respaldo = '') {
  const limpio = String(valor ?? '').replace(/\s+/g, ' ').trim();
  return limpio || respaldo;
}

function tieneTexto(valor) {
  return Boolean(String(valor ?? '').trim());
}

function ordenarPorGlobal(a = {}, b = {}) {
  return numero(a.inicioGlobal ?? a.segundoGlobal ?? a.inicio ?? a.segundo, 0) - numero(b.inicioGlobal ?? b.segundoGlobal ?? b.inicio ?? b.segundo, 0);
}

function obtenerResultado(item = {}) {
  return item?.resultado || null;
}

function obtenerLineaVideo(item = {}, lineaTiempoGlobal = {}) {
  if (item?.lineaTiempoVideo) return item.lineaTiempoVideo;
  const videoId = item?.videoId || item?.resultado?.videoId;
  const linea = Array.isArray(lineaTiempoGlobal?.lineaTiempo) ? lineaTiempoGlobal.lineaTiempo : [];
  return linea.find((video) => video.videoId === videoId || video.id === videoId) || null;
}

function obtenerTranscripcionBase(resultado = {}) {
  return resultado.transcripcionPrincipal || resultado.transcripcion || null;
}

function normalizarSegmento(segmento = {}, contexto = {}) {
  const offset = numero(contexto.offsetGlobal, 0);
  const inicioLocal = numero(segmento.inicioLocal ?? segmento.inicio ?? segmento.start, 0);
  const finLocal = numero(segmento.finLocal ?? segmento.fin ?? segmento.end, inicioLocal + 3);
  const inicioGlobal = numero(segmento.inicioGlobal, offset + inicioLocal);
  const finGlobal = numero(segmento.finGlobal, offset + finLocal);
  return {
    ...segmento,
    id: segmento.id || `${contexto.videoId}-segmento-${contexto.indiceSegmento + 1}`,
    idLocal: segmento.idLocal || segmento.id || `segmento-${contexto.indiceSegmento + 1}`,
    videoId: contexto.videoId,
    indiceVideo: contexto.indiceVideo,
    ordenVideo: contexto.ordenVideo,
    inicio: redondear(inicioGlobal, 2),
    fin: redondear(finGlobal, 2),
    start: redondear(inicioGlobal, 2),
    end: redondear(finGlobal, 2),
    inicioLocal: redondear(inicioLocal, 2),
    finLocal: redondear(finLocal, 2),
    inicioGlobal: redondear(inicioGlobal, 2),
    finGlobal: redondear(finGlobal, 2),
    offsetGlobal: redondear(offset, 2),
    texto: texto(segmento.texto || segmento.text || segmento.nota, '')
  };
}

function crearSegmentoDesdeTexto({ transcripcion, contexto, lineaVideo }) {
  const contenido = texto(transcripcion?.textoCompleto || transcripcion?.texto || '', '');
  if (!contenido) return null;
  const offset = numero(contexto.offsetGlobal, 0);
  const duracion = numero(lineaVideo?.duracionSegundos, 0);
  return {
    id: `${contexto.videoId}-segmento-texto-completo`,
    idLocal: 'segmento-texto-completo',
    videoId: contexto.videoId,
    indiceVideo: contexto.indiceVideo,
    ordenVideo: contexto.ordenVideo,
    inicio: redondear(offset, 2),
    fin: redondear(offset + Math.max(duracion, 3), 2),
    start: redondear(offset, 2),
    end: redondear(offset + Math.max(duracion, 3), 2),
    inicioLocal: 0,
    finLocal: redondear(Math.max(duracion, 3), 2),
    inicioGlobal: redondear(offset, 2),
    finGlobal: redondear(offset + Math.max(duracion, 3), 2),
    offsetGlobal: redondear(offset, 2),
    texto: contenido
  };
}

function obtenerSegmentosGlobales(resultadosPorVideo = [], lineaTiempoGlobal = {}) {
  const segmentos = [];
  for (const item of resultadosPorVideo) {
    if (!item?.ok) continue;
    const resultado = obtenerResultado(item);
    const transcripcion = obtenerTranscripcionBase(resultado);
    if (!transcripcion) continue;
    const lineaVideo = obtenerLineaVideo(item, lineaTiempoGlobal);
    const contexto = {
      videoId: item.videoId || resultado?.videoId || lineaVideo?.videoId,
      indiceVideo: numero(item.indice ?? resultado?.indiceVideo ?? lineaVideo?.indice, 0),
      ordenVideo: numero(item.orden ?? resultado?.ordenVideo ?? lineaVideo?.orden, 1),
      offsetGlobal: numero(lineaVideo?.offsetGlobal ?? resultado?.offsetGlobal, 0),
      indiceSegmento: 0
    };
    const lista = Array.isArray(transcripcion.segmentos) ? transcripcion.segmentos : [];
    if (lista.length) {
      lista.forEach((segmento, index) => {
        segmentos.push(normalizarSegmento(segmento, { ...contexto, indiceSegmento: index }));
      });
    } else {
      const creado = crearSegmentoDesdeTexto({ transcripcion, contexto, lineaVideo });
      if (creado) segmentos.push(creado);
    }
  }
  return segmentos.sort(ordenarPorGlobal);
}

function contarPalabras(textoCompleto = '') {
  return String(textoCompleto || '').split(/\s+/).map((item) => item.trim()).filter(Boolean).length;
}

function crearTextoGlobalDesdeSegmentos(segmentos = []) {
  return segmentos.map((segmento) => texto(segmento.texto, '')).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

function obtenerTextosPorVideo(resultadosPorVideo = []) {
  return resultadosPorVideo.filter((item) => item?.ok && item.resultado).map((item) => {
    const resultado = item.resultado;
    const transcripcion = obtenerTranscripcionBase(resultado) || {};
    return {
      videoId: item.videoId || resultado.videoId,
      ordenVideo: item.orden || resultado.ordenVideo,
      motor: transcripcion.motor || transcripcion.motorPrincipal || resultado.resumen?.motorTranscripcionPrincipal || null,
      textoCompleto: texto(transcripcion.textoCompleto || transcripcion.texto, ''),
      palabras: contarPalabras(transcripcion.textoCompleto || transcripcion.texto || ''),
      segmentos: Array.isArray(transcripcion.segmentos) ? transcripcion.segmentos.length : 0
    };
  });
}

function crearTranscripcionGlobal({ resultadosPorVideo = [], lineaTiempoGlobal = {} } = {}) {
  const segmentos = obtenerSegmentosGlobales(resultadosPorVideo, lineaTiempoGlobal);
  const textoCompleto = crearTextoGlobalDesdeSegmentos(segmentos);
  const textosPorVideo = obtenerTextosPorVideo(resultadosPorVideo);
  const motores = [...new Set(textosPorVideo.map((item) => item.motor).filter(Boolean))];
  const motorPrincipal = motores[0] || 'global-multivideo';
  const duracion = numero(lineaTiempoGlobal?.resumen?.duracionTotalSegundos, 0);
  return {
    ok: tieneTexto(textoCompleto),
    estado: tieneTexto(textoCompleto) ? 'ok' : 'vacia',
    tipo: 'transcripcion-global-multivideo',
    motor: motorPrincipal,
    motorPrincipal,
    motoresUsados: motores,
    textoCompleto,
    texto: textoCompleto,
    segmentos,
    textosPorVideo,
    resumen: {
      videosConTexto: textosPorVideo.filter((item) => tieneTexto(item.textoCompleto)).length,
      videosTotales: resultadosPorVideo.length,
      segmentos: segmentos.length,
      palabras: contarPalabras(textoCompleto),
      duracionSegundos: duracion || null,
      motoresUsados: motores
    },
    mensaje: tieneTexto(textoCompleto)
      ? `Transcripción global creada con ${segmentos.length} segmento(s) de ${textosPorVideo.length} video(s).`
      : 'No se pudo crear transcripción global porque no hay texto útil.'
  };
}

function recolectarFotogramas(resultadosPorVideo = []) {
  const frames = [];
  for (const item of resultadosPorVideo) {
    if (!item?.ok || !item.resultado) continue;
    const lista = Array.isArray(item.resultado.fotogramas?.fotogramas) ? item.resultado.fotogramas.fotogramas : [];
    frames.push(...lista.map((frame) => ({
      ...frame,
      videoId: frame.videoId || item.videoId,
      indiceVideo: frame.indiceVideo ?? item.indice,
      ordenVideo: frame.ordenVideo ?? item.orden,
      segundoGlobal: redondear(frame.segundoGlobal ?? frame.segundo ?? 0, 2),
      segundoLocal: redondear(frame.segundoLocal ?? frame.segundo ?? 0, 2)
    })));
  }
  return frames.sort(ordenarPorGlobal);
}

function crearFotogramasGlobales({ resultadosPorVideo = [], lineaTiempoGlobal = {} } = {}) {
  const fotogramas = recolectarFotogramas(resultadosPorVideo);
  const porVideo = new Map();
  for (const frame of fotogramas) {
    const videoId = frame.videoId || 'video';
    porVideo.set(videoId, (porVideo.get(videoId) || 0) + 1);
  }
  return {
    ok: fotogramas.length > 0,
    etapa: 'entender-fotogramas',
    tipo: 'fotogramas-globales-multivideo',
    cantidadExtraida: fotogramas.length,
    cantidadSolicitada: fotogramas.length,
    fotogramas,
    resumenPorVideo: Array.from(porVideo.entries()).map(([videoId, total]) => ({ videoId, total })),
    analisisFotogramas: {
      total: fotogramas.length,
      puntosAnalizados: fotogramas.map((frame) => frame.segundoGlobal ?? frame.segundo).filter((valor) => valor !== undefined),
      lecturaVisual: fotogramas.length
        ? 'Fotogramas globales consolidados desde todos los videos del proyecto.'
        : 'No hay fotogramas globales disponibles.',
      fuenteDescripcion: 'union-multivideo-local',
      duracionTotalSegundos: lineaTiempoGlobal?.resumen?.duracionTotalSegundos || null
    },
    mensaje: fotogramas.length
      ? `${fotogramas.length} fotograma(s) consolidados desde ${porVideo.size} video(s).`
      : 'No hay fotogramas para consolidar.'
  };
}

function recolectarMomentos(resultadosPorVideo = []) {
  const momentos = [];
  for (const item of resultadosPorVideo) {
    if (!item?.ok || !item.resultado) continue;
    const lista = Array.isArray(item.resultado.analisisVideo?.momentosClave) ? item.resultado.analisisVideo.momentosClave : [];
    momentos.push(...lista.map((momento, index) => ({
      ...momento,
      id: momento.id || `${item.videoId}-momento-${index + 1}`,
      videoId: momento.videoId || item.videoId,
      indiceVideo: momento.indiceVideo ?? item.indice,
      ordenVideo: momento.ordenVideo ?? item.orden,
      inicio: redondear(momento.inicioGlobal ?? momento.inicio ?? 0, 2),
      fin: redondear(momento.finGlobal ?? momento.fin ?? 0, 2),
      inicioGlobal: redondear(momento.inicioGlobal ?? momento.inicio ?? 0, 2),
      finGlobal: redondear(momento.finGlobal ?? momento.fin ?? 0, 2)
    })));
  }
  return momentos.sort(ordenarPorGlobal);
}

function recolectarNecesidades(resultadosPorVideo = []) {
  const necesidades = [];
  for (const item of resultadosPorVideo) {
    if (!item?.ok || !item.resultado) continue;
    const lista = Array.isArray(item.resultado.analisisVideo?.necesidades) ? item.resultado.analisisVideo.necesidades : [];
    lista.forEach((necesidad) => {
      const valor = texto(necesidad, '');
      if (valor && !necesidades.includes(valor)) necesidades.push(valor);
    });
  }
  return necesidades;
}

function crearAnalisisVideoGlobal({ resultadosPorVideo = [], lineaTiempoGlobal = {}, fotogramasGlobales = {}, transcripcionGlobal = {} } = {}) {
  const momentosClave = recolectarMomentos(resultadosPorVideo);
  const necesidades = recolectarNecesidades(resultadosPorVideo);
  const resumenLinea = lineaTiempoGlobal?.resumen || {};
  return {
    ok: true,
    tipo: 'analisis-video-global-multivideo',
    momentosClave,
    necesidades,
    resumenEditorial: {
      formatoDetectado: resumenLinea.orientacionPredominante || 'desconocido',
      duracionTipo: numero(resumenLinea.duracionTotalSegundos, 0) >= 180 ? 'largo/multiclip' : 'corto/multiclip',
      lectura: `Proyecto con ${resumenLinea.totalVideos || resultadosPorVideo.length} video(s), ${transcripcionGlobal?.resumen?.segmentos || 0} segmento(s) de transcripción y ${fotogramasGlobales?.cantidadExtraida || 0} fotograma(s) consolidados.`,
      recomendacionInicial: 'Revisar la transcripción global y los momentos por video antes de crear el plan de edición.'
    },
    resumen: {
      totalVideos: resumenLinea.totalVideos || resultadosPorVideo.length,
      duracionTotalSegundos: resumenLinea.duracionTotalSegundos || null,
      momentosClave: momentosClave.length,
      necesidades: necesidades.length,
      fotogramasGlobales: fotogramasGlobales?.cantidadExtraida || 0,
      segmentosGlobales: transcripcionGlobal?.resumen?.segmentos || 0
    }
  };
}

function agruparTranscripcionesPorMotor(resultadosPorVideo = [], transcripcionGlobal = {}) {
  const grupos = new Map();
  for (const item of resultadosPorVideo) {
    if (!item?.ok || !item.resultado) continue;
    const base = obtenerTranscripcionBase(item.resultado);
    if (!base) continue;
    const motor = base.motor || base.motorPrincipal || 'motor-global';
    if (!grupos.has(motor)) grupos.set(motor, []);
    grupos.get(motor).push({ item, transcripcion: base });
  }

  return Array.from(grupos.entries()).map(([motor, registros]) => {
    const segmentos = [];
    const textosPorVideo = [];
    for (const registro of registros) {
      const item = registro.item;
      const transcripcion = registro.transcripcion;
      const lista = Array.isArray(transcripcion.segmentos) ? transcripcion.segmentos : [];
      segmentos.push(...lista);
      textosPorVideo.push({
        videoId: item.videoId,
        textoCompleto: texto(transcripcion.textoCompleto || transcripcion.texto, ''),
        segmentos: lista.length
      });
    }
    const segmentosOrdenados = segmentos.sort(ordenarPorGlobal);
    const textoCompleto = crearTextoGlobalDesdeSegmentos(segmentosOrdenados) || textosPorVideo.map((item) => item.textoCompleto).filter(Boolean).join(' ');
    return {
      ok: tieneTexto(textoCompleto),
      motor,
      estado: tieneTexto(textoCompleto) ? 'ok' : 'vacia',
      transcripcion: {
        ...transcripcionGlobal,
        motor,
        motorPrincipal: motor,
        textoCompleto,
        texto: textoCompleto,
        segmentos: segmentosOrdenados,
        textosPorVideo,
        resumen: {
          ...(transcripcionGlobal.resumen || {}),
          palabras: contarPalabras(textoCompleto),
          segmentos: segmentosOrdenados.length,
          videosConTexto: textosPorVideo.filter((item) => tieneTexto(item.textoCompleto)).length
        }
      },
      resumen: {
        palabras: contarPalabras(textoCompleto),
        segmentos: segmentosOrdenados.length,
        videos: textosPorVideo.length
      },
      mensaje: `Transcripción global por motor ${motor}.`
    };
  });
}

export async function unirEntendimientoMultivideo({ proyectoId, carpetaProyecto, lineaTiempoGlobal, resultadosPorVideo = [] } = {}) {
  const transcripcionGlobal = crearTranscripcionGlobal({ resultadosPorVideo, lineaTiempoGlobal });
  const fotogramasGlobales = crearFotogramasGlobales({ resultadosPorVideo, lineaTiempoGlobal });
  const analisisVideoGlobal = crearAnalisisVideoGlobal({ resultadosPorVideo, lineaTiempoGlobal, fotogramasGlobales, transcripcionGlobal });
  const transcripcionesPorMotor = agruparTranscripcionesPorMotor(resultadosPorVideo, transcripcionGlobal);
  const resumenLinea = lineaTiempoGlobal?.resumen || {};
  const exitosos = resultadosPorVideo.filter((item) => item?.ok).length;

  const resultado = {
    ok: true,
    tipo: 'union-entendimiento-multivideo',
    proyectoId,
    transcripcionGlobal,
    transcripcionPrincipal: transcripcionGlobal,
    transcripcion: transcripcionGlobal,
    transcripcionesPorMotor,
    fotogramasGlobales,
    fotogramas: fotogramasGlobales,
    analisisVideoGlobal,
    analisisVideo: analisisVideoGlobal,
    resumen: {
      totalVideos: resumenLinea.totalVideos || resultadosPorVideo.length,
      videosProcesados: exitosos,
      duracionTotalSegundos: resumenLinea.duracionTotalSegundos || null,
      segmentosGlobales: transcripcionGlobal.resumen.segmentos,
      palabrasGlobales: transcripcionGlobal.resumen.palabras,
      fotogramasGlobales: fotogramasGlobales.cantidadExtraida,
      momentosGlobales: analisisVideoGlobal.momentosClave.length,
      transcripcionesPorMotor: transcripcionesPorMotor.length
    },
    creadoEn: new Date().toISOString()
  };

  if (carpetaProyecto) {
    const ruta = path.join(carpetaProyecto, 'entendimiento', 'entendimiento-global.json');
    await escribirJson(ruta, { ...resultado, ruta });
    return { ...resultado, ruta };
  }

  return resultado;
}

export default unirEntendimientoMultivideo;

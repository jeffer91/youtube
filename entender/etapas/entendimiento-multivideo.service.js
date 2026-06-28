import fs from 'fs';
import path from 'path';
import { entenderVideo } from '../entender.conexion.js';
import { escribirJson } from '../../comun/archivos.js';
import { crearEntradaVideoEntendimiento } from './normalizar-videos-entendimiento.service.js';

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

function asegurarCarpetaLocal(ruta) {
  fs.mkdirSync(ruta, { recursive: true });
  return ruta;
}

function obtenerLineaVideo(lineaTiempoGlobal = {}, videoId = '') {
  const linea = Array.isArray(lineaTiempoGlobal?.lineaTiempo) ? lineaTiempoGlobal.lineaTiempo : [];
  return linea.find((item) => item.videoId === videoId || item.id === videoId) || null;
}

function crearEntradaIndividual({ proyectoId, estado, video, carpetaProyecto, videosNormalizados, lineaTiempoGlobal, etapa }) {
  const videoId = video.videoId || video.id;
  const carpetaVideo = asegurarCarpetaLocal(path.join(carpetaProyecto, 'entendimiento', 'videos', videoId));
  const entrada = crearEntradaVideoEntendimiento({
    proyectoId: `${proyectoId}-${videoId}`,
    estado,
    video,
    carpetaProyecto: carpetaVideo,
    videosNormalizados,
    etapa
  });

  entrada.proyecto = {
    ...(entrada.proyecto || {}),
    id: `${proyectoId}-${videoId}`,
    proyectoPadreId: proyectoId,
    videoId,
    nombre: `${texto(estado?.nombre, 'Proyecto AutoVideoJeff')} · ${video.etiqueta || videoId}`
  };
  entrada.video = {
    ...(entrada.video || {}),
    videoId,
    id: videoId,
    indice: numero(video.indice, 0),
    orden: numero(video.orden, numero(video.indice, 0) + 1),
    etiqueta: video.etiqueta || videoId
  };
  entrada.rutas = {
    ...(entrada.rutas || {}),
    carpetaProyecto: carpetaVideo,
    carpetaProyectoPadre: carpetaProyecto,
    carpetaVideoEntendimiento: carpetaVideo,
    rutaVideoOriginal: video.rutaProyecto || video.rutaOriginal
  };
  entrada.lineaTiempoGlobal = lineaTiempoGlobal;
  entrada.lineaTiempoVideo = obtenerLineaVideo(lineaTiempoGlobal, videoId);
  entrada.multivideo = {
    ...(entrada.multivideo || {}),
    activo: videosNormalizados?.esMultivideo || false,
    procesandoVideoIndividual: true,
    proyectoPadreId: proyectoId,
    videoId,
    offsetGlobal: entrada.lineaTiempoVideo?.offsetGlobal || 0,
    duracionTotalSegundos: lineaTiempoGlobal?.resumen?.duracionTotalSegundos || null
  };
  return entrada;
}

function anotarSegmentos(segmentos = [], contexto = {}) {
  const offset = numero(contexto.offsetGlobal, 0);
  return (Array.isArray(segmentos) ? segmentos : []).map((segmento, index) => {
    const inicioLocal = numero(segmento.inicio ?? segmento.start, index * 3);
    const finLocal = numero(segmento.fin ?? segmento.end, inicioLocal + 3);
    return {
      ...segmento,
      videoId: contexto.videoId,
      indiceVideo: contexto.indiceVideo,
      ordenVideo: contexto.ordenVideo,
      inicioLocal: redondear(inicioLocal, 2),
      finLocal: redondear(finLocal, 2),
      inicioGlobal: redondear(offset + inicioLocal, 2),
      finGlobal: redondear(offset + finLocal, 2),
      offsetGlobal: redondear(offset, 2)
    };
  });
}

function anotarFotogramas(fotogramas = [], contexto = {}) {
  const offset = numero(contexto.offsetGlobal, 0);
  return (Array.isArray(fotogramas) ? fotogramas : []).map((frame) => {
    const segundoLocal = numero(frame.segundo ?? frame.segundoLocal, 0);
    return {
      ...frame,
      idLocal: frame.id,
      id: `${contexto.videoId}-${frame.id || 'frame'}`,
      videoId: contexto.videoId,
      indiceVideo: contexto.indiceVideo,
      ordenVideo: contexto.ordenVideo,
      segundoLocal: redondear(segundoLocal, 2),
      segundoGlobal: redondear(offset + segundoLocal, 2),
      offsetGlobal: redondear(offset, 2)
    };
  });
}

function anotarMomentos(momentos = [], contexto = {}) {
  const offset = numero(contexto.offsetGlobal, 0);
  return (Array.isArray(momentos) ? momentos : []).map((momento, index) => {
    const inicioLocal = numero(momento.inicio, index * 3);
    const finLocal = numero(momento.fin, inicioLocal + 2);
    return {
      ...momento,
      idLocal: momento.id || `momento-${index + 1}`,
      id: `${contexto.videoId}-${momento.id || `momento-${index + 1}`}`,
      videoId: contexto.videoId,
      indiceVideo: contexto.indiceVideo,
      ordenVideo: contexto.ordenVideo,
      inicioLocal: redondear(inicioLocal, 2),
      finLocal: redondear(finLocal, 2),
      inicioGlobal: redondear(offset + inicioLocal, 2),
      finGlobal: redondear(offset + finLocal, 2),
      offsetGlobal: redondear(offset, 2)
    };
  });
}

function anotarResultadoIndividual({ resultado, entrada, lineaVideo }) {
  const videoId = entrada?.video?.videoId || entrada?.video?.id;
  const contexto = {
    videoId,
    indiceVideo: numero(entrada?.video?.indice, 0),
    ordenVideo: numero(entrada?.video?.orden, 1),
    offsetGlobal: numero(lineaVideo?.offsetGlobal, 0)
  };
  const transcripcion = resultado?.transcripcion
    ? {
        ...resultado.transcripcion,
        videoId,
        indiceVideo: contexto.indiceVideo,
        ordenVideo: contexto.ordenVideo,
        offsetGlobal: contexto.offsetGlobal,
        segmentos: anotarSegmentos(resultado.transcripcion.segmentos, contexto)
      }
    : resultado?.transcripcion;

  const transcripcionPrincipal = resultado?.transcripcionPrincipal
    ? {
        ...resultado.transcripcionPrincipal,
        videoId,
        indiceVideo: contexto.indiceVideo,
        ordenVideo: contexto.ordenVideo,
        offsetGlobal: contexto.offsetGlobal,
        segmentos: anotarSegmentos(resultado.transcripcionPrincipal.segmentos, contexto)
      }
    : resultado?.transcripcionPrincipal;

  const fotogramas = resultado?.fotogramas
    ? {
        ...resultado.fotogramas,
        fotogramas: anotarFotogramas(resultado.fotogramas.fotogramas, contexto)
      }
    : resultado?.fotogramas;

  const analisisVideo = resultado?.analisisVideo
    ? {
        ...resultado.analisisVideo,
        momentosClave: anotarMomentos(resultado.analisisVideo.momentosClave, contexto)
      }
    : resultado?.analisisVideo;

  return {
    ...resultado,
    videoId,
    indiceVideo: contexto.indiceVideo,
    ordenVideo: contexto.ordenVideo,
    offsetGlobal: contexto.offsetGlobal,
    lineaTiempoVideo: lineaVideo,
    transcripcion,
    transcripcionPrincipal,
    fotogramas,
    analisisVideo,
    entradaIndividual: entrada
  };
}

function crearResumenIndividual(resultado = {}, lineaVideo = {}) {
  const transcripcion = resultado.transcripcion || {};
  const segmentos = Array.isArray(transcripcion.segmentos) ? transcripcion.segmentos.length : 0;
  const frames = Array.isArray(resultado.fotogramas?.fotogramas) ? resultado.fotogramas.fotogramas.length : 0;
  const momentos = Array.isArray(resultado.analisisVideo?.momentosClave) ? resultado.analisisVideo.momentosClave.length : 0;
  return {
    videoId: resultado.videoId || lineaVideo.videoId || null,
    ordenVideo: resultado.ordenVideo || lineaVideo.orden || null,
    ok: Boolean(resultado.ok),
    duracionSegundos: resultado.analisis?.duracionSegundos || lineaVideo.duracionSegundos || null,
    inicioGlobal: lineaVideo.inicioGlobal ?? null,
    finGlobal: lineaVideo.finGlobal ?? null,
    offsetGlobal: lineaVideo.offsetGlobal ?? 0,
    tieneAudio: Boolean(resultado.analisis?.tieneAudio || lineaVideo.tieneAudio),
    tieneTranscripcionReal: Boolean(transcripcion.textoCompleto),
    motorTranscripcionPrincipal: resultado.resumen?.motorTranscripcionPrincipal || transcripcion.motorPrincipal || transcripcion.motor || null,
    segmentos,
    fotogramas: frames,
    momentosClave: momentos,
    mensaje: resultado.mensaje || 'Entendimiento individual completado.'
  };
}

function sumar(lista = [], selector) {
  return lista.reduce((total, item) => total + numero(selector(item), 0), 0);
}

function crearResultadoGlobal({ proyectoId, estado, entradaGlobal, lineaTiempoGlobal, resultadosPorVideo, opciones = {} }) {
  const exitosos = resultadosPorVideo.filter((item) => item.ok && item.resultado);
  const fallidos = resultadosPorVideo.filter((item) => !item.ok);
  const principal = exitosos[0]?.resultado || null;
  const resumenVideos = resultadosPorVideo.map((item) => item.resumen).filter(Boolean);
  const resumenLinea = lineaTiempoGlobal?.resumen || {};
  const totalSegmentos = sumar(resumenVideos, (item) => item.segmentos);
  const totalFotogramas = sumar(resumenVideos, (item) => item.fotogramas);
  const totalMomentos = sumar(resumenVideos, (item) => item.momentosClave);

  return {
    ...(principal || {}),
    ok: exitosos.length > 0,
    etapa: 'entender',
    tipo: 'entendimiento-multivideo-por-video',
    proyectoId,
    proyecto: {
      id: proyectoId,
      nombre: texto(estado?.nombre, 'Proyecto AutoVideoJeff'),
      perfil: texto(estado?.datos?.perfil, 'general'),
      plataforma: texto(estado?.datos?.plataforma, 'tiktok'),
      modoEdicion: texto(estado?.datos?.modoEdicion, 'revision_completa')
    },
    entrada: entradaGlobal,
    analisis: {
      ...(principal?.analisis || {}),
      tipo: 'analisis-global-multivideo',
      duracionSegundos: resumenLinea.duracionTotalSegundos || principal?.analisis?.duracionSegundos || null,
      duracionTotalSegundos: resumenLinea.duracionTotalSegundos || null,
      duracionVideoPrincipalSegundos: principal?.analisis?.duracionSegundos || null,
      orientacion: resumenLinea.orientacionPredominante || principal?.analisis?.orientacion || 'desconocida',
      ancho: resumenLinea.anchoPredominante || principal?.analisis?.ancho || null,
      alto: resumenLinea.altoPredominante || principal?.analisis?.alto || null,
      fps: resumenLinea.fpsPredominante || principal?.analisis?.fps || null,
      tieneAudio: Boolean(resumenLinea.tieneAudio || principal?.analisis?.tieneAudio),
      totalVideos: resumenLinea.totalVideos || resultadosPorVideo.length,
      videosAnalizados: resumenLinea.videosAnalizados || resultadosPorVideo.length,
      lineaTiempoGlobal: true
    },
    resumen: {
      ...(principal?.resumen || {}),
      duracionSegundos: resumenLinea.duracionTotalSegundos || principal?.resumen?.duracionSegundos || null,
      duracionTotalSegundos: resumenLinea.duracionTotalSegundos || null,
      duracionVideoPrincipalSegundos: principal?.resumen?.duracionSegundos || principal?.analisis?.duracionSegundos || null,
      orientacion: resumenLinea.orientacionPredominante || principal?.resumen?.orientacion || 'desconocida',
      tieneAudio: Boolean(resumenLinea.tieneAudio || principal?.resumen?.tieneAudio),
      tieneTranscripcionReal: exitosos.some((item) => item.resumen?.tieneTranscripcionReal),
      motorTranscripcionPrincipal: principal?.resumen?.motorTranscripcionPrincipal || principal?.transcripcion?.motorPrincipal || principal?.transcripcion?.motor || null,
      transcripcionesGeneradas: sumar(resumenVideos, () => 1),
      fotogramasExtraidos: totalFotogramas,
      momentosClave: totalMomentos,
      segmentosTranscripcion: totalSegmentos,
      videosOriginales: resultadosPorVideo.length,
      videosProcesados: exitosos.length,
      videosFallidos: fallidos.length,
      esMultivideo: resultadosPorVideo.length > 1,
      modoVideos: resultadosPorVideo.length > 1 ? 'multivideo' : 'video-unico',
      listoParaEditar: exitosos.length > 0
    },
    lineaTiempoGlobal,
    resultadosPorVideo,
    resumenPorVideo: resumenVideos,
    erroresPorVideo: fallidos.map((item) => item.error).filter(Boolean),
    multivideo: {
      activo: resultadosPorVideo.length > 1,
      fase: 'bloque-3-entendimiento-por-video',
      totalVideos: resultadosPorVideo.length,
      videosProcesados: exitosos.length,
      videosFallidos: fallidos.length,
      duracionTotalSegundos: resumenLinea.duracionTotalSegundos || null,
      transcripcionGlobalPendiente: true,
      fotogramasGlobalesPendientes: true,
      nota: 'Cada video ya fue procesado individualmente. En el siguiente bloque se consolidarán transcripciones, frames y momentos globales.'
    },
    opcionesMultivideo: {
      continuarSiFallaUnVideo: opciones.continuarSiFallaUnVideo !== false
    },
    mensaje: resultadosPorVideo.length > 1
      ? `Entendimiento individual completado: ${exitosos.length}/${resultadosPorVideo.length} video(s) procesado(s).`
      : (principal?.mensaje || 'Entendimiento completado.')
  };
}

export async function procesarEntendimientoMultivideo({ proyectoId, estado, carpetaProyecto, videosNormalizados, lineaTiempoGlobal, opciones = {}, solicitud = {}, etapa } = {}) {
  const videos = Array.isArray(videosNormalizados?.videosValidos) ? videosNormalizados.videosValidos : [];
  if (!videos.length) throw new Error('No hay videos válidos para procesar entendimiento multivideo.');

  const entradaGlobal = crearEntradaVideoEntendimiento({
    proyectoId,
    estado,
    video: videosNormalizados.videoPrincipal || videos[0],
    carpetaProyecto,
    videosNormalizados,
    etapa
  });
  entradaGlobal.lineaTiempoGlobal = lineaTiempoGlobal;
  entradaGlobal.multivideo = {
    ...(entradaGlobal.multivideo || {}),
    activo: videos.length > 1,
    fase: 'bloque-3-entendimiento-por-video',
    duracionTotalSegundos: lineaTiempoGlobal?.resumen?.duracionTotalSegundos || null
  };

  const resultadosPorVideo = [];
  const continuarSiFalla = opciones.continuarSiFallaUnVideo !== false;

  for (const video of videos) {
    const videoId = video.videoId || video.id;
    const lineaVideo = obtenerLineaVideo(lineaTiempoGlobal, videoId);
    const entradaIndividual = crearEntradaIndividual({
      proyectoId,
      estado,
      video,
      carpetaProyecto,
      videosNormalizados,
      lineaTiempoGlobal,
      etapa
    });

    try {
      const resultadoBase = await entenderVideo(entradaIndividual, {
        ...opciones,
        ...(solicitud || {}),
        etapaSolicitada: etapa,
        contextoMultivideo: true,
        videoId,
        indiceVideo: video.indice,
        ordenVideo: video.orden
      });
      const resultado = anotarResultadoIndividual({ resultado: resultadoBase, entrada: entradaIndividual, lineaVideo });
      const resumen = crearResumenIndividual(resultado, lineaVideo || {});
      resultadosPorVideo.push({
        ok: true,
        videoId,
        indice: video.indice,
        orden: video.orden,
        entrada: entradaIndividual,
        resultado,
        resumen,
        lineaTiempoVideo: lineaVideo,
        error: null
      });
    } catch (error) {
      const itemError = {
        ok: false,
        videoId,
        indice: video.indice,
        orden: video.orden,
        entrada: entradaIndividual,
        resultado: null,
        resumen: {
          videoId,
          ordenVideo: video.orden,
          ok: false,
          duracionSegundos: lineaVideo?.duracionSegundos || null,
          inicioGlobal: lineaVideo?.inicioGlobal ?? null,
          finGlobal: lineaVideo?.finGlobal ?? null,
          offsetGlobal: lineaVideo?.offsetGlobal ?? 0,
          mensaje: `Error procesando ${videoId}: ${error.message}`
        },
        lineaTiempoVideo: lineaVideo,
        error: {
          videoId,
          mensaje: error.message,
          stack: process.env.NODE_ENV === 'production' ? null : error.stack || null
        }
      };
      resultadosPorVideo.push(itemError);
      if (!continuarSiFalla) throw error;
    }
  }

  const resultadoGlobal = crearResultadoGlobal({ proyectoId, estado, entradaGlobal, lineaTiempoGlobal, resultadosPorVideo, opciones });
  const ruta = path.join(carpetaProyecto, 'entendimiento', 'resultados-por-video.json');
  await escribirJson(ruta, {
    ok: resultadoGlobal.ok,
    proyectoId,
    tipo: 'resultados-por-video',
    resumen: resultadoGlobal.resumen,
    lineaTiempoGlobal,
    resultadosPorVideo,
    creadoEn: new Date().toISOString(),
    ruta
  });

  return {
    ...resultadoGlobal,
    archivoResultadosPorVideo: ruta
  };
}

export default procesarEntendimientoMultivideo;

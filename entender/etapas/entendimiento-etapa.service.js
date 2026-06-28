/*
  Bloque 6: Entendimiento backend independiente
  Función: ejecutar la etapa de entendimiento desde la nueva API por etapas.
*/

import path from 'path';
import { leerJsonSiExiste, obtenerRutaRaiz } from '../../comun/archivos.js';
import {
  ETAPAS_AUTOVIDEO,
  ESTADOS_PROYECTO_ETAPAS,
  cargarEstadoProyectoEtapas,
  avanzarEstadoProyectoEtapas,
  marcarErrorEstadoProyectoEtapas,
  guardarResultadoEtapa
} from '../../flujo-etapas/flujo-etapas.conexion.js';
import { normalizarVideosEntendimiento } from './normalizar-videos-entendimiento.service.js';
import { crearLineaTiempoMultivideo } from './linea-tiempo-multivideo.service.js';
import { procesarEntendimientoMultivideo } from './entendimiento-multivideo.service.js';

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function obtenerCarpetaProyecto(proyectoId) {
  return path.join(obtenerRutaRaiz(), 'datos', 'proyectos', proyectoId);
}

async function cargarVideosOriginalesProyecto(proyectoId) {
  const ruta = path.join(obtenerCarpetaProyecto(proyectoId), 'videos-originales.json');
  return await leerJsonSiExiste(ruta, { ok: true, proyectoId, total: 0, totalValidos: 0, modo: 'sin-videos', esMultivideo: false, videos: [] });
}

function crearResumenEntendimiento(resultado, videosNormalizados = null, lineaTiempoGlobal = null) {
  const transcripcionesPorMotor = Array.isArray(resultado?.transcripcionesPorMotor) ? resultado.transcripcionesPorMotor : [];
  const resumenTranscripcion = resultado?.resumenTranscripcion || resultado?.transcripcion?.resumenTranscripcion || null;
  const motorPrincipal = resultado?.resumen?.motorTranscripcionPrincipal || resultado?.transcripcionPrincipal?.motor || resultado?.transcripcion?.motor || null;
  const resumenLinea = lineaTiempoGlobal?.resumen || {};
  const resumenResultado = resultado?.resumen || {};
  const totalVideos = resumenLinea.totalVideos || videosNormalizados?.totalValidos || resumenResultado.videosOriginales || 1;
  const esMultivideo = Boolean(resumenLinea.esMultivideo || videosNormalizados?.esMultivideo || totalVideos > 1);
  const duracionGlobal = numero(resumenLinea.duracionTotalSegundos || resumenResultado.duracionTotalSegundos, 0);
  return {
    orientacion: resumenLinea.orientacionPredominante || resumenResultado.orientacion || resultado?.analisis?.orientacion || 'desconocida',
    duracionSegundos: duracionGlobal > 0 ? duracionGlobal : (resumenResultado.duracionSegundos || resultado?.analisis?.duracionSegundos || null),
    duracionTotalSegundos: duracionGlobal > 0 ? duracionGlobal : (resumenResultado.duracionTotalSegundos || resumenResultado.duracionSegundos || resultado?.analisis?.duracionSegundos || null),
    duracionVideoPrincipalSegundos: resumenResultado.duracionVideoPrincipalSegundos || resultado?.analisis?.duracionVideoPrincipalSegundos || null,
    tieneAudio: Boolean(resumenLinea.tieneAudio || resumenResultado.tieneAudio || resultado?.analisis?.tieneAudio),
    todosTienenAudio: Boolean(resumenLinea.todosTienenAudio),
    tieneTranscripcionReal: Boolean(resumenResultado.tieneTranscripcionReal || resultado?.resumen?.tieneTranscripcionReal),
    motorTranscripcionPrincipal: motorPrincipal,
    transcripcionesGeneradas: resumenResultado.transcripcionesGeneradas || transcripcionesPorMotor.length,
    resumenTranscripcion,
    fotogramasExtraidos: resumenResultado.fotogramasExtraidos || resultado?.fotogramas?.cantidadExtraida || 0,
    segmentosTranscripcion: resumenResultado.segmentosTranscripcion || 0,
    listoParaEditar: Boolean(resumenResultado.listoParaEditar || resultado?.resumen?.listoParaEditar),
    momentosClave: resumenResultado.momentosClave || (Array.isArray(resultado?.analisisVideo?.momentosClave) ? resultado.analisisVideo.momentosClave.length : 0),
    necesidades: Array.isArray(resultado?.analisisVideo?.necesidades) ? resultado.analisisVideo.necesidades : [],
    videosOriginales: totalVideos,
    videosPreparados: totalVideos,
    videosProcesados: resumenResultado.videosProcesados || 0,
    videosFallidos: resumenResultado.videosFallidos || 0,
    videosAnalizadosEnLineaTiempo: resumenLinea.videosAnalizados || 0,
    videosConAudio: resumenLinea.videosConAudio || 0,
    videosSinAudio: resumenLinea.videosSinAudio || 0,
    modoVideos: esMultivideo ? 'multivideo' : 'video-unico',
    esMultivideo,
    videoPrincipalId: videosNormalizados?.videoPrincipal?.videoId || resultado?.entrada?.video?.videoId || null,
    lineaTiempoGlobal: Boolean(lineaTiempoGlobal?.ok),
    entendimientoPorVideo: Array.isArray(resultado?.resultadosPorVideo)
  };
}

export async function procesarEntendimientoProyectoEtapa({ proyectoId, opciones = {}, solicitud = {} } = {}) {
  if (!proyectoId) throw new Error('Falta proyectoId para procesar entendimiento.');
  const carpetaProyecto = obtenerCarpetaProyecto(proyectoId);
  const estadoInicial = await cargarEstadoProyectoEtapas({ proyectoId, crearSiFalta: false });
  if (!estadoInicial) throw new Error('No existe estado-proyecto.json. Primero crea el proyecto.');

  try {
    await avanzarEstadoProyectoEtapas({
      proyectoId,
      etapaDestino: ETAPAS_AUTOVIDEO.ENTENDIMIENTO,
      estadoDestino: ESTADOS_PROYECTO_ETAPAS.ENTENDIENDO,
      mensaje: 'Iniciando entendimiento por video.'
    });

    const videosGuardados = await cargarVideosOriginalesProyecto(proyectoId);
    const videosNormalizados = normalizarVideosEntendimiento(videosGuardados);
    if (!videosNormalizados.ok) throw new Error(videosNormalizados.mensaje);

    const estadoProcesando = await cargarEstadoProyectoEtapas({ proyectoId, crearSiFalta: false });
    const entradaBase = {
      proyecto: {
        id: proyectoId,
        nombre: estadoProcesando?.nombre || estadoInicial?.nombre || 'Proyecto AutoVideoJeff'
      }
    };
    const lineaTiempoGlobal = await crearLineaTiempoMultivideo({
      entrada: entradaBase,
      videosNormalizados,
      carpetaProyecto
    });

    const resultadoEntendimiento = await procesarEntendimientoMultivideo({
      proyectoId,
      estado: estadoProcesando,
      carpetaProyecto,
      videosNormalizados,
      lineaTiempoGlobal,
      opciones,
      solicitud,
      etapa: ETAPAS_AUTOVIDEO.ENTENDIMIENTO
    });
    const resumen = crearResumenEntendimiento(resultadoEntendimiento, videosNormalizados, lineaTiempoGlobal);

    const guardado = await guardarResultadoEtapa({
      proyectoId,
      etapa: ETAPAS_AUTOVIDEO.ENTENDIMIENTO,
      resultado: {
        ...resultadoEntendimiento,
        resumenEtapa: resumen,
        videosEntendimiento: {
          ok: videosNormalizados.ok,
          modo: videosNormalizados.modo,
          esMultivideo: videosNormalizados.esMultivideo,
          total: videosNormalizados.total,
          totalValidos: videosNormalizados.totalValidos,
          videoPrincipalId: videosNormalizados.videoPrincipal?.videoId || null,
          videos: videosNormalizados.videos
        },
        lineaTiempoGlobal,
        multivideo: {
          ...(resultadoEntendimiento.multivideo || {}),
          activo: videosNormalizados.esMultivideo,
          fase: 'bloque-3-entendimiento-por-video',
          lineaTiempoGlobal: Boolean(lineaTiempoGlobal?.ok),
          duracionTotalSegundos: lineaTiempoGlobal?.resumen?.duracionTotalSegundos || null,
          videosAnalizados: lineaTiempoGlobal?.resumen?.videosAnalizados || 0,
          videosProcesados: resultadoEntendimiento?.resumen?.videosProcesados || 0,
          videosFallidos: resultadoEntendimiento?.resumen?.videosFallidos || 0,
          nota: videosNormalizados.esMultivideo
            ? 'Cada video fue procesado individualmente. En el siguiente bloque se consolidarán transcripciones, fotogramas y momentos globales.'
            : 'Proyecto de un solo video procesado con la misma estructura por video.'
        }
      },
      metadata: {
        bloque: 7,
        tipo: videosNormalizados.esMultivideo ? 'entendimiento-backend-por-video-multivideo' : 'entendimiento-backend-por-video-unico',
        origen: 'POST /api/proyectos/:proyectoId/entendimiento/procesar',
        videos: {
          total: videosNormalizados.total,
          totalValidos: videosNormalizados.totalValidos,
          modo: videosNormalizados.modo,
          videoPrincipalId: videosNormalizados.videoPrincipal?.videoId || null,
          duracionTotalSegundos: lineaTiempoGlobal?.resumen?.duracionTotalSegundos || null,
          videosProcesados: resultadoEntendimiento?.resumen?.videosProcesados || 0,
          videosFallidos: resultadoEntendimiento?.resumen?.videosFallidos || 0
        }
      }
    });

    const estadoFinal = await avanzarEstadoProyectoEtapas({
      proyectoId,
      etapaDestino: ETAPAS_AUTOVIDEO.ENTENDIMIENTO,
      estadoDestino: ESTADOS_PROYECTO_ETAPAS.ENTENDIDO,
      archivoGenerado: guardado.ruta,
      mensaje: videosNormalizados.esMultivideo
        ? 'Entendimiento por video completado para proyecto multivideo.'
        : 'Entendimiento independiente completado.'
    });

    return {
      ok: true,
      proyectoId,
      etapa: ETAPAS_AUTOVIDEO.ENTENDIMIENTO,
      estado: estadoFinal,
      entrada: resultadoEntendimiento.entrada,
      resultado: resultadoEntendimiento,
      resumen,
      videosEntendimiento: videosNormalizados,
      lineaTiempoGlobal,
      resultadosPorVideo: resultadoEntendimiento.resultadosPorVideo || [],
      archivo: guardado,
      mensaje: resultadoEntendimiento.mensaje || 'Entendimiento completado.'
    };
  } catch (error) {
    await marcarErrorEstadoProyectoEtapas({ proyectoId, etapa: ETAPAS_AUTOVIDEO.ENTENDIMIENTO, error, mensaje: 'Error en entendimiento por video.' }).catch(() => null);
    throw error;
  }
}

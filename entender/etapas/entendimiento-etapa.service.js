/*
  Bloque 6: Entendimiento backend independiente
  Función: ejecutar la etapa de entendimiento desde la nueva API por etapas.
*/

import path from 'path';
import { entenderVideo } from '../entender.conexion.js';
import { leerJsonSiExiste, obtenerRutaRaiz } from '../../comun/archivos.js';
import {
  ETAPAS_AUTOVIDEO,
  ESTADOS_PROYECTO_ETAPAS,
  cargarEstadoProyectoEtapas,
  avanzarEstadoProyectoEtapas,
  marcarErrorEstadoProyectoEtapas,
  guardarResultadoEtapa
} from '../../flujo-etapas/flujo-etapas.conexion.js';
import {
  normalizarVideosEntendimiento,
  crearEntradaVideoEntendimiento
} from './normalizar-videos-entendimiento.service.js';
import { crearLineaTiempoMultivideo } from './linea-tiempo-multivideo.service.js';

function texto(valor, respaldo = '') {
  const limpio = String(valor || '').trim();
  return limpio || respaldo;
}

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
  const totalVideos = resumenLinea.totalVideos || videosNormalizados?.totalValidos || resultado?.entrada?.multivideo?.totalValidos || 1;
  const esMultivideo = Boolean(resumenLinea.esMultivideo || videosNormalizados?.esMultivideo || totalVideos > 1);
  const duracionGlobal = numero(resumenLinea.duracionTotalSegundos, 0);
  return {
    orientacion: resumenLinea.orientacionPredominante || resultado?.resumen?.orientacion || resultado?.analisis?.orientacion || 'desconocida',
    duracionSegundos: duracionGlobal > 0 ? duracionGlobal : (resultado?.resumen?.duracionSegundos || resultado?.analisis?.duracionSegundos || null),
    duracionTotalSegundos: duracionGlobal > 0 ? duracionGlobal : (resultado?.resumen?.duracionSegundos || resultado?.analisis?.duracionSegundos || null),
    duracionVideoPrincipalSegundos: resultado?.resumen?.duracionSegundos || resultado?.analisis?.duracionSegundos || null,
    tieneAudio: Boolean(resumenLinea.tieneAudio || resultado?.analisis?.tieneAudio),
    todosTienenAudio: Boolean(resumenLinea.todosTienenAudio),
    tieneTranscripcionReal: Boolean(resultado?.resumen?.tieneTranscripcionReal),
    motorTranscripcionPrincipal: motorPrincipal,
    transcripcionesGeneradas: transcripcionesPorMotor.length,
    resumenTranscripcion,
    fotogramasExtraidos: resultado?.resumen?.fotogramasExtraidos || 0,
    listoParaEditar: Boolean(resultado?.resumen?.listoParaEditar),
    momentosClave: Array.isArray(resultado?.analisisVideo?.momentosClave) ? resultado.analisisVideo.momentosClave.length : 0,
    necesidades: Array.isArray(resultado?.analisisVideo?.necesidades) ? resultado.analisisVideo.necesidades : [],
    videosOriginales: totalVideos,
    videosPreparados: totalVideos,
    videosAnalizadosEnLineaTiempo: resumenLinea.videosAnalizados || 0,
    videosConAudio: resumenLinea.videosConAudio || 0,
    videosSinAudio: resumenLinea.videosSinAudio || 0,
    modoVideos: esMultivideo ? 'multivideo' : 'video-unico',
    esMultivideo,
    videoPrincipalId: videosNormalizados?.videoPrincipal?.videoId || resultado?.entrada?.video?.videoId || null,
    lineaTiempoGlobal: Boolean(lineaTiempoGlobal?.ok)
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
      mensaje: 'Iniciando entendimiento independiente del video.'
    });

    const videosGuardados = await cargarVideosOriginalesProyecto(proyectoId);
    const videosNormalizados = normalizarVideosEntendimiento(videosGuardados);
    if (!videosNormalizados.ok) throw new Error(videosNormalizados.mensaje);

    const video = videosNormalizados.videoPrincipal;
    const estadoProcesando = await cargarEstadoProyectoEtapas({ proyectoId, crearSiFalta: false });
    const entrada = crearEntradaVideoEntendimiento({
      proyectoId,
      estado: estadoProcesando,
      video,
      carpetaProyecto,
      videosNormalizados,
      etapa: ETAPAS_AUTOVIDEO.ENTENDIMIENTO
    });

    const lineaTiempoGlobal = await crearLineaTiempoMultivideo({
      entrada,
      videosNormalizados,
      carpetaProyecto
    });

    entrada.lineaTiempoGlobal = lineaTiempoGlobal;
    entrada.multivideo = {
      ...(entrada.multivideo || {}),
      lineaTiempoGlobal: Boolean(lineaTiempoGlobal?.ok),
      duracionTotalSegundos: lineaTiempoGlobal?.resumen?.duracionTotalSegundos || null
    };

    const resultadoEntendimiento = await entenderVideo(entrada, { ...opciones, ...(solicitud || {}), etapaSolicitada: ETAPAS_AUTOVIDEO.ENTENDIMIENTO });
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
          activo: videosNormalizados.esMultivideo,
          fase: 'bloque-2-linea-tiempo-global',
          lineaTiempoGlobal: Boolean(lineaTiempoGlobal?.ok),
          duracionTotalSegundos: lineaTiempoGlobal?.resumen?.duracionTotalSegundos || null,
          videosAnalizados: lineaTiempoGlobal?.resumen?.videosAnalizados || 0,
          nota: videosNormalizados.esMultivideo
            ? 'Los videos ya tienen línea de tiempo global. En el siguiente bloque se procesará entendimiento completo por cada video.'
            : 'Proyecto de un solo video normalizado y con línea de tiempo global.'
        }
      },
      metadata: {
        bloque: 7,
        tipo: videosNormalizados.esMultivideo ? 'entendimiento-backend-linea-tiempo-multivideo' : 'entendimiento-backend-video-unico-linea-tiempo',
        origen: 'POST /api/proyectos/:proyectoId/entendimiento/procesar',
        videos: {
          total: videosNormalizados.total,
          totalValidos: videosNormalizados.totalValidos,
          modo: videosNormalizados.modo,
          videoPrincipalId: videosNormalizados.videoPrincipal?.videoId || null,
          duracionTotalSegundos: lineaTiempoGlobal?.resumen?.duracionTotalSegundos || null
        }
      }
    });

    const estadoFinal = await avanzarEstadoProyectoEtapas({
      proyectoId,
      etapaDestino: ETAPAS_AUTOVIDEO.ENTENDIMIENTO,
      estadoDestino: ESTADOS_PROYECTO_ETAPAS.ENTENDIDO,
      archivoGenerado: guardado.ruta,
      mensaje: videosNormalizados.esMultivideo
        ? 'Entendimiento completado con línea de tiempo global multivideo.'
        : 'Entendimiento independiente completado.'
    });

    return {
      ok: true,
      proyectoId,
      etapa: ETAPAS_AUTOVIDEO.ENTENDIMIENTO,
      estado: estadoFinal,
      entrada,
      resultado: resultadoEntendimiento,
      resumen,
      videosEntendimiento: videosNormalizados,
      lineaTiempoGlobal,
      archivo: guardado,
      mensaje: resultadoEntendimiento.mensaje || 'Entendimiento completado.'
    };
  } catch (error) {
    await marcarErrorEstadoProyectoEtapas({ proyectoId, etapa: ETAPAS_AUTOVIDEO.ENTENDIMIENTO, error, mensaje: 'Error en entendimiento independiente.' }).catch(() => null);
    throw error;
  }
}

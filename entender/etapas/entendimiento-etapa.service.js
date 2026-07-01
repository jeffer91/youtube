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
import { unirEntendimientoMultivideo } from './unir-entendimiento-multivideo.service.js';

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

async function registrarProgresoEntendimiento({ proyectoId, mensaje, detalle = '' } = {}) {
  if (!proyectoId || !mensaje) return null;
  return await avanzarEstadoProyectoEtapas({
    proyectoId,
    etapaDestino: ETAPAS_AUTOVIDEO.ENTENDIMIENTO,
    estadoDestino: ESTADOS_PROYECTO_ETAPAS.ENTENDIENDO,
    mensaje: detalle ? `${mensaje} ${detalle}` : mensaje
  }).catch((error) => {
    console.warn('[Entendimiento] No se pudo guardar progreso:', error.message);
    return null;
  });
}

function crearResumenEntendimiento(resultado, videosNormalizados = null, lineaTiempoGlobal = null, entendimientoGlobal = null) {
  const transcripcionesPorMotor = Array.isArray(resultado?.transcripcionesPorMotor) ? resultado.transcripcionesPorMotor : [];
  const resumenTranscripcion = resultado?.resumenTranscripcion || resultado?.transcripcion?.resumenTranscripcion || resultado?.transcripcion?.resumen || null;
  const motorPrincipal = resultado?.resumen?.motorTranscripcionPrincipal || resultado?.transcripcionPrincipal?.motor || resultado?.transcripcion?.motor || null;
  const resumenLinea = lineaTiempoGlobal?.resumen || {};
  const resumenResultado = resultado?.resumen || {};
  const resumenGlobal = entendimientoGlobal?.resumen || {};
  const totalVideos = resumenLinea.totalVideos || videosNormalizados?.totalValidos || resumenResultado.videosOriginales || resumenGlobal.totalVideos || 1;
  const esMultivideo = Boolean(resumenLinea.esMultivideo || videosNormalizados?.esMultivideo || totalVideos > 1);
  const duracionGlobal = numero(resumenLinea.duracionTotalSegundos || resumenResultado.duracionTotalSegundos || resumenGlobal.duracionTotalSegundos, 0);
  return {
    orientacion: resumenLinea.orientacionPredominante || resumenResultado.orientacion || resultado?.analisis?.orientacion || 'desconocida',
    duracionSegundos: duracionGlobal > 0 ? duracionGlobal : (resumenResultado.duracionSegundos || resultado?.analisis?.duracionSegundos || null),
    duracionTotalSegundos: duracionGlobal > 0 ? duracionGlobal : (resumenResultado.duracionTotalSegundos || resumenResultado.duracionSegundos || resultado?.analisis?.duracionSegundos || null),
    duracionVideoPrincipalSegundos: resumenResultado.duracionVideoPrincipalSegundos || resultado?.analisis?.duracionVideoPrincipalSegundos || null,
    tieneAudio: Boolean(resumenLinea.tieneAudio || resumenResultado.tieneAudio || resultado?.analisis?.tieneAudio),
    todosTienenAudio: Boolean(resumenLinea.todosTienenAudio),
    tieneTranscripcionReal: Boolean(resumenResultado.tieneTranscripcionReal || resultado?.resumen?.tieneTranscripcionReal || resultado?.transcripcion?.textoCompleto),
    motorTranscripcionPrincipal: motorPrincipal,
    transcripcionesGeneradas: resumenGlobal.transcripcionesPorMotor || resumenResultado.transcripcionesGeneradas || transcripcionesPorMotor.length,
    resumenTranscripcion,
    fotogramasExtraidos: resumenGlobal.fotogramasGlobales || resumenResultado.fotogramasExtraidos || resultado?.fotogramas?.cantidadExtraida || 0,
    segmentosTranscripcion: resumenGlobal.segmentosGlobales || resumenResultado.segmentosTranscripcion || resultado?.transcripcion?.segmentos?.length || 0,
    palabrasTranscripcion: resumenGlobal.palabrasGlobales || resultado?.transcripcion?.resumen?.palabras || 0,
    listoParaEditar: Boolean(resumenResultado.listoParaEditar || resultado?.resumen?.listoParaEditar || resultado?.transcripcion?.textoCompleto),
    momentosClave: resumenGlobal.momentosGlobales || resumenResultado.momentosClave || (Array.isArray(resultado?.analisisVideo?.momentosClave) ? resultado.analisisVideo.momentosClave.length : 0),
    necesidades: Array.isArray(resultado?.analisisVideo?.necesidades) ? resultado.analisisVideo.necesidades : [],
    videosOriginales: totalVideos,
    videosPreparados: totalVideos,
    videosProcesados: resumenResultado.videosProcesados || resumenGlobal.videosProcesados || 0,
    videosFallidos: resumenResultado.videosFallidos || 0,
    videosAnalizadosEnLineaTiempo: resumenLinea.videosAnalizados || 0,
    videosConAudio: resumenLinea.videosConAudio || 0,
    videosSinAudio: resumenLinea.videosSinAudio || 0,
    modoVideos: esMultivideo ? 'multivideo' : 'video-unico',
    esMultivideo,
    videoPrincipalId: videosNormalizados?.videoPrincipal?.videoId || resultado?.entrada?.video?.videoId || null,
    lineaTiempoGlobal: Boolean(lineaTiempoGlobal?.ok),
    entendimientoPorVideo: Array.isArray(resultado?.resultadosPorVideo),
    entendimientoGlobal: Boolean(entendimientoGlobal?.ok)
  };
}

function aplicarUnionGlobal(resultadoEntendimiento = {}, entendimientoGlobal = null) {
  if (!entendimientoGlobal?.ok) return resultadoEntendimiento;
  return {
    ...resultadoEntendimiento,
    transcripcionGlobal: entendimientoGlobal.transcripcionGlobal,
    transcripcionPrincipal: entendimientoGlobal.transcripcionPrincipal,
    transcripcion: entendimientoGlobal.transcripcion,
    transcripcionesPorMotor: entendimientoGlobal.transcripcionesPorMotor,
    fotogramasGlobales: entendimientoGlobal.fotogramasGlobales,
    fotogramas: entendimientoGlobal.fotogramas,
    analisisVideoGlobal: entendimientoGlobal.analisisVideoGlobal,
    analisisVideo: entendimientoGlobal.analisisVideo,
    entendimientoGlobal,
    resumen: {
      ...(resultadoEntendimiento.resumen || {}),
      duracionSegundos: entendimientoGlobal.resumen?.duracionTotalSegundos || resultadoEntendimiento.resumen?.duracionSegundos || null,
      duracionTotalSegundos: entendimientoGlobal.resumen?.duracionTotalSegundos || resultadoEntendimiento.resumen?.duracionTotalSegundos || null,
      tieneTranscripcionReal: Boolean(entendimientoGlobal.transcripcionGlobal?.textoCompleto || resultadoEntendimiento.resumen?.tieneTranscripcionReal),
      motorTranscripcionPrincipal: entendimientoGlobal.transcripcionGlobal?.motor || resultadoEntendimiento.resumen?.motorTranscripcionPrincipal || null,
      transcripcionesGeneradas: entendimientoGlobal.transcripcionesPorMotor?.length || resultadoEntendimiento.resumen?.transcripcionesGeneradas || 0,
      fotogramasExtraidos: entendimientoGlobal.fotogramasGlobales?.cantidadExtraida || resultadoEntendimiento.resumen?.fotogramasExtraidos || 0,
      segmentosTranscripcion: entendimientoGlobal.transcripcionGlobal?.resumen?.segmentos || resultadoEntendimiento.resumen?.segmentosTranscripcion || 0,
      palabrasTranscripcion: entendimientoGlobal.transcripcionGlobal?.resumen?.palabras || 0,
      momentosClave: entendimientoGlobal.analisisVideoGlobal?.momentosClave?.length || resultadoEntendimiento.resumen?.momentosClave || 0,
      videosProcesados: entendimientoGlobal.resumen?.videosProcesados || resultadoEntendimiento.resumen?.videosProcesados || 0,
      listoParaEditar: Boolean(entendimientoGlobal.transcripcionGlobal?.textoCompleto || resultadoEntendimiento.resumen?.listoParaEditar)
    },
    multivideo: {
      ...(resultadoEntendimiento.multivideo || {}),
      fase: 'bloque-4-union-global',
      transcripcionGlobal: Boolean(entendimientoGlobal.transcripcionGlobal?.textoCompleto),
      fotogramasGlobales: Boolean(entendimientoGlobal.fotogramasGlobales?.cantidadExtraida),
      momentosGlobales: entendimientoGlobal.analisisVideoGlobal?.momentosClave?.length || 0,
      nota: 'Transcripción, fotogramas y momentos ya fueron consolidados en una vista global del proyecto.'
    }
  };
}

export async function procesarEntendimientoProyectoEtapa({ proyectoId, opciones = {}, solicitud = {} } = {}) {
  if (!proyectoId) throw new Error('Falta proyectoId para procesar entendimiento.');
  const carpetaProyecto = obtenerCarpetaProyecto(proyectoId);
  const estadoInicial = await cargarEstadoProyectoEtapas({ proyectoId, crearSiFalta: false });
  if (!estadoInicial) throw new Error('No existe estado-proyecto.json. Primero crea el proyecto.');

  const reportarProgreso = async (evento = {}) => {
    const mensaje = evento.mensaje || evento.detalle || 'Procesando entendimiento del proyecto.';
    return await registrarProgresoEntendimiento({ proyectoId, mensaje });
  };

  try {
    await registrarProgresoEntendimiento({ proyectoId, mensaje: 'Iniciando entendimiento global del proyecto.' });

    const videosGuardados = await cargarVideosOriginalesProyecto(proyectoId);
    const videosNormalizados = normalizarVideosEntendimiento(videosGuardados);
    if (!videosNormalizados.ok) throw new Error(videosNormalizados.mensaje);
    await reportarProgreso({ mensaje: `Videos detectados: ${videosNormalizados.totalValidos}/${videosNormalizados.total} válido(s).` });

    const estadoProcesando = await cargarEstadoProyectoEtapas({ proyectoId, crearSiFalta: false });
    const entradaBase = {
      proyecto: {
        id: proyectoId,
        nombre: estadoProcesando?.nombre || estadoInicial?.nombre || 'Proyecto AutoVideoJeff'
      }
    };

    await reportarProgreso({ mensaje: 'Leyendo duración, audio, formato y línea de tiempo de los videos.' });
    const lineaTiempoGlobal = await crearLineaTiempoMultivideo({
      entrada: entradaBase,
      videosNormalizados,
      carpetaProyecto
    });
    await reportarProgreso({ mensaje: `Línea de tiempo lista: ${lineaTiempoGlobal?.resumen?.videosAnalizados || videosNormalizados.totalValidos} video(s), ${lineaTiempoGlobal?.resumen?.duracionTotalSegundos || 0} segundos.` });

    await reportarProgreso({ mensaje: 'Procesando transcripción, fotogramas y análisis por video.' });
    const resultadoPorVideo = await procesarEntendimientoMultivideo({
      proyectoId,
      estado: estadoProcesando,
      carpetaProyecto,
      videosNormalizados,
      lineaTiempoGlobal,
      opciones: { ...opciones, onProgreso: reportarProgreso },
      solicitud,
      etapa: ETAPAS_AUTOVIDEO.ENTENDIMIENTO
    });

    await reportarProgreso({ mensaje: `Entendimiento por video listo: ${resultadoPorVideo?.resumen?.videosProcesados || 0}/${videosNormalizados.totalValidos} procesado(s).` });
    await reportarProgreso({ mensaje: 'Uniendo transcripciones, fotogramas y momentos en un entendimiento global.' });
    const entendimientoGlobal = await unirEntendimientoMultivideo({
      proyectoId,
      carpetaProyecto,
      lineaTiempoGlobal,
      resultadosPorVideo: resultadoPorVideo.resultadosPorVideo || []
    });

    const resultadoEntendimiento = aplicarUnionGlobal(resultadoPorVideo, entendimientoGlobal);
    const resumen = crearResumenEntendimiento(resultadoEntendimiento, videosNormalizados, lineaTiempoGlobal, entendimientoGlobal);

    await reportarProgreso({ mensaje: 'Guardando resultado final de entendimiento del proyecto.' });
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
        entendimientoGlobal,
        multivideo: {
          ...(resultadoEntendimiento.multivideo || {}),
          activo: videosNormalizados.esMultivideo,
          fase: 'bloque-4-union-global',
          lineaTiempoGlobal: Boolean(lineaTiempoGlobal?.ok),
          duracionTotalSegundos: lineaTiempoGlobal?.resumen?.duracionTotalSegundos || null,
          videosAnalizados: lineaTiempoGlobal?.resumen?.videosAnalizados || 0,
          videosProcesados: resultadoEntendimiento?.resumen?.videosProcesados || 0,
          videosFallidos: resultadoEntendimiento?.resumen?.videosFallidos || 0,
          transcripcionGlobal: Boolean(entendimientoGlobal?.transcripcionGlobal?.textoCompleto),
          fotogramasGlobales: Boolean(entendimientoGlobal?.fotogramasGlobales?.cantidadExtraida),
          momentosGlobales: entendimientoGlobal?.analisisVideoGlobal?.momentosClave?.length || 0,
          nota: videosNormalizados.esMultivideo
            ? 'Transcripción, fotogramas y momentos globales consolidados para todo el proyecto.'
            : 'Proyecto de un solo video procesado y consolidado con estructura global.'
        }
      },
      metadata: {
        bloque: 7,
        tipo: videosNormalizados.esMultivideo ? 'entendimiento-backend-global-multivideo' : 'entendimiento-backend-global-video-unico',
        origen: 'POST /api/proyectos/:proyectoId/entendimiento/procesar',
        videos: {
          total: videosNormalizados.total,
          totalValidos: videosNormalizados.totalValidos,
          modo: videosNormalizados.modo,
          videoPrincipalId: videosNormalizados.videoPrincipal?.videoId || null,
          duracionTotalSegundos: lineaTiempoGlobal?.resumen?.duracionTotalSegundos || null,
          videosProcesados: resultadoEntendimiento?.resumen?.videosProcesados || 0,
          videosFallidos: resultadoEntendimiento?.resumen?.videosFallidos || 0,
          segmentosGlobales: entendimientoGlobal?.transcripcionGlobal?.resumen?.segmentos || 0,
          fotogramasGlobales: entendimientoGlobal?.fotogramasGlobales?.cantidadExtraida || 0
        }
      }
    });

    const estadoFinal = await avanzarEstadoProyectoEtapas({
      proyectoId,
      etapaDestino: ETAPAS_AUTOVIDEO.ENTENDIMIENTO,
      estadoDestino: ESTADOS_PROYECTO_ETAPAS.ENTENDIDO,
      archivoGenerado: guardado.ruta,
      mensaje: videosNormalizados.esMultivideo
        ? 'Entendimiento global multivideo completado.'
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
      entendimientoGlobal,
      resultadosPorVideo: resultadoEntendimiento.resultadosPorVideo || [],
      archivo: guardado,
      mensaje: resultadoEntendimiento.mensaje || 'Entendimiento completado.'
    };
  } catch (error) {
    await marcarErrorEstadoProyectoEtapas({ proyectoId, etapa: ETAPAS_AUTOVIDEO.ENTENDIMIENTO, error, mensaje: 'Error en entendimiento global multivideo.' }).catch(() => null);
    throw error;
  }
}

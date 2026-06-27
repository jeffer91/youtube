/*
  Bloque 6: Entendimiento backend independiente
  Función: ejecutar la etapa de entendimiento desde la nueva API por etapas.
*/

import path from 'path';
import fs from 'fs';
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

function texto(valor, respaldo = '') {
  const limpio = String(valor || '').trim();
  return limpio || respaldo;
}

function obtenerCarpetaProyecto(proyectoId) {
  return path.join(obtenerRutaRaiz(), 'datos', 'proyectos', proyectoId);
}

async function cargarVideosOriginalesProyecto(proyectoId) {
  const ruta = path.join(obtenerCarpetaProyecto(proyectoId), 'videos-originales.json');
  return await leerJsonSiExiste(ruta, { ok: true, proyectoId, total: 0, videos: [] });
}

function seleccionarVideoPrincipal(videos = []) {
  const lista = Array.isArray(videos) ? videos : [];
  const seleccionado = lista.find((item) => item?.rutaProyecto && fs.existsSync(item.rutaProyecto)) || null;
  if (!seleccionado) throw new Error('No existe video original guardado para ejecutar entendimiento. Primero sube el video al proyecto.');
  return seleccionado;
}

function crearEntradaEntendimiento({ proyectoId, estado, video, carpetaProyecto }) {
  const nombreProyecto = texto(estado?.nombre, 'Proyecto AutoVideoJeff');
  const datos = estado?.datos || {};
  return {
    ok: true,
    etapa: ETAPAS_AUTOVIDEO.ENTENDIMIENTO,
    proyecto: {
      id: proyectoId,
      nombre: nombreProyecto,
      perfil: texto(datos.perfil, 'general'),
      plataforma: texto(datos.plataforma, 'tiktok'),
      modoEdicion: texto(datos.modoEdicion, 'revision_completa')
    },
    video: {
      nombreOriginal: video.nombreOriginal || video.nombreTemporal || path.basename(video.rutaProyecto),
      nombreSeguro: path.basename(video.rutaProyecto),
      rutaOriginal: video.rutaProyecto,
      extension: path.extname(video.rutaProyecto).toLowerCase(),
      origen: 'api-etapas'
    },
    rutas: {
      carpetaProyecto,
      rutaVideoOriginal: video.rutaProyecto
    }
  };
}

function crearResumenEntendimiento(resultado) {
  const transcripcionesPorMotor = Array.isArray(resultado?.transcripcionesPorMotor) ? resultado.transcripcionesPorMotor : [];
  const resumenTranscripcion = resultado?.resumenTranscripcion || resultado?.transcripcion?.resumenTranscripcion || null;
  const motorPrincipal = resultado?.resumen?.motorTranscripcionPrincipal || resultado?.transcripcionPrincipal?.motor || resultado?.transcripcion?.motor || null;
  return {
    orientacion: resultado?.resumen?.orientacion || resultado?.analisis?.orientacion || 'desconocida',
    duracionSegundos: resultado?.resumen?.duracionSegundos || resultado?.analisis?.duracionSegundos || null,
    tieneAudio: Boolean(resultado?.analisis?.tieneAudio),
    tieneTranscripcionReal: Boolean(resultado?.resumen?.tieneTranscripcionReal),
    motorTranscripcionPrincipal: motorPrincipal,
    transcripcionesGeneradas: transcripcionesPorMotor.length,
    resumenTranscripcion,
    fotogramasExtraidos: resultado?.resumen?.fotogramasExtraidos || 0,
    listoParaEditar: Boolean(resultado?.resumen?.listoParaEditar),
    momentosClave: Array.isArray(resultado?.analisisVideo?.momentosClave) ? resultado.analisisVideo.momentosClave.length : 0,
    necesidades: Array.isArray(resultado?.analisisVideo?.necesidades) ? resultado.analisisVideo.necesidades : []
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
    const video = seleccionarVideoPrincipal(videosGuardados.videos || []);
    const estadoProcesando = await cargarEstadoProyectoEtapas({ proyectoId, crearSiFalta: false });
    const entrada = crearEntradaEntendimiento({ proyectoId, estado: estadoProcesando, video, carpetaProyecto });
    const resultadoEntendimiento = await entenderVideo(entrada, { ...opciones, ...(solicitud || {}), etapaSolicitada: ETAPAS_AUTOVIDEO.ENTENDIMIENTO });
    const resumen = crearResumenEntendimiento(resultadoEntendimiento);

    const guardado = await guardarResultadoEtapa({
      proyectoId,
      etapa: ETAPAS_AUTOVIDEO.ENTENDIMIENTO,
      resultado: {
        ...resultadoEntendimiento,
        resumenEtapa: resumen
      },
      metadata: {
        bloque: 7,
        tipo: 'entendimiento-backend-multimotor',
        origen: 'POST /api/proyectos/:proyectoId/entendimiento/procesar'
      }
    });

    const estadoFinal = await avanzarEstadoProyectoEtapas({
      proyectoId,
      etapaDestino: ETAPAS_AUTOVIDEO.ENTENDIMIENTO,
      estadoDestino: ESTADOS_PROYECTO_ETAPAS.ENTENDIDO,
      archivoGenerado: guardado.ruta,
      mensaje: 'Entendimiento independiente completado.'
    });

    return {
      ok: true,
      proyectoId,
      etapa: ETAPAS_AUTOVIDEO.ENTENDIMIENTO,
      estado: estadoFinal,
      entrada,
      resultado: resultadoEntendimiento,
      resumen,
      archivo: guardado,
      mensaje: resultadoEntendimiento.mensaje || 'Entendimiento completado.'
    };
  } catch (error) {
    await marcarErrorEstadoProyectoEtapas({ proyectoId, etapa: ETAPAS_AUTOVIDEO.ENTENDIMIENTO, error, mensaje: 'Error en entendimiento independiente.' }).catch(() => null);
    throw error;
  }
}

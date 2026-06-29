/*
  Bloque 10: Producción maestro backend
  Función: tomar el plan de edición y producir un video maestro exportado con auditoría.
*/

import path from 'path';
import fs from 'fs';
import { editarVideo } from '../../editar/editar.conexion.js';
import { prepararSalida } from '../../salida/salida.conexion.js';
import { leerJsonSiExiste, obtenerRutaRaiz } from '../../comun/archivos.js';
import {
  ETAPAS_AUTOVIDEO,
  ESTADOS_PROYECTO_ETAPAS,
  cargarEstadoProyectoEtapas,
  avanzarEstadoProyectoEtapas,
  marcarErrorEstadoProyectoEtapas,
  guardarResultadoEtapa,
  cargarResultadoEtapa
} from '../../flujo-etapas/flujo-etapas.conexion.js';
import { unirVideosMaestroMultivideo } from './unir-videos-maestro.service.js';
import { construirTimelineEditorialProduccion } from './construir-marcadores-produccion.service.js';

function texto(valor, respaldo = '') {
  const limpio = String(valor ?? '').replace(/\s+/g, ' ').trim();
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

function existeArchivo(rutaArchivo) {
  try {
    return Boolean(rutaArchivo && fs.existsSync(rutaArchivo) && fs.statSync(rutaArchivo).isFile());
  } catch (_error) {
    return false;
  }
}

function seleccionarVideoPrincipal(videos = []) {
  const lista = Array.isArray(videos) ? videos : [];
  const seleccionado = lista.find((item) => item?.rutaProyecto && existeArchivo(item.rutaProyecto)) || lista.find((item) => item?.rutaOriginal && existeArchivo(item.rutaOriginal)) || null;
  if (!seleccionado) throw new Error('No existe video original guardado para producir. Primero sube el video al proyecto.');
  return seleccionado;
}

function obtenerVideosValidos(videosGuardados = {}) {
  const lista = Array.isArray(videosGuardados?.videos) ? videosGuardados.videos : Array.isArray(videosGuardados) ? videosGuardados : [];
  return lista
    .map((video, index) => ({
      ...video,
      id: video.id || video.videoId || `video-${String(index + 1).padStart(2, '0')}`,
      videoId: video.videoId || video.id || `video-${String(index + 1).padStart(2, '0')}`,
      indice: video.indice ?? index,
      orden: video.orden ?? index + 1,
      rutaProyecto: video.rutaProyecto || video.rutaOriginal || video.ruta || '',
      rutaOriginal: video.rutaOriginal || video.rutaProyecto || video.ruta || ''
    }))
    .filter((video) => existeArchivo(video.rutaProyecto || video.rutaOriginal));
}

function extraerResultadoEtapa(wrapper = {}) {
  if (wrapper?.resultado?.resultado) return wrapper.resultado.resultado;
  if (wrapper?.datos?.resultado?.resultado) return wrapper.datos.resultado.resultado;
  if (wrapper?.resultado) return wrapper.resultado;
  return wrapper;
}

function extraerEntendimiento(wrapper = {}) {
  const entendimiento = extraerResultadoEtapa(wrapper);
  if (!entendimiento || typeof entendimiento !== 'object') throw new Error('No existe entendimiento válido para producción.');
  return entendimiento;
}

function extraerPlan(wrapper = {}) {
  const plan = extraerResultadoEtapa(wrapper);
  if (!plan || typeof plan !== 'object') throw new Error('No existe plan de edición válido para producción.');
  if (!plan.planProduccion) throw new Error('El plan cargado no contiene planProduccion.');
  return plan;
}

function obtenerLineaTiempoGlobal(entendimiento = {}, plan = {}) {
  return plan.planProduccion?.lineaTiempoGlobal || plan.fuente?.lineaTiempoGlobal || entendimiento.lineaTiempoGlobal || entendimiento.entendimientoGlobal?.lineaTiempoGlobal || null;
}

function esMultivideoProduccion({ videosValidos = [], entendimiento = {}, plan = {} } = {}) {
  return videosValidos.length > 1 || Boolean(plan.multivideo?.activo || plan.planProduccion?.multivideo?.activo || entendimiento.multivideo?.activo);
}

async function prepararVideoBaseProduccion({ proyectoId, carpetaProyecto, videosValidos, entendimiento, plan } = {}) {
  const lineaTiempoGlobal = obtenerLineaTiempoGlobal(entendimiento, plan);
  const multivideoActivo = esMultivideoProduccion({ videosValidos, entendimiento, plan });
  if (!multivideoActivo) {
    const video = seleccionarVideoPrincipal(videosValidos);
    return {
      ok: true,
      multivideoActivo: false,
      video,
      unionVideos: null,
      videosFuente: [video],
      lineaTiempoGlobal
    };
  }

  const unionVideos = await unirVideosMaestroMultivideo({
    proyectoId,
    carpetaProyecto,
    videos: videosValidos,
    lineaTiempoGlobal
  });

  return {
    ok: true,
    multivideoActivo: true,
    video: unionVideos.videoMaestro,
    unionVideos,
    videosFuente: videosValidos,
    lineaTiempoGlobal
  };
}

function crearEntradaProduccion({ proyectoId, estado, video, carpetaProyecto, plan, videoBase }) {
  const proyectoPlan = plan.proyecto || {};
  const multivideoActivo = Boolean(videoBase?.multivideoActivo);
  return {
    ok: true,
    etapa: ETAPAS_AUTOVIDEO.PRODUCCION,
    proyecto: {
      id: proyectoId,
      nombre: texto(estado?.nombre || proyectoPlan.nombre, 'Proyecto AutoVideoJeff'),
      perfil: texto(proyectoPlan.perfil || estado?.datos?.perfil, 'general'),
      plataforma: texto(proyectoPlan.plataforma || estado?.datos?.plataforma, 'tiktok'),
      modoEdicion: texto(proyectoPlan.modoEdicion || estado?.datos?.modoEdicion, 'revision_completa'),
      esMultivideo: multivideoActivo,
      totalVideos: videoBase?.videosFuente?.length || 1
    },
    video: {
      id: video.videoId || video.id || null,
      videoId: video.videoId || video.id || null,
      nombreOriginal: video.nombreOriginal || video.nombreTemporal || path.basename(video.rutaProyecto || video.rutaOriginal),
      nombreSeguro: video.nombreSeguro || path.basename(video.rutaProyecto || video.rutaOriginal),
      rutaOriginal: video.rutaProyecto || video.rutaOriginal,
      rutaProyecto: video.rutaProyecto || video.rutaOriginal,
      extension: path.extname(video.rutaProyecto || video.rutaOriginal).toLowerCase(),
      origen: multivideoActivo ? 'api-etapas-produccion-maestro-multivideo' : 'api-etapas-produccion'
    },
    videos: videoBase?.videosFuente || [video],
    lineaTiempoGlobal: videoBase?.lineaTiempoGlobal || null,
    multivideo: {
      activo: multivideoActivo,
      fase: 'bloque-7-produccion-multivideo',
      totalVideos: videoBase?.videosFuente?.length || 1,
      usaVideoMaestroUnido: Boolean(videoBase?.unionVideos?.videoMaestro),
      videoMaestroTemporal: videoBase?.unionVideos?.videoMaestro || null,
      unionVideos: videoBase?.unionVideos || null
    },
    rutas: {
      carpetaProyecto,
      rutaVideoOriginal: video.rutaProyecto || video.rutaOriginal,
      carpetaProduccion: path.join(carpetaProyecto, 'produccion')
    }
  };
}

function crearOpcionesProduccion({ plan = {}, solicitud = {}, videoBase = null } = {}) {
  const proyecto = plan.proyecto || {};
  return {
    plataforma: texto(solicitud.plataforma || proyecto.plataforma, 'tiktok'),
    modo: texto(solicitud.modo || solicitud.modoVideo || 'cuadrado-centro', 'cuadrado-centro'),
    modoEdicion: texto(solicitud.modoEdicion || proyecto.modoEdicion, 'revision_completa'),
    perfil: texto(solicitud.perfil || proyecto.perfil, 'general'),
    exportarMultiplataforma: false,
    crearTranscripcion: false,
    agregarSubtitulos: true,
    agregarTextosFlotantes: true,
    agregarSonidosEdicion: true,
    agregarEfectosVisualesDinamicos: true,
    usarMotorEfectos: true,
    intensidadEfectos: texto(solicitud.intensidadEfectos, 'normal'),
    maxEfectosVisuales: numero(solicitud.maxEfectosVisuales, 12),
    origen: videoBase?.multivideoActivo ? 'produccion-maestro-etapas-multivideo' : 'produccion-maestro-etapas',
    multivideo: videoBase?.multivideoActivo || false,
    planEdicionId: plan.planProduccion?.id || null
  };
}

function crearTranscripcionDesdeEntendimiento(entendimiento = {}) {
  const transcripcion = entendimiento.transcripcionGlobal || entendimiento.transcripcionPrincipal || entendimiento.transcripcion || null;
  if (!transcripcion) return null;
  return {
    ...transcripcion,
    origenProduccion: transcripcion.tipo === 'transcripcion-global-multivideo' ? 'entendimiento-global-multivideo' : 'entendimiento-guardado'
  };
}

function obtenerPlanEjecutable(plan = {}) {
  return plan.planEjecutable || plan.planPorPartes?.planEjecutable || plan.planProduccion?.planEjecutable || null;
}

function crearEdicionDinamicaDesdePlan(plan = {}) {
  const elementos = Array.isArray(plan.planProduccion?.elementos) ? plan.planProduccion.elementos : [];
  const planEjecutable = obtenerPlanEjecutable(plan);
  const cortes = elementos.filter((item) => ['corte', 'segmento', 'subtitulo', 'texto', 'efecto', 'recurso', 'zoom', 'animacion', 'transicion', 'audio'].includes(item.tipo)).slice(0, 80);
  return {
    activo: cortes.length > 0,
    omitido: cortes.length === 0,
    origen: plan.multivideo?.activo ? 'plan-edicion-multivideo' : 'plan-edicion',
    planProduccionId: plan.planProduccion?.id || null,
    elementosUsados: cortes.length,
    planEjecutable,
    multivideo: plan.multivideo || plan.planProduccion?.multivideo || null,
    lineaTiempoGlobal: plan.planProduccion?.lineaTiempoGlobal || plan.fuente?.lineaTiempoGlobal || null,
    mapaTiempo: cortes.map((item, index) => ({
      id: item.id || `item-${index + 1}`,
      tipo: item.tipo || 'elemento',
      videoId: item.videoId || item.datos?.videoId || null,
      indiceVideo: item.indiceVideo ?? item.datos?.indiceVideo ?? null,
      ordenVideo: item.ordenVideo ?? item.datos?.ordenVideo ?? null,
      inicioLocal: item.inicioLocal ?? item.datos?.inicioLocal ?? null,
      finLocal: item.finLocal ?? item.datos?.finLocal ?? null,
      inicioGlobal: item.inicioGlobal ?? item.datos?.inicioGlobal ?? item.inicio ?? null,
      finGlobal: item.finGlobal ?? item.datos?.finGlobal ?? item.fin ?? null,
      offsetGlobal: item.offsetGlobal ?? item.datos?.offsetGlobal ?? null,
      inicio: numero(item.inicioGlobal ?? item.inicio, 0),
      fin: numero(item.finGlobal ?? item.fin, numero(item.inicioGlobal ?? item.inicio, 0) + 2),
      motivo: texto(item.motivo || item.descripcion, 'Elemento tomado del plan de edición.')
    })),
    diagnostico: {
      mensaje: cortes.length
        ? 'Producción basada en elementos del plan de edición con tiempos globales.'
        : 'Plan sin elementos suficientes para edición dinámica.'
    }
  };
}

function crearResumenProduccion({ plan, edicion, salida, videoBase, timelineEditorial }) {
  const elementos = Array.isArray(plan.planProduccion?.elementos) ? plan.planProduccion.elementos : [];
  const resumenMarcadores = timelineEditorial?.resumen || {};
  return {
    totalElementosPlan: elementos.length,
    elementosAprobados: elementos.filter((item) => item.aprobado).length,
    elementosEnRevision: elementos.filter((item) => !item.aprobado && !item.rechazado).length,
    esMultivideo: Boolean(videoBase?.multivideoActivo),
    videosFuente: videoBase?.videosFuente?.length || 1,
    videoMaestroUnido: videoBase?.unionVideos?.videoMaestro?.nombreSeguro || null,
    duracionTotalSegundos: plan.resumen?.duracionTotalSegundos || plan.planProduccion?.duracionSegundos || timelineEditorial?.duracionSegundos || null,
    videoMaestro: salida?.nombreExportado || null,
    urlPublica: salida?.urlPublica || null,
    pesoBytes: salida?.pesoBytes || null,
    modo: salida?.modo || edicion?.modo || null,
    plataformaBase: salida?.plataforma || edicion?.plataforma || null,
    filtroVideo: edicion?.render?.filtroVideo || null,
    antesDespues: Boolean(salida?.antesDespues?.ok),
    reporteFinal: salida?.reporteFinal?.nombreArchivo || null,
    listoParaAdaptacion: Boolean(salida?.ok && salida?.rutaExportada),
    timelineEditorial: {
      existe: Boolean(timelineEditorial?.ok),
      totalMarcadores: resumenMarcadores.totalMarcadores || 0,
      totalPistas: resumenMarcadores.totalPistas || 0,
      duracionSegundos: resumenMarcadores.duracionSegundos || timelineEditorial?.duracionSegundos || 0
    },
    marcadores: {
      total: resumenMarcadores.totalMarcadores || 0,
      aplicados: resumenMarcadores.aplicados || 0,
      planificados: resumenMarcadores.planificados || 0,
      omitidos: resumenMarcadores.omitidos || 0,
      globales: resumenMarcadores.globales || 0,
      cortes: resumenMarcadores.cortes || 0,
      subtitulos: resumenMarcadores.subtitulos || 0,
      textos: resumenMarcadores.textos || 0,
      zooms: resumenMarcadores.zooms || 0,
      efectos: resumenMarcadores.efectos || 0,
      animaciones: resumenMarcadores.animaciones || 0,
      transiciones: resumenMarcadores.transiciones || 0,
      audioSfx: resumenMarcadores.audioSfx || 0,
      recursos: resumenMarcadores.recursos || 0
    }
  };
}

function crearAuditoriaProduccion({ entrada, plan, edicion, salida, videoBase, timelineEditorial }) {
  return {
    tipo: videoBase?.multivideoActivo ? 'produccion-maestro-multivideo' : 'produccion-maestro',
    entrada: {
      proyectoId: entrada.proyecto.id,
      nombreOriginal: entrada.video.nombreOriginal,
      rutaOriginal: entrada.video.rutaOriginal,
      multivideo: entrada.multivideo || null
    },
    plan: {
      id: plan.planProduccion?.id || null,
      totalElementos: plan.planProduccion?.elementos?.length || 0,
      validacion: plan.validacion || null,
      resumen: plan.resumen || null,
      multivideo: plan.multivideo || plan.planProduccion?.multivideo || null
    },
    timelineEditorial: timelineEditorial ? {
      ok: Boolean(timelineEditorial.ok),
      version: timelineEditorial.version || null,
      totalMarcadores: timelineEditorial.resumen?.totalMarcadores || 0,
      totalPistas: timelineEditorial.resumen?.totalPistas || 0,
      porTipo: timelineEditorial.resumen?.porTipo || {},
      porPista: timelineEditorial.resumen?.porPista || {}
    } : null,
    unionVideos: videoBase?.unionVideos ? {
      ok: videoBase.unionVideos.ok,
      metodo: videoBase.unionVideos.metodo,
      totalVideosFuente: videoBase.unionVideos.totalVideosFuente,
      rutaSalida: videoBase.unionVideos.rutaSalida
    } : null,
    edicion: {
      ok: Boolean(edicion?.ok),
      tipo: edicion?.tipo || null,
      modo: edicion?.modo || null,
      filtroVideo: edicion?.render?.filtroVideo || null,
      sonidosAplicados: Boolean(edicion?.sonidos && !edicion.sonidos.omitido),
      animacionesAplicadas: Boolean(edicion?.render?.animacionesRender)
    },
    salida: {
      ok: Boolean(salida?.ok),
      nombreExportado: salida?.nombreExportado || null,
      rutaExportada: salida?.rutaExportada || null,
      urlPublica: salida?.urlPublica || null,
      pesoBytes: salida?.pesoBytes || null
    },
    creadoEn: new Date().toISOString()
  };
}

export async function procesarProduccionMaestroProyectoEtapa({ proyectoId, opciones = {}, solicitud = {} } = {}) {
  if (!proyectoId) throw new Error('Falta proyectoId para procesar producción maestro.');
  const carpetaProyecto = obtenerCarpetaProyecto(proyectoId);
  const estadoInicial = await cargarEstadoProyectoEtapas({ proyectoId, crearSiFalta: false });
  if (!estadoInicial) throw new Error('No existe estado-proyecto.json. Primero crea el proyecto.');

  try {
    await avanzarEstadoProyectoEtapas({
      proyectoId,
      etapaDestino: ETAPAS_AUTOVIDEO.PRODUCCION,
      estadoDestino: ESTADOS_PROYECTO_ETAPAS.PRODUCIENDO,
      mensaje: 'Iniciando producción del video maestro desde el plan de edición.'
    });

    const entendimientoGuardado = await cargarResultadoEtapa({ proyectoId, etapa: ETAPAS_AUTOVIDEO.ENTENDIMIENTO, valorPorDefecto: null });
    const planGuardado = await cargarResultadoEtapa({ proyectoId, etapa: ETAPAS_AUTOVIDEO.PLAN_EDICION, valorPorDefecto: null });
    if (!entendimientoGuardado) throw new Error('No se puede producir porque no existe entendimiento guardado.');
    if (!planGuardado) throw new Error('No se puede producir porque no existe plan de edición guardado.');

    const videosGuardados = await cargarVideosOriginalesProyecto(proyectoId);
    const videosValidos = obtenerVideosValidos(videosGuardados);
    const estadoProcesando = await cargarEstadoProyectoEtapas({ proyectoId, crearSiFalta: false });
    const entendimiento = extraerEntendimiento(entendimientoGuardado);
    const plan = extraerPlan(planGuardado);
    const videoBase = await prepararVideoBaseProduccion({ proyectoId, carpetaProyecto, videosValidos, entendimiento, plan });
    const entrada = crearEntradaProduccion({ proyectoId, estado: estadoProcesando, video: videoBase.video, carpetaProyecto, plan, videoBase });
    const opcionesProduccion = crearOpcionesProduccion({ plan, solicitud: { ...opciones, ...solicitud }, videoBase });
    const transcripcion = crearTranscripcionDesdeEntendimiento(entendimiento);
    const edicionDinamica = crearEdicionDinamicaDesdePlan(plan);

    const edicion = await editarVideo({ entrada, entendimiento, audio: null, transcripcion, edicionDinamica, opciones: opcionesProduccion, progreso: null });
    const salida = await prepararSalida({ entrada, entendimiento, audio: null, transcripcion, edicionDinamica, edicion, opciones: opcionesProduccion, progreso: null });
    const timelineEditorial = construirTimelineEditorialProduccion({ plan, edicion, salida, videoBase, edicionDinamica });
    const resumen = crearResumenProduccion({ plan, edicion, salida, videoBase, timelineEditorial });
    const auditoria = crearAuditoriaProduccion({ entrada, plan, edicion, salida, videoBase, timelineEditorial });

    const produccion = {
      ok: true,
      etapa: ETAPAS_AUTOVIDEO.PRODUCCION,
      proyectoId,
      entrada,
      resumen,
      multivideo: {
        activo: Boolean(videoBase.multivideoActivo),
        fase: 'bloque-7-produccion-multivideo',
        totalVideos: videoBase.videosFuente?.length || 1,
        usaVideoMaestroUnido: Boolean(videoBase.unionVideos?.videoMaestro),
        unionVideos: videoBase.unionVideos || null,
        usaTiemposGlobales: Boolean(edicionDinamica?.lineaTiempoGlobal),
        nota: videoBase.multivideoActivo
          ? 'Producción realizada sobre un video maestro temporal unido desde todos los videos originales.'
          : 'Producción realizada con video único compatible con flujo multivideo.'
      },
      videoMaestro: {
        nombre: salida.nombreExportado,
        ruta: salida.rutaExportada,
        rutaRelativa: salida.rutaRelativa,
        urlPublica: salida.urlPublica,
        pesoBytes: salida.pesoBytes,
        fuenteTemporal: videoBase.unionVideos?.videoMaestro || null
      },
      planProduccion: plan.planProduccion,
      timelineEditorial,
      pistasProduccion: timelineEditorial.pistas,
      marcadoresProduccion: timelineEditorial.marcadores,
      resumenMarcadores: timelineEditorial.resumen,
      edicion,
      salida,
      auditoria,
      siguienteEtapa: ETAPAS_AUTOVIDEO.ADAPTACION,
      creadoEn: new Date().toISOString()
    };

    const guardado = await guardarResultadoEtapa({
      proyectoId,
      etapa: ETAPAS_AUTOVIDEO.PRODUCCION,
      resultado: produccion,
      metadata: {
        bloque: 10,
        tipo: videoBase.multivideoActivo ? 'produccion-maestro-backend-multivideo' : 'produccion-maestro-backend',
        origen: 'POST /api/proyectos/:proyectoId/produccion/procesar',
        multivideo: produccion.multivideo,
        timelineEditorial: produccion.resumenMarcadores
      }
    });

    const estadoFinal = await avanzarEstadoProyectoEtapas({
      proyectoId,
      etapaDestino: ETAPAS_AUTOVIDEO.PRODUCCION,
      estadoDestino: ESTADOS_PROYECTO_ETAPAS.PRODUCIDO,
      archivoGenerado: guardado.ruta,
      mensaje: videoBase.multivideoActivo ? 'Producción maestro multivideo completada.' : 'Producción maestro completada.'
    });

    return {
      ok: true,
      proyectoId,
      etapa: ETAPAS_AUTOVIDEO.PRODUCCION,
      estado: estadoFinal,
      resultado: produccion,
      resumen,
      archivo: guardado,
      mensaje: videoBase.multivideoActivo ? 'Video maestro multivideo producido correctamente.' : 'Video maestro producido correctamente.'
    };
  } catch (error) {
    await marcarErrorEstadoProyectoEtapas({ proyectoId, etapa: ETAPAS_AUTOVIDEO.PRODUCCION, error, mensaje: 'Error en producción maestro.' }).catch(() => null);
    throw error;
  }
}

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
  return await leerJsonSiExiste(ruta, { ok: true, proyectoId, total: 0, videos: [] });
}

function seleccionarVideoPrincipal(videos = []) {
  const lista = Array.isArray(videos) ? videos : [];
  const seleccionado = lista.find((item) => item?.rutaProyecto && fs.existsSync(item.rutaProyecto)) || null;
  if (!seleccionado) throw new Error('No existe video original guardado para producir. Primero sube el video al proyecto.');
  return seleccionado;
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

function crearEntradaProduccion({ proyectoId, estado, video, carpetaProyecto, plan }) {
  const proyectoPlan = plan.proyecto || {};
  return {
    ok: true,
    etapa: ETAPAS_AUTOVIDEO.PRODUCCION,
    proyecto: {
      id: proyectoId,
      nombre: texto(estado?.nombre || proyectoPlan.nombre, 'Proyecto AutoVideoJeff'),
      perfil: texto(proyectoPlan.perfil || estado?.datos?.perfil, 'general'),
      plataforma: texto(proyectoPlan.plataforma || estado?.datos?.plataforma, 'tiktok'),
      modoEdicion: texto(proyectoPlan.modoEdicion || estado?.datos?.modoEdicion, 'revision_completa')
    },
    video: {
      nombreOriginal: video.nombreOriginal || video.nombreTemporal || path.basename(video.rutaProyecto),
      nombreSeguro: path.basename(video.rutaProyecto),
      rutaOriginal: video.rutaProyecto,
      extension: path.extname(video.rutaProyecto).toLowerCase(),
      origen: 'api-etapas-produccion'
    },
    rutas: {
      carpetaProyecto,
      rutaVideoOriginal: video.rutaProyecto
    }
  };
}

function crearOpcionesProduccion({ plan = {}, solicitud = {} } = {}) {
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
    origen: 'produccion-maestro-etapas',
    planEdicionId: plan.planProduccion?.id || null
  };
}

function crearTranscripcionDesdeEntendimiento(entendimiento = {}) {
  const transcripcion = entendimiento.transcripcion || null;
  if (!transcripcion) return null;
  return {
    ...transcripcion,
    origenProduccion: 'entendimiento-guardado'
  };
}

function crearEdicionDinamicaDesdePlan(plan = {}) {
  const elementos = Array.isArray(plan.planProduccion?.elementos) ? plan.planProduccion.elementos : [];
  const cortes = elementos.filter((item) => ['corte', 'segmento', 'subtitulo', 'texto', 'efecto', 'recurso'].includes(item.tipo)).slice(0, 40);
  return {
    activo: cortes.length > 0,
    omitido: cortes.length === 0,
    origen: 'plan-edicion',
    planProduccionId: plan.planProduccion?.id || null,
    elementosUsados: cortes.length,
    mapaTiempo: cortes.map((item, index) => ({
      id: item.id || `item-${index + 1}`,
      tipo: item.tipo || 'elemento',
      inicio: numero(item.inicio, 0),
      fin: numero(item.fin, numero(item.inicio, 0) + 2),
      motivo: texto(item.motivo || item.descripcion, 'Elemento tomado del plan de edición.')
    })),
    diagnostico: {
      mensaje: cortes.length ? 'Producción basada en elementos del plan de edición.' : 'Plan sin elementos suficientes para edición dinámica.'
    }
  };
}

function crearResumenProduccion({ plan, edicion, salida }) {
  const elementos = Array.isArray(plan.planProduccion?.elementos) ? plan.planProduccion.elementos : [];
  return {
    totalElementosPlan: elementos.length,
    elementosAprobados: elementos.filter((item) => item.aprobado).length,
    elementosEnRevision: elementos.filter((item) => !item.aprobado && !item.rechazado).length,
    videoMaestro: salida?.nombreExportado || null,
    urlPublica: salida?.urlPublica || null,
    pesoBytes: salida?.pesoBytes || null,
    modo: salida?.modo || edicion?.modo || null,
    plataformaBase: salida?.plataforma || edicion?.plataforma || null,
    filtroVideo: edicion?.render?.filtroVideo || null,
    antesDespues: Boolean(salida?.antesDespues?.ok),
    reporteFinal: salida?.reporteFinal?.nombreArchivo || null,
    listoParaAdaptacion: Boolean(salida?.ok && salida?.rutaExportada)
  };
}

function crearAuditoriaProduccion({ entrada, plan, edicion, salida }) {
  return {
    tipo: 'produccion-maestro',
    entrada: {
      proyectoId: entrada.proyecto.id,
      nombreOriginal: entrada.video.nombreOriginal,
      rutaOriginal: entrada.video.rutaOriginal
    },
    plan: {
      id: plan.planProduccion?.id || null,
      totalElementos: plan.planProduccion?.elementos?.length || 0,
      validacion: plan.validacion || null,
      resumen: plan.resumen || null
    },
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
    const video = seleccionarVideoPrincipal(videosGuardados.videos || []);
    const estadoProcesando = await cargarEstadoProyectoEtapas({ proyectoId, crearSiFalta: false });
    const entendimiento = extraerEntendimiento(entendimientoGuardado);
    const plan = extraerPlan(planGuardado);
    const entrada = crearEntradaProduccion({ proyectoId, estado: estadoProcesando, video, carpetaProyecto, plan });
    const opcionesProduccion = crearOpcionesProduccion({ plan, solicitud: { ...opciones, ...solicitud } });
    const transcripcion = crearTranscripcionDesdeEntendimiento(entendimiento);
    const edicionDinamica = crearEdicionDinamicaDesdePlan(plan);

    const edicion = await editarVideo({ entrada, entendimiento, audio: null, transcripcion, edicionDinamica, opciones: opcionesProduccion, progreso: null });
    const salida = await prepararSalida({ entrada, entendimiento, audio: null, transcripcion, edicionDinamica, edicion, opciones: opcionesProduccion, progreso: null });
    const resumen = crearResumenProduccion({ plan, edicion, salida });
    const auditoria = crearAuditoriaProduccion({ entrada, plan, edicion, salida });

    const produccion = {
      ok: true,
      etapa: ETAPAS_AUTOVIDEO.PRODUCCION,
      proyectoId,
      entrada,
      resumen,
      videoMaestro: {
        nombre: salida.nombreExportado,
        ruta: salida.rutaExportada,
        rutaRelativa: salida.rutaRelativa,
        urlPublica: salida.urlPublica,
        pesoBytes: salida.pesoBytes
      },
      planProduccion: plan.planProduccion,
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
        tipo: 'produccion-maestro-backend',
        origen: 'POST /api/proyectos/:proyectoId/produccion/procesar'
      }
    });

    const estadoFinal = await avanzarEstadoProyectoEtapas({
      proyectoId,
      etapaDestino: ETAPAS_AUTOVIDEO.PRODUCCION,
      estadoDestino: ESTADOS_PROYECTO_ETAPAS.PRODUCIDO,
      archivoGenerado: guardado.ruta,
      mensaje: 'Producción maestro completada.'
    });

    return {
      ok: true,
      proyectoId,
      etapa: ETAPAS_AUTOVIDEO.PRODUCCION,
      estado: estadoFinal,
      resultado: produccion,
      resumen,
      archivo: guardado,
      mensaje: 'Video maestro producido correctamente.'
    };
  } catch (error) {
    await marcarErrorEstadoProyectoEtapas({ proyectoId, etapa: ETAPAS_AUTOVIDEO.PRODUCCION, error, mensaje: 'Error en producción maestro.' }).catch(() => null);
    throw error;
  }
}

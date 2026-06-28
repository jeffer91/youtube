/*
  Bloque 15: Adaptación a plataformas backend
  Función: tomar el video maestro producido y generar salidas adaptadas por plataforma.
*/

import fs from 'fs';
import path from 'path';
import {
  prepararExportaciones,
  crearResultadoPlataformas,
  renderizarPlataformasPendientes,
  normalizarPlataformas,
  obtenerPlataformaExportacion
} from '../../exportacion/exportacion.conexion.js';
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

function extraerResultadoEtapa(wrapper = {}) {
  if (wrapper?.resultado?.resultado) return wrapper.resultado.resultado;
  if (wrapper?.datos?.resultado?.resultado) return wrapper.datos.resultado.resultado;
  if (wrapper?.resultado) return wrapper.resultado;
  return wrapper;
}

function extraerProduccion(wrapper = {}) {
  const produccion = extraerResultadoEtapa(wrapper);
  if (!produccion || typeof produccion !== 'object') throw new Error('No existe producción maestro válida para adaptar.');
  if (!produccion.videoMaestro && !produccion.salida) throw new Error('La producción no contiene video maestro ni salida exportada.');
  return produccion;
}

function esMultivideoProduccion(produccion = {}) {
  return Boolean(
    produccion.multivideo?.activo ||
    produccion.resumen?.esMultivideo ||
    produccion.entrada?.multivideo?.activo ||
    produccion.planProduccion?.multivideo?.activo
  );
}

function obtenerRutaMaestro(produccion = {}) {
  return produccion.videoMaestro?.ruta || produccion.salida?.rutaExportada || produccion.resumen?.rutaExportada || '';
}

function obtenerFuenteTemporalMultivideo(produccion = {}) {
  return produccion.videoMaestro?.fuenteTemporal || produccion.multivideo?.unionVideos?.videoMaestro || produccion.entrada?.multivideo?.videoMaestroTemporal || null;
}

function obtenerSalidaBase(produccion = {}) {
  const rutaExportada = obtenerRutaMaestro(produccion);
  const nombreExportado = produccion.videoMaestro?.nombre || produccion.salida?.nombreExportado || (rutaExportada ? path.basename(rutaExportada) : 'video-maestro.mp4');
  const plataforma = produccion.resumen?.plataformaBase || produccion.salida?.plataforma || produccion.entrada?.proyecto?.plataforma || produccion.planProduccion?.proyecto?.plataforma || 'tiktok';
  const multivideoActivo = esMultivideoProduccion(produccion);
  const fuenteTemporal = obtenerFuenteTemporalMultivideo(produccion);
  return {
    ...(produccion.salida || {}),
    rutaExportada,
    nombreExportado,
    plataforma,
    formato: produccion.salida?.formato || obtenerPlataformaExportacion(plataforma)?.formato || '9:16',
    urlPublica: produccion.videoMaestro?.urlPublica || produccion.salida?.urlPublica || '',
    pesoBytes: produccion.videoMaestro?.pesoBytes || produccion.salida?.pesoBytes || null,
    modo: produccion.resumen?.modo || produccion.salida?.modo || 'maestro',
    multivideo: {
      activo: multivideoActivo,
      totalVideos: produccion.multivideo?.totalVideos || produccion.resumen?.videosFuente || produccion.entrada?.multivideo?.totalVideos || 1,
      videoMaestroUnido: produccion.resumen?.videoMaestroUnido || fuenteTemporal?.nombreSeguro || null,
      rutaVideoMaestroTemporal: fuenteTemporal?.rutaProyecto || fuenteTemporal?.rutaOriginal || null,
      unionVideos: produccion.multivideo?.unionVideos || produccion.entrada?.multivideo?.unionVideos || null
    }
  };
}

function validarMaestro(salidaBase = {}) {
  if (!salidaBase.rutaExportada) throw new Error('No existe ruta del video maestro para adaptar.');
  if (!fs.existsSync(salidaBase.rutaExportada)) throw new Error(`No existe el archivo maestro para adaptar: ${salidaBase.rutaExportada}`);
}

function resolverPlataformas({ produccion = {}, estado = {}, solicitud = {} } = {}) {
  const desdeSolicitud = solicitud.plataformas || solicitud.platforms || solicitud.destinos;
  const desdeProduccion = produccion.entrada?.proyecto?.plataformas || produccion.planProduccion?.proyecto?.plataformas;
  const desdeEstado = estado.datos?.plataformas;
  return normalizarPlataformas(desdeSolicitud || desdeProduccion || desdeEstado || ['tiktok', 'reels', 'shorts', 'youtube']);
}

function obtenerLineaTiempoGlobal(produccion = {}) {
  return produccion.entrada?.lineaTiempoGlobal || produccion.planProduccion?.lineaTiempoGlobal || produccion.multivideo?.unionVideos?.lineaTiempoGlobal || null;
}

function crearProyectoExportacion({ proyectoId, estado = {}, produccion = {}, salidaBase = {}, plataformas = [] } = {}) {
  const proyectoProduccion = produccion.entrada?.proyecto || produccion.planProduccion?.proyecto || {};
  const multivideoActivo = Boolean(salidaBase.multivideo?.activo);
  return {
    id: proyectoId,
    nombre: texto(estado.nombre || proyectoProduccion.nombre, 'Proyecto AutoVideoJeff'),
    perfil: texto(proyectoProduccion.perfil || estado.datos?.perfil, 'general'),
    plataforma: texto(salidaBase.plataforma || proyectoProduccion.plataforma || estado.datos?.plataforma, 'tiktok'),
    plataformas,
    esMultivideo: multivideoActivo,
    totalVideos: salidaBase.multivideo?.totalVideos || proyectoProduccion.totalVideos || 1,
    videoEditado: salidaBase.rutaExportada,
    videoOrigen: salidaBase.rutaExportada,
    videoMaestroTemporal: salidaBase.multivideo?.rutaVideoMaestroTemporal || null,
    lineaTiempoGlobal: obtenerLineaTiempoGlobal(produccion),
    rutas: {
      carpetaProyecto: produccion.entrada?.rutas?.carpetaProyecto || '',
      exportaciones: path.join(produccion.entrada?.rutas?.carpetaProyecto || '', '04-adaptacion').replace(/\\/g, '/')
    }
  };
}

function enriquecerExportacionesMultivideo({ exportaciones = [], produccion = {}, salidaBase = {}, proyectoExportacion = {} } = {}) {
  const multivideo = salidaBase.multivideo || {};
  const lineaTiempoGlobal = obtenerLineaTiempoGlobal(produccion);
  return exportaciones.map((item) => ({
    ...item,
    origen: multivideo.activo ? 'maestro-multivideo' : 'maestro-video-unico',
    multivideo: {
      activo: Boolean(multivideo.activo),
      totalVideos: multivideo.totalVideos || 1,
      videoMaestroUnido: multivideo.videoMaestroUnido || null,
      usaVideoMaestroProducido: true,
      usaTiemposGlobales: Boolean(lineaTiempoGlobal)
    },
    lineaTiempoGlobal: lineaTiempoGlobal ? {
      resumen: lineaTiempoGlobal.resumen || null,
      totalItems: Array.isArray(lineaTiempoGlobal.lineaTiempo) ? lineaTiempoGlobal.lineaTiempo.length : 0
    } : null,
    proyecto: {
      id: proyectoExportacion.id,
      esMultivideo: Boolean(proyectoExportacion.esMultivideo),
      totalVideos: proyectoExportacion.totalVideos
    }
  }));
}

function enriquecerResultadoPlataformasMultivideo({ resultadoPlataformas = {}, produccion = {}, salidaBase = {} } = {}) {
  const multivideo = salidaBase.multivideo || {};
  const lineaTiempoGlobal = obtenerLineaTiempoGlobal(produccion);
  const resultados = Array.isArray(resultadoPlataformas.resultados) ? resultadoPlataformas.resultados : [];
  return {
    ...resultadoPlataformas,
    resultados: resultados.map((item) => ({
      ...item,
      multivideo: {
        activo: Boolean(multivideo.activo),
        totalVideos: multivideo.totalVideos || 1,
        videoMaestroUnido: multivideo.videoMaestroUnido || null,
        origenVideo: multivideo.activo ? 'video-maestro-multivideo' : 'video-maestro'
      }
    })),
    multivideo: {
      activo: Boolean(multivideo.activo),
      fase: 'bloque-8-adaptacion-multivideo',
      totalVideos: multivideo.totalVideos || 1,
      videoMaestroUnido: multivideo.videoMaestroUnido || null,
      rutaVideoMaestroTemporal: multivideo.rutaVideoMaestroTemporal || null,
      usaTiemposGlobales: Boolean(lineaTiempoGlobal),
      nota: multivideo.activo
        ? 'Adaptación creada desde el video maestro multivideo producido.'
        : 'Adaptación creada con estructura compatible multivideo.'
    },
    lineaTiempoGlobal: lineaTiempoGlobal ? {
      resumen: lineaTiempoGlobal.resumen || null,
      lineaTiempo: lineaTiempoGlobal.lineaTiempo || []
    } : null
  };
}

function crearResumenAdaptacion(resultadoPlataformas = {}, salidaBase = {}) {
  const resultados = Array.isArray(resultadoPlataformas.resultados) ? resultadoPlataformas.resultados : [];
  const exportadas = resultados.filter((item) => item.estado === 'exportado').length;
  const errores = resultados.filter((item) => item.estado === 'error_render').length;
  const pendientes = resultados.filter((item) => item.estado !== 'exportado').length;
  const pesoTotalBytes = resultados.reduce((total, item) => total + numero(item.pesoBytes, 0), 0);
  const multivideo = salidaBase.multivideo || resultadoPlataformas.multivideo || {};
  return {
    total: resultados.length,
    exportadas,
    pendientes,
    errores,
    pesoTotalBytes,
    esMultivideo: Boolean(multivideo.activo),
    videosFuente: multivideo.totalVideos || 1,
    videoMaestroUnido: multivideo.videoMaestroUnido || null,
    usaVideoMaestroMultivideo: Boolean(multivideo.activo && multivideo.videoMaestroUnido),
    plataformas: resultados.map((item) => ({
      plataforma: item.plataforma,
      nombre: item.nombre,
      formato: item.formato,
      estado: item.estado,
      urlPublica: item.urlPublica || '',
      nombreExportado: item.nombreExportado || '',
      pesoBytes: item.pesoBytes || null,
      multivideo: item.multivideo || null
    })),
    listoParaResultado: resultados.length > 0 && exportadas > 0 && errores === 0
  };
}

function crearLecturaAdaptacion(resumen = {}) {
  const lectura = [];
  lectura.push(`Adaptación generada para ${resumen.total} plataforma(s).`);
  if (resumen.esMultivideo) lectura.push(`Se usó el video maestro multivideo unido desde ${resumen.videosFuente} video(s).`);
  lectura.push(`${resumen.exportadas} plataforma(s) exportada(s), ${resumen.pendientes} pendiente(s).`);
  if (resumen.errores) lectura.push(`${resumen.errores} plataforma(s) tuvieron error de render.`);
  if (resumen.listoParaResultado) lectura.push('El proyecto está listo para preparar el resultado final.');
  else lectura.push('Revisar plataformas pendientes antes del resultado final.');
  return lectura;
}

export async function procesarAdaptacionPlataformasProyectoEtapa({ proyectoId, opciones = {}, solicitud = {}, progreso = null } = {}) {
  if (!proyectoId) throw new Error('Falta proyectoId para adaptar a plataformas.');
  const estadoInicial = await cargarEstadoProyectoEtapas({ proyectoId, crearSiFalta: false });
  if (!estadoInicial) throw new Error('No existe estado-proyecto.json. Primero crea el proyecto.');

  try {
    await avanzarEstadoProyectoEtapas({
      proyectoId,
      etapaDestino: ETAPAS_AUTOVIDEO.ADAPTACION,
      estadoDestino: ESTADOS_PROYECTO_ETAPAS.ADAPTANDO,
      mensaje: 'Iniciando adaptación a plataformas desde video maestro.'
    });

    const produccionGuardada = await cargarResultadoEtapa({ proyectoId, etapa: ETAPAS_AUTOVIDEO.PRODUCCION, valorPorDefecto: null });
    if (!produccionGuardada) throw new Error('No se puede adaptar porque no existe producción maestro guardada.');

    const estadoProcesando = await cargarEstadoProyectoEtapas({ proyectoId, crearSiFalta: false });
    const produccion = extraerProduccion(produccionGuardada);
    const salidaBase = obtenerSalidaBase(produccion);
    validarMaestro(salidaBase);

    const plataformas = resolverPlataformas({ produccion, estado: estadoProcesando, solicitud: { ...opciones, ...solicitud } });
    const proyectoExportacion = crearProyectoExportacion({ proyectoId, estado: estadoProcesando, produccion, salidaBase, plataformas });
    const exportacionesBase = prepararExportaciones(proyectoExportacion, {
      plataformas,
      videoOrigen: salidaBase.rutaExportada,
      carpetaDestino: proyectoExportacion.rutas.exportaciones
    });
    const exportaciones = enriquecerExportacionesMultivideo({ exportaciones: exportacionesBase, produccion, salidaBase, proyectoExportacion });

    const resultadoBase = crearResultadoPlataformas({ salida: salidaBase, exportaciones, plataformas });
    const resultadoBaseMultivideo = enriquecerResultadoPlataformasMultivideo({ resultadoPlataformas: resultadoBase, produccion, salidaBase });
    const resultadoRender = await renderizarPlataformasPendientes({
      salida: salidaBase,
      resultadoPlataformas: resultadoBaseMultivideo,
      opciones: {
        ...(opciones || {}),
        ...(solicitud || {}),
        renderizarBaseOtraVez: Boolean(solicitud.renderizarBaseOtraVez || opciones.renderizarBaseOtraVez),
        multivideo: salidaBase.multivideo || null
      },
      progreso
    });
    const resultadoPlataformas = enriquecerResultadoPlataformasMultivideo({ resultadoPlataformas: resultadoRender, produccion, salidaBase });

    const resumen = crearResumenAdaptacion(resultadoPlataformas, salidaBase);
    const adaptacion = {
      ok: true,
      etapa: ETAPAS_AUTOVIDEO.ADAPTACION,
      proyectoId,
      proyecto: proyectoExportacion,
      plataformasSolicitadas: plataformas,
      salidaBase,
      exportaciones,
      resultadoPlataformas,
      resumen,
      multivideo: {
        activo: resumen.esMultivideo,
        fase: 'bloque-8-adaptacion-multivideo',
        totalVideos: resumen.videosFuente,
        videoMaestroUnido: resumen.videoMaestroUnido,
        usaVideoMaestroMultivideo: resumen.usaVideoMaestroMultivideo,
        usaTiemposGlobales: Boolean(resultadoPlataformas.lineaTiempoGlobal),
        nota: resumen.esMultivideo
          ? 'Salidas por plataforma adaptadas desde el maestro multivideo.'
          : 'Salidas por plataforma adaptadas desde el maestro de video único.'
      },
      lectura: crearLecturaAdaptacion(resumen),
      siguienteEtapa: ETAPAS_AUTOVIDEO.RESULTADO,
      creadoEn: new Date().toISOString()
    };

    const guardado = await guardarResultadoEtapa({
      proyectoId,
      etapa: ETAPAS_AUTOVIDEO.ADAPTACION,
      resultado: adaptacion,
      metadata: {
        bloque: 15,
        tipo: resumen.esMultivideo ? 'adaptacion-plataformas-backend-multivideo' : 'adaptacion-plataformas-backend',
        origen: 'POST /api/proyectos/:proyectoId/adaptacion/procesar',
        multivideo: adaptacion.multivideo
      }
    });

    const estadoFinal = await avanzarEstadoProyectoEtapas({
      proyectoId,
      etapaDestino: ETAPAS_AUTOVIDEO.ADAPTACION,
      estadoDestino: ESTADOS_PROYECTO_ETAPAS.ADAPTADO,
      archivoGenerado: guardado.ruta,
      mensaje: resumen.esMultivideo ? 'Adaptación multivideo a plataformas completada.' : 'Adaptación a plataformas completada.'
    });

    return {
      ok: true,
      proyectoId,
      etapa: ETAPAS_AUTOVIDEO.ADAPTACION,
      estado: estadoFinal,
      resultado: adaptacion,
      resumen,
      archivo: guardado,
      mensaje: resumen.esMultivideo ? 'Adaptación multivideo a plataformas completada correctamente.' : 'Adaptación a plataformas completada correctamente.'
    };
  } catch (error) {
    await marcarErrorEstadoProyectoEtapas({ proyectoId, etapa: ETAPAS_AUTOVIDEO.ADAPTACION, error, mensaje: 'Error adaptando a plataformas.' }).catch(() => null);
    throw error;
  }
}

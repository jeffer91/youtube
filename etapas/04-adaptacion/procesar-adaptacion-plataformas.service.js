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

function obtenerRutaMaestro(produccion = {}) {
  return produccion.videoMaestro?.ruta || produccion.salida?.rutaExportada || produccion.resumen?.rutaExportada || '';
}

function obtenerSalidaBase(produccion = {}) {
  const rutaExportada = obtenerRutaMaestro(produccion);
  const nombreExportado = produccion.videoMaestro?.nombre || produccion.salida?.nombreExportado || (rutaExportada ? path.basename(rutaExportada) : 'video-maestro.mp4');
  const plataforma = produccion.resumen?.plataformaBase || produccion.salida?.plataforma || produccion.entrada?.proyecto?.plataforma || produccion.planProduccion?.proyecto?.plataforma || 'tiktok';
  return {
    ...(produccion.salida || {}),
    rutaExportada,
    nombreExportado,
    plataforma,
    formato: produccion.salida?.formato || obtenerPlataformaExportacion(plataforma)?.formato || '9:16',
    urlPublica: produccion.videoMaestro?.urlPublica || produccion.salida?.urlPublica || '',
    pesoBytes: produccion.videoMaestro?.pesoBytes || produccion.salida?.pesoBytes || null,
    modo: produccion.resumen?.modo || produccion.salida?.modo || 'maestro'
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

function crearProyectoExportacion({ proyectoId, estado = {}, produccion = {}, salidaBase = {}, plataformas = [] } = {}) {
  const proyectoProduccion = produccion.entrada?.proyecto || produccion.planProduccion?.proyecto || {};
  return {
    id: proyectoId,
    nombre: texto(estado.nombre || proyectoProduccion.nombre, 'Proyecto AutoVideoJeff'),
    perfil: texto(proyectoProduccion.perfil || estado.datos?.perfil, 'general'),
    plataforma: texto(salidaBase.plataforma || proyectoProduccion.plataforma || estado.datos?.plataforma, 'tiktok'),
    plataformas,
    videoEditado: salidaBase.rutaExportada,
    videoOrigen: salidaBase.rutaExportada,
    rutas: {
      carpetaProyecto: produccion.entrada?.rutas?.carpetaProyecto || '',
      exportaciones: path.join(produccion.entrada?.rutas?.carpetaProyecto || '', '04-adaptacion').replace(/\\/g, '/')
    }
  };
}

function crearResumenAdaptacion(resultadoPlataformas = {}) {
  const resultados = Array.isArray(resultadoPlataformas.resultados) ? resultadoPlataformas.resultados : [];
  const exportadas = resultados.filter((item) => item.estado === 'exportado').length;
  const errores = resultados.filter((item) => item.estado === 'error_render').length;
  const pendientes = resultados.filter((item) => item.estado !== 'exportado').length;
  const pesoTotalBytes = resultados.reduce((total, item) => total + numero(item.pesoBytes, 0), 0);
  return {
    total: resultados.length,
    exportadas,
    pendientes,
    errores,
    pesoTotalBytes,
    plataformas: resultados.map((item) => ({
      plataforma: item.plataforma,
      nombre: item.nombre,
      formato: item.formato,
      estado: item.estado,
      urlPublica: item.urlPublica || '',
      nombreExportado: item.nombreExportado || '',
      pesoBytes: item.pesoBytes || null
    })),
    listoParaResultado: resultados.length > 0 && exportadas > 0 && errores === 0
  };
}

function crearLecturaAdaptacion(resumen = {}) {
  const lectura = [];
  lectura.push(`Adaptación generada para ${resumen.total} plataforma(s).`);
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
    const exportaciones = prepararExportaciones(proyectoExportacion, {
      plataformas,
      videoOrigen: salidaBase.rutaExportada,
      carpetaDestino: proyectoExportacion.rutas.exportaciones
    });

    const resultadoBase = crearResultadoPlataformas({ salida: salidaBase, exportaciones, plataformas });
    const resultadoPlataformas = await renderizarPlataformasPendientes({
      salida: salidaBase,
      resultadoPlataformas: resultadoBase,
      opciones: {
        ...(opciones || {}),
        ...(solicitud || {}),
        renderizarBaseOtraVez: Boolean(solicitud.renderizarBaseOtraVez || opciones.renderizarBaseOtraVez)
      },
      progreso
    });

    const resumen = crearResumenAdaptacion(resultadoPlataformas);
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
        tipo: 'adaptacion-plataformas-backend',
        origen: 'POST /api/proyectos/:proyectoId/adaptacion/procesar'
      }
    });

    const estadoFinal = await avanzarEstadoProyectoEtapas({
      proyectoId,
      etapaDestino: ETAPAS_AUTOVIDEO.ADAPTACION,
      estadoDestino: ESTADOS_PROYECTO_ETAPAS.ADAPTADO,
      archivoGenerado: guardado.ruta,
      mensaje: 'Adaptación a plataformas completada.'
    });

    return {
      ok: true,
      proyectoId,
      etapa: ETAPAS_AUTOVIDEO.ADAPTACION,
      estado: estadoFinal,
      resultado: adaptacion,
      resumen,
      archivo: guardado,
      mensaje: 'Adaptación a plataformas completada correctamente.'
    };
  } catch (error) {
    await marcarErrorEstadoProyectoEtapas({ proyectoId, etapa: ETAPAS_AUTOVIDEO.ADAPTACION, error, mensaje: 'Error adaptando a plataformas.' }).catch(() => null);
    throw error;
  }
}

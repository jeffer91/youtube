/*
  Bloques 5, 6, 8, 10, 15 y 17: API por etapas + Entendimiento + Plan + Producción + Adaptación + Resultado
  Función: registrar rutas base del nuevo flujo y ejecutar etapas reales cuando estén conectadas.
*/

import path from 'path';
import fs from 'fs';
import {
  crearIdProyecto,
  normalizarNombreArchivo,
  asegurarCarpeta,
  copiarArchivoSeguro,
  escribirJson,
  leerJsonSiExiste,
  obtenerRutaRaiz
} from '../comun/archivos.js';
import {
  ETAPAS_AUTOVIDEO,
  ESTADOS_PROYECTO_ETAPAS,
  crearEstadoProyectoEtapas,
  cargarEstadoProyectoEtapas,
  guardarEstadoProyectoEtapas,
  avanzarEstadoProyectoEtapas,
  guardarResultadoEtapa,
  cargarResultadoEtapa
} from '../flujo-etapas/flujo-etapas.conexion.js';
import { procesarEntendimientoProyectoEtapa } from '../entender/etapas/entendimiento-etapa.service.js';
import { procesarPlanEdicionProyectoEtapa } from '../etapas/02-plan/procesar-plan-edicion.service.js';
import { procesarProduccionMaestroProyectoEtapa } from '../etapas/03-produccion/procesar-produccion-maestro.service.js';
import { procesarAdaptacionPlataformasProyectoEtapa } from '../etapas/04-adaptacion/procesar-adaptacion-plataformas.service.js';
import { procesarResultadoFinalProyectoEtapa } from '../etapas/05-resultado/procesar-resultado-final.service.js';

const CONFIG_ETAPAS_API = Object.freeze({
  entendimiento: {
    etapa: ETAPAS_AUTOVIDEO.ENTENDIMIENTO,
    estadoProcesando: ESTADOS_PROYECTO_ETAPAS.ENTENDIENDO,
    mensaje: 'Entendimiento real conectado desde el Bloque 6.'
  },
  plan: {
    etapa: ETAPAS_AUTOVIDEO.PLAN_EDICION,
    estadoProcesando: ESTADOS_PROYECTO_ETAPAS.PLANIFICANDO,
    mensaje: 'Plan de edición real conectado desde el Bloque 8.'
  },
  produccion: {
    etapa: ETAPAS_AUTOVIDEO.PRODUCCION,
    estadoProcesando: ESTADOS_PROYECTO_ETAPAS.PRODUCIENDO,
    mensaje: 'Producción maestro real conectada desde el Bloque 10.'
  },
  adaptacion: {
    etapa: ETAPAS_AUTOVIDEO.ADAPTACION,
    estadoProcesando: ESTADOS_PROYECTO_ETAPAS.ADAPTANDO,
    mensaje: 'Adaptación a plataformas real conectada desde el Bloque 15.'
  },
  resultado: {
    etapa: ETAPAS_AUTOVIDEO.RESULTADO,
    estadoProcesando: ESTADOS_PROYECTO_ETAPAS.EXPORTANDO,
    mensaje: 'Resultado final real conectado desde el Bloque 17.'
  }
});

function responderOk(res, datos = {}) {
  return res.json({ ok: true, ...datos, fecha: new Date().toISOString() });
}

function responderError(res, error, codigo = 500) {
  return res.status(codigo).json({ ok: false, mensaje: error?.message || 'Error en API por etapas.', fecha: new Date().toISOString() });
}

function textoSeguro(valor, defecto = '') {
  if (typeof valor !== 'string') return defecto;
  const limpio = valor.trim();
  return limpio || defecto;
}

function normalizarListaProyecto(valor, defecto = []) {
  if (Array.isArray(valor)) return valor.map((item) => String(item).trim()).filter(Boolean);
  if (typeof valor === 'string' && valor.trim()) return valor.split(',').map((item) => item.trim()).filter(Boolean);
  return defecto;
}

function obtenerCarpetaProyecto(proyectoId) {
  return path.join(obtenerRutaRaiz(), 'datos', 'proyectos', proyectoId);
}

function crearProyectoIdDesdeNombre(nombre) {
  const base = textoSeguro(nombre, 'autovideo').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  return crearIdProyecto(base || 'autovideo');
}

function existeArchivo(rutaArchivo) {
  try {
    return Boolean(rutaArchivo && fs.existsSync(rutaArchivo) && fs.statSync(rutaArchivo).isFile());
  } catch (_error) {
    return false;
  }
}

function crearVideoId(indice) {
  return `video-${String(indice + 1).padStart(2, '0')}`;
}

function resumenArchivo(file, destino = null, indice = 0) {
  const nombreSeguro = destino ? path.basename(destino) : normalizarNombreArchivo(file.originalname || file.filename || `video-${indice + 1}.mp4`);
  const videoId = crearVideoId(indice);
  return {
    id: videoId,
    videoId,
    indice,
    orden: indice + 1,
    etiqueta: `Video ${String(indice + 1).padStart(2, '0')}`,
    nombreOriginal: file.originalname,
    nombreTemporal: file.filename,
    nombreSeguro,
    extension: path.extname(nombreSeguro).toLowerCase(),
    tipo: file.mimetype || 'video',
    tamanoBytes: file.size || 0,
    rutaTemporal: file.path,
    rutaProyecto: destino,
    rutaOriginal: destino,
    origen: 'api-etapas-upload',
    existe: existeArchivo(destino),
    estado: existeArchivo(destino) ? 'listo' : 'faltante',
    guardadoEn: new Date().toISOString()
  };
}

function crearResumenVideosGuardados({ proyectoId, videos = [], carpetaVideos, rutaJson }) {
  const validos = videos.filter((video) => video.existe && video.rutaProyecto);
  return {
    ok: validos.length > 0,
    proyectoId,
    total: videos.length,
    totalValidos: validos.length,
    modo: validos.length > 1 ? 'multivideo' : 'video-unico',
    esMultivideo: validos.length > 1,
    videoPrincipalId: validos[0]?.videoId || null,
    ids: videos.map((video) => video.videoId),
    carpetaVideos,
    rutaJson,
    videos,
    actualizadoEn: new Date().toISOString()
  };
}

async function guardarVideosProyecto({ proyectoId, archivos = [] } = {}) {
  if (!proyectoId) throw new Error('Falta proyectoId para guardar videos.');
  if (!archivos.length) throw new Error('No se recibieron videos para el proyecto.');

  const carpetaProyecto = obtenerCarpetaProyecto(proyectoId);
  const carpetaVideos = path.join(carpetaProyecto, 'videos-originales');
  asegurarCarpeta(carpetaVideos);

  const videos = [];
  for (const file of archivos) {
    const indice = videos.length;
    const nombre = `${String(indice + 1).padStart(2, '0')}-${normalizarNombreArchivo(file.originalname)}`;
    const destino = path.join(carpetaVideos, nombre);
    await copiarArchivoSeguro(file.path, destino);
    videos.push(resumenArchivo(file, destino, indice));
  }

  const rutaJson = path.join(carpetaProyecto, 'videos-originales.json');
  const resumen = crearResumenVideosGuardados({ proyectoId, videos, carpetaVideos, rutaJson });
  await escribirJson(rutaJson, resumen);

  return { videos, rutaJson, carpetaVideos, resumen };
}

async function eliminarTemporales(archivos = []) {
  for (const file of archivos) {
    try {
      if (file?.path && fs.existsSync(file.path)) await fs.promises.unlink(file.path);
    } catch (error) {
      console.warn('[API etapas] No se pudo eliminar temporal:', error.message);
    }
  }
}

async function cargarVideosProyecto(proyectoId) {
  const ruta = path.join(obtenerCarpetaProyecto(proyectoId), 'videos-originales.json');
  return await leerJsonSiExiste(ruta, { ok: true, proyectoId, total: 0, totalValidos: 0, modo: 'sin-videos', esMultivideo: false, videos: [] });
}

async function crearProyectoEtapas(req, res, aplicarCabeceras) {
  try {
    aplicarCabeceras(res);
    const nombre = textoSeguro(req.body?.nombre || req.body?.nombreProyecto || req.body?.titulo, 'Proyecto AutoVideoJeff');
    const proyectoId = textoSeguro(req.body?.proyectoId, '') || crearProyectoIdDesdeNombre(nombre);
    const carpetaProyecto = obtenerCarpetaProyecto(proyectoId);
    const plataforma = textoSeguro(req.body?.plataforma, 'tiktok');
    const plataformas = normalizarListaProyecto(req.body?.plataformas, [plataforma]);
    asegurarCarpeta(carpetaProyecto);

    const estado = crearEstadoProyectoEtapas({
      proyectoId,
      nombre,
      datos: {
        origen: 'api-etapas',
        perfil: req.body?.perfil || 'general',
        plataforma,
        plataformas,
        modoEdicion: req.body?.modoEdicion || 'revision_completa',
        cantidadVideosProyecto: Number(req.body?.cantidadVideosProyecto || req.body?.videosSeleccionados?.length || 0),
        videosSeleccionados: Array.isArray(req.body?.videosSeleccionados) ? req.body.videosSeleccionados : [],
        creadoDesde: 'POST /api/proyectos'
      }
    });

    const estadoGuardado = await guardarEstadoProyectoEtapas({
      proyectoId,
      carpetaProyecto,
      estado,
      mensaje: 'Proyecto creado desde API por etapas.'
    });

    return responderOk(res, { proyecto: { proyectoId, nombre, carpetaProyecto, plataforma, plataformas }, estado: estadoGuardado });
  } catch (error) {
    return responderError(res, error, 400);
  }
}

async function obtenerEstado(req, res, aplicarCabeceras) {
  try {
    aplicarCabeceras(res);
    const estado = await cargarEstadoProyectoEtapas({ proyectoId: req.params.proyectoId, crearSiFalta: false });
    if (!estado) return responderError(res, new Error('No existe estado-proyecto.json para este proyecto.'), 404);
    const videos = await cargarVideosProyecto(req.params.proyectoId);
    return responderOk(res, { estado, videos });
  } catch (error) {
    return responderError(res, error, 400);
  }
}

async function subirVideos(req, res, aplicarCabeceras) {
  const archivos = req.files || [];
  try {
    aplicarCabeceras(res);
    const proyectoId = req.params.proyectoId;
    const guardado = await guardarVideosProyecto({ proyectoId, archivos });
    const estadoActual = await cargarEstadoProyectoEtapas({ proyectoId, nombre: req.body?.nombreProyecto || 'Proyecto AutoVideoJeff' });
    const estado = await guardarEstadoProyectoEtapas({
      proyectoId,
      estado: {
        ...estadoActual,
        datos: {
          ...(estadoActual.datos || {}),
          videosOriginales: guardado.videos.length,
          videosOriginalesValidos: guardado.resumen.totalValidos,
          modoVideosOriginales: guardado.resumen.modo,
          esMultivideo: guardado.resumen.esMultivideo,
          videoPrincipalId: guardado.resumen.videoPrincipalId,
          rutaVideosOriginales: guardado.rutaJson,
          idsVideosOriginales: guardado.resumen.ids
        }
      },
      mensaje: guardado.resumen.esMultivideo
        ? `${guardado.videos.length} videos originales registrados para el flujo por etapas.`
        : 'Video original registrado para el flujo por etapas.'
    });
    return responderOk(res, { proyectoId, videos: guardado.videos, resumenVideos: guardado.resumen, estado });
  } catch (error) {
    return responderError(res, error, 400);
  } finally {
    await eliminarTemporales(archivos);
  }
}

async function registrarSolicitudEtapa({ req, res, aplicarCabeceras, tipo }) {
  try {
    aplicarCabeceras(res);
    const config = CONFIG_ETAPAS_API[tipo];
    if (!config) throw new Error(`Tipo de etapa no soportado: ${tipo}`);
    const proyectoId = req.params.proyectoId;

    if (tipo === 'entendimiento') {
      const resultadoEntendimiento = await procesarEntendimientoProyectoEtapa({ proyectoId, opciones: req.body || {}, solicitud: req.body || {} });
      return responderOk(res, { ...resultadoEntendimiento, pendienteImplementacion: false });
    }

    if (tipo === 'plan') {
      const resultadoPlan = await procesarPlanEdicionProyectoEtapa({ proyectoId, opciones: req.body || {}, solicitud: req.body || {} });
      return responderOk(res, { ...resultadoPlan, pendienteImplementacion: false });
    }

    if (tipo === 'produccion') {
      const resultadoProduccion = await procesarProduccionMaestroProyectoEtapa({ proyectoId, opciones: req.body || {}, solicitud: req.body || {} });
      return responderOk(res, { ...resultadoProduccion, pendienteImplementacion: false });
    }

    if (tipo === 'adaptacion') {
      const resultadoAdaptacion = await procesarAdaptacionPlataformasProyectoEtapa({ proyectoId, opciones: req.body || {}, solicitud: req.body || {} });
      return responderOk(res, { ...resultadoAdaptacion, pendienteImplementacion: false });
    }

    if (tipo === 'resultado') {
      const resultadoFinal = await procesarResultadoFinalProyectoEtapa({ proyectoId, opciones: req.body || {}, solicitud: req.body || {} });
      return responderOk(res, { ...resultadoFinal, pendienteImplementacion: false });
    }

    const estado = await avanzarEstadoProyectoEtapas({
      proyectoId,
      etapaDestino: config.etapa,
      estadoDestino: config.estadoProcesando,
      mensaje: config.mensaje
    });

    const resultado = await guardarResultadoEtapa({
      proyectoId,
      etapa: config.etapa,
      resultado: {
        pendienteImplementacion: true,
        tipo,
        solicitud: req.body || {},
        mensaje: config.mensaje
      },
      metadata: {
        bloque: 5,
        endpoint: req.originalUrl,
        metodo: req.method
      }
    });

    return responderOk(res, { proyectoId, etapa: config.etapa, estado, resultado, mensaje: config.mensaje, pendienteImplementacion: true });
  } catch (error) {
    return responderError(res, error, 400);
  }
}

async function cargarEtapa(req, res, aplicarCabeceras, tipo) {
  try {
    aplicarCabeceras(res);
    const config = CONFIG_ETAPAS_API[tipo];
    if (!config) throw new Error(`Tipo de etapa no soportado: ${tipo}`);
    const resultado = await cargarResultadoEtapa({ proyectoId: req.params.proyectoId, etapa: config.etapa, valorPorDefecto: null });
    const estado = await cargarEstadoProyectoEtapas({ proyectoId: req.params.proyectoId, crearSiFalta: false });
    return responderOk(res, { proyectoId: req.params.proyectoId, etapa: config.etapa, estado, resultado });
  } catch (error) {
    return responderError(res, error, 400);
  }
}

export function registrarRutasEtapas(app, opciones = {}) {
  const aplicarCabeceras = opciones.aplicarCabecerasSinCache || (() => {});
  const upload = opciones.upload;

  app.post('/api/proyectos', (req, res) => crearProyectoEtapas(req, res, aplicarCabeceras));
  app.get('/api/proyectos/:proyectoId/estado', (req, res) => obtenerEstado(req, res, aplicarCabeceras));

  if (upload) {
    app.post('/api/proyectos/:proyectoId/videos', upload.array('videos', 12), (req, res) => subirVideos(req, res, aplicarCabeceras));
    app.post('/api/proyectos/:proyectoId/video', upload.array('video', 12), (req, res) => subirVideos(req, res, aplicarCabeceras));
  }

  app.post('/api/proyectos/:proyectoId/entendimiento/procesar', (req, res) => registrarSolicitudEtapa({ req, res, aplicarCabeceras, tipo: 'entendimiento' }));
  app.get('/api/proyectos/:proyectoId/entendimiento', (req, res) => cargarEtapa(req, res, aplicarCabeceras, 'entendimiento'));

  app.post('/api/proyectos/:proyectoId/plan/procesar', (req, res) => registrarSolicitudEtapa({ req, res, aplicarCabeceras, tipo: 'plan' }));
  app.get('/api/proyectos/:proyectoId/plan', (req, res) => cargarEtapa(req, res, aplicarCabeceras, 'plan'));

  app.post('/api/proyectos/:proyectoId/produccion/procesar', (req, res) => registrarSolicitudEtapa({ req, res, aplicarCabeceras, tipo: 'produccion' }));
  app.get('/api/proyectos/:proyectoId/produccion', (req, res) => cargarEtapa(req, res, aplicarCabeceras, 'produccion'));

  app.post('/api/proyectos/:proyectoId/adaptacion/procesar', (req, res) => registrarSolicitudEtapa({ req, res, aplicarCabeceras, tipo: 'adaptacion' }));
  app.get('/api/proyectos/:proyectoId/adaptacion', (req, res) => cargarEtapa(req, res, aplicarCabeceras, 'adaptacion'));

  app.post('/api/proyectos/:proyectoId/resultado/exportar', (req, res) => registrarSolicitudEtapa({ req, res, aplicarCabeceras, tipo: 'resultado' }));
  app.get('/api/proyectos/:proyectoId/resultado', (req, res) => cargarEtapa(req, res, aplicarCabeceras, 'resultado'));
}

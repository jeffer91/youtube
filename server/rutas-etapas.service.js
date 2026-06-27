/*
  Bloques 5, 6 y 8: API por etapas + Entendimiento + Plan de edición
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
    mensaje: 'Solicitud de producción maestro registrada. El motor real se conectará en el Bloque 10.'
  },
  adaptacion: {
    etapa: ETAPAS_AUTOVIDEO.ADAPTACION,
    estadoProcesando: ESTADOS_PROYECTO_ETAPAS.ADAPTANDO,
    mensaje: 'Solicitud de adaptación a plataformas registrada. El motor real se conectará en el Bloque 15.'
  },
  resultado: {
    etapa: ETAPAS_AUTOVIDEO.RESULTADO,
    estadoProcesando: ESTADOS_PROYECTO_ETAPAS.EXPORTANDO,
    mensaje: 'Solicitud de resultado final registrada. La exportación final se conectará en el Bloque 17.'
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

function obtenerCarpetaProyecto(proyectoId) {
  return path.join(obtenerRutaRaiz(), 'datos', 'proyectos', proyectoId);
}

function crearProyectoIdDesdeNombre(nombre) {
  const base = textoSeguro(nombre, 'autovideo').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  return crearIdProyecto(base || 'autovideo');
}

function resumenArchivo(file, destino = null) {
  return {
    nombreOriginal: file.originalname,
    nombreTemporal: file.filename,
    tipo: file.mimetype || 'video',
    tamanoBytes: file.size || 0,
    rutaTemporal: file.path,
    rutaProyecto: destino,
    guardadoEn: new Date().toISOString()
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
    const nombre = `${String(videos.length + 1).padStart(2, '0')}-${normalizarNombreArchivo(file.originalname)}`;
    const destino = path.join(carpetaVideos, nombre);
    await copiarArchivoSeguro(file.path, destino);
    videos.push(resumenArchivo(file, destino));
  }

  const rutaJson = path.join(carpetaProyecto, 'videos-originales.json');
  await escribirJson(rutaJson, {
    ok: true,
    proyectoId,
    total: videos.length,
    videos,
    actualizadoEn: new Date().toISOString()
  });

  return { videos, rutaJson, carpetaVideos };
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
  return await leerJsonSiExiste(ruta, { ok: true, proyectoId, total: 0, videos: [] });
}

async function crearProyectoEtapas(req, res, aplicarCabeceras) {
  try {
    aplicarCabeceras(res);
    const nombre = textoSeguro(req.body?.nombre || req.body?.nombreProyecto || req.body?.titulo, 'Proyecto AutoVideoJeff');
    const proyectoId = textoSeguro(req.body?.proyectoId, '') || crearProyectoIdDesdeNombre(nombre);
    const carpetaProyecto = obtenerCarpetaProyecto(proyectoId);
    asegurarCarpeta(carpetaProyecto);

    const estado = crearEstadoProyectoEtapas({
      proyectoId,
      nombre,
      datos: {
        origen: 'api-etapas',
        perfil: req.body?.perfil || 'general',
        plataforma: req.body?.plataforma || 'tiktok',
        modoEdicion: req.body?.modoEdicion || 'revision_completa',
        creadoDesde: 'POST /api/proyectos'
      }
    });

    const estadoGuardado = await guardarEstadoProyectoEtapas({
      proyectoId,
      carpetaProyecto,
      estado,
      mensaje: 'Proyecto creado desde API por etapas.'
    });

    return responderOk(res, { proyecto: { proyectoId, nombre, carpetaProyecto }, estado: estadoGuardado });
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
          rutaVideosOriginales: guardado.rutaJson
        }
      },
      mensaje: 'Videos originales registrados para el flujo por etapas.'
    });
    return responderOk(res, { proyectoId, videos: guardado.videos, estado });
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

/*
  Bloque 8
  Funcion: registrar rutas API para los modulos nuevos sin romper el flujo actual.
*/

import { listarPerfiles, obtenerPerfil } from '../perfiles/perfiles.conexion.js';
import { obtenerIdsPlataformas, obtenerPlataformaExportacion, prepararExportaciones } from '../exportacion/exportacion.conexion.js';
import { crearProyecto, listarProyectos, cargarProyecto } from '../proyectos/proyectos.conexion.js';
import { listarCategoriasBiblioteca, buscarRecursosBiblioteca, guardarRecursoBiblioteca } from '../biblioteca/biblioteca.conexion.js';
import { listarRecursosProyecto, guardarRecursoProyecto } from '../biblioteca-proyecto/biblioteca-proyecto.conexion.js';
import { crearPlanProduccion, guardarPlanProduccion, cargarPlanProduccion } from '../produccion/produccion.conexion.js';
import { cargarMemoriaEdicion, guardarCorreccionAprendizaje } from '../aprendizaje/aprendizaje.conexion.js';
import { GEMINI_CONFIG } from '../gemini/gemini.conexion.js';

function responderOk(res, datos = {}) {
  return res.json({ ok: true, ...datos, fecha: new Date().toISOString() });
}

function responderError(res, error, codigo = 500) {
  return res.status(codigo).json({ ok: false, mensaje: error?.message || 'Error en rutas modulares.', fecha: new Date().toISOString() });
}

function normalizarProyectoSimple(datos = {}) {
  return {
    nombre: datos.nombre || datos.titulo || 'Nuevo proyecto AutoVideoJeff',
    perfil: datos.perfil || 'general',
    modoEdicion: datos.modoEdicion || 'revision_completa',
    plataformas: Array.isArray(datos.plataformas) ? datos.plataformas : ['tiktok', 'reels', 'shorts', 'youtube']
  };
}

export function registrarRutasModulares(app, opciones = {}) {
  const aplicarCabeceras = opciones.aplicarCabecerasSinCache || (() => {});

  app.get('/api/autovideo/modulos', (_req, res) => {
    aplicarCabeceras(res);
    return responderOk(res, {
      modulos: ['proyectos', 'perfiles', 'exportacion', 'audio', 'subtitulos', 'textos', 'visual', 'biblioteca', 'gemini', 'produccion', 'aprendizaje'],
      flujo: ['subida_configuracion', 'procesado', 'produccion', 'resultado_comparativa'],
      bibliotecaExternaAlFlujo: true
    });
  });

  app.get('/api/autovideo/perfiles', (_req, res) => {
    aplicarCabeceras(res);
    return responderOk(res, { perfiles: listarPerfiles() });
  });

  app.get('/api/autovideo/perfiles/:perfilId', (req, res) => {
    aplicarCabeceras(res);
    return responderOk(res, { perfil: obtenerPerfil(req.params.perfilId) });
  });

  app.get('/api/autovideo/plataformas', (_req, res) => {
    aplicarCabeceras(res);
    const plataformas = obtenerIdsPlataformas().map((id) => obtenerPlataformaExportacion(id));
    return responderOk(res, { plataformas });
  });

  app.post('/api/autovideo/exportaciones/preparar', (req, res) => {
    try {
      aplicarCabeceras(res);
      const proyecto = req.body?.proyecto || req.body || {};
      return responderOk(res, { exportaciones: prepararExportaciones(proyecto) });
    } catch (error) {
      return responderError(res, error, 400);
    }
  });

  app.get('/api/autovideo/proyectos', async (_req, res) => {
    try {
      aplicarCabeceras(res);
      return responderOk(res, { proyectos: await listarProyectos() });
    } catch (error) {
      return responderError(res, error);
    }
  });

  app.post('/api/autovideo/proyectos', async (req, res) => {
    try {
      aplicarCabeceras(res);
      const proyecto = await crearProyecto(normalizarProyectoSimple(req.body || {}));
      return responderOk(res, { proyecto });
    } catch (error) {
      return responderError(res, error, 400);
    }
  });

  app.get('/api/autovideo/biblioteca/categorias', (_req, res) => {
    aplicarCabeceras(res);
    return responderOk(res, { categorias: listarCategoriasBiblioteca() });
  });

  app.get('/api/autovideo/biblioteca', async (req, res) => {
    try {
      aplicarCabeceras(res);
      const recursos = await buscarRecursosBiblioteca({ consulta: req.query.q || '', tipo: req.query.tipo || '', categoria: req.query.categoria || '', perfil: req.query.perfil || '' });
      return responderOk(res, { recursos });
    } catch (error) {
      return responderError(res, error);
    }
  });

  app.post('/api/autovideo/biblioteca', async (req, res) => {
    try {
      aplicarCabeceras(res);
      const recurso = await guardarRecursoBiblioteca(req.body || {});
      return responderOk(res, { recurso });
    } catch (error) {
      return responderError(res, error, 400);
    }
  });

  app.get('/api/autovideo/proyectos/:proyectoId/biblioteca', async (req, res) => {
    try {
      aplicarCabeceras(res);
      const proyecto = await cargarProyecto(req.params.proyectoId);
      return responderOk(res, { recursos: await listarRecursosProyecto(proyecto) });
    } catch (error) {
      return responderError(res, error, 404);
    }
  });

  app.post('/api/autovideo/proyectos/:proyectoId/biblioteca', async (req, res) => {
    try {
      aplicarCabeceras(res);
      const proyecto = await cargarProyecto(req.params.proyectoId);
      const recurso = await guardarRecursoProyecto(proyecto, req.body || {});
      return responderOk(res, { recurso });
    } catch (error) {
      return responderError(res, error, 400);
    }
  });

  app.post('/api/autovideo/produccion/crear-plan', async (req, res) => {
    try {
      aplicarCabeceras(res);
      const proyecto = req.body?.proyecto || normalizarProyectoSimple(req.body || {});
      const plan = crearPlanProduccion(req.body || {});
      return responderOk(res, { plan, proyecto });
    } catch (error) {
      return responderError(res, error, 400);
    }
  });

  app.post('/api/autovideo/proyectos/:proyectoId/produccion', async (req, res) => {
    try {
      aplicarCabeceras(res);
      const proyecto = await cargarProyecto(req.params.proyectoId);
      const plan = await guardarPlanProduccion(proyecto, req.body?.plan || req.body || {});
      return responderOk(res, { plan });
    } catch (error) {
      return responderError(res, error, 400);
    }
  });

  app.get('/api/autovideo/proyectos/:proyectoId/produccion', async (req, res) => {
    try {
      aplicarCabeceras(res);
      const proyecto = await cargarProyecto(req.params.proyectoId);
      const plan = await cargarPlanProduccion(proyecto);
      return responderOk(res, { plan });
    } catch (error) {
      return responderError(res, error, 404);
    }
  });

  app.get('/api/autovideo/aprendizaje', async (_req, res) => {
    try {
      aplicarCabeceras(res);
      return responderOk(res, { memoria: await cargarMemoriaEdicion() });
    } catch (error) {
      return responderError(res, error);
    }
  });

  app.post('/api/autovideo/aprendizaje', async (req, res) => {
    try {
      aplicarCabeceras(res);
      const regla = await guardarCorreccionAprendizaje(req.body || {});
      return responderOk(res, { regla });
    } catch (error) {
      return responderError(res, error, 400);
    }
  });

  app.get('/api/autovideo/gemini/config', (_req, res) => {
    aplicarCabeceras(res);
    return responderOk(res, { config: { ...GEMINI_CONFIG, requiereClaveApi: true } });
  });
}

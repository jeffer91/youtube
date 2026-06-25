import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { procesarVideoDesdeMotor, crearDraftVideoDesdeMotor, renderizarPlanDesdeMotor } from './motor/motor.conexion.js';
import { asegurarCarpeta, obtenerRutaRaiz, asegurarCarpetasBase as asegurarCarpetasDatosBase } from './comun/archivos.js';
import { crearDiagnosticoAutomatico, diagnosticoEsBloqueante } from './diagnostico/diagnostico-automatico.service.js';
import { crearTrabajoProgreso, crearJobId, suscribirClienteProgreso, emitirEventoProgreso } from './progreso/progreso-registro.js';
import { crearReporteroProgreso, reportarErrorProgreso, reportarFinalizadoProgreso } from './progreso/progreso.conexion.js';
import { aplicarDraftAPlan } from './revision/aplicar-draft-a-plan.js';
import { crearDraftRevision } from './revision/crear-draft.service.js';
import { aprobarPlanEdicion } from './plan-edicion/aprobar-plan-edicion.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PLATAFORMA_PREDETERMINADA = 'tiktok';
const MODO_VIDEO_PREDETERMINADO = 'cuadrado-centro';
const MODO_AUDIO_PREDETERMINADO = 'limpieza-simple';
let instanciaServidor = null;
let estadoServidor = null;

function convertirBooleano(valor, valorPorDefecto = true) {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'string') {
    const limpio = valor.trim().toLowerCase();
    if (['true', '1', 'si', 'sí', 'yes', 'on', 'activo', 'activado'].includes(limpio)) return true;
    if (['false', '0', 'no', 'off', 'inactivo', 'desactivado'].includes(limpio)) return false;
  }
  return valorPorDefecto;
}

function normalizarTexto(valor, valorPorDefecto) {
  if (Array.isArray(valor)) return valor.map((item) => String(item || '').trim()).filter(Boolean).join(',');
  if (typeof valor !== 'string') return valorPorDefecto;
  const limpio = valor.trim();
  return limpio.length > 0 ? limpio : valorPorDefecto;
}

function normalizarNumero(valor, valorPorDefecto, minimo, maximo) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return valorPorDefecto;
  return Math.min(Math.max(numero, minimo), maximo);
}

function normalizarPlataforma(valor) { return normalizarTexto(valor, PLATAFORMA_PREDETERMINADA).toLowerCase(); }
function normalizarModoAudio(valor) { return normalizarTexto(valor, MODO_AUDIO_PREDETERMINADO).toLowerCase(); }
function normalizarModoVideo(valor) {
  const modo = normalizarTexto(valor, MODO_VIDEO_PREDETERMINADO).toLowerCase();
  if (['cuadrado-centro', 'tiktok-cuadrado-centro', 'square-center'].includes(modo)) return 'cuadrado-centro';
  if (['simple', 'tiktok-simple'].includes(modo)) return 'simple';
  return modo;
}

function obtenerRutasBase() {
  const raiz = obtenerRutaRaiz();
  const raizDatos = path.join(raiz, 'datos');
  return {
    app: path.join(__dirname, 'app'),
    raiz,
    raizDatos,
    videosOriginales: path.join(raizDatos, 'videos-originales'),
    proyectos: path.join(raizDatos, 'proyectos'),
    temporales: path.join(raizDatos, 'temporales'),
    subidas: path.join(raizDatos, 'temporales', 'subidas'),
    videosExportados: path.join(raizDatos, 'videos-exportados'),
    audiosMejorados: path.join(raizDatos, 'audios-mejorados')
  };
}

function asegurarCarpetasServidor(rutasBase) {
  asegurarCarpetasDatosBase();
  [rutasBase.raizDatos, rutasBase.videosOriginales, rutasBase.proyectos, rutasBase.temporales, rutasBase.subidas, rutasBase.videosExportados, rutasBase.audiosMejorados].forEach((ruta) => asegurarCarpeta(ruta));
}

function normalizarNombreTemporal(nombreOriginal) {
  const extension = path.extname(nombreOriginal || '.mp4') || '.mp4';
  const base = path.basename(nombreOriginal || 'video', extension);
  const baseLimpia = base.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  return `${Date.now()}-${baseLimpia || 'video'}${extension.toLowerCase()}`;
}

function crearConfiguracionMulter(rutasBase) {
  const almacenamiento = multer.diskStorage({
    destination(_req, _file, callback) { asegurarCarpeta(rutasBase.subidas); callback(null, rutasBase.subidas); },
    filename(_req, file, callback) { callback(null, normalizarNombreTemporal(file.originalname)); }
  });

  return multer({
    storage: almacenamiento,
    limits: { fileSize: 2 * 1024 * 1024 * 1024, fieldSize: 20 * 1024 * 1024, fields: 120, fieldNameSize: 220 },
    fileFilter(_req, file, callback) {
      const tipo = file.mimetype || '';
      const extension = path.extname(file.originalname || '').toLowerCase();
      const permitidas = new Set(['.mp4', '.mov', '.m4v', '.avi', '.mkv', '.webm']);
      if (tipo.startsWith('video/') || permitidas.has(extension)) { callback(null, true); return; }
      callback(new Error('Solo se permiten archivos de video.'));
    }
  });
}

function crearErrorHttp(res, codigo, mensaje, detalle = null) {
  return res.status(codigo).json({ ok: false, mensaje, detalle, fecha: new Date().toISOString() });
}

function normalizarOpcionesDesdeBody(body = {}) {
  return {
    plataforma: normalizarPlataforma(body.plataforma),
    modo: normalizarModoVideo(body.modo),
    mejorarAudio: convertirBooleano(body.mejorarAudio, true),
    modoAudio: normalizarModoAudio(body.modoAudio),
    crearTranscripcion: convertirBooleano(body.crearTranscripcion, true),
    modoTranscripcion: normalizarTexto(body.modoTranscripcion, 'manual'),
    idiomaTranscripcion: normalizarTexto(body.idiomaTranscripcion, 'es'),
    textoTranscripcionManual: normalizarTexto(body.textoTranscripcionManual, ''),
    agregarSubtitulos: convertirBooleano(body.agregarSubtitulos, true),
    estiloSubtitulos: normalizarTexto(body.estiloSubtitulos, 'tiktok-profesional'),
    agregarTextosFlotantes: convertirBooleano(body.agregarTextosFlotantes, true),
    estiloTextosFlotantes: normalizarTexto(body.estiloTextosFlotantes, 'badge'),
    maxTextosFlotantes: normalizarNumero(body.maxTextosFlotantes, 6, 1, 12),
    usarGemini: convertirBooleano(body.usarGemini, false),
    usarFallbackGemini: convertirBooleano(body.usarFallbackGemini, true),
    geminiCredencial: normalizarTexto(body.geminiCredencial, ''),
    geminiModelo: normalizarTexto(body.geminiModelo, 'gemini-1.5-flash'),
    geminiGuia: normalizarTexto(body.geminiGuia, ''),
    geminiTemperatura: normalizarNumero(body.geminiTemperatura, 0.35, 0, 1),
    geminiTimeoutMs: normalizarNumero(body.geminiTimeoutMs, 60000, 10000, 180000),
    edicionDinamica: convertirBooleano(body.edicionDinamica ?? body.activarEdicionDinamica ?? body.usarEdicionDinamica, true),
    activarEdicionDinamica: true,
    usarEdicionDinamica: true,
    cortarSilencios: convertirBooleano(body.cortarSilencios, true),
    modoSeguroEdicionDinamica: convertirBooleano(body.modoSeguroEdicionDinamica, true),
    intensidadEdicion: normalizarTexto(body.intensidadEdicion || body.modoEdicionDinamica, 'automatica'),
    modoEdicionDinamica: normalizarTexto(body.modoEdicionDinamica || body.intensidadEdicion, 'automatica'),
    agregarEfectosVisualesDinamicos: convertirBooleano(body.agregarEfectosVisualesDinamicos, true),
    agregarZooms: convertirBooleano(body.agregarZooms, true),
    agregarPunchIn: convertirBooleano(body.agregarPunchIn, true),
    agregarBarraProgreso: convertirBooleano(body.agregarBarraProgreso, true),
    agregarEtiquetasVisuales: convertirBooleano(body.agregarEtiquetasVisuales, true),
    agregarSonidosEdicion: convertirBooleano(body.agregarSonidosEdicion, true),
    modoSonidosEdicion: normalizarTexto(body.modoSonidosEdicion, 'normal'),
    volumenSonidosEdicion: normalizarNumero(body.volumenSonidosEdicion, 0.24, 0.04, 0.48),
    separacionMinimaSonidos: normalizarNumero(body.separacionMinimaSonidos, 1.2, 0.5, 4),
    cantidadMaximaSonidos: Math.round(normalizarNumero(body.cantidadMaximaSonidos, 16, 1, 32)),
    perfilVisual: normalizarTexto(body.perfilVisual || body.perfil, 'educacion'),
    nivelEdicion: Math.round(normalizarNumero(body.nivelEdicion || body.nivel, 2, 1, 4)),
    formatoPrincipal: normalizarTexto(body.formatoPrincipal || body.formato, 'vertical-9-16'),
    formatosExportacion: normalizarTexto(body.formatosExportacion || body.formatos, 'vertical-9-16'),
    requiereRevision: convertirBooleano(body.requiereRevision ?? body.draftMode, true),
    renderAutomatico: convertirBooleano(body.renderAutomatico, false),
    jobId: normalizarTexto(body.jobId, '')
  };
}

async function crearDiagnosticoSeguro({ guardarReporte = false } = {}) {
  try {
    return await crearDiagnosticoAutomatico({ guardarReporte });
  } catch (error) {
    return { ok: false, bloqueante: true, tipo: 'diagnostico-automatico', mensaje: `No se pudo ejecutar el diagnóstico automático: ${error.message}`, errores: [error.message], advertencias: [], creadoEn: new Date().toISOString() };
  }
}

async function eliminarTemporalSiExiste(rutaTemporal) {
  if (!rutaTemporal) return;
  try { if (fs.existsSync(rutaTemporal)) await fs.promises.unlink(rutaTemporal); } catch (error) { console.warn('[Servidor] No se pudo eliminar temporal:', error.message); }
}

function aplicarCabecerasSinCache(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
}

async function validarDiagnosticoAntesDeProcesar({ jobId, res, guardarReporte = true } = {}) {
  emitirEventoProgreso(jobId, { etapa: 'diagnostico', porcentaje: 5, titulo: 'Revisando sistema', detalle: 'Validando FFmpeg, carpetas y módulos antes de editar.' });
  const diagnostico = await crearDiagnosticoSeguro({ guardarReporte });

  if (diagnosticoEsBloqueante(diagnostico)) {
    const error = new Error('La app detectó un problema antes de procesar. Revisa el diagnóstico automático.');
    reportarErrorProgreso(jobId, error, { etapa: 'diagnostico', archivo: 'diagnostico/diagnostico-automatico.service.js', datos: diagnostico });
    res.status(503).json({ ok: false, mensaje: error.message, diagnostico, jobId, fecha: new Date().toISOString() });
    return { ok: false, diagnostico };
  }

  return { ok: true, diagnostico };
}

function obtenerPlanDesdeBody(body = {}) {
  if (body.plan && typeof body.plan === 'object') return body.plan;
  throw new Error('No se recibió el plan de edición.');
}

function crearAplicacionExpress({ modoElectron = false } = {}) {
  const rutasBase = obtenerRutasBase();
  asegurarCarpetasServidor(rutasBase);
  const app = express();
  const upload = crearConfiguracionMulter(rutasBase);

  app.disable('x-powered-by');
  app.use(cors());
  app.use(express.json({ limit: '40mb' }));
  app.use(express.urlencoded({ extended: true, limit: '40mb' }));
  app.use(express.static(rutasBase.app, { extensions: ['html'], maxAge: 0, etag: false, lastModified: false, setHeaders: aplicarCabecerasSinCache }));
  app.use('/exports', express.static(rutasBase.videosExportados, { fallthrough: false, maxAge: 0, etag: false, lastModified: false, setHeaders: aplicarCabecerasSinCache }));

  app.get('/api/estado', async (_req, res) => {
    aplicarCabecerasSinCache(res);
    const diagnostico = await crearDiagnosticoSeguro({ guardarReporte: false });
    res.json({ ok: true, app: 'AutoVideoJeff', estado: diagnosticoEsBloqueante(diagnostico) ? 'SERVIDOR_CON_DIAGNOSTICO_PENDIENTE' : 'SERVIDOR_ACTIVO', modo: modoElectron ? 'electron' : 'web', predeterminados: { plataforma: PLATAFORMA_PREDETERMINADA, modoVideo: MODO_VIDEO_PREDETERMINADO, modoAudio: MODO_AUDIO_PREDETERMINADO, crearTranscripcion: true, agregarSubtitulos: true, agregarTextosFlotantes: true, edicionDinamica: true, cortarSilencios: true, visualDinamico: true, sonidosEdicion: true, intensidadEdicion: 'automatica', requiereRevision: true, renderAutomatico: false }, diagnostico, rutas: { raizDatos: rutasBase.raizDatos, videosExportados: rutasBase.videosExportados, audiosMejorados: rutasBase.audiosMejorados }, fecha: new Date().toISOString() });
  });

  app.get('/api/diagnostico', async (_req, res) => {
    aplicarCabecerasSinCache(res);
    const diagnostico = await crearDiagnosticoSeguro({ guardarReporte: true });
    res.status(diagnosticoEsBloqueante(diagnostico) ? 503 : 200).json({ ok: !diagnosticoEsBloqueante(diagnostico), diagnostico, fecha: new Date().toISOString() });
  });

  app.get('/api/progreso/:jobId', (req, res) => {
    const jobId = normalizarTexto(req.params.jobId, '');
    if (!jobId) {
      res.status(400).json({ ok: false, mensaje: 'Falta jobId para progreso.' });
      return;
    }
    crearTrabajoProgreso(jobId);
    suscribirClienteProgreso(jobId, res);
  });

  app.post('/api/crear-draft-video', upload.single('video'), async (req, res) => {
    const archivo = req.file || null;
    const opcionesIniciales = normalizarOpcionesDesdeBody(req.body || {});
    const jobId = opcionesIniciales.jobId || crearJobId();
    crearTrabajoProgreso(jobId);
    const progreso = crearReporteroProgreso(jobId);

    try {
      if (!archivo) {
        const error = new Error('No se recibió ningún video.');
        reportarErrorProgreso(jobId, error, { etapa: 'entrada', archivo: 'server.js' });
        return crearErrorHttp(res, 400, 'No se recibió ningún video.');
      }

      const diagnosticoResultado = await validarDiagnosticoAntesDeProcesar({ jobId, res, guardarReporte: true });
      if (!diagnosticoResultado.ok) return;

      emitirEventoProgreso(jobId, { etapa: 'diagnostico', porcentaje: 8, titulo: 'Sistema listo', detalle: 'Diagnóstico correcto. Creando plan y draft.' });
      const opciones = { ...opcionesIniciales, jobId, requiereRevision: true, renderAutomatico: false };
      const resultado = await crearDraftVideoDesdeMotor({ archivoTemporal: archivo.path, nombreOriginal: archivo.originalname, nombreTemporal: archivo.filename, opciones, progreso, jobId });

      if (!resultado?.ok) {
        const error = new Error(resultado?.mensaje || 'No se pudo crear el draft del video.');
        reportarErrorProgreso(jobId, error, { etapa: 'servidor', archivo: 'motor/motor.conexion.js', datos: resultado });
        return res.status(422).json({ ok: false, mensaje: resultado?.mensaje || 'No se pudo crear el draft del video.', diagnostico: diagnosticoResultado.diagnostico, resultado, jobId, fecha: new Date().toISOString() });
      }

      reportarFinalizadoProgreso(jobId, { detalle: resultado.mensaje || 'Draft creado correctamente.', datos: { planId: resultado.plan?.id || null, draftId: resultado.draft?.id || null } });

      return res.json({ ok: true, mensaje: resultado.mensaje || 'Draft creado correctamente.', diagnostico: diagnosticoResultado.diagnostico, jobId, proyecto: resultado.proyecto, video: resultado.video, entendimiento: resultado.entendimiento, audio: resultado.audio, transcripcion: resultado.transcripcion, edicionDinamica: resultado.edicionDinamica, edicion: resultado.edicion, plan: resultado.plan, draft: resultado.draft, guardadoPlan: resultado.guardadoPlan, guardadoDraft: resultado.guardadoDraft, historial: resultado.historial || [], fecha: new Date().toISOString() });
    } catch (error) {
      console.error('[Servidor] Error creando draft:', error);
      reportarErrorProgreso(jobId, error, { etapa: error?.etapa || null, archivo: null });
      return crearErrorHttp(res, 500, error?.message || 'Error interno creando el draft.', process.env.NODE_ENV === 'production' ? null : error?.stack || null);
    } finally {
      await eliminarTemporalSiExiste(archivo?.path);
    }
  });

  app.post('/api/draft/guardar-cambios', async (req, res) => {
    try {
      const plan = obtenerPlanDesdeBody(req.body || {});
      const cambios = req.body?.cambios || {};
      const usuario = normalizarTexto(req.body?.usuario, 'usuario');
      const comentario = normalizarTexto(req.body?.comentario, 'Correcciones aplicadas desde Draft Mode.');
      const resultadoPlan = await aplicarDraftAPlan({ plan, cambios, usuario, comentario, guardar: true });
      const resultadoDraft = await crearDraftRevision({ plan: resultadoPlan.plan, guardar: true });
      return res.json({ ok: true, mensaje: 'Cambios del draft guardados correctamente.', plan: resultadoPlan.plan, draft: resultadoDraft.draft, guardadoPlan: resultadoPlan.guardado || null, guardadoDraft: resultadoDraft.guardado || null, fecha: new Date().toISOString() });
    } catch (error) {
      console.error('[Servidor] Error guardando cambios del draft:', error);
      return crearErrorHttp(res, 500, error?.message || 'Error interno guardando cambios del draft.', process.env.NODE_ENV === 'production' ? null : error?.stack || null);
    }
  });

  app.post('/api/plan/aprobar', async (req, res) => {
    try {
      const plan = obtenerPlanDesdeBody(req.body || {});
      const usuario = normalizarTexto(req.body?.usuario, 'usuario');
      const comentario = normalizarTexto(req.body?.comentario, 'Plan aprobado desde Draft Mode.');
      const resultado = await aprobarPlanEdicion({ plan, usuario, comentario, guardar: true });
      return res.json({ ok: true, mensaje: 'Plan aprobado correctamente. Ya se puede renderizar el video final.', plan: resultado.plan, guardadoPlan: resultado.guardado || null, fecha: new Date().toISOString() });
    } catch (error) {
      console.error('[Servidor] Error aprobando plan:', error);
      return crearErrorHttp(res, 500, error?.message || 'Error interno aprobando el plan.', process.env.NODE_ENV === 'production' ? null : error?.stack || null);
    }
  });

  app.post('/api/plan/renderizar', async (req, res) => {
    const jobId = normalizarTexto(req.body?.jobId, '') || crearJobId();
    crearTrabajoProgreso(jobId);
    const progreso = crearReporteroProgreso(jobId);

    try {
      const plan = obtenerPlanDesdeBody(req.body || {});
      const diagnosticoResultado = await validarDiagnosticoAntesDeProcesar({ jobId, res, guardarReporte: true });
      if (!diagnosticoResultado.ok) return;

      emitirEventoProgreso(jobId, { etapa: 'render-plan', porcentaje: 80, titulo: 'Render final', detalle: 'Renderizando video desde plan aprobado.' });
      const resultado = await renderizarPlanDesdeMotor({ plan, opciones: { jobId, renderDesdePlan: true }, progreso, jobId });

      if (!resultado?.ok) {
        const error = new Error(resultado?.mensaje || 'No se pudo renderizar el plan aprobado.');
        reportarErrorProgreso(jobId, error, { etapa: 'render-plan', archivo: 'motor/renderizar-plan-aprobado.js', datos: resultado });
        return res.status(422).json({ ok: false, mensaje: resultado?.mensaje || 'No se pudo renderizar el plan aprobado.', diagnostico: diagnosticoResultado.diagnostico, resultado, jobId, fecha: new Date().toISOString() });
      }

      reportarFinalizadoProgreso(jobId, { detalle: resultado.mensaje || 'Plan renderizado correctamente.', datos: { urlPublica: resultado.resultado?.urlPublica || null, nombreExportado: resultado.resultado?.nombreExportado || null } });
      return res.json({ ok: true, mensaje: resultado.mensaje || 'Plan renderizado correctamente.', diagnostico: diagnosticoResultado.diagnostico, jobId, resultado: resultado.resultado, proyecto: resultado.proyecto, video: resultado.video, plan: resultado.plan, guardadoPlan: resultado.guardadoPlan, historial: resultado.historial || [], fecha: new Date().toISOString() });
    } catch (error) {
      console.error('[Servidor] Error renderizando plan:', error);
      reportarErrorProgreso(jobId, error, { etapa: error?.etapa || 'render-plan', archivo: 'server.js' });
      return crearErrorHttp(res, 500, error?.message || 'Error interno renderizando el plan.', process.env.NODE_ENV === 'production' ? null : error?.stack || null);
    }
  });

  app.post('/api/procesar-video', upload.single('video'), async (req, res) => {
    const archivo = req.file || null;
    const opcionesIniciales = normalizarOpcionesDesdeBody(req.body || {});
    const jobId = opcionesIniciales.jobId || crearJobId();
    crearTrabajoProgreso(jobId);
    const progreso = crearReporteroProgreso(jobId);

    try {
      if (!archivo) {
        const error = new Error('No se recibió ningún video.');
        reportarErrorProgreso(jobId, error, { etapa: 'entrada', archivo: 'server.js' });
        return crearErrorHttp(res, 400, 'No se recibió ningún video.');
      }

      const diagnosticoResultado = await validarDiagnosticoAntesDeProcesar({ jobId, res, guardarReporte: true });
      if (!diagnosticoResultado.ok) return;

      emitirEventoProgreso(jobId, { etapa: 'diagnostico', porcentaje: 8, titulo: 'Sistema listo', detalle: 'Diagnóstico correcto. Iniciando edición automática.' });
      const opciones = { ...opcionesIniciales, jobId };
      const resultado = await procesarVideoDesdeMotor({ archivoTemporal: archivo.path, nombreOriginal: archivo.originalname, nombreTemporal: archivo.filename, opciones, progreso, jobId });

      if (!resultado?.ok) {
        const error = new Error(resultado?.mensaje || 'El video no se pudo procesar.');
        reportarErrorProgreso(jobId, error, { etapa: 'servidor', archivo: 'motor/motor.conexion.js', datos: resultado });
        return res.status(422).json({ ok: false, mensaje: resultado?.mensaje || 'El video no se pudo procesar.', diagnostico: diagnosticoResultado.diagnostico, resultado, jobId, fecha: new Date().toISOString() });
      }

      reportarFinalizadoProgreso(jobId, { detalle: resultado.mensaje || 'Video procesado correctamente.', datos: { urlPublica: resultado.resultado?.urlPublica || null, nombreExportado: resultado.resultado?.nombreExportado || null } });

      return res.json({ ok: true, mensaje: resultado.mensaje || 'Video procesado correctamente.', diagnostico: diagnosticoResultado.diagnostico, jobId, resultado: resultado.resultado, proyecto: resultado.proyecto, video: resultado.video, entendimiento: resultado.entendimiento, audio: resultado.audio, transcripcion: resultado.transcripcion, edicionDinamica: resultado.edicionDinamica, edicion: resultado.edicion, historial: resultado.historial || [], fecha: new Date().toISOString() });
    } catch (error) {
      console.error('[Servidor] Error procesando video:', error);
      reportarErrorProgreso(jobId, error, { etapa: error?.etapa || null, archivo: null });
      return crearErrorHttp(res, 500, error?.message || 'Error interno procesando el video.', process.env.NODE_ENV === 'production' ? null : error?.stack || null);
    } finally {
      await eliminarTemporalSiExiste(archivo?.path);
    }
  });

  app.use((_req, res) => res.status(404).json({ ok: false, mensaje: 'Ruta no encontrada.', fecha: new Date().toISOString() }));
  app.use((error, _req, res, _next) => {
    console.error('[Servidor] Error no controlado:', error);
    if (error instanceof multer.MulterError) return crearErrorHttp(res, 400, `Error de carga: ${error.message}`);
    return crearErrorHttp(res, 500, error?.message || 'Error interno del servidor.');
  });

  return { app, rutasBase };
}

export async function iniciarServidor({ puerto = 3000, host = '127.0.0.1', modoElectron = false } = {}) {
  if (instanciaServidor) return estadoServidor;
  const { app, rutasBase } = crearAplicacionExpress({ modoElectron });
  await new Promise((resolve, reject) => {
    instanciaServidor = app.listen(Number(puerto), host, () => {
      const direccion = instanciaServidor.address();
      const puertoReal = typeof direccion === 'object' && direccion ? direccion.port : Number(puerto);
      const url = `http://${host}:${puertoReal}`;
      estadoServidor = { ok: true, app: 'AutoVideoJeff', modo: modoElectron ? 'electron' : 'web', host, puerto: puertoReal, url, rutas: rutasBase, iniciadoEn: new Date().toISOString() };
      console.log(`[Servidor] AutoVideoJeff activo en ${url}`);
      resolve();
    });
    instanciaServidor.on('error', (error) => { instanciaServidor = null; estadoServidor = null; reject(error); });
  });
  return estadoServidor;
}

export async function detenerServidor() {
  if (!instanciaServidor) { estadoServidor = null; return; }
  await new Promise((resolve) => { instanciaServidor.close(() => resolve()); });
  instanciaServidor = null;
  estadoServidor = null;
}

export function obtenerEstadoServidor() { return estadoServidor; }
function esEjecucionDirecta() { const rutaEjecutada = process.argv[1] ? path.resolve(process.argv[1]) : ''; return rutaEjecutada === __filename; }
if (esEjecucionDirecta()) {
  iniciarServidor({ puerto: process.env.PORT || 3000, host: '127.0.0.1', modoElectron: false }).catch((error) => { console.error('[Servidor] No se pudo iniciar AutoVideoJeff:', error); process.exit(1); });
}

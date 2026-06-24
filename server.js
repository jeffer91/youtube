import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { procesarVideoDesdeMotor } from './motor/motor.conexion.js';
import { asegurarCarpeta, obtenerRutaRaiz, asegurarCarpetasBase as asegurarCarpetasDatosBase } from './comun/archivos.js';
import { crearDiagnosticoAutomatico, diagnosticoEsBloqueante } from './diagnostico/diagnostico-automatico.service.js';
import { crearDiagnosticoResultadoFinal } from './diagnostico/diagnostico-resultado-final.service.js';
import { crearTrabajoProgreso, crearJobId, suscribirClienteProgreso, emitirEventoProgreso } from './progreso/progreso-registro.js';
import { crearReporteroProgreso, reportarErrorProgreso, reportarFinalizadoProgreso } from './progreso/progreso.conexion.js';
import { normalizarOpcionesProcesamiento, validarOpcionesProcesamiento } from './motor/opciones-procesamiento.js';
import { obtenerFuncionesDisponibles, obtenerDetalleFuncion, probarFuncionDisponible, validarModuloFunciones } from './funciones/funciones.conexion.js';

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

function normalizarTexto(valor, valorPorDefecto = '') {
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

function leerJsonSeguro(valor, respaldo = null) {
  if (!valor) return respaldo;
  if (typeof valor === 'object') return valor;
  if (typeof valor !== 'string') return respaldo;
  try { return JSON.parse(valor); } catch { return respaldo; }
}

function obtenerRutasBase() {
  const raiz = obtenerRutaRaiz();
  const raizDatos = path.join(raiz, 'datos');
  return { app: path.join(__dirname, 'app'), raiz, raizDatos, videosOriginales: path.join(raizDatos, 'videos-originales'), proyectos: path.join(raizDatos, 'proyectos'), temporales: path.join(raizDatos, 'temporales'), subidas: path.join(raizDatos, 'temporales', 'subidas'), videosExportados: path.join(raizDatos, 'videos-exportados'), audiosMejorados: path.join(raizDatos, 'audios-mejorados') };
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

function extraerOpcionesProcesamientoDesdeBody(body = {}) {
  const desdeChecklist = leerJsonSeguro(body.opcionesProcesamiento, null) || leerJsonSeguro(body.procesamientoChecklist, null);
  if (desdeChecklist?.opciones && typeof desdeChecklist.opciones === 'object') return desdeChecklist.opciones;
  if (desdeChecklist && typeof desdeChecklist === 'object' && !Array.isArray(desdeChecklist)) return desdeChecklist;
  return { mejorarAudio: convertirBooleano(body.mejorarAudio, true), transcripcion: convertirBooleano(body.transcripcion ?? body.crearTranscripcion, true), subtitulos: convertirBooleano(body.subtitulos ?? body.agregarSubtitulos, true), textosFlotantes: convertirBooleano(body.textosFlotantes ?? body.agregarTextosFlotantes, true), cortes: convertirBooleano(body.cortes ?? body.cortarSilencios ?? body.edicionDinamica, true), zooms: convertirBooleano(body.zooms ?? body.agregarZooms ?? body.agregarPunchIn, true), barraProgreso: convertirBooleano(body.barraProgreso ?? body.agregarBarraProgreso, true), etiquetasVisuales: convertirBooleano(body.etiquetasVisuales ?? body.agregarEtiquetasVisuales, true), sonidos: convertirBooleano(body.sonidos ?? body.agregarSonidosEdicion, true), exportacion: convertirBooleano(body.exportacion, true) };
}

function normalizarOpcionesDesdeBody(body = {}) {
  const opcionesProcesamiento = normalizarOpcionesProcesamiento(extraerOpcionesProcesamientoDesdeBody(body));
  return { plataforma: normalizarPlataforma(body.plataforma), modo: normalizarModoVideo(body.modo), opcionesProcesamiento, mejorarAudio: opcionesProcesamiento.mejorarAudio, modoAudio: normalizarModoAudio(body.modoAudio), crearTranscripcion: opcionesProcesamiento.transcripcion, modoTranscripcion: normalizarTexto(body.modoTranscripcion, 'manual'), idiomaTranscripcion: normalizarTexto(body.idiomaTranscripcion, 'es'), textoTranscripcionManual: normalizarTexto(body.textoTranscripcionManual, ''), agregarSubtitulos: opcionesProcesamiento.subtitulos, estiloSubtitulos: normalizarTexto(body.estiloSubtitulos, 'tiktok-profesional'), agregarTextosFlotantes: opcionesProcesamiento.textosFlotantes, estiloTextosFlotantes: normalizarTexto(body.estiloTextosFlotantes, 'badge'), maxTextosFlotantes: normalizarNumero(body.maxTextosFlotantes, 6, 1, 12), usarGemini: opcionesProcesamiento.textosFlotantes ? convertirBooleano(body.usarGemini, false) : false, usarFallbackGemini: opcionesProcesamiento.textosFlotantes ? convertirBooleano(body.usarFallbackGemini, true) : false, geminiCredencial: normalizarTexto(body.geminiCredencial, ''), geminiModelo: normalizarTexto(body.geminiModelo, 'gemini-1.5-flash'), geminiGuia: normalizarTexto(body.geminiGuia, ''), geminiTemperatura: normalizarNumero(body.geminiTemperatura, 0.35, 0, 1), geminiTimeoutMs: normalizarNumero(body.geminiTimeoutMs, 60000, 10000, 180000), edicionDinamica: opcionesProcesamiento.cortes, activarEdicionDinamica: opcionesProcesamiento.cortes, usarEdicionDinamica: opcionesProcesamiento.cortes, cortarSilencios: opcionesProcesamiento.cortes, modoSeguroEdicionDinamica: convertirBooleano(body.modoSeguroEdicionDinamica, true), intensidadEdicion: normalizarTexto(body.intensidadEdicion || body.modoEdicionDinamica, 'automatica'), modoEdicionDinamica: normalizarTexto(body.modoEdicionDinamica || body.intensidadEdicion, 'automatica'), agregarEfectosVisualesDinamicos: Boolean(opcionesProcesamiento.zooms || opcionesProcesamiento.barraProgreso || opcionesProcesamiento.etiquetasVisuales), agregarZooms: opcionesProcesamiento.zooms, agregarPunchIn: opcionesProcesamiento.zooms, agregarBarraProgreso: opcionesProcesamiento.barraProgreso, agregarEtiquetasVisuales: opcionesProcesamiento.etiquetasVisuales, agregarSonidosEdicion: opcionesProcesamiento.sonidos, modoSonidosEdicion: normalizarTexto(body.modoSonidosEdicion, 'normal'), volumenSonidosEdicion: normalizarNumero(body.volumenSonidosEdicion, 0.24, 0.04, 0.48), separacionMinimaSonidos: normalizarNumero(body.separacionMinimaSonidos, 1.2, 0.5, 4), cantidadMaximaSonidos: Math.round(normalizarNumero(body.cantidadMaximaSonidos, 16, 1, 32)), exportacion: opcionesProcesamiento.exportacion, jobId: normalizarTexto(body.jobId, '') };
}

function crearUrlVideoOriginal(video = {}) { return video?.rutaOriginal ? `/originales/${encodeURIComponent(path.basename(video.rutaOriginal))}` : null; }
function crearUrlVideoEditado(resultado = {}) { return resultado?.urlPublica || resultado?.exportUrl || null; }

async function crearDiagnosticoSeguro({ guardarReporte = false } = {}) {
  try { return await crearDiagnosticoAutomatico({ guardarReporte }); }
  catch (error) { return { ok: false, bloqueante: true, tipo: 'diagnostico-automatico', mensaje: `No se pudo ejecutar el diagnóstico automático: ${error.message}`, errores: [error.message], advertencias: [], creadoEn: new Date().toISOString() }; }
}

async function eliminarTemporalSiExiste(rutaTemporal) {
  if (!rutaTemporal) return;
  try { if (fs.existsSync(rutaTemporal)) await fs.promises.unlink(rutaTemporal); }
  catch (error) { console.warn('[Servidor] No se pudo eliminar temporal:', error.message); }
}

function aplicarCabecerasSinCache(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
}

function crearAplicacionExpress({ modoElectron = false } = {}) {
  const rutasBase = obtenerRutasBase();
  asegurarCarpetasServidor(rutasBase);
  const app = express();
  const upload = crearConfiguracionMulter(rutasBase);
  app.disable('x-powered-by');
  app.use(cors());
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));
  app.use(express.static(rutasBase.app, { extensions: ['html'], maxAge: 0, etag: false, lastModified: false, setHeaders: aplicarCabecerasSinCache }));
  app.use('/exports', express.static(rutasBase.videosExportados, { fallthrough: false, maxAge: 0, etag: false, lastModified: false, setHeaders: aplicarCabecerasSinCache }));
  app.use('/originales', express.static(rutasBase.videosOriginales, { fallthrough: false, maxAge: 0, etag: false, lastModified: false, setHeaders: aplicarCabecerasSinCache }));

  app.get('/api/estado', async (_req, res) => {
    aplicarCabecerasSinCache(res);
    const diagnostico = await crearDiagnosticoSeguro({ guardarReporte: false });
    res.json({ ok: true, app: 'AutoVideoJeff', estado: diagnosticoEsBloqueante(diagnostico) ? 'SERVIDOR_CON_DIAGNOSTICO_PENDIENTE' : 'SERVIDOR_ACTIVO', modo: modoElectron ? 'electron' : 'web', predeterminados: { plataforma: PLATAFORMA_PREDETERMINADA, modoVideo: MODO_VIDEO_PREDETERMINADO, modoAudio: MODO_AUDIO_PREDETERMINADO, crearTranscripcion: true, agregarSubtitulos: true, agregarTextosFlotantes: true, edicionDinamica: true, cortarSilencios: true, visualDinamico: true, sonidosEdicion: true, intensidadEdicion: 'automatica' }, diagnostico, rutas: { raizDatos: rutasBase.raizDatos, videosExportados: rutasBase.videosExportados, audiosMejorados: rutasBase.audiosMejorados }, fecha: new Date().toISOString() });
  });

  app.get('/api/diagnostico', async (_req, res) => {
    aplicarCabecerasSinCache(res);
    const diagnostico = await crearDiagnosticoSeguro({ guardarReporte: true });
    res.status(diagnosticoEsBloqueante(diagnostico) ? 503 : 200).json({ ok: !diagnosticoEsBloqueante(diagnostico), diagnostico, fecha: new Date().toISOString() });
  });

  app.get('/api/funciones', async (req, res) => { try { aplicarCabecerasSinCache(res); const respuesta = await obtenerFuncionesDisponibles({ busqueda: normalizarTexto(req.query.q, ''), grupoId: normalizarTexto(req.query.grupo, '') }); res.json(respuesta); } catch (error) { crearErrorHttp(res, 500, error?.message || 'No se pudo cargar el catálogo de funciones.'); } });
  app.get('/api/funciones/validar', async (_req, res) => { try { aplicarCabecerasSinCache(res); const respuesta = await validarModuloFunciones(); res.status(respuesta.ok ? 200 : 422).json(respuesta); } catch (error) { crearErrorHttp(res, 500, error?.message || 'No se pudo validar el módulo de funciones.'); } });
  app.post('/api/funciones/probar', async (req, res) => { try { aplicarCabecerasSinCache(res); const respuesta = await probarFuncionDisponible(req.body || {}); res.status(respuesta.ok ? 200 : 422).json(respuesta); } catch (error) { crearErrorHttp(res, 500, error?.message || 'No se pudo probar la función.'); } });
  app.get('/api/funciones/:identificador', async (req, res) => { try { aplicarCabecerasSinCache(res); const respuesta = await obtenerDetalleFuncion(req.params.identificador); res.status(respuesta.ok ? 200 : 404).json(respuesta); } catch (error) { crearErrorHttp(res, 500, error?.message || 'No se pudo leer el detalle de la función.'); } });

  app.get('/api/progreso/:jobId', (req, res) => {
    const jobId = normalizarTexto(req.params.jobId, '');
    if (!jobId) { res.status(400).json({ ok: false, mensaje: 'Falta jobId para progreso.' }); return; }
    crearTrabajoProgreso(jobId);
    suscribirClienteProgreso(jobId, res);
  });

  app.post('/api/procesar-video', upload.single('video'), async (req, res) => {
    const archivo = req.file || null;
    const opcionesIniciales = normalizarOpcionesDesdeBody(req.body || {});
    const jobId = opcionesIniciales.jobId || crearJobId();
    const validacionOpciones = validarOpcionesProcesamiento(opcionesIniciales.opcionesProcesamiento);
    if (!validacionOpciones.ok) return crearErrorHttp(res, 400, validacionOpciones.errores[0] || 'Debes seleccionar al menos una función para procesar.');
    crearTrabajoProgreso(jobId);
    const progreso = crearReporteroProgreso(jobId);

    try {
      if (!archivo) { const error = new Error('No se recibió ningún video.'); reportarErrorProgreso(jobId, error, { etapa: 'entrada', archivo: 'server.js' }); return crearErrorHttp(res, 400, 'No se recibió ningún video.'); }
      emitirEventoProgreso(jobId, { etapa: 'diagnostico', porcentaje: 5, titulo: 'Revisando sistema', detalle: 'Validando FFmpeg, carpetas y módulos antes de editar.' });
      const diagnostico = await crearDiagnosticoSeguro({ guardarReporte: true });
      if (diagnosticoEsBloqueante(diagnostico)) { const error = new Error('La app detectó un problema antes de procesar. Revisa el diagnóstico automático.'); reportarErrorProgreso(jobId, error, { etapa: 'diagnostico', archivo: 'diagnostico/diagnostico-automatico.service.js', datos: diagnostico }); return res.status(503).json({ ok: false, mensaje: error.message, diagnostico, jobId, fecha: new Date().toISOString() }); }
      emitirEventoProgreso(jobId, { etapa: 'diagnostico', porcentaje: 8, titulo: 'Sistema listo', detalle: 'Diagnóstico correcto. Iniciando edición automática.' });
      const opciones = { ...opcionesIniciales, jobId };
      const resultado = await procesarVideoDesdeMotor({ archivoTemporal: archivo.path, nombreOriginal: archivo.originalname, nombreTemporal: archivo.filename, opciones, progreso, jobId });
      if (!resultado?.ok) { const error = new Error(resultado?.mensaje || 'El video no se pudo procesar.'); reportarErrorProgreso(jobId, error, { etapa: 'servidor', archivo: 'motor/motor.conexion.js', datos: resultado }); return res.status(422).json({ ok: false, mensaje: resultado?.mensaje || 'El video no se pudo procesar.', diagnostico, resultado, jobId, fecha: new Date().toISOString() }); }

      const videoOriginalUrl = crearUrlVideoOriginal(resultado.video);
      const videoEditadoUrl = crearUrlVideoEditado(resultado.resultado);
      const diagnosticoResultadoFinal = crearDiagnosticoResultadoFinal({ salida: resultado.resultado, opciones, videoEditadoUrl, reporteImpacto: resultado.reporteImpacto });
      const exportacionActiva = Boolean(opciones.opcionesProcesamiento?.exportacion);

      if (exportacionActiva && !resultado?.validacionFinal?.ok) {
        const error = new Error('El motor terminó, pero el video final no llegó correctamente al frontend.');
        reportarErrorProgreso(jobId, error, { etapa: 'validacion-final', archivo: 'motor/validar-resultado-final.js', datos: resultado.validacionFinal });
        return res.status(422).json({ ok: false, mensaje: error.message, diagnostico, diagnosticoResultadoFinal, validacionFinal: resultado.validacionFinal, reporteImpacto: resultado.reporteImpacto, resultado: resultado.resultado, jobId, fecha: new Date().toISOString() });
      }

      reportarFinalizadoProgreso(jobId, { detalle: resultado.mensaje || 'Video procesado correctamente.', datos: { urlPublica: resultado.resultado?.urlPublica || null, nombreExportado: resultado.resultado?.nombreExportado || null, exportacion: exportacionActiva, impactoGeneral: resultado.reporteImpacto?.porcentajeGeneral || 0 } });
      return res.json({ ok: true, mensaje: resultado.mensaje || 'Video procesado correctamente.', diagnostico, diagnosticoResultadoFinal, jobId, resultado: resultado.resultado, videoOriginalUrl, videoEditadoUrl, abrirComparativa: Boolean(exportacionActiva && resultado.resultado?.ok && !resultado.resultado?.omitido && resultado.resultado?.urlPublica), opcionesProcesamiento: opciones.opcionesProcesamiento, resumenProcesamiento: resultado.resumenProcesamiento || null, detalleProcesamiento: resultado.detalleProcesamiento || null, reporteImpacto: resultado.reporteImpacto || null, validacionFinal: resultado.validacionFinal || null, proyecto: resultado.proyecto, video: resultado.video, entendimiento: resultado.entendimiento, audio: resultado.audio, transcripcion: resultado.transcripcion, edicionDinamica: resultado.edicionDinamica, edicion: resultado.edicion, historial: resultado.historial || [], fecha: new Date().toISOString() });
    } catch (error) {
      console.error('[Servidor] Error procesando video:', error);
      reportarErrorProgreso(jobId, error, { etapa: error?.etapa || null, archivo: null });
      return crearErrorHttp(res, 500, error?.message || 'Error interno procesando el video.', process.env.NODE_ENV === 'production' ? null : error?.stack || null);
    } finally {
      await eliminarTemporalSiExiste(archivo?.path);
    }
  });

  app.use((_req, res) => res.status(404).json({ ok: false, mensaje: 'Ruta no encontrada.', fecha: new Date().toISOString() }));
  app.use((error, _req, res, _next) => { console.error('[Servidor] Error no controlado:', error); if (error instanceof multer.MulterError) return crearErrorHttp(res, 400, `Error de carga: ${error.message}`); return crearErrorHttp(res, 500, error?.message || 'Error interno del servidor.'); });
  return { app, rutasBase };
}

export async function iniciarServidor({ puerto = 3000, host = '127.0.0.1', modoElectron = false } = {}) {
  if (instanciaServidor) return estadoServidor;
  const { app, rutasBase } = crearAplicacionExpress({ modoElectron });
  await new Promise((resolve, reject) => {
    instanciaServidor = app.listen(Number(puerto), host, () => { const direccion = instanciaServidor.address(); const puertoReal = typeof direccion === 'object' && direccion ? direccion.port : Number(puerto); const url = `http://${host}:${puertoReal}`; estadoServidor = { ok: true, app: 'AutoVideoJeff', modo: modoElectron ? 'electron' : 'web', host, puerto: puertoReal, url, rutas: rutasBase, iniciadoEn: new Date().toISOString() }; console.log(`[Servidor] AutoVideoJeff activo en ${url}`); resolve(); });
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
if (esEjecucionDirecta()) { iniciarServidor({ puerto: process.env.PORT || 3000, host: '127.0.0.1', modoElectron: false }).catch((error) => { console.error('[Servidor] No se pudo iniciar AutoVideoJeff:', error); process.exit(1); }); }

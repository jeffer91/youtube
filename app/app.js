import { inicializarGeminiPopup, obtenerConfiguracionGemini, bloquearControlesGemini } from './gemini-popup.js';
import { inicializarTranscripcionUI, obtenerOpcionesTranscripcion, bloquearControlesTranscripcion } from './transcripcion-ui.js';
import { obtenerResumenAudio, obtenerResumenTranscripcion } from './resultado-resumen.js';
import { obtenerResumenEdicionDinamica } from './resultado-edicion-dinamica.js';
import { obtenerResumenDiagnostico, actualizarEstadoDiagnosticoEnServidor } from './diagnostico-ui.js';
import { validarVideoSeleccionado } from './validar-formulario.js';
import { obtenerOpcionesEdicionAutomatica, aplicarModoAutomaticoVisual } from './edicion-automatica-ui.js';
import { inicializarModalErrorEdicion, mostrarModalErrorEdicion } from './error-modal.js';
import { crearJobIdFrontend, prepararProgresoReal, conectarProgresoReal, actualizarProgresoReal } from './progreso-real-ui.js';
import { limpiarResultadoPlataformasUI, mostrarResultadoPlataformasUI } from './resultado-plataformas-ui.js';
import { inicializarConfiguracionProyectoUI, aplicarOpcionesProyectoAFormulario, bloquearControlesConfiguracionProyecto } from './configuracion-proyecto-ui.js';
import { inicializarHistorialProyectosUI, recargarHistorialProyectosUI } from './historial-proyectos-ui.js';
import { inicializarProduccionRevisionUI, guardarUltimaProduccion } from './produccion-revision-ui.js';
import { inicializarBibliotecaUI } from './biblioteca-ui.js';
import { inicializarEfectosUI, obtenerOpcionesEfectos, bloquearControlesEfectos } from './efectos-ui.js';

const PANTALLA_PROCESADOR = 'nuevo-proyecto';

const elementos = {
  serverStatus: document.getElementById('serverStatus'),
  videoForm: document.getElementById('videoForm'),
  videoInput: document.getElementById('videoInput'),
  fileName: document.getElementById('fileName'),
  processButton: document.getElementById('processButton'),
  progressArea: document.getElementById('progressArea'),
  progressText: document.getElementById('progressText'),
  progressTitle: document.getElementById('progressTitle'),
  progressPercent: document.getElementById('progressPercent'),
  progressBar: document.getElementById('progressBar'),
  progressHistory: document.getElementById('progressHistory'),
  messageBox: document.getElementById('messageBox'),
  resultPanel: document.getElementById('resultPanel'),
  resultVideo: document.getElementById('resultVideo'),
  downloadLink: document.getElementById('downloadLink'),
  improveAudio: document.getElementById('improveAudio'),
  audioMode: document.getElementById('audioMode'),
  platformInput: document.getElementById('platformInput'),
  modeInput: document.getElementById('modeInput'),
  editingSummary: document.getElementById('editingSummary'),
  audioSummary: document.getElementById('audioSummary'),
  transcriptionSummary: document.getElementById('transcriptionSummary'),
  modularSummary: document.getElementById('modularSummary'),
  productionSummary: document.getElementById('productionSummary'),
  resultPlatformsPanel: document.getElementById('resultPlatformsPanel'),
  resultPlatformsSummary: document.getElementById('resultPlatformsSummary'),
  resultPlatformsList: document.getElementById('resultPlatformsList'),
  beforeAfterPanel: document.getElementById('beforeAfterPanel'),
  beforeAfterSummary: document.getElementById('beforeAfterSummary'),
  beforeVideo: document.getElementById('beforeVideo'),
  afterVideo: document.getElementById('afterVideo')
};

let apiBaseCache = null;
let controladorProgreso = null;
let procesandoVideo = false;
let servidorVerificado = false;

function validarElementosRequeridos() {
  const faltantes = Object.entries(elementos).filter(([, valor]) => !valor).map(([nombre]) => nombre);
  if (faltantes.length > 0) {
    console.error('Faltan elementos de la interfaz:', faltantes);
    return false;
  }
  return true;
}

function esPantallaProcesadorActiva(pantallaId = document.body.dataset.pantallaActiva) {
  return pantallaId === PANTALLA_PROCESADOR;
}

function cerrarProgresoActual() {
  if (controladorProgreso?.cerrar) controladorProgreso.cerrar();
  controladorProgreso = null;
}

function mostrarMensaje(mensaje, tipo = 'normal') {
  elementos.messageBox.hidden = false;
  elementos.messageBox.textContent = mensaje;
  elementos.messageBox.className = `message-box message-box--${tipo}`;
}

function ocultarMensaje() {
  elementos.messageBox.hidden = true;
  elementos.messageBox.textContent = '';
  elementos.messageBox.className = 'message-box';
}

function ocultarProgreso() {
  cerrarProgresoActual();
  elementos.progressArea.hidden = true;
  elementos.progressText.textContent = '';
}

function limpiarVideo(video) {
  video.hidden = true;
  video.removeAttribute('src');
  video.load();
}

function reiniciarResultado() {
  elementos.resultPanel.hidden = true;
  limpiarVideo(elementos.resultVideo);
  limpiarVideo(elementos.beforeVideo);
  limpiarVideo(elementos.afterVideo);
  elementos.beforeAfterPanel.hidden = true;
  elementos.beforeAfterSummary.textContent = '';
  elementos.downloadLink.hidden = true;
  elementos.downloadLink.removeAttribute('href');
  elementos.editingSummary.hidden = true;
  elementos.editingSummary.textContent = '';
  elementos.audioSummary.hidden = true;
  elementos.audioSummary.textContent = '';
  elementos.transcriptionSummary.hidden = true;
  elementos.transcriptionSummary.textContent = '';
  limpiarResultadoPlataformasUI(elementos);
}

function aplicarEstadoControlesProcesador() {
  const activo = esPantallaProcesadorActiva();
  const bloquearBase = procesandoVideo || !activo;
  elementos.processButton.disabled = bloquearBase;
  elementos.videoInput.disabled = bloquearBase;
  elementos.improveAudio.disabled = bloquearBase;
  elementos.audioMode.disabled = bloquearBase || !elementos.improveAudio.checked;
  bloquearControlesTranscripcion(bloquearBase);
  bloquearControlesGemini(bloquearBase);
  bloquearControlesConfiguracionProyecto(bloquearBase);
  bloquearControlesEfectos(bloquearBase);
  elementos.processButton.textContent = procesandoVideo ? 'Editando automáticamente...' : 'Procesar automáticamente';
}

function bloquearFormulario(bloquear) {
  procesandoVideo = Boolean(bloquear);
  aplicarEstadoControlesProcesador();
}

async function obtenerBaseApi() {
  if (apiBaseCache) return apiBaseCache;
  const apiElectron = window.AutoVideoJeff?.servidor?.obtenerEstado;
  if (typeof apiElectron === 'function') {
    try {
      const estado = await apiElectron();
      if (estado?.url) {
        apiBaseCache = estado.url;
        return apiBaseCache;
      }
    } catch (error) {
      console.warn('No se pudo leer estado desde Electron:', error);
    }
  }
  apiBaseCache = window.location.origin;
  return apiBaseCache;
}

async function crearUrlApi(ruta) {
  const base = await obtenerBaseApi();
  return `${base}${ruta}`;
}

async function crearUrlPublica(ruta) {
  if (!ruta) return '';
  if (/^https?:\/\//i.test(ruta)) return ruta;
  const base = await obtenerBaseApi();
  const rutaNormalizada = ruta.startsWith('/') ? ruta : `/${ruta}`;
  return `${base}${rutaNormalizada}`;
}

async function leerRespuestaJsonSegura(respuesta) {
  const texto = await respuesta.text();
  if (!texto) return {};
  try {
    return JSON.parse(texto);
  } catch (_error) {
    return { ok: false, mensaje: texto };
  }
}

function actualizarEstadoServidor(ok, mensaje) {
  elementos.serverStatus.textContent = mensaje;
  elementos.serverStatus.className = ok ? 'server-status server-status--ok' : 'server-status server-status--error';
}

async function verificarServidor() {
  try {
    const respuesta = await fetch(await crearUrlApi('/api/estado'), { method: 'GET' });
    const datos = await leerRespuestaJsonSegura(respuesta);
    if (!respuesta.ok || !datos.ok) throw new Error(datos.mensaje || 'Servidor no disponible.');
    actualizarEstadoDiagnosticoEnServidor(elementos.serverStatus, datos);
    servidorVerificado = true;
  } catch (error) {
    actualizarEstadoServidor(false, 'Servidor no disponible');
    servidorVerificado = false;
    if (esPantallaProcesadorActiva()) mostrarMensaje(`No se pudo conectar con el servidor local: ${error.message}`, 'error');
  }
}

function registrarCambioDeArchivo() {
  if (!esPantallaProcesadorActiva()) return;
  ocultarMensaje();
  ocultarProgreso();
  reiniciarResultado();
  const archivo = elementos.videoInput.files?.[0];
  if (!archivo) {
    elementos.fileName.textContent = 'Ningún video seleccionado.';
    return;
  }
  const pesoMb = archivo.size / (1024 * 1024);
  elementos.fileName.textContent = `${archivo.name} · ${pesoMb.toFixed(1)} MB`;
  mostrarMensaje('Video seleccionado. Presiona Procesar automáticamente.', 'normal');
}

function agregarOpcionesAFormulario(formulario, opciones) {
  Object.entries(opciones).forEach(([clave, valor]) => formulario.append(clave, valor ?? ''));
}

function crearFormularioProcesamiento(jobId) {
  const archivo = elementos.videoInput.files?.[0];
  validarVideoSeleccionado(archivo);
  const formulario = new FormData();
  formulario.append('video', archivo);
  formulario.append('jobId', jobId);
  aplicarOpcionesProyectoAFormulario(formulario);
  formulario.append('modo', elementos.modeInput.value || 'cuadrado-centro');
  formulario.append('mejorarAudio', elementos.improveAudio.checked ? 'true' : 'false');
  formulario.append('modoAudio', elementos.audioMode.value || 'limpieza-simple');
  agregarOpcionesAFormulario(formulario, obtenerOpcionesTranscripcion());
  agregarOpcionesAFormulario(formulario, obtenerConfiguracionGemini());
  agregarOpcionesAFormulario(formulario, obtenerOpcionesEdicionAutomatica());
  agregarOpcionesAFormulario(formulario, obtenerOpcionesEfectos());
  return formulario;
}

async function iniciarProgresoReal(jobId) {
  prepararProgresoReal();
  const url = await crearUrlApi(`/api/progreso/${encodeURIComponent(jobId)}`);
  controladorProgreso = conectarProgresoReal({
    url,
    onError: (evento) => mostrarModalErrorEdicion(evento),
    onFinalizado: () => cerrarProgresoActual()
  });
  actualizarProgresoReal({ titulo: 'Trabajo creado', detalle: 'Conectando barra de progreso real.', porcentaje: 1, estado: 'procesando', etapa: 'inicio' });
}

async function mostrarAntesDespues(antesDespues, urlExportada) {
  const urlAntes = await crearUrlPublica(antesDespues?.original?.copiaVista?.urlPublica || antesDespues?.original?.urlPublica || '');
  const urlDespues = await crearUrlPublica(antesDespues?.final?.urlPublica || urlExportada || '');
  if (!urlAntes || !urlDespues) return;

  elementos.beforeAfterPanel.hidden = false;
  elementos.beforeAfterSummary.textContent = antesDespues?.resumen || 'Comparación generada correctamente.';
  elementos.beforeVideo.hidden = false;
  elementos.beforeVideo.src = urlAntes;
  elementos.afterVideo.hidden = false;
  elementos.afterVideo.src = urlDespues;
}

async function normalizarUrlsPlataformas(datos) {
  const resultadoPlataformas = datos.resultadoPlataformas || datos.modular?.resultadoPlataformas;
  if (!resultadoPlataformas?.resultados) return datos;
  const resultados = [];
  for (const item of resultadoPlataformas.resultados) {
    resultados.push({ ...item, urlPublica: item.urlPublica ? await crearUrlPublica(item.urlPublica) : '' });
  }
  const actualizado = { ...resultadoPlataformas, resultados };
  return { ...datos, resultadoPlataformas: actualizado, modular: datos.modular ? { ...datos.modular, resultadoPlataformas: actualizado } : datos.modular };
}

async function mostrarResultado(datosEntrada) {
  const datos = await normalizarUrlsPlataformas(datosEntrada);
  guardarUltimaProduccion(datos);
  const urlExportada = await crearUrlPublica(datos.resultado?.urlPublica || datos.resultado?.exportUrl || '');
  elementos.resultPanel.hidden = false;
  elementos.editingSummary.hidden = false;
  elementos.editingSummary.textContent = obtenerResumenEdicionDinamica(datos);
  elementos.audioSummary.hidden = false;
  elementos.audioSummary.textContent = obtenerResumenAudio(datos, elementos.improveAudio.checked);
  elementos.transcriptionSummary.hidden = false;
  elementos.transcriptionSummary.textContent = obtenerResumenTranscripcion(datos);
  mostrarResultadoPlataformasUI(datos, elementos);
  if (urlExportada) {
    elementos.resultVideo.hidden = false;
    elementos.resultVideo.src = urlExportada;
    elementos.downloadLink.hidden = false;
    elementos.downloadLink.href = urlExportada;
  }
  await mostrarAntesDespues(datos.resultado?.antesDespues, urlExportada);
}

function construirErrorParaModal(datos, respaldoMensaje) {
  if (datos?.diagnostico) {
    return { titulo: 'Fallo en diagnóstico', etapa: 'diagnostico', detalle: datos.mensaje || datos.diagnostico.mensaje || respaldoMensaje, archivo: 'diagnostico/diagnostico-automatico.service.js', recomendacion: 'Revisar diagnóstico automático antes de procesar el video.' };
  }

  return { titulo: 'Fallo de edición', etapa: 'servidor', detalle: datos?.mensaje || respaldoMensaje || 'No se pudo procesar el video.', archivo: 'server.js', recomendacion: 'Revisar el historial de progreso y el error del servidor.' };
}

async function procesarFormulario(evento) {
  evento.preventDefault();
  if (!esPantallaProcesadorActiva()) return;
  ocultarMensaje();
  reiniciarResultado();
  cerrarProgresoActual();

  const jobId = crearJobIdFrontend();
  let modalErrorMostrado = false;

  try {
    const formulario = crearFormularioProcesamiento(jobId);
    bloquearFormulario(true);
    await iniciarProgresoReal(jobId);
    const respuesta = await fetch(await crearUrlApi('/api/procesar-video'), { method: 'POST', body: formulario });
    const datos = await leerRespuestaJsonSegura(respuesta);

    if (!respuesta.ok || !datos.ok) {
      const resumenDiagnostico = datos?.diagnostico ? ` ${obtenerResumenDiagnostico(datos)}` : '';
      const mensaje = `${datos.mensaje || 'No se pudo procesar el video.'}${resumenDiagnostico}`.trim();
      mostrarModalErrorEdicion(construirErrorParaModal(datos, mensaje));
      modalErrorMostrado = true;
      throw new Error(mensaje);
    }

    actualizarProgresoReal({ titulo: 'Video listo', detalle: datos.mensaje || 'Proceso completado correctamente.', porcentaje: 100, estado: 'finalizado', etapa: 'finalizado' });
    await mostrarResultado(datos);
    await recargarHistorialProyectosUI({ crearUrlApi });
    mostrarMensaje(datos.mensaje || 'Proceso completado correctamente.', 'ok');
  } catch (error) {
    mostrarMensaje(error.message || 'Ocurrió un error al procesar el video.', 'error');
    if (!modalErrorMostrado) {
      mostrarModalErrorEdicion({ titulo: 'Fallo de edición', etapa: 'app', detalle: error.message || 'Ocurrió un error al procesar el video.', archivo: 'app/app.js', recomendacion: 'Revisar la conexión con el servidor y el historial de progreso.' });
    }
    console.error('Error al procesar video:', error);
  } finally {
    bloquearFormulario(false);
  }
}

function sincronizarModoAudio() {
  aplicarEstadoControlesProcesador();
}

async function sincronizarProcesadorConPantalla(pantallaId = document.body.dataset.pantallaActiva) {
  aplicarEstadoControlesProcesador();
  if (pantallaId === PANTALLA_PROCESADOR && !servidorVerificado) await verificarServidor();
}

function registrarEventosProcesador() {
  elementos.videoInput.addEventListener('change', registrarCambioDeArchivo);
  elementos.videoForm.addEventListener('submit', procesarFormulario);
  elementos.improveAudio.addEventListener('change', sincronizarModoAudio);
  document.addEventListener('autovideo:navegacion', (evento) => {
    sincronizarProcesadorConPantalla(evento.detail?.pantallaId);
  });
}

function iniciarInterfaz() {
  if (!validarElementosRequeridos()) return;
  ocultarProgreso();
  ocultarMensaje();
  reiniciarResultado();
  inicializarConfiguracionProyectoUI();
  inicializarHistorialProyectosUI({ crearUrlApi });
  inicializarProduccionRevisionUI({ crearUrlApi });
  inicializarBibliotecaUI({ crearUrlApi });
  inicializarGeminiPopup();
  inicializarTranscripcionUI();
  inicializarEfectosUI();
  inicializarModalErrorEdicion();
  aplicarModoAutomaticoVisual();
  registrarEventosProcesador();
  sincronizarProcesadorConPantalla();
}

document.addEventListener('DOMContentLoaded', iniciarInterfaz);

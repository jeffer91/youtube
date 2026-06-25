import { inicializarGeminiPopup, obtenerConfiguracionGemini, bloquearControlesGemini } from './gemini-popup.js';
import { inicializarTranscripcionUI, obtenerOpcionesTranscripcion, bloquearControlesTranscripcion } from './transcripcion-ui.js';
import { obtenerResumenAudio, obtenerResumenTranscripcion } from './resultado-resumen.js';
import { obtenerResumenEdicionDinamica } from './resultado-edicion-dinamica.js';
import { obtenerResumenDiagnostico, actualizarEstadoDiagnosticoEnServidor } from './diagnostico-ui.js';
import { validarVideoSeleccionado } from './validar-formulario.js';
import { obtenerOpcionesEdicionAutomatica, aplicarModoAutomaticoVisual } from './edicion-automatica-ui.js';
import { inicializarModalErrorEdicion, mostrarModalErrorEdicion } from './error-modal.js';
import { crearJobIdFrontend, prepararProgresoReal, conectarProgresoReal, actualizarProgresoReal } from './progreso-real-ui.js';
import { inicializarPlanEdicionUI, obtenerOpcionesPlanEdicion, bloquearControlesPlanEdicion } from './plan-edicion-ui.js';
import { inicializarDraftUI } from './draft-ui.js';

const elementos = {
  serverStatus: document.getElementById('serverStatus'),
  videoForm: document.getElementById('videoForm'),
  videoInput: document.getElementById('videoInput'),
  fileName: document.getElementById('fileName'),
  processButton: document.getElementById('processButton'),
  draftButton: document.getElementById('draftButton'),
  draftPanel: document.getElementById('draftPanel'),
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
  transcriptionSummary: document.getElementById('transcriptionSummary')
};

let apiBaseCache = null;
let controladorProgreso = null;
let draftUI = null;

function validarElementosRequeridos() {
  const faltantes = Object.entries(elementos).filter(([, valor]) => !valor).map(([nombre]) => nombre);
  if (faltantes.length > 0) {
    console.error('Faltan elementos de la interfaz:', faltantes);
    return false;
  }
  return true;
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

function reiniciarDraft() {
  elementos.draftPanel.hidden = true;
  elementos.draftPanel.innerHTML = '';
}

function reiniciarResultado() {
  reiniciarDraft();
  elementos.resultPanel.hidden = true;
  elementos.resultVideo.hidden = true;
  elementos.resultVideo.removeAttribute('src');
  elementos.resultVideo.load();
  elementos.downloadLink.hidden = true;
  elementos.downloadLink.removeAttribute('href');
  elementos.editingSummary.hidden = true;
  elementos.editingSummary.textContent = '';
  elementos.audioSummary.hidden = true;
  elementos.audioSummary.textContent = '';
  elementos.transcriptionSummary.hidden = true;
  elementos.transcriptionSummary.textContent = '';
}

function bloquearFormulario(bloquear, modoOperacion = 'procesar') {
  elementos.processButton.disabled = bloquear;
  elementos.draftButton.disabled = bloquear;
  elementos.videoInput.disabled = bloquear;
  elementos.improveAudio.disabled = bloquear;
  elementos.audioMode.disabled = bloquear;
  bloquearControlesTranscripcion(bloquear);
  bloquearControlesGemini(bloquear);
  bloquearControlesPlanEdicion(bloquear);
  elementos.processButton.textContent = bloquear && modoOperacion === 'procesar' ? 'Editando automáticamente...' : 'Procesar automáticamente';
  elementos.draftButton.textContent = bloquear && modoOperacion === 'draft' ? 'Creando borrador...' : 'Crear borrador revisable';
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
  } catch (error) {
    actualizarEstadoServidor(false, 'Servidor no disponible');
    mostrarMensaje(`No se pudo conectar con el servidor local: ${error.message}`, 'error');
  }
}

function registrarCambioDeArchivo() {
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
  mostrarMensaje('Video seleccionado. Puedes crear un borrador revisable o procesar directamente.', 'normal');
}

function agregarOpcionesAFormulario(formulario, opciones) {
  Object.entries(opciones).forEach(([clave, valor]) => formulario.append(clave, valor ?? ''));
}

function crearFormularioProcesamiento(jobId, ajustes = {}) {
  const archivo = elementos.videoInput.files?.[0];
  validarVideoSeleccionado(archivo);
  const formulario = new FormData();
  formulario.append('video', archivo);
  formulario.append('jobId', jobId);
  formulario.append('plataforma', elementos.platformInput.value || 'tiktok');
  formulario.append('modo', elementos.modeInput.value || 'cuadrado-centro');
  formulario.append('mejorarAudio', elementos.improveAudio.checked ? 'true' : 'false');
  formulario.append('modoAudio', elementos.audioMode.value || 'limpieza-simple');
  agregarOpcionesAFormulario(formulario, obtenerOpcionesTranscripcion());
  agregarOpcionesAFormulario(formulario, obtenerConfiguracionGemini());
  agregarOpcionesAFormulario(formulario, obtenerOpcionesEdicionAutomatica());
  agregarOpcionesAFormulario(formulario, obtenerOpcionesPlanEdicion());
  agregarOpcionesAFormulario(formulario, ajustes);
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

async function mostrarResultado(datos) {
  const urlExportada = await crearUrlPublica(datos.resultado?.urlPublica || datos.resultado?.exportUrl || '');
  elementos.resultPanel.hidden = false;
  elementos.editingSummary.hidden = false;
  elementos.editingSummary.textContent = obtenerResumenEdicionDinamica(datos);
  elementos.audioSummary.hidden = false;
  elementos.audioSummary.textContent = obtenerResumenAudio(datos, elementos.improveAudio.checked);
  elementos.transcriptionSummary.hidden = false;
  elementos.transcriptionSummary.textContent = obtenerResumenTranscripcion(datos);
  if (urlExportada) {
    elementos.resultVideo.hidden = false;
    elementos.resultVideo.src = urlExportada;
    elementos.downloadLink.hidden = false;
    elementos.downloadLink.href = urlExportada;
  }
}

function mostrarDraft(datos) {
  elementos.draftPanel.hidden = false;
  if (draftUI?.pintar) draftUI.pintar(datos.draft);
  const planId = datos.plan?.id || 'sin id';
  const draftId = datos.draft?.id || 'sin id';
  mostrarMensaje(`Borrador creado correctamente. Plan: ${planId} · Draft: ${draftId}. Revisa el panel antes del render final.`, 'ok');
}

function construirErrorParaModal(datos, respaldoMensaje) {
  if (datos?.diagnostico) {
    return { titulo: 'Fallo en diagnóstico', etapa: 'diagnostico', detalle: datos.mensaje || datos.diagnostico.mensaje || respaldoMensaje, archivo: 'diagnostico/diagnostico-automatico.service.js', recomendacion: 'Revisar diagnóstico automático antes de procesar el video.' };
  }

  return { titulo: 'Fallo de edición', etapa: 'servidor', detalle: datos?.mensaje || respaldoMensaje || 'No se pudo procesar el video.', archivo: 'server.js', recomendacion: 'Revisar el historial de progreso y el error del servidor.' };
}

async function ejecutarOperacionVideo({ endpoint, modoOperacion, ajustesFormulario = {}, onOk }) {
  ocultarMensaje();
  reiniciarResultado();
  cerrarProgresoActual();

  const jobId = crearJobIdFrontend();
  let modalErrorMostrado = false;

  try {
    const formulario = crearFormularioProcesamiento(jobId, ajustesFormulario);
    bloquearFormulario(true, modoOperacion);
    await iniciarProgresoReal(jobId);
    const respuesta = await fetch(await crearUrlApi(endpoint), { method: 'POST', body: formulario });
    const datos = await leerRespuestaJsonSegura(respuesta);

    if (!respuesta.ok || !datos.ok) {
      const resumenDiagnostico = datos?.diagnostico ? ` ${obtenerResumenDiagnostico(datos)}` : '';
      const mensaje = `${datos.mensaje || 'No se pudo completar la operación.'}${resumenDiagnostico}`.trim();
      mostrarModalErrorEdicion(construirErrorParaModal(datos, mensaje));
      modalErrorMostrado = true;
      throw new Error(mensaje);
    }

    actualizarProgresoReal({ titulo: modoOperacion === 'draft' ? 'Borrador listo' : 'Video listo', detalle: datos.mensaje || 'Proceso completado correctamente.', porcentaje: 100, estado: 'finalizado', etapa: 'finalizado' });
    if (typeof onOk === 'function') await onOk(datos);
    if (modoOperacion !== 'draft') mostrarMensaje(datos.mensaje || 'Proceso completado correctamente.', 'ok');
  } catch (error) {
    mostrarMensaje(error.message || 'Ocurrió un error al procesar el video.', 'error');
    if (!modalErrorMostrado) {
      mostrarModalErrorEdicion({ titulo: 'Fallo de edición', etapa: 'app', detalle: error.message || 'Ocurrió un error al procesar el video.', archivo: 'app/app.js', recomendacion: 'Revisar la conexión con el servidor y el historial de progreso.' });
    }
    console.error('Error al procesar video:', error);
  } finally {
    bloquearFormulario(false, modoOperacion);
  }
}

async function procesarFormulario(evento) {
  evento.preventDefault();
  await ejecutarOperacionVideo({
    endpoint: '/api/procesar-video',
    modoOperacion: 'procesar',
    ajustesFormulario: { requiereRevision: 'false', draftMode: 'false', renderAutomatico: 'true' },
    onOk: mostrarResultado
  });
}

async function crearDraftDesdeBoton() {
  await ejecutarOperacionVideo({
    endpoint: '/api/crear-draft-video',
    modoOperacion: 'draft',
    ajustesFormulario: { requiereRevision: 'true', draftMode: 'true', renderAutomatico: 'false' },
    onOk: mostrarDraft
  });
}

function sincronizarModoAudio() {
  elementos.audioMode.disabled = !elementos.improveAudio.checked;
}

function iniciarInterfaz() {
  if (!validarElementosRequeridos()) return;
  ocultarProgreso();
  ocultarMensaje();
  reiniciarResultado();
  draftUI = inicializarDraftUI({ contenedorId: 'draftPanel' });
  inicializarGeminiPopup();
  inicializarTranscripcionUI();
  inicializarPlanEdicionUI();
  inicializarModalErrorEdicion();
  aplicarModoAutomaticoVisual();
  elementos.videoInput.addEventListener('change', registrarCambioDeArchivo);
  elementos.videoForm.addEventListener('submit', procesarFormulario);
  elementos.draftButton.addEventListener('click', crearDraftDesdeBoton);
  elementos.improveAudio.addEventListener('change', sincronizarModoAudio);
  sincronizarModoAudio();
  verificarServidor();
}

document.addEventListener('DOMContentLoaded', iniciarInterfaz);

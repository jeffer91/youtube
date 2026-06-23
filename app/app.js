import { inicializarGeminiPopup, obtenerConfiguracionGemini, bloquearControlesGemini } from './gemini-popup.js';
import { inicializarTranscripcionUI, obtenerOpcionesTranscripcion, bloquearControlesTranscripcion } from './transcripcion-ui.js';
import { obtenerResumenAudio, obtenerResumenTranscripcion } from './resultado-resumen.js';
import { crearMensajesProceso } from './progreso-mensajes.js';
import { validarVideoSeleccionado } from './validar-formulario.js';

const elementos = {
  serverStatus: document.getElementById('serverStatus'),
  videoForm: document.getElementById('videoForm'),
  videoInput: document.getElementById('videoInput'),
  fileName: document.getElementById('fileName'),
  processButton: document.getElementById('processButton'),
  progressArea: document.getElementById('progressArea'),
  progressText: document.getElementById('progressText'),
  messageBox: document.getElementById('messageBox'),
  resultPanel: document.getElementById('resultPanel'),
  resultVideo: document.getElementById('resultVideo'),
  downloadLink: document.getElementById('downloadLink'),
  improveAudio: document.getElementById('improveAudio'),
  audioMode: document.getElementById('audioMode'),
  platformInput: document.getElementById('platformInput'),
  modeInput: document.getElementById('modeInput'),
  audioSummary: document.getElementById('audioSummary'),
  transcriptionSummary: document.getElementById('transcriptionSummary')
};

let apiBaseCache = null;
let temporizadorEstado = null;

function validarElementosRequeridos() {
  const faltantes = Object.entries(elementos).filter(([, valor]) => !valor).map(([nombre]) => nombre);
  if (faltantes.length > 0) {
    console.error('Faltan elementos de la interfaz:', faltantes);
    return false;
  }
  return true;
}

function limpiarTemporizadorEstado() {
  if (temporizadorEstado) {
    window.clearInterval(temporizadorEstado);
    temporizadorEstado = null;
  }
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

function mostrarProgreso(mensaje) {
  elementos.progressArea.hidden = false;
  elementos.progressText.textContent = mensaje;
}

function ocultarProgreso() {
  limpiarTemporizadorEstado();
  elementos.progressArea.hidden = true;
  elementos.progressText.textContent = '';
}

function reiniciarResultado() {
  elementos.resultPanel.hidden = true;
  elementos.resultVideo.hidden = true;
  elementos.resultVideo.removeAttribute('src');
  elementos.resultVideo.load();
  elementos.downloadLink.hidden = true;
  elementos.downloadLink.removeAttribute('href');
  elementos.audioSummary.hidden = true;
  elementos.audioSummary.textContent = '';
  elementos.transcriptionSummary.hidden = true;
  elementos.transcriptionSummary.textContent = '';
}

function bloquearFormulario(bloquear) {
  elementos.processButton.disabled = bloquear;
  elementos.videoInput.disabled = bloquear;
  elementos.improveAudio.disabled = bloquear;
  elementos.audioMode.disabled = bloquear;
  bloquearControlesTranscripcion(bloquear);
  bloquearControlesGemini(bloquear);
  elementos.processButton.textContent = bloquear ? 'Procesando...' : 'Procesar video';
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
    actualizarEstadoServidor(true, 'Servidor activo');
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
  mostrarMensaje('Video seleccionado. Puedes procesarlo cuando quieras.', 'normal');
}

function agregarOpcionesAFormulario(formulario, opciones) {
  Object.entries(opciones).forEach(([clave, valor]) => formulario.append(clave, valor ?? ''));
}

function crearFormularioProcesamiento() {
  const archivo = elementos.videoInput.files?.[0];
  validarVideoSeleccionado(archivo);
  const formulario = new FormData();
  formulario.append('video', archivo);
  formulario.append('plataforma', elementos.platformInput.value || 'tiktok');
  formulario.append('modo', elementos.modeInput.value || 'cuadrado-centro');
  formulario.append('mejorarAudio', elementos.improveAudio.checked ? 'true' : 'false');
  formulario.append('modoAudio', elementos.audioMode.value || 'limpieza-simple');
  agregarOpcionesAFormulario(formulario, obtenerOpcionesTranscripcion());
  agregarOpcionesAFormulario(formulario, obtenerConfiguracionGemini());
  return formulario;
}

function iniciarMensajesDeProceso() {
  const opcionesTranscripcion = obtenerOpcionesTranscripcion();
  const opcionesGemini = obtenerConfiguracionGemini();
  const mensajes = crearMensajesProceso({ mejorarAudio: elementos.improveAudio.checked, crearTranscripcion: opcionesTranscripcion.crearTranscripcion === 'true', agregarSubtitulos: opcionesTranscripcion.agregarSubtitulos === 'true', agregarTextosFlotantes: opcionesTranscripcion.agregarTextosFlotantes === 'true', usarGemini: Boolean(opcionesGemini.usarGemini) });
  let indice = 0;
  mostrarProgreso(mensajes[indice]);
  limpiarTemporizadorEstado();
  temporizadorEstado = window.setInterval(() => {
    indice = Math.min(indice + 1, mensajes.length - 1);
    mostrarProgreso(mensajes[indice]);
    if (indice >= mensajes.length - 1) limpiarTemporizadorEstado();
  }, 1800);
}

async function mostrarResultado(datos) {
  const urlExportada = await crearUrlPublica(datos.resultado?.urlPublica || datos.resultado?.exportUrl || '');
  elementos.resultPanel.hidden = false;
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

async function procesarFormulario(evento) {
  evento.preventDefault();
  ocultarMensaje();
  ocultarProgreso();
  reiniciarResultado();
  try {
    const formulario = crearFormularioProcesamiento();
    bloquearFormulario(true);
    iniciarMensajesDeProceso();
    const respuesta = await fetch(await crearUrlApi('/api/procesar-video'), { method: 'POST', body: formulario });
    const datos = await leerRespuestaJsonSegura(respuesta);
    if (!respuesta.ok || !datos.ok) throw new Error(datos.mensaje || 'No se pudo procesar el video.');
    limpiarTemporizadorEstado();
    mostrarProgreso('Video listo.');
    await mostrarResultado(datos);
    mostrarMensaje(datos.mensaje || 'Proceso completado correctamente.', 'ok');
  } catch (error) {
    ocultarProgreso();
    mostrarMensaje(error.message || 'Ocurrió un error al procesar el video.', 'error');
    console.error('Error al procesar video:', error);
  } finally {
    bloquearFormulario(false);
  }
}

function sincronizarModoAudio() {
  elementos.audioMode.disabled = !elementos.improveAudio.checked;
  if (!elementos.improveAudio.checked) mostrarMensaje('Mejora de audio desactivada. Se usará el audio original.', 'normal');
  else mostrarMensaje('Mejora de audio activada. Se limpiará el ruido de fondo.', 'normal');
}

function iniciarInterfaz() {
  if (!validarElementosRequeridos()) return;
  ocultarProgreso();
  ocultarMensaje();
  reiniciarResultado();
  inicializarGeminiPopup();
  inicializarTranscripcionUI();
  elementos.videoInput.addEventListener('change', registrarCambioDeArchivo);
  elementos.videoForm.addEventListener('submit', procesarFormulario);
  elementos.improveAudio.addEventListener('change', sincronizarModoAudio);
  sincronizarModoAudio();
  verificarServidor();
}

document.addEventListener('DOMContentLoaded', iniciarInterfaz);

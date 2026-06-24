/*
  Nombre completo: resultado-comparativa.js
  Ruta: /app/resultado-comparativa.js

  Función:
  - Leer parámetros enviados a resultado-comparativa.html.
  - Cargar video original y video editado.
  - Controlar botones individuales y generales.
*/

import {
  guardarUltimoProcesamientoParaReprocesar
} from './procesamiento-checklist-api.js';

const elementos = {
  videoOriginal: document.getElementById('videoOriginal'),
  videoEditado: document.getElementById('videoEditado'),
  btnReproducirAmbos: document.getElementById('btnReproducirAmbos'),
  btnPausarAmbos: document.getElementById('btnPausarAmbos'),
  btnVolverProcesar: document.getElementById('btnVolverProcesar'),
  btnCerrarComparativa: document.getElementById('btnCerrarComparativa'),
  btnPlayOriginal: document.getElementById('btnPlayOriginal'),
  btnPauseOriginal: document.getElementById('btnPauseOriginal'),
  btnReiniciarOriginal: document.getElementById('btnReiniciarOriginal'),
  btnPlayEditado: document.getElementById('btnPlayEditado'),
  btnPauseEditado: document.getElementById('btnPauseEditado'),
  btnReiniciarEditado: document.getElementById('btnReiniciarEditado'),
  btnDescargarEditado: document.getElementById('btnDescargarEditado'),
  error: document.getElementById('comparativaError'),
  info: document.getElementById('comparativaInfo')
};

function obtenerParametro(nombre) {
  const params = new URLSearchParams(window.location.search);
  return params.get(nombre) || '';
}

function decodificarJsonSeguro(valor, respaldo = {}) {
  if (!valor) return respaldo;

  try {
    return JSON.parse(valor);
  } catch {
    return respaldo;
  }
}

function mostrarError(mensaje) {
  if (!elementos.error) return;
  elementos.error.hidden = false;
  elementos.error.textContent = mensaje || 'No se pudo cargar la comparativa.';
}

function limpiarError() {
  if (!elementos.error) return;
  elementos.error.hidden = true;
  elementos.error.textContent = '';
}

function asignarVideo(video, url) {
  if (!video || !url) return false;
  video.src = url;
  video.load();
  return true;
}

function reproducirVideo(video) {
  if (!video) return;

  const promesa = video.play();

  if (promesa && typeof promesa.catch === 'function') {
    promesa.catch(() => {
      mostrarError('El navegador bloqueó la reproducción automática. Usa el botón de reproducción del video.');
    });
  }
}

function pausarVideo(video) {
  if (!video) return;
  video.pause();
}

function reiniciarVideo(video) {
  if (!video) return;
  video.pause();
  video.currentTime = 0;
}

function reproducirAmbos() {
  limpiarError();
  reproducirVideo(elementos.videoOriginal);
  reproducirVideo(elementos.videoEditado);
}

function pausarAmbos() {
  pausarVideo(elementos.videoOriginal);
  pausarVideo(elementos.videoEditado);
}

function prepararDescarga(urlEditado) {
  if (!elementos.btnDescargarEditado) return;

  if (!urlEditado) {
    elementos.btnDescargarEditado.setAttribute('href', '#');
    elementos.btnDescargarEditado.setAttribute('aria-disabled', 'true');
    return;
  }

  elementos.btnDescargarEditado.setAttribute('href', urlEditado);
  elementos.btnDescargarEditado.removeAttribute('aria-disabled');
}

function actualizarInfo({ jobId, opciones }) {
  if (!elementos.info) return;

  const totalActivas = Object.values(opciones || {}).filter(Boolean).length;
  const textoJob = jobId ? ` Proceso: ${jobId}.` : '';
  elementos.info.textContent = `Comparativa cargada. Opciones activas: ${totalActivas}.${textoJob} Si no te gusta el resultado, puedes volver a procesar.`;
}

function volverAProcesar(datos) {
  guardarUltimoProcesamientoParaReprocesar({
    origen: 'comparativa',
    originalUrl: datos.originalUrl,
    editadoUrl: datos.editadoUrl,
    jobId: datos.jobId,
    opcionesProcesamiento: datos.opciones
  });

  window.location.href = './index.html?reprocesar=1';
}

function cerrarComparativa() {
  reiniciarVideo(elementos.videoOriginal);
  reiniciarVideo(elementos.videoEditado);
  window.location.href = './index.html';
}

function inicializarEventos(datos) {
  elementos.btnReproducirAmbos?.addEventListener('click', reproducirAmbos);
  elementos.btnPausarAmbos?.addEventListener('click', pausarAmbos);
  elementos.btnPlayOriginal?.addEventListener('click', () => reproducirVideo(elementos.videoOriginal));
  elementos.btnPauseOriginal?.addEventListener('click', () => pausarVideo(elementos.videoOriginal));
  elementos.btnReiniciarOriginal?.addEventListener('click', () => reiniciarVideo(elementos.videoOriginal));
  elementos.btnPlayEditado?.addEventListener('click', () => reproducirVideo(elementos.videoEditado));
  elementos.btnPauseEditado?.addEventListener('click', () => pausarVideo(elementos.videoEditado));
  elementos.btnReiniciarEditado?.addEventListener('click', () => reiniciarVideo(elementos.videoEditado));
  elementos.btnVolverProcesar?.addEventListener('click', () => volverAProcesar(datos));
  elementos.btnCerrarComparativa?.addEventListener('click', cerrarComparativa);
}

function inicializarComparativa() {
  limpiarError();

  const originalUrl = obtenerParametro('original');
  const editadoUrl = obtenerParametro('editado');
  const jobId = obtenerParametro('jobId');
  const opciones = decodificarJsonSeguro(obtenerParametro('opciones'), {});

  if (!originalUrl || !editadoUrl) {
    mostrarError('Faltan las rutas del video original o del video editado. Vuelve a procesar el video.');
    return;
  }

  const originalOk = asignarVideo(elementos.videoOriginal, originalUrl);
  const editadoOk = asignarVideo(elementos.videoEditado, editadoUrl);

  if (!originalOk || !editadoOk) {
    mostrarError('No se pudieron cargar los videos de la comparativa.');
    return;
  }

  prepararDescarga(editadoUrl);

  const datos = { originalUrl, editadoUrl, jobId, opciones };
  actualizarInfo(datos);
  inicializarEventos(datos);
}

document.addEventListener('DOMContentLoaded', inicializarComparativa);

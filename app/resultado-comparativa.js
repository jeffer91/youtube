/*
  Nombre completo: resultado-comparativa.js
  Ruta: /app/resultado-comparativa.js

  Función:
  - Cargar video original y editado.
  - Mostrar controles de reproducción.
  - Mostrar reporte de impacto guardado desde el procesamiento.
*/

import { guardarUltimoProcesamientoParaReprocesar, leerUltimoProcesamientoParaReprocesar } from './procesamiento-checklist-api.js';
import { mostrarReporteImpacto } from './reporte-impacto-ui.js';

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
  info: document.getElementById('comparativaInfo'),
  reporte: document.getElementById('comparativaReporteImpacto')
};

function obtenerParametro(nombre) { const params = new URLSearchParams(window.location.search); return params.get(nombre) || ''; }
function decodificarJsonSeguro(valor, respaldo = {}) { if (!valor) return respaldo; try { return JSON.parse(valor); } catch { return respaldo; } }
function mostrarError(mensaje) { if (!elementos.error) return; elementos.error.hidden = false; elementos.error.textContent = mensaje || 'No se pudo cargar la comparativa.'; }
function limpiarError() { if (!elementos.error) return; elementos.error.hidden = true; elementos.error.textContent = ''; }
function asignarVideo(video, url) { if (!video || !url) return false; video.src = url; video.load(); return true; }
function reproducirVideo(video) { if (!video) return; const p = video.play(); if (p && typeof p.catch === 'function') p.catch(() => mostrarError('El navegador bloqueó la reproducción automática. Usa el botón de reproducción del video.')); }
function pausarVideo(video) { if (video) video.pause(); }
function reiniciarVideo(video) { if (!video) return; video.pause(); video.currentTime = 0; }
function reproducirAmbos() { limpiarError(); reproducirVideo(elementos.videoOriginal); reproducirVideo(elementos.videoEditado); }
function pausarAmbos() { pausarVideo(elementos.videoOriginal); pausarVideo(elementos.videoEditado); }
function prepararDescarga(urlEditado) { if (!elementos.btnDescargarEditado) return; if (!urlEditado) { elementos.btnDescargarEditado.setAttribute('href', '#'); elementos.btnDescargarEditado.setAttribute('aria-disabled', 'true'); return; } elementos.btnDescargarEditado.setAttribute('href', urlEditado); elementos.btnDescargarEditado.removeAttribute('aria-disabled'); }

function actualizarInfo({ jobId, opciones, reporteImpacto }) {
  if (!elementos.info) return;
  const totalActivas = Object.values(opciones || {}).filter(Boolean).length;
  const textoJob = jobId ? ` Proceso: ${jobId}.` : '';
  const impacto = reporteImpacto?.porcentajeGeneral !== undefined ? ` Impacto general: ${reporteImpacto.porcentajeGeneral}%.` : '';
  elementos.info.textContent = `Comparativa cargada. Opciones activas: ${totalActivas}.${textoJob}${impacto} Si no te gusta el resultado, puedes volver a procesar.`;
}

function volverAProcesar(datos) {
  guardarUltimoProcesamientoParaReprocesar({ origen: 'comparativa', originalUrl: datos.originalUrl, editadoUrl: datos.editadoUrl, jobId: datos.jobId, opcionesProcesamiento: datos.opciones, reporteImpacto: datos.reporteImpacto, validacionFinal: datos.validacionFinal });
  window.location.href = './index.html?reprocesar=1';
}

function cerrarComparativa() { reiniciarVideo(elementos.videoOriginal); reiniciarVideo(elementos.videoEditado); window.location.href = './index.html'; }

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
  const guardado = leerUltimoProcesamientoParaReprocesar() || {};
  const originalUrl = obtenerParametro('original') || guardado.originalUrl || '';
  const editadoUrl = obtenerParametro('editado') || guardado.editadoUrl || '';
  const jobId = obtenerParametro('jobId') || guardado.jobId || '';
  const opciones = decodificarJsonSeguro(obtenerParametro('opciones'), guardado.opcionesProcesamiento || {});
  const reporteImpacto = guardado.reporteImpacto || guardado.respuesta?.reporteImpacto || null;
  const validacionFinal = guardado.validacionFinal || guardado.respuesta?.validacionFinal || null;

  if (!originalUrl || !editadoUrl) { mostrarError('Faltan las rutas del video original o del video editado. Vuelve a procesar el video.'); return; }
  if (!asignarVideo(elementos.videoOriginal, originalUrl) || !asignarVideo(elementos.videoEditado, editadoUrl)) { mostrarError('No se pudieron cargar los videos de la comparativa.'); return; }

  prepararDescarga(editadoUrl);
  if (reporteImpacto) mostrarReporteImpacto(reporteImpacto, elementos.reporte);
  const datos = { originalUrl, editadoUrl, jobId, opciones, reporteImpacto, validacionFinal };
  actualizarInfo(datos);
  inicializarEventos(datos);
}

document.addEventListener('DOMContentLoaded', inicializarComparativa);

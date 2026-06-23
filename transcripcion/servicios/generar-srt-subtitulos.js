/*
  Nombre completo: generar-srt-subtitulos.js
  Ruta: transcripcion/servicios/generar-srt-subtitulos.js
*/

import { TRANSCRIPCION_CONFIG, limitarNumero } from '../transcripcion.config.js';
import { normalizarSegmentos } from './normalizar-segmentos.js';

function pad(numero, tamano = 2) {
  return String(numero).padStart(tamano, '0');
}

function formatearTiempoSrt(segundos) {
  const totalMs = Math.max(0, Math.round(Number(segundos || 0) * 1000));
  const horas = Math.floor(totalMs / 3600000);
  const minutos = Math.floor((totalMs % 3600000) / 60000);
  const seg = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;
  return `${pad(horas)}:${pad(minutos)}:${pad(seg)},${pad(ms, 3)}`;
}

function limpiarTextoSrt(texto) {
  return String(texto || '').replace(/\r?\n+/g, ' ').replace(/\s+/g, ' ').trim();
}

function dividirLineas(texto, maxCaracteresLinea, maxLineas) {
  const limpio = limpiarTextoSrt(texto);
  if (!limpio) return [];
  const palabras = limpio.split(' ');
  const lineas = [];
  let actual = '';
  for (const palabra of palabras) {
    const candidato = actual ? `${actual} ${palabra}` : palabra;
    if (candidato.length <= maxCaracteresLinea) {
      actual = candidato;
    } else {
      if (actual) lineas.push(actual);
      actual = palabra;
    }
  }
  if (actual) lineas.push(actual);
  if (lineas.length <= maxLineas) return lineas;
  const permitidas = lineas.slice(0, maxLineas);
  const resto = lineas.slice(maxLineas).join(' ');
  const ultima = `${permitidas[permitidas.length - 1]} ${resto}`.trim();
  permitidas[permitidas.length - 1] = ultima.length > maxCaracteresLinea + 8 ? `${ultima.slice(0, maxCaracteresLinea + 5).trim()}...` : ultima;
  return permitidas;
}

export function generarContenidoSrt(segmentos = [], opciones = {}) {
  const config = opciones.config || TRANSCRIPCION_CONFIG;
  const subtitulosConfig = { ...config.subtitulos, ...(opciones.subtitulos || {}) };
  const maxCaracteresLinea = limitarNumero(opciones.maxCaracteresLinea || subtitulosConfig.maxCaracteresLinea, 16, 60, 32);
  const maxLineas = limitarNumero(opciones.maxLineasPorSubtitulo || subtitulosConfig.maxLineasPorSubtitulo, 1, 3, 2);
  const segmentosNormalizados = normalizarSegmentos(segmentos, { config });
  if (segmentosNormalizados.length === 0) return '';
  return segmentosNormalizados.map((segmento, index) => {
    const inicio = formatearTiempoSrt(segmento.inicio);
    const fin = formatearTiempoSrt(segmento.fin);
    const texto = dividirLineas(segmento.texto, maxCaracteresLinea, maxLineas).join('\n');
    return `${index + 1}\n${inicio} --> ${fin}\n${texto}`;
  }).join('\n\n').concat('\n');
}

export function crearResumenSrt(segmentos = []) {
  const segmentosNormalizados = normalizarSegmentos(segmentos);
  return { formato: 'srt', cantidadSubtitulos: segmentosNormalizados.length, primerInicio: segmentosNormalizados[0]?.inicio ?? null, ultimoFin: segmentosNormalizados[segmentosNormalizados.length - 1]?.fin ?? null };
}

export default generarContenidoSrt;

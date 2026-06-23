/*
  Nombre completo: normalizar-segmentos.js
  Ruta: transcripcion/servicios/normalizar-segmentos.js
*/

import { TRANSCRIPCION_CONFIG, limitarNumero, normalizarTexto } from '../transcripcion.config.js';

function limpiarTexto(valor) {
  return normalizarTexto(valor, '').replace(/\s+/g, ' ').replace(/\s+([,.!?;:])/g, '$1').trim();
}

function redondear(valor, decimales = 3) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return 0;
  const factor = 10 ** decimales;
  return Math.round(numero * factor) / factor;
}

function numeroSeguro(valor, respaldo = 0) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : respaldo;
}

function dividirTextoEnFrases(texto) {
  const limpio = limpiarTexto(texto);
  if (!limpio) return [];
  const frases = limpio.split(/(?<=[.!?])\s+|\n+/g).map((item) => limpiarTexto(item)).filter(Boolean);
  return frases.length > 0 ? frases : [limpio];
}

function cortarTextoPorLongitud(texto, maxCaracteres) {
  const limpio = limpiarTexto(texto);
  if (limpio.length <= maxCaracteres) return [limpio];
  const palabras = limpio.split(' ');
  const partes = [];
  let actual = '';
  for (const palabra of palabras) {
    const candidato = actual ? `${actual} ${palabra}` : palabra;
    if (candidato.length <= maxCaracteres) {
      actual = candidato;
    } else {
      if (actual) partes.push(actual);
      actual = palabra;
    }
  }
  if (actual) partes.push(actual);
  return partes.filter(Boolean);
}

function crearSegmentosDesdeTexto(texto, opciones = {}) {
  const config = opciones.config || TRANSCRIPCION_CONFIG;
  const duracionPorDefecto = limitarNumero(opciones.duracionSegmentoPorDefecto || config.transcripcion.duracionSegmentoPorDefecto, 1, 8, 3);
  const maxCaracteres = limitarNumero(opciones.maxCaracteresSegmento || config.transcripcion.maxCaracteresSegmento, 40, 260, 180);
  const frases = dividirTextoEnFrases(texto).flatMap((frase) => cortarTextoPorLongitud(frase, maxCaracteres));
  let cursor = 0;
  return frases.map((frase, index) => {
    const inicio = redondear(cursor);
    const fin = redondear(inicio + duracionPorDefecto);
    cursor = fin + 0.05;
    return { id: index + 1, inicio, fin, duracion: redondear(fin - inicio), texto: frase, origen: 'texto-sin-tiempos' };
  });
}

function obtenerTextoSegmento(segmento) {
  return limpiarTexto(segmento?.texto || segmento?.text || segmento?.caption || segmento?.contenido || '');
}

function obtenerInicioSegmento(segmento, indice, duracionPorDefecto) {
  const inicio = numeroSeguro(segmento?.inicio ?? segmento?.start ?? segmento?.startTime ?? segmento?.desde, indice * duracionPorDefecto);
  return Math.max(0, inicio);
}

function obtenerFinSegmento(segmento, inicio, duracionPorDefecto) {
  const fin = numeroSeguro(segmento?.fin ?? segmento?.end ?? segmento?.endTime ?? segmento?.hasta, inicio + duracionPorDefecto);
  return fin > inicio ? fin : inicio + duracionPorDefecto;
}

export function normalizarSegmentos(segmentos = [], opciones = {}) {
  const config = opciones.config || TRANSCRIPCION_CONFIG;
  const duracionPorDefecto = limitarNumero(opciones.duracionSegmentoPorDefecto || config.transcripcion.duracionSegmentoPorDefecto, 1, 8, 3);
  const maxCaracteres = limitarNumero(opciones.maxCaracteresSegmento || config.transcripcion.maxCaracteresSegmento, 40, 260, 180);
  const separacionMinima = limitarNumero(opciones.separacionMinimaSegmentos || config.transcripcion.separacionMinimaSegmentos, 0, 0.5, 0.05);
  if (!Array.isArray(segmentos) || segmentos.length === 0) return [];
  let cursorMinimo = 0;
  return segmentos.map((segmento, indice) => {
    const texto = obtenerTextoSegmento(segmento);
    if (!texto) return null;
    const partesTexto = cortarTextoPorLongitud(texto, maxCaracteres);
    const inicioOriginal = obtenerInicioSegmento(segmento, indice, duracionPorDefecto);
    const finOriginal = obtenerFinSegmento(segmento, inicioOriginal, duracionPorDefecto);
    const duracionTotal = Math.max(finOriginal - inicioOriginal, duracionPorDefecto);
    const duracionParte = duracionTotal / Math.max(partesTexto.length, 1);
    return partesTexto.map((parte, subIndice) => {
      const inicioCalculado = inicioOriginal + (duracionParte * subIndice);
      const inicio = Math.max(inicioCalculado, cursorMinimo);
      const fin = Math.max(inicio + 0.45, inicio + duracionParte);
      cursorMinimo = fin + separacionMinima;
      return { id: 0, inicio: redondear(inicio), fin: redondear(fin), duracion: redondear(fin - inicio), texto: parte, origen: segmento?.origen || 'transcripcion', indiceOriginal: indice, subIndice };
    });
  }).flat().filter(Boolean).sort((a, b) => a.inicio - b.inicio).map((segmento, index) => ({ ...segmento, id: index + 1 }));
}

export function crearTranscripcionNormalizada({ textoCompleto = '', segmentos = [], idioma = 'es', fuente = 'manual', duracionSegundos = null, opciones = {} } = {}) {
  const texto = limpiarTexto(textoCompleto);
  const segmentosBase = Array.isArray(segmentos) && segmentos.length > 0 ? segmentos : crearSegmentosDesdeTexto(texto, opciones);
  const segmentosNormalizados = normalizarSegmentos(segmentosBase, opciones);
  const textoFinal = texto || segmentosNormalizados.map((segmento) => segmento.texto).join(' ');
  return { ok: textoFinal.length > 0 || segmentosNormalizados.length > 0, idioma, fuente, textoCompleto: textoFinal, segmentos: segmentosNormalizados, cantidadSegmentos: segmentosNormalizados.length, duracionSegundos: duracionSegundos ?? (segmentosNormalizados.length > 0 ? segmentosNormalizados[segmentosNormalizados.length - 1].fin : null), creadoEn: new Date().toISOString() };
}

export function segmentarTextoManual(texto, opciones = {}) {
  return crearSegmentosDesdeTexto(texto, opciones);
}

export default normalizarSegmentos;

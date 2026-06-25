import { PALABRAS_IMPORTANTES } from './inteligencia.config.js';

export function extraerSegmentosTranscripcion(transcripcion = {}) {
  if (Array.isArray(transcripcion?.transcripcion?.segmentos)) return transcripcion.transcripcion.segmentos;
  if (Array.isArray(transcripcion?.segmentos)) return transcripcion.segmentos;
  return [];
}

export function extraerTextoCompleto(transcripcion = {}) {
  const directo = transcripcion?.transcripcion?.textoCompleto || transcripcion?.textoCompleto || '';
  if (typeof directo === 'string' && directo.trim()) return directo.trim();
  return extraerSegmentosTranscripcion(transcripcion).map((segmento) => segmento?.texto || '').join(' ').replace(/\s+/g, ' ').trim();
}

export function normalizarTexto(valor = '') {
  return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9áéíóúñü\s#@-]/gi, ' ').replace(/\s+/g, ' ').trim();
}

export function dividirPalabras(texto = '') {
  return normalizarTexto(texto).split(' ').map((palabra) => palabra.trim()).filter((palabra) => palabra.length >= 4);
}

export function puntuarSegmento(segmento = {}) {
  const texto = String(segmento.texto || '');
  const normalizado = normalizarTexto(texto);
  let puntaje = 0;
  for (const palabra of PALABRAS_IMPORTANTES) {
    if (normalizado.includes(normalizarTexto(palabra))) puntaje += 3;
  }
  if (texto.includes('?') || texto.includes('¿')) puntaje += 2;
  if (texto.includes('!') || texto.includes('¡')) puntaje += 2;
  if (texto.length >= 45 && texto.length <= 150) puntaje += 2;
  const inicio = Number(segmento.inicio ?? segmento.start ?? 0);
  if (Number.isFinite(inicio) && inicio <= 20) puntaje += 1;
  return puntaje;
}

export function extraerPalabrasClave(texto = '', max = 12) {
  const ignoradas = new Set(['para', 'como', 'este', 'esta', 'esto', 'pero', 'porque', 'tiene', 'hacer', 'puede', 'video', 'vamos', 'cuando', 'donde', 'desde', 'sobre', 'entre', 'tambien', 'también', 'solo', 'todo', 'todos', 'todas', 'ellos', 'ellas', 'usted', 'ustedes']);
  const conteo = new Map();
  for (const palabra of dividirPalabras(texto)) {
    if (ignoradas.has(palabra)) continue;
    conteo.set(palabra, (conteo.get(palabra) || 0) + 1);
  }
  return [...conteo.entries()].sort((a, b) => b[1] - a[1]).slice(0, max).map(([palabra, cantidad]) => ({ palabra, cantidad }));
}

export function recortarTexto(texto = '', max = 120) {
  const limpio = String(texto || '').replace(/\s+/g, ' ').trim();
  if (limpio.length <= max) return limpio;
  return `${limpio.slice(0, max - 1).trim()}…`;
}

import { limitarNumero, normalizarTexto } from '../transcripcion.config.js';

export function limpiarTextoTranscripcion(texto = '') {
  return normalizarTexto(texto, '').replace(/\u00a0/g, ' ').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

export function dividirEnOraciones(texto = '') {
  const limpio = limpiarTextoTranscripcion(texto);
  if (!limpio) return [];
  const partes = limpio.split(/(?<=[.!?])\s+|\n+/g).map((parte) => limpiarTextoTranscripcion(parte)).filter(Boolean);
  return partes.length > 0 ? partes : [limpio];
}

export function crearBloquesPorLongitud(texto = '', opciones = {}) {
  const maxCaracteres = limitarNumero(opciones.maxCaracteres || 150, 40, 280, 150);
  const oraciones = dividirEnOraciones(texto);
  const bloques = [];
  for (const oracion of oraciones) {
    if (oracion.length <= maxCaracteres) {
      bloques.push(oracion);
      continue;
    }
    const palabras = oracion.split(' ').filter(Boolean);
    let actual = '';
    for (const palabra of palabras) {
      const candidato = actual ? `${actual} ${palabra}` : palabra;
      if (candidato.length <= maxCaracteres) actual = candidato;
      else {
        if (actual) bloques.push(actual);
        actual = palabra;
      }
    }
    if (actual) bloques.push(actual);
  }
  return bloques.filter(Boolean);
}

export function limitarTextoCompleto(texto = '', opciones = {}) {
  const maxCaracteres = limitarNumero(opciones.maxCaracteres || 18000, 1000, 50000, 18000);
  const limpio = limpiarTextoTranscripcion(texto);
  if (limpio.length <= maxCaracteres) return limpio;
  return limpio.slice(0, maxCaracteres).trim();
}

export default limpiarTextoTranscripcion;

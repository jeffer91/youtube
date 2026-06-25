import { extraerSegmentosTranscripcion, puntuarSegmento, recortarTexto } from '../utilidades-extraer-texto.js';
import { INTELIGENCIA_CONFIG } from '../inteligencia.config.js';

function obtenerTiempo(segmento, campo, respaldo = 0) {
  const valor = Number(segmento?.[campo] ?? segmento?.[campo === 'inicio' ? 'start' : 'end'] ?? respaldo);
  return Number.isFinite(valor) ? valor : respaldo;
}

export function detectarPuntosImportantes({ transcripcion = {}, opciones = {} } = {}) {
  const max = Number(opciones.maxPuntosImportantes || INTELIGENCIA_CONFIG.maxPuntosImportantes);
  const segmentos = extraerSegmentosTranscripcion(transcripcion);

  const puntos = segmentos
    .map((segmento, index) => ({
      id: `punto-${index + 1}`,
      inicio: obtenerTiempo(segmento, 'inicio', index * 3),
      fin: obtenerTiempo(segmento, 'fin', index * 3 + 3),
      texto: recortarTexto(segmento?.texto || '', 140),
      puntaje: puntuarSegmento(segmento),
      tipo: 'segmento-importante-local'
    }))
    .filter((punto) => punto.texto.length > 0)
    .sort((a, b) => b.puntaje - a.puntaje || a.inicio - b.inicio)
    .slice(0, max)
    .sort((a, b) => a.inicio - b.inicio);

  return {
    ok: true,
    estado: puntos.length ? 'DETECTADOS_LOCAL' : 'SIN_SEGMENTOS',
    cantidad: puntos.length,
    puntos
  };
}

export default detectarPuntosImportantes;

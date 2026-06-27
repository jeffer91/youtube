/*
  Bloque 2: Analisis de contexto visual
  Funcion: reunir momentos candidatos desde transcripcion, Gemini, fallback y textos flotantes.
*/

import { mapearMomentosATimeline } from './mapear-momentos-a-timeline.service.js';

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function obtenerSegmentosTranscripcion(transcripcion = {}) {
  const fuentes = [
    transcripcion?.transcripcion?.segmentos,
    transcripcion?.segmentos,
    transcripcion?.capasVideo?.segmentos
  ];
  for (const fuente of fuentes) {
    if (Array.isArray(fuente) && fuente.length > 0) return fuente;
  }
  return [];
}

function obtenerMomentosIA(transcripcion = {}) {
  const fuentes = [
    transcripcion?.gemini?.momentosImportantes,
    transcripcion?.fallback?.momentosImportantes,
    transcripcion?.textosFlotantes?.textos
  ];
  return fuentes.flatMap((fuente) => Array.isArray(fuente) ? fuente : []);
}

function obtenerMomentosDesdeSegmentos(segmentos = [], duracion = 0) {
  if (!Array.isArray(segmentos) || segmentos.length === 0) return [];
  const seleccionados = segmentos
    .map((segmento, index) => {
      const texto = String(segmento.texto || segmento.text || '').replace(/\s+/g, ' ').trim();
      const inicio = Number(segmento.inicio ?? segmento.start ?? index * 4);
      const fin = Number(segmento.fin ?? segmento.end ?? inicio + 2.4);
      const palabras = texto.split(' ').filter(Boolean).length;
      const prioridad = texto.includes('?') ? 15 : palabras >= 9 ? 25 : 45;
      return { inicio, fin, texto, prioridad, tipo: texto.includes('?') ? 'pregunta' : 'frase', motivo: 'Segmento util de transcripcion.' };
    })
    .filter((item) => item.texto.length >= 8)
    .sort((a, b) => a.prioridad - b.prioridad)
    .slice(0, 12);

  return mapearMomentosATimeline(seleccionados, { duracion, origen: 'transcripcion', maximo: 12 });
}

function crearMomentosBase(duracion = 0) {
  const total = Math.max(0, numero(duracion, 0));
  if (total <= 0) return [];
  const puntos = [1.2, total * 0.25, total * 0.50, total * 0.75].filter((punto) => punto < total - 1.2);
  return mapearMomentosATimeline(puntos.map((inicio, index) => ({ inicio, fin: inicio + 1.8, texto: index === 0 ? 'Inicio fuerte' : `Momento ${index + 1}`, prioridad: 60 + index, tipo: 'base', motivo: 'Momento base para evitar video plano.' })), { duracion: total, origen: 'base', maximo: 6 });
}

export function detectarMomentosEfecto({ transcripcion = null, entendimiento = null, duracion = 0 } = {}) {
  const duracionVideo = numero(duracion || entendimiento?.analisis?.duracionSegundos, 0);
  const momentosIA = mapearMomentosATimeline(obtenerMomentosIA(transcripcion || {}), { duracion: duracionVideo, origen: 'ia', maximo: 12 });
  const momentosTranscripcion = obtenerMomentosDesdeSegmentos(obtenerSegmentosTranscripcion(transcripcion || {}), duracionVideo);
  const momentosBase = crearMomentosBase(duracionVideo);

  const combinados = [...momentosIA, ...momentosTranscripcion, ...momentosBase]
    .sort((a, b) => a.inicio - b.inicio || a.prioridad - b.prioridad)
    .slice(0, 20);

  return {
    ok: true,
    duracion: duracionVideo,
    total: combinados.length,
    fuentes: {
      ia: momentosIA.length,
      transcripcion: momentosTranscripcion.length,
      base: momentosBase.length
    },
    momentos: combinados,
    mensaje: combinados.length > 0 ? 'Momentos de efecto detectados.' : 'No se detectaron momentos de efecto.'
  };
}

export default detectarMomentosEfecto;

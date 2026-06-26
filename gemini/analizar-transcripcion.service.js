/*
  Modulo: gemini
  Funcion: preparar analisis de transcripcion para detectar estructura, ideas y momentos.
*/

import { obtenerConfigGemini } from './gemini.config.js';

function compactarSegmentos(segmentos = [], limite = 80) {
  return segmentos.slice(0, limite).map((segmento, indice) => ({
    id: segmento.id || `seg-${indice + 1}`,
    inicio: Number(segmento.inicio ?? segmento.start ?? 0),
    fin: Number(segmento.fin ?? segmento.end ?? 0),
    texto: String(segmento.texto ?? segmento.text ?? '').trim()
  })).filter((segmento) => segmento.texto);
}

export function prepararAnalisisTranscripcion({ transcripcion = {}, perfil = {}, proyecto = {}, opciones = {} } = {}) {
  const config = obtenerConfigGemini(opciones);
  const segmentos = compactarSegmentos(transcripcion.segmentos || transcripcion.segments || []);

  return {
    ok: true,
    tarea: config.tareas.analizarTranscripcion,
    modelo: config.modelo,
    payload: {
      proyecto: { id: proyecto.id || null, nombre: proyecto.nombre || '' },
      perfil: {
        id: perfil.id || proyecto.perfil || 'general',
        nombre: perfil.nombre || 'General',
        instrucciones: perfil.instruccionesGemini || ''
      },
      segmentos,
      salidaEsperada: {
        estructura: ['hook', 'desarrollo', 'cierre'],
        momentosImportantes: true,
        frasesFuertes: true,
        silenciosOPartesDebiles: true,
        sugerenciasCorte: true
      }
    },
    instrucciones: [
      'Analiza el video como contenido de Jeff hablando a camara.',
      'Devuelve JSON con estructura, momentos importantes, frases fuertes y sugerencias de corte.',
      'Cada sugerencia debe incluir inicio, fin, motivo y prioridad.'
    ],
    creadoEn: new Date().toISOString()
  };
}

export function crearAnalisisTranscripcionFallback({ transcripcion = {}, perfil = 'general' } = {}) {
  const segmentos = compactarSegmentos(transcripcion.segmentos || transcripcion.segments || [], 20);
  const momentos = segmentos.filter((segmento) => segmento.texto.length > 45).slice(0, 8).map((segmento, indice) => ({
    id: `momento-${indice + 1}`,
    inicio: segmento.inicio,
    fin: segmento.fin,
    texto: segmento.texto,
    prioridad: indice < 3 ? 'alta' : 'media',
    motivo: 'Segmento con idea completa o frase aprovechable.'
  }));

  return {
    ok: true,
    fallback: true,
    perfil,
    estructura: { hook: segmentos[0] || null, desarrollo: segmentos.slice(1, -1), cierre: segmentos.at(-1) || null },
    momentosImportantes: momentos,
    creadoEn: new Date().toISOString()
  };
}

/*
  Nueva etapa estructural - Bloque 3
  Función: transcribir audio/video con Gemini cuando exista clave API.
*/

import fs from 'fs';
import path from 'path';
import { obtenerConfigTranscripcion } from '../transcripcion.config.js';
import { crearTranscripcionNormalizada } from './normalizar-segmentos.js';
import { limpiarJsonGemini, obtenerTextoGeminiDesdeRespuestaApi } from '../gemini/limpiar-json-gemini.js';

const MIME_POR_EXTENSION = Object.freeze({
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.mkv': 'video/x-matroska',
  '.avi': 'video/x-msvideo',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg'
});

function obtenerMime(rutaArchivo = '') {
  return MIME_POR_EXTENSION[path.extname(rutaArchivo).toLowerCase()] || 'video/mp4';
}

function crearEndpoint({ modelo, apiKey }) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelo || 'gemini-1.5-flash')}:generateContent?key=${encodeURIComponent(apiKey)}`;
}

async function fetchConTimeout(url, opcionesFetch = {}, timeoutMs = 90000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opcionesFetch, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function leerArchivoBase64(rutaArchivo, maxBytes) {
  const stats = fs.statSync(rutaArchivo);
  if (stats.size > maxBytes) {
    return { ok: false, mensaje: `Archivo demasiado grande para transcripción inline Gemini: ${(stats.size / 1024 / 1024).toFixed(1)} MB. Límite configurado: ${(maxBytes / 1024 / 1024).toFixed(1)} MB.` };
  }
  return { ok: true, base64: fs.readFileSync(rutaArchivo).toString('base64'), size: stats.size, mimeType: obtenerMime(rutaArchivo) };
}

function crearPrompt({ idioma = 'es', duracionSegundos = null } = {}) {
  return [
    'Eres un transcriptor profesional para una app de edición de video.',
    'Transcribe el audio del archivo y divide el resultado en segmentos con tiempos aproximados.',
    'Responde solamente JSON válido, sin markdown.',
    'No inventes frases. Si una parte no se entiende, usa "[inaudible]" solo en esa parte.',
    `Idioma esperado: ${idioma}.`,
    duracionSegundos ? `Duración aproximada del video: ${duracionSegundos} segundos.` : '',
    'Formato exacto esperado:',
    '{"idioma":"es","textoCompleto":"texto completo","segmentos":[{"inicio":0,"fin":3,"texto":"frase"}],"resumen":"resumen corto"}'
  ].filter(Boolean).join('\n');
}

function normalizarRespuestaGemini({ data, config, entendimiento }) {
  const segmentos = Array.isArray(data?.segmentos) ? data.segmentos : [];
  const textoCompleto = data?.textoCompleto || data?.texto || segmentos.map((item) => item.texto || item.text || '').filter(Boolean).join(' ');
  return crearTranscripcionNormalizada({
    textoCompleto,
    segmentos,
    idioma: data?.idioma || config.transcripcion.idioma,
    fuente: 'gemini-audio-video',
    duracionSegundos: entendimiento?.analisis?.duracionSegundos || null,
    opciones: { config }
  });
}

export async function transcribirConGemini({ entrada, entendimiento, fuenteAudio, opciones = {} } = {}) {
  const config = obtenerConfigTranscripcion(opciones);
  const apiKey = config.gemini.credencial;
  if (!config.gemini.usarGemini) return { ok: false, omitido: true, mensaje: 'Gemini no está activado para transcripción.' };
  if (!apiKey) return { ok: false, omitido: true, mensaje: 'No hay clave API Gemini para transcribir.' };
  if (!fuenteAudio?.ruta || !fs.existsSync(fuenteAudio.ruta)) return { ok: false, omitido: true, mensaje: 'No existe fuente de audio/video para transcripción Gemini.' };

  const maxBytes = Number(opciones.geminiMaxBytesTranscripcion || 30 * 1024 * 1024);
  const archivo = leerArchivoBase64(fuenteAudio.ruta, maxBytes);
  if (!archivo.ok) return { ok: false, omitido: true, mensaje: archivo.mensaje };

  const body = {
    contents: [{
      role: 'user',
      parts: [
        { text: crearPrompt({ idioma: config.transcripcion.idioma, duracionSegundos: entendimiento?.analisis?.duracionSegundos }) },
        { inlineData: { mimeType: archivo.mimeType, data: archivo.base64 } }
      ]
    }],
    generationConfig: {
      temperature: Number(config.gemini.temperatura || 0.2),
      maxOutputTokens: Number(opciones.geminiMaxOutputTokensTranscripcion || 8192),
      responseMimeType: 'application/json'
    }
  };

  const respuesta = await fetchConTimeout(crearEndpoint({ modelo: config.gemini.modelo, apiKey }), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }, Number(config.gemini.timeoutMs || 90000));

  const json = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(json?.error?.message || `Gemini transcripción respondió HTTP ${respuesta.status}`);
  const textoRespuesta = obtenerTextoGeminiDesdeRespuestaApi(json);
  const limpio = limpiarJsonGemini(textoRespuesta || json);
  if (!limpio.ok) throw new Error(limpio.error || 'Gemini no devolvió transcripción JSON válida.');
  const transcripcion = normalizarRespuestaGemini({ data: limpio.data, config, entendimiento });

  return {
    ...transcripcion,
    ok: transcripcion.ok,
    omitido: !transcripcion.ok,
    etapa: 'transcripcion',
    fuenteAudio,
    proyectoId: entrada?.proyecto?.id || null,
    motor: 'gemini-audio-video',
    respuestaGemini: { modelo: config.gemini.modelo, mimeType: archivo.mimeType, sizeBytes: archivo.size, resumen: limpio.data?.resumen || null },
    mensaje: transcripcion.ok ? 'Transcripción real generada con Gemini.' : 'Gemini respondió, pero no se obtuvo texto útil.'
  };
}

export default transcribirConGemini;

import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { obtenerConfigTranscripcion, MODOS_TRANSCRIPCION, normalizarTexto } from '../transcripcion.config.js';
import { resolverFuenteAudioTranscripcion } from './extraer-audio-transcripcion.service.js';
import { crearTranscripcionNormalizada } from './normalizar-segmentos.js';
import { transcribirConGemini } from './transcribir-gemini.service.js';

function resolverRutaFfmpeg() {
  return typeof ffmpegStatic === 'string' ? ffmpegStatic : ffmpegStatic?.path;
}

const rutaFfmpeg = resolverRutaFfmpeg();
if (rutaFfmpeg) ffmpeg.setFfmpegPath(rutaFfmpeg);

function obtenerTextoManual(opciones = {}, config) {
  return normalizarTexto(opciones.textoTranscripcionManual || opciones.transcripcionManual || opciones.textoManual || config.transcripcion.textoManualPorDefecto || '', '');
}

function obtenerSegmentosManual(opciones = {}) {
  if (Array.isArray(opciones.segmentosTranscripcion)) return opciones.segmentosTranscripcion;
  if (Array.isArray(opciones.transcripcionSegmentos)) return opciones.transcripcionSegmentos;
  return [];
}

function transcripcionVacia({ entrada, fuenteAudio, config, motivo }) {
  return { ok: true, omitido: true, etapa: 'transcripcion', fuente: 'sin-transcripcion-real', idioma: config.transcripcion.idioma, textoCompleto: '', segmentos: [], cantidadSegmentos: 0, duracionSegundos: null, fuenteAudio, proyectoId: entrada?.proyecto?.id || null, mensaje: motivo, creadoEn: new Date().toISOString() };
}

function archivoValido(rutaArchivo) {
  try {
    return Boolean(rutaArchivo && fs.existsSync(rutaArchivo) && fs.statSync(rutaArchivo).size > 1024);
  } catch (_error) {
    return false;
  }
}

function necesitaFuenteLigeraParaGemini(fuenteAudio, config) {
  if (!config?.gemini?.usarGemini || !config?.gemini?.credencial) return false;
  return fuenteAudio?.ok && fuenteAudio?.tipo === 'video-original' && archivoValido(fuenteAudio.ruta);
}

function extraerAudioLigero({ origen, destino }) {
  return new Promise((resolve, reject) => {
    if (!rutaFfmpeg) {
      reject(new Error('No se encontró FFmpeg para preparar audio de transcripción.'));
      return;
    }

    ffmpeg(origen)
      .noVideo()
      .audioCodec('aac')
      .audioChannels(1)
      .audioFrequency(16000)
      .audioBitrate('48k')
      .outputOptions(['-movflags', '+faststart'])
      .output(destino)
      .on('end', () => resolve(destino))
      .on('error', (error) => reject(error))
      .run();
  });
}

async function prepararFuenteGemini({ entrada, fuenteAudio, config }) {
  if (!necesitaFuenteLigeraParaGemini(fuenteAudio, config)) return fuenteAudio;

  const carpetaProyecto = entrada?.rutas?.carpetaProyecto;
  if (!carpetaProyecto) return fuenteAudio;

  const carpetaTranscripcion = path.join(carpetaProyecto, 'transcripcion');
  const destino = path.join(carpetaTranscripcion, 'audio-transcripcion-gemini.m4a');

  try {
    await fs.promises.mkdir(carpetaTranscripcion, { recursive: true });
    if (!archivoValido(destino)) await extraerAudioLigero({ origen: fuenteAudio.ruta, destino });
    if (!archivoValido(destino)) return fuenteAudio;
    return {
      ok: true,
      tipo: 'audio-extraido-gemini',
      ruta: destino,
      rutaVideoOriginal: fuenteAudio.ruta,
      mensaje: 'Se extrajo audio ligero para transcripción real con Gemini.'
    };
  } catch (error) {
    console.warn('[transcripcion] No se pudo extraer audio ligero para Gemini:', error.message);
    return {
      ...fuenteAudio,
      advertenciaAudioLigero: error.message,
      mensaje: `${fuenteAudio.mensaje || 'Se usará fuente original.'} No se pudo generar audio ligero: ${error.message}`
    };
  }
}

export async function transcribirVideo({ entrada, entendimiento, audio = null, opciones = {} } = {}) {
  const config = obtenerConfigTranscripcion(opciones);
  if (!config.transcripcion.crearTranscripcion) return transcripcionVacia({ entrada, fuenteAudio: null, config, motivo: 'La transcripción está desactivada.' });

  let fuenteAudio = resolverFuenteAudioTranscripcion({ entrada, audio, opciones: { usarAudioMejoradoSiExiste: config.transcripcion.usarAudioMejoradoSiExiste } });
  if (!fuenteAudio.ok) return transcripcionVacia({ entrada, fuenteAudio, config, motivo: fuenteAudio.mensaje });

  const textoManual = obtenerTextoManual(opciones, config);
  const segmentosManuales = obtenerSegmentosManual(opciones);
  if (textoManual || segmentosManuales.length > 0) {
    const transcripcion = crearTranscripcionNormalizada({ textoCompleto: textoManual, segmentos: segmentosManuales, idioma: config.transcripcion.idioma, fuente: 'manual', duracionSegundos: entendimiento?.analisis?.duracionSegundos || null, opciones: { config } });
    return { ...transcripcion, ok: true, omitido: false, etapa: 'transcripcion', fuenteAudio, proyectoId: entrada?.proyecto?.id || null, mensaje: 'Transcripción manual normalizada correctamente.' };
  }

  if (!entendimiento?.analisis?.tieneAudio) {
    return transcripcionVacia({ entrada, fuenteAudio, config, motivo: 'El análisis técnico no detectó audio en el video.' });
  }

  if (config.gemini.usarGemini && config.gemini.credencial) {
    try {
      fuenteAudio = await prepararFuenteGemini({ entrada, fuenteAudio, config });
      const transcripcionGemini = await transcribirConGemini({ entrada, entendimiento, fuenteAudio, opciones });
      if (transcripcionGemini?.ok && !transcripcionGemini.omitido && transcripcionGemini.textoCompleto) return transcripcionGemini;
      if (!config.gemini.permitirFallbackLocal) return transcripcionGemini;
      return transcripcionVacia({ entrada, fuenteAudio, config, motivo: transcripcionGemini?.mensaje || 'Gemini no devolvió texto útil.' });
    } catch (error) {
      if (!config.gemini.permitirFallbackLocal) throw error;
      return transcripcionVacia({ entrada, fuenteAudio, config, motivo: `Gemini no pudo transcribir y se usó fallback controlado: ${error.message}` });
    }
  }

  if (config.transcripcion.modoTranscripcion === MODOS_TRANSCRIPCION.MANUAL) return transcripcionVacia({ entrada, fuenteAudio, config, motivo: 'Modo manual activo, pero no se recibió texto manual de transcripción ni Gemini activo.' });
  return transcripcionVacia({ entrada, fuenteAudio, config, motivo: `Modo ${config.transcripcion.modoTranscripcion} preparado, pero todavía no tiene motor real conectado.` });
}

export default transcribirVideo;

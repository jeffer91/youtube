import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { asegurarCarpeta, escribirJson } from '../../comun/archivos.js';

export const AUDIO_MOTORES_TRANSCRIPCION_CONFIG = Object.freeze({
  version: '1.0.0-audio-motores',
  carpeta: 'transcripciones/audio',
  archivoAudio: 'audio-motores.wav',
  archivoMetadata: 'audio-motores.json',
  formato: 'wav',
  codec: 'pcm_s16le',
  sampleRate: 16000,
  canales: 1,
  reutilizarSiExiste: true
});

function resolverRutaFfmpeg() {
  return typeof ffmpegStatic === 'string' ? ffmpegStatic : ffmpegStatic?.path;
}

const rutaFfmpeg = resolverRutaFfmpeg();
if (rutaFfmpeg) ffmpeg.setFfmpegPath(rutaFfmpeg);

function existeArchivoValido(rutaArchivo) {
  try {
    return Boolean(rutaArchivo && fs.existsSync(rutaArchivo) && fs.statSync(rutaArchivo).size > 1024);
  } catch (_error) {
    return false;
  }
}

function obtenerPesoArchivo(rutaArchivo) {
  try {
    return fs.statSync(rutaArchivo).size;
  } catch (_error) {
    return 0;
  }
}

function texto(valor, respaldo = '') {
  const limpio = String(valor || '').trim();
  return limpio || respaldo;
}

function obtenerCarpetaProyecto(entrada) {
  const carpeta = entrada?.rutas?.carpetaProyecto;
  if (!carpeta) throw new Error('No se puede preparar audio de motores porque falta carpetaProyecto.');
  return carpeta;
}

export function obtenerCarpetaAudioMotoresTranscripcion(entrada) {
  return path.join(obtenerCarpetaProyecto(entrada), AUDIO_MOTORES_TRANSCRIPCION_CONFIG.carpeta);
}

export function obtenerRutaAudioMotoresTranscripcion(entrada) {
  return path.join(obtenerCarpetaAudioMotoresTranscripcion(entrada), AUDIO_MOTORES_TRANSCRIPCION_CONFIG.archivoAudio);
}

export function obtenerRutaMetadataAudioMotoresTranscripcion(entrada) {
  return path.join(obtenerCarpetaAudioMotoresTranscripcion(entrada), AUDIO_MOTORES_TRANSCRIPCION_CONFIG.archivoMetadata);
}

export function resolverFuenteAudioMotoresTranscripcion({ entrada, audio = null, opciones = {} } = {}) {
  const fuentes = [
    { tipo: 'opciones', ruta: opciones.rutaFuenteAudio || opciones.rutaAudioTranscripcion || '' },
    { tipo: 'audio-mejorado', ruta: audio?.rutaAudioMejorado || audio?.ruta || '' },
    { tipo: 'video-original', ruta: entrada?.video?.rutaOriginal || entrada?.rutas?.rutaVideoOriginal || '' }
  ];

  const encontrada = fuentes.find((fuente) => existeArchivoValido(fuente.ruta));

  if (!encontrada) {
    return {
      ok: false,
      tipo: 'sin-fuente',
      ruta: null,
      mensaje: 'No existe una fuente válida para preparar audio de motores.'
    };
  }

  return {
    ok: true,
    tipo: encontrada.tipo,
    ruta: encontrada.ruta,
    extension: path.extname(encontrada.ruta).toLowerCase(),
    pesoBytes: obtenerPesoArchivo(encontrada.ruta),
    mensaje: `Fuente de audio detectada: ${encontrada.tipo}.`
  };
}

function convertirAudioMotores({ rutaEntrada, rutaSalida }) {
  return new Promise((resolve, reject) => {
    if (!rutaFfmpeg) {
      reject(new Error('No se encontró FFmpeg para preparar audio de transcripción.'));
      return;
    }

    ffmpeg(rutaEntrada)
      .noVideo()
      .audioCodec(AUDIO_MOTORES_TRANSCRIPCION_CONFIG.codec)
      .audioFrequency(AUDIO_MOTORES_TRANSCRIPCION_CONFIG.sampleRate)
      .audioChannels(AUDIO_MOTORES_TRANSCRIPCION_CONFIG.canales)
      .format(AUDIO_MOTORES_TRANSCRIPCION_CONFIG.formato)
      .outputOptions(['-vn'])
      .output(rutaSalida)
      .on('end', () => resolve(rutaSalida))
      .on('error', (error) => reject(error))
      .run();
  });
}

function crearMetadataAudioMotores({ entrada, fuente, rutaAudio, reutilizado = false, error = null }) {
  const ok = existeArchivoValido(rutaAudio) && !error;
  return {
    ok,
    version: AUDIO_MOTORES_TRANSCRIPCION_CONFIG.version,
    tipo: 'audio-motores-transcripcion',
    proyectoId: entrada?.proyecto?.id || null,
    proyectoNombre: entrada?.proyecto?.nombre || null,
    reutilizado: Boolean(reutilizado),
    fuente,
    audio: {
      ruta: rutaAudio,
      formato: AUDIO_MOTORES_TRANSCRIPCION_CONFIG.formato,
      codec: AUDIO_MOTORES_TRANSCRIPCION_CONFIG.codec,
      sampleRate: AUDIO_MOTORES_TRANSCRIPCION_CONFIG.sampleRate,
      canales: AUDIO_MOTORES_TRANSCRIPCION_CONFIG.canales,
      pesoBytes: obtenerPesoArchivo(rutaAudio)
    },
    error: error ? { mensaje: error.message || String(error) } : null,
    creadoEn: new Date().toISOString()
  };
}

export async function prepararAudioMotoresTranscripcion({ entrada, audio = null, opciones = {} } = {}) {
  const carpetaAudio = obtenerCarpetaAudioMotoresTranscripcion(entrada);
  const rutaAudio = obtenerRutaAudioMotoresTranscripcion(entrada);
  const rutaMetadata = obtenerRutaMetadataAudioMotoresTranscripcion(entrada);
  const forzar = opciones.forzarPrepararAudioMotores === true || opciones.forzar === true;
  const reutilizar = opciones.reutilizarAudioMotores !== false && AUDIO_MOTORES_TRANSCRIPCION_CONFIG.reutilizarSiExiste;

  asegurarCarpeta(carpetaAudio);

  const fuente = resolverFuenteAudioMotoresTranscripcion({ entrada, audio, opciones });
  if (!fuente.ok) {
    const metadata = crearMetadataAudioMotores({ entrada, fuente, rutaAudio, error: new Error(fuente.mensaje) });
    await escribirJson(rutaMetadata, { ...metadata, rutaMetadata });
    return { ...metadata, rutaMetadata, mensaje: fuente.mensaje };
  }

  if (!forzar && reutilizar && existeArchivoValido(rutaAudio)) {
    const metadata = crearMetadataAudioMotores({ entrada, fuente, rutaAudio, reutilizado: true });
    await escribirJson(rutaMetadata, { ...metadata, rutaMetadata });
    return { ...metadata, rutaMetadata, mensaje: 'Audio de motores reutilizado correctamente.' };
  }

  try {
    await convertirAudioMotores({ rutaEntrada: fuente.ruta, rutaSalida: rutaAudio });
    const metadata = crearMetadataAudioMotores({ entrada, fuente, rutaAudio, reutilizado: false });
    await escribirJson(rutaMetadata, { ...metadata, rutaMetadata });
    return { ...metadata, rutaMetadata, mensaje: 'Audio único para motores preparado correctamente.' };
  } catch (error) {
    const metadata = crearMetadataAudioMotores({ entrada, fuente, rutaAudio, error });
    await escribirJson(rutaMetadata, { ...metadata, rutaMetadata });
    return { ...metadata, rutaMetadata, mensaje: `No se pudo preparar audio único para motores: ${error.message}` };
  }
}

export async function cargarMetadataAudioMotoresTranscripcion(entrada) {
  const rutaMetadata = obtenerRutaMetadataAudioMotoresTranscripcion(entrada);
  try {
    const contenido = await fs.promises.readFile(rutaMetadata, 'utf-8');
    return JSON.parse(contenido);
  } catch (_error) {
    return null;
  }
}

export function crearFuenteAudioParaMotor({ entrada, metadata = null } = {}) {
  const rutaAudio = metadata?.audio?.ruta || obtenerRutaAudioMotoresTranscripcion(entrada);
  return {
    ok: existeArchivoValido(rutaAudio),
    tipo: 'audio-motores',
    ruta: rutaAudio,
    formato: AUDIO_MOTORES_TRANSCRIPCION_CONFIG.formato,
    codec: AUDIO_MOTORES_TRANSCRIPCION_CONFIG.codec,
    sampleRate: AUDIO_MOTORES_TRANSCRIPCION_CONFIG.sampleRate,
    canales: AUDIO_MOTORES_TRANSCRIPCION_CONFIG.canales,
    mensaje: texto(metadata?.mensaje, 'Fuente de audio normalizada para motores de transcripción.')
  };
}

export default prepararAudioMotoresTranscripcion;

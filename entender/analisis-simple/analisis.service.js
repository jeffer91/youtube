/*
  Nombre completo: analisis.service.js
  Ruta o ubicación: AutoVideoJeff/entender/analisis-simple/analisis.service.js
  Función:
    - Leer información técnica básica del video.
    - Usar FFprobe cuando esté disponible.
    - Detectar duración, ancho, alto, fps, orientación, codecs y audio.
    - Guardar analisis-simple.json dentro del proyecto.
    - Si FFprobe falla, devolver análisis básico con advertencia explícita.
*/

import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffprobeStatic from 'ffprobe-static';
import { escribirJson } from '../../comun/archivos.js';

function resolverRutaFfprobe() {
  return typeof ffprobeStatic === 'string' ? ffprobeStatic : ffprobeStatic?.path;
}

const rutaFfprobe = resolverRutaFfprobe();

if (rutaFfprobe) {
  ffmpeg.setFfprobePath(rutaFfprobe);
}

function calcularOrientacion(ancho, alto) {
  if (!ancho || !alto) return 'desconocida';
  if (alto > ancho) return 'vertical';
  if (ancho > alto) return 'horizontal';
  return 'cuadrada';
}

function obtenerFps(stream) {
  const ratio = stream?.avg_frame_rate || stream?.r_frame_rate;

  if (!ratio || ratio === '0/0') return null;

  const [numerador, denominador] = String(ratio).split('/').map(Number);

  if (!numerador || !denominador) return null;

  return Number((numerador / denominador).toFixed(2));
}

function normalizarNumero(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function leerMetadataConFfprobe(rutaVideo) {
  return new Promise((resolve, reject) => {
    if (!rutaFfprobe) {
      reject(new Error('No se encontró la ruta del binario FFprobe.'));
      return;
    }

    ffmpeg.ffprobe(rutaVideo, (error, metadata) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(metadata);
    });
  });
}

function crearAnalisisBasicoDesdeArchivo(rutaVideo, advertencia = null) {
  const stats = fs.statSync(rutaVideo);

  return {
    ok: true,
    etapa: 'entender',
    metodo: 'archivo-basico',
    duracionSegundos: null,
    ancho: null,
    alto: null,
    fps: null,
    orientacion: 'desconocida',
    pesoBytes: stats.size,
    formato: path.extname(rutaVideo).replace('.', '').toLowerCase() || null,
    codecVideo: null,
    codecAudio: null,
    tieneAudio: false,
    tieneVideo: true,
    advertencias: advertencia ? [advertencia] : []
  };
}

function extraerAnalisisDesdeMetadata(rutaVideo, metadata) {
  const streamVideo = metadata?.streams?.find((stream) => stream.codec_type === 'video') || null;
  const streamAudio = metadata?.streams?.find((stream) => stream.codec_type === 'audio') || null;

  const ancho = normalizarNumero(streamVideo?.width || streamVideo?.coded_width);
  const alto = normalizarNumero(streamVideo?.height || streamVideo?.coded_height);
  const duracion =
    normalizarNumero(metadata?.format?.duration) ||
    normalizarNumero(streamVideo?.duration) ||
    null;

  const stats = fs.statSync(rutaVideo);

  return {
    ok: true,
    etapa: 'entender',
    metodo: 'ffprobe',
    duracionSegundos: duracion !== null ? Number(duracion.toFixed(2)) : null,
    ancho,
    alto,
    fps: obtenerFps(streamVideo),
    orientacion: calcularOrientacion(ancho, alto),
    pesoBytes: normalizarNumero(metadata?.format?.size) || stats.size,
    formato: metadata?.format?.format_name || null,
    codecVideo: streamVideo?.codec_name || null,
    codecAudio: streamAudio?.codec_name || null,
    tieneAudio: Boolean(streamAudio),
    tieneVideo: Boolean(streamVideo),
    advertencias: streamVideo ? [] : ['FFprobe no encontró stream de video.']
  };
}

async function guardarAnalisisSiEsPosible(entrada, analisis) {
  const carpetaProyecto = entrada?.rutas?.carpetaProyecto;

  if (!carpetaProyecto) {
    return null;
  }

  const rutaAnalisis = path.join(carpetaProyecto, 'analisis-simple.json');

  await escribirJson(rutaAnalisis, {
    ...analisis,
    guardadoEn: new Date().toISOString()
  });

  return rutaAnalisis;
}

export async function analizarVideoSimple(entrada) {
  const rutaVideo = entrada?.video?.rutaOriginal;

  if (!rutaVideo) {
    throw new Error('No se puede analizar el video porque falta la ruta original.');
  }

  if (!fs.existsSync(rutaVideo)) {
    throw new Error(`No se puede analizar el video porque no existe: ${rutaVideo}`);
  }

  let analisis;

  try {
    const metadata = await leerMetadataConFfprobe(rutaVideo);
    analisis = extraerAnalisisDesdeMetadata(rutaVideo, metadata);
  } catch (error) {
    analisis = crearAnalisisBasicoDesdeArchivo(
      rutaVideo,
      `FFprobe no pudo leer metadata completa: ${error.message}`
    );
  }

  const rutaAnalisis = await guardarAnalisisSiEsPosible(entrada, analisis);

  return {
    ...analisis,
    rutaAnalisis
  };
}
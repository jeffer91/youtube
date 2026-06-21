/*
  Nombre completo: analisis.service.js
  Ruta o ubicación: AutoVideoJeff/entender/analisis-simple/analisis.service.js
  Función o funciones:
    - Leer información técnica básica del video.
    - Detectar duración, ancho, alto, fps aproximado y orientación.
    - Usar ffprobe cuando esté disponible.
    - Devolver datos simples para que el editor decida cómo preparar el formato TikTok.
  Con qué se conecta:
    - entender/entender.conexion.js
    - entrada/subir-simple/subir.service.js
    - datos/proyectos/
*/

import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffprobeStatic from 'ffprobe-static';

ffmpeg.setFfprobePath(ffprobeStatic.path);

function calcularOrientacion(ancho, alto) {
  if (!ancho || !alto) return 'desconocida';
  if (alto > ancho) return 'vertical';
  if (ancho > alto) return 'horizontal';
  return 'cuadrada';
}

function obtenerFps(stream) {
  const ratio = stream?.avg_frame_rate || stream?.r_frame_rate;

  if (!ratio || ratio === '0/0') return null;

  const [numerador, denominador] = ratio.split('/').map(Number);

  if (!numerador || !denominador) return null;

  return Number((numerador / denominador).toFixed(2));
}

function leerMetadataConFfprobe(rutaVideo) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(rutaVideo, (error, metadata) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(metadata);
    });
  });
}

function crearAnalisisBasicoDesdeArchivo(rutaVideo) {
  const stats = fs.statSync(rutaVideo);

  return {
    metodo: 'archivo-basico',
    duracionSegundos: null,
    ancho: null,
    alto: null,
    fps: null,
    orientacion: 'desconocida',
    pesoBytes: stats.size,
    formato: null,
    tieneAudio: null,
    tieneVideo: true,
    advertencias: [
      'No se pudo leer metadata avanzada con ffprobe. Se guardó análisis básico del archivo.'
    ]
  };
}

export async function analizarVideoSimple(entrada) {
  const rutaVideo = entrada.video.rutaOriginal;

  try {
    const metadata = await leerMetadataConFfprobe(rutaVideo);
    const streamVideo = metadata.streams?.find((stream) => stream.codec_type === 'video');
    const streamAudio = metadata.streams?.find((stream) => stream.codec_type === 'audio');
    const ancho = streamVideo?.width || null;
    const alto = streamVideo?.height || null;

    return {
      metodo: 'ffprobe',
      duracionSegundos: metadata.format?.duration ? Number(metadata.format.duration.toFixed(2)) : null,
      ancho,
      alto,
      fps: obtenerFps(streamVideo),
      orientacion: calcularOrientacion(ancho, alto),
      pesoBytes: metadata.format?.size ? Number(metadata.format.size) : fs.statSync(rutaVideo).size,
      formato: metadata.format?.format_name || null,
      codecVideo: streamVideo?.codec_name || null,
      codecAudio: streamAudio?.codec_name || null,
      tieneAudio: Boolean(streamAudio),
      tieneVideo: Boolean(streamVideo),
      advertencias: []
    };
  } catch (_error) {
    return crearAnalisisBasicoDesdeArchivo(rutaVideo);
  }
}

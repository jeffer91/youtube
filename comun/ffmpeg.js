/*
  Nombre completo: ffmpeg.js
  Ruta o ubicación: AutoVideoJeff/comun/ffmpeg.js
  Función o funciones:
    - Centralizar el uso de FFmpeg en toda la app.
    - Configurar ffmpeg-static y ffprobe-static.
    - Ejecutar la generación final del video usando un filtro de video.
    - Limpiar audio con filtros seguros de FFmpeg.
    - Permitir exportar video usando el audio original o un audio mejorado externo.
    - Validar binarios antes de exportar para detectar errores reales en Electron.
  Con qué se conecta:
    - entender/analisis-simple/analisis.service.js
    - audio/limpieza-simple/limpieza-audio.service.js
    - salida/exportar-simple/exportar.service.js
*/

import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';

function resolverRutaFfmpeg() {
  return typeof ffmpegStatic === 'string' ? ffmpegStatic : ffmpegStatic?.path;
}

function resolverRutaFfprobe() {
  return typeof ffprobeStatic === 'string' ? ffprobeStatic : ffprobeStatic?.path;
}

const rutaFfmpeg = resolverRutaFfmpeg();
const rutaFfprobe = resolverRutaFfprobe();

function configurarFfmpeg() {
  if (!rutaFfmpeg) {
    throw new Error('No se encontró el binario de FFmpeg. Reinstala dependencias con npm install.');
  }

  if (!rutaFfprobe) {
    throw new Error('No se encontró el binario de FFprobe. Reinstala dependencias con npm install.');
  }

  ffmpeg.setFfmpegPath(rutaFfmpeg);
  ffmpeg.setFfprobePath(rutaFfprobe);
}

configurarFfmpeg();

function validarArchivoEntrada(rutaArchivo, etiqueta) {
  if (!rutaArchivo || typeof rutaArchivo !== 'string') {
    throw new Error(`No se indicó ruta para ${etiqueta}.`);
  }

  if (!fs.existsSync(rutaArchivo)) {
    throw new Error(`No existe ${etiqueta}: ${rutaArchivo}`);
  }
}

function validarRutaSalida(rutaSalida, etiqueta = 'salida') {
  if (!rutaSalida || typeof rutaSalida !== 'string') {
    throw new Error(`No se indicó ruta de ${etiqueta} para FFmpeg.`);
  }
}

export function validarBinariosFfmpeg() {
  const resultado = {
    ok: true,
    ffmpegPath: rutaFfmpeg,
    ffprobePath: rutaFfprobe,
    errores: []
  };

  if (!rutaFfmpeg || !fs.existsSync(rutaFfmpeg)) {
    resultado.ok = false;
    resultado.errores.push('FFmpeg no existe en la ruta configurada.');
  }

  if (!rutaFfprobe || !fs.existsSync(rutaFfprobe)) {
    resultado.ok = false;
    resultado.errores.push('FFprobe no existe en la ruta configurada.');
  }

  return resultado;
}

function validarFfmpegListo() {
  const validacion = validarBinariosFfmpeg();

  if (!validacion.ok) {
    throw new Error(`FFmpeg no está listo: ${validacion.errores.join(' ')}`);
  }
}

export function limpiarAudioConFfmpeg({
  rutaEntrada,
  rutaSalida,
  filtroAudio,
  codecAudio = 'aac',
  audioBitrate = '192k',
  frecuenciaMuestreo = 48000,
  canales = 2
}) {
  return new Promise((resolve, reject) => {
    try {
      validarFfmpegListo();
      validarArchivoEntrada(rutaEntrada, 'el video de entrada para limpiar audio');
      validarRutaSalida(rutaSalida, 'audio limpio');

      if (!filtroAudio || typeof filtroAudio !== 'string') {
        throw new Error('No se indicó filtro de audio para FFmpeg.');
      }

      const comando = ffmpeg(rutaEntrada)
        .noVideo()
        .audioFilters(filtroAudio)
        .audioCodec(codecAudio)
        .audioBitrate(audioBitrate)
        .audioFrequency(frecuenciaMuestreo)
        .audioChannels(canales)
        .outputOptions([
          '-map 0:a:0?',
          '-vn',
          '-movflags +faststart'
        ])
        .on('end', () => {
          resolve({
            ok: true,
            rutaSalida
          });
        })
        .on('error', (error) => {
          reject(new Error(`FFmpeg no pudo limpiar el audio: ${error.message}`));
        });

      comando.save(rutaSalida);
    } catch (error) {
      reject(error);
    }
  });
}

export function exportarConFfmpeg({
  rutaEntrada,
  rutaSalida,
  filtroVideo,
  rutaAudioExterno = null,
  codecVideo = 'libx264',
  codecAudio = 'aac',
  crf = 23,
  presetFfmpeg = 'veryfast',
  audioBitrate = '160k'
}) {
  return new Promise((resolve, reject) => {
    try {
      validarFfmpegListo();
      validarArchivoEntrada(rutaEntrada, 'el video de entrada');
      validarRutaSalida(rutaSalida, 'salida de video');

      if (!filtroVideo) {
        throw new Error('No se indicó filtro de video para FFmpeg.');
      }

      const usarAudioExterno = Boolean(rutaAudioExterno);

      if (usarAudioExterno) {
        validarArchivoEntrada(rutaAudioExterno, 'el audio mejorado externo');
      }

      const comando = ffmpeg(rutaEntrada);

      if (usarAudioExterno) {
        comando.input(rutaAudioExterno);
      }

      const opcionesSalida = [
        '-map 0:v:0',
        usarAudioExterno ? '-map 1:a:0' : '-map 0:a?',
        `-c:v ${codecVideo}`,
        `-preset ${presetFfmpeg}`,
        `-crf ${crf}`,
        `-c:a ${codecAudio}`,
        `-b:a ${audioBitrate}`,
        '-movflags +faststart',
        '-pix_fmt yuv420p',
        '-shortest'
      ];

      comando
        .videoFilters(filtroVideo)
        .outputOptions(opcionesSalida)
        .on('end', () => {
          resolve({
            ok: true,
            rutaSalida,
            audioUsado: usarAudioExterno ? 'mejorado' : 'original'
          });
        })
        .on('error', (error) => {
          reject(new Error(`FFmpeg no pudo generar el video: ${error.message}`));
        })
        .save(rutaSalida);
    } catch (error) {
      reject(error);
    }
  });
}

export function obtenerInfoFfmpeg() {
  const validacion = validarBinariosFfmpeg();

  return {
    ffmpegPath: rutaFfmpeg,
    ffprobePath: rutaFfprobe,
    configurado: validacion.ok,
    errores: validacion.errores
  };
}
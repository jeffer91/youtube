/*
  Nombre completo: analizar-audio.service.js
  Ruta o ubicación: AutoVideoJeff/audio/audio-inteligente/analizar-audio.service.js
  Función o funciones:
    - Analizar el audio real de un video antes de limpiarlo.
    - Obtener metadata de audio con FFprobe.
    - Medir volumen medio y volumen máximo con FFmpeg volumedetect.
    - Detectar silencios con FFmpeg silencedetect.
    - Generar señales para que el clasificador elija el mejor perfil de mejora.
  Con qué se conecta:
    - audio/audio-inteligente/audio-inteligente.config.js
    - audio/audio-inteligente/clasificar-audio.service.js
    - audio/audio-inteligente/audio-inteligente.service.js
    - comun/ffmpeg.js
*/

import fs from 'fs';
import { spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import { obtenerConfigAudioInteligente } from './audio-inteligente.config.js';

function resolverRutaBinario(valorBinario) {
  return typeof valorBinario === 'string' ? valorBinario : valorBinario?.path;
}

const RUTA_FFMPEG = resolverRutaBinario(ffmpegStatic);
const RUTA_FFPROBE = resolverRutaBinario(ffprobeStatic);

function validarArchivoAnalisis(rutaEntrada) {
  if (!rutaEntrada || typeof rutaEntrada !== 'string') {
    throw new Error('No se indicó la ruta del video o audio para analizar.');
  }

  if (!fs.existsSync(rutaEntrada)) {
    throw new Error(`No existe el archivo para analizar audio: ${rutaEntrada}`);
  }
}

function validarBinarios() {
  if (!RUTA_FFMPEG || !fs.existsSync(RUTA_FFMPEG)) {
    throw new Error('No se encontró FFmpeg para analizar audio. Reinstala dependencias con npm install.');
  }

  if (!RUTA_FFPROBE || !fs.existsSync(RUTA_FFPROBE)) {
    throw new Error('No se encontró FFprobe para analizar audio. Reinstala dependencias con npm install.');
  }
}

function ejecutarBinario({ binario, args, timeoutMs }) {
  return new Promise((resolve, reject) => {
    const proceso = spawn(binario, args, {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    let terminadoPorTimeout = false;

    const timer = setTimeout(() => {
      terminadoPorTimeout = true;
      proceso.kill('SIGKILL');
    }, timeoutMs);

    proceso.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf-8');
    });

    proceso.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf-8');
    });

    proceso.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });

    proceso.on('close', (codigo) => {
      clearTimeout(timer);

      if (terminadoPorTimeout) {
        reject(new Error('El análisis de audio tardó demasiado y fue cancelado.'));
        return;
      }

      resolve({ codigo, stdout, stderr });
    });
  });
}

function parsearNumero(valor, respaldo = null) {
  const numero = Number.parseFloat(valor);
  return Number.isFinite(numero) ? numero : respaldo;
}

function redondear(valor, decimales = 2) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return null;
  }

  const factor = 10 ** decimales;
  return Math.round(numero * factor) / factor;
}

function extraerPrimerAudio(metadata) {
  const streams = Array.isArray(metadata?.streams) ? metadata.streams : [];
  return streams.find((stream) => stream.codec_type === 'audio') || streams[0] || null;
}

async function leerMetadataAudio(rutaEntrada, config) {
  const resultado = await ejecutarBinario({
    binario: RUTA_FFPROBE,
    timeoutMs: config.analisis.timeoutMs,
    args: [
      '-v', 'error',
      '-select_streams', 'a:0',
      '-show_entries', 'stream=index,codec_type,codec_name,channels,channel_layout,sample_rate,bit_rate,duration:format=duration,bit_rate',
      '-of', 'json',
      rutaEntrada
    ]
  });

  if (resultado.codigo !== 0 && !resultado.stdout) {
    return {
      tieneAudio: false,
      stream: null,
      format: null,
      error: resultado.stderr || 'FFprobe no pudo leer audio.'
    };
  }

  try {
    const metadata = JSON.parse(resultado.stdout || '{}');
    const stream = extraerPrimerAudio(metadata);

    if (!stream) {
      return {
        tieneAudio: false,
        stream: null,
        format: metadata.format || null,
        error: null
      };
    }

    const duracionStream = parsearNumero(stream.duration, null);
    const duracionFormato = parsearNumero(metadata.format?.duration, null);

    return {
      tieneAudio: true,
      stream,
      format: metadata.format || null,
      codec: stream.codec_name || null,
      canales: Number.parseInt(stream.channels, 10) || null,
      layoutCanales: stream.channel_layout || null,
      frecuenciaMuestreo: Number.parseInt(stream.sample_rate, 10) || null,
      bitrate: Number.parseInt(stream.bit_rate || metadata.format?.bit_rate, 10) || null,
      duracionSegundos: redondear(duracionStream || duracionFormato || 0, 3),
      error: null
    };
  } catch (error) {
    return {
      tieneAudio: false,
      stream: null,
      format: null,
      error: `No se pudo interpretar metadata de audio: ${error.message}`
    };
  }
}

function parsearVolumen(stderr) {
  const meanMatch = stderr.match(/mean_volume:\s*(-?\d+(?:\.\d+)?)\s*dB/i);
  const maxMatch = stderr.match(/max_volume:\s*(-?\d+(?:\.\d+)?)\s*dB/i);

  return {
    volumenMedioDb: parsearNumero(meanMatch?.[1], null),
    volumenMaximoDb: parsearNumero(maxMatch?.[1], null)
  };
}

async function medirVolumen(rutaEntrada, config) {
  const resultado = await ejecutarBinario({
    binario: RUTA_FFMPEG,
    timeoutMs: config.analisis.timeoutMs,
    args: [
      '-hide_banner',
      '-nostdin',
      '-i', rutaEntrada,
      '-vn',
      '-af', 'volumedetect',
      '-f', 'null',
      '-'
    ]
  });

  const volumen = parsearVolumen(resultado.stderr || '');

  return {
    ...volumen,
    codigo: resultado.codigo,
    disponible: volumen.volumenMedioDb !== null || volumen.volumenMaximoDb !== null
  };
}

function parsearSilencios(stderr) {
  const lineas = String(stderr || '').split(/\r?\n/g);
  const silencios = [];
  let silencioActual = null;

  for (const linea of lineas) {
    const inicio = linea.match(/silence_start:\s*([0-9.]+)/i);
    const fin = linea.match(/silence_end:\s*([0-9.]+)\s*\|\s*silence_duration:\s*([0-9.]+)/i);

    if (inicio) {
      silencioActual = {
        inicio: parsearNumero(inicio[1], 0),
        fin: null,
        duracion: null
      };
    }

    if (fin) {
      const registro = silencioActual || {};
      registro.fin = parsearNumero(fin[1], null);
      registro.duracion = parsearNumero(fin[2], null);
      silencios.push(registro);
      silencioActual = null;
    }
  }

  return silencios.filter((silencio) => Number.isFinite(silencio.duracion));
}

async function detectarSilencios(rutaEntrada, config) {
  const noise = config.analisis.silencioNoiseDb;
  const duracion = config.analisis.silencioDuracionMinimaSeg;

  const resultado = await ejecutarBinario({
    binario: RUTA_FFMPEG,
    timeoutMs: config.analisis.timeoutMs,
    args: [
      '-hide_banner',
      '-nostdin',
      '-i', rutaEntrada,
      '-vn',
      '-af', `silencedetect=noise=${noise}dB:d=${duracion}`,
      '-f', 'null',
      '-'
    ]
  });

  const silencios = parsearSilencios(resultado.stderr || '');

  return {
    silencios,
    cantidad: silencios.length,
    duracionTotalSeg: redondear(silencios.reduce((total, item) => total + (item.duracion || 0), 0), 3),
    codigo: resultado.codigo
  };
}

function crearSenalesAudio({ metadata, volumen, silencios, config }) {
  const duracionSegundos = metadata.duracionSegundos || 0;
  const volumenMedioDb = volumen.volumenMedioDb;
  const volumenMaximoDb = volumen.volumenMaximoDb;
  const porcentajeSilencio = duracionSegundos > 0
    ? redondear((silencios.duracionTotalSeg / duracionSegundos) * 100, 2)
    : 0;

  const rangoDinamicoAproximadoDb =
    volumenMedioDb !== null && volumenMaximoDb !== null
      ? redondear(Math.abs(volumenMaximoDb - volumenMedioDb), 2)
      : null;

  const margenAntesClippingDb = volumenMaximoDb !== null
    ? redondear(Math.abs(0 - volumenMaximoDb), 2)
    : null;

  return {
    vozBaja: volumenMedioDb !== null && volumenMedioDb <= config.analisis.volumenMedioBajoDb,
    vozMuyBaja: volumenMedioDb !== null && volumenMedioDb <= config.analisis.volumenMedioMuyBajoDb,
    volumenAlto: volumenMedioDb !== null && volumenMedioDb >= config.analisis.volumenMedioAltoDb,
    posibleSaturacion: volumenMaximoDb !== null && volumenMaximoDb >= config.analisis.volumenMaximoSaturadoDb,
    cercaDeClipping: volumenMaximoDb !== null && volumenMaximoDb >= config.analisis.volumenMaximoSeguroDb,
    volumenIrregular: rangoDinamicoAproximadoDb !== null && rangoDinamicoAproximadoDb >= config.analisis.rangoDinamicoIrregularDb,
    silenciosAltos: porcentajeSilencio >= config.analisis.porcentajeSilencioAlto,
    silenciosExcesivos: porcentajeSilencio >= config.analisis.porcentajeSilencioExcesivo,
    duracionValida: duracionSegundos >= config.analisis.duracionMinimaValidaSeg,
    porcentajeSilencio,
    rangoDinamicoAproximadoDb,
    margenAntesClippingDb
  };
}

export async function analizarAudioInteligente({ rutaEntrada, idProyecto = null, opciones = {} } = {}) {
  const config = obtenerConfigAudioInteligente(opciones);
  validarArchivoAnalisis(rutaEntrada);
  validarBinarios();

  const advertencias = [];
  const metadata = await leerMetadataAudio(rutaEntrada, config);

  if (!metadata.tieneAudio) {
    return {
      ok: false,
      idProyecto,
      rutaEntrada,
      tieneAudio: false,
      motivo: metadata.error || 'El archivo no tiene pista de audio detectable.',
      metadata,
      volumen: null,
      silencios: null,
      senales: null,
      advertencias
    };
  }

  const volumen = await medirVolumen(rutaEntrada, config);

  if (!volumen.disponible) {
    advertencias.push('No se pudieron obtener métricas de volumen con volumedetect.');
  }

  const silencios = await detectarSilencios(rutaEntrada, config);
  const senales = crearSenalesAudio({ metadata, volumen, silencios, config });

  if (!senales.duracionValida) {
    advertencias.push('La duración del audio es demasiado corta para un análisis confiable.');
  }

  if (senales.posibleSaturacion) {
    advertencias.push('El audio tiene picos muy cerca de 0 dB; puede existir saturación en la fuente.');
  }

  if (senales.vozMuyBaja) {
    advertencias.push('La voz parece muy baja; se requerirá ganancia y compresión controlada.');
  }

  return {
    ok: true,
    idProyecto,
    rutaEntrada,
    tieneAudio: true,
    metadata,
    volumen: {
      volumenMedioDb: redondear(volumen.volumenMedioDb, 2),
      volumenMaximoDb: redondear(volumen.volumenMaximoDb, 2),
      disponible: volumen.disponible
    },
    silencios: {
      cantidad: silencios.cantidad,
      duracionTotalSeg: silencios.duracionTotalSeg,
      porcentajeSilencio: senales.porcentajeSilencio,
      detalle: silencios.silencios.slice(0, 50)
    },
    senales,
    resumen: {
      duracionSegundos: metadata.duracionSegundos,
      codec: metadata.codec,
      canales: metadata.canales,
      frecuenciaMuestreo: metadata.frecuenciaMuestreo,
      volumenMedioDb: redondear(volumen.volumenMedioDb, 2),
      volumenMaximoDb: redondear(volumen.volumenMaximoDb, 2),
      rangoDinamicoAproximadoDb: senales.rangoDinamicoAproximadoDb,
      porcentajeSilencio: senales.porcentajeSilencio
    },
    advertencias
  };
}

export default analizarAudioInteligente;

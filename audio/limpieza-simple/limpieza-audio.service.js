/*
  Nombre completo: limpieza-audio.service.js
  Ruta o ubicación: AutoVideoJeff/audio/limpieza-simple/limpieza-audio.service.js
  Función o funciones:
    - Limpiar el audio de un video usando FFmpeg.
    - Reducir ruido de fondo con filtros nativos.
    - Mejorar claridad de voz con highpass, lowpass, compresor y normalización.
    - Guardar el audio mejorado en datos/audios-mejorados/.
    - Guardar audio-limpio-simple.json dentro del proyecto.
  Con qué se conecta:
    - audio/audio.conexion.js
    - comun/ffmpeg.js
    - comun/archivos.js
    - salida/exportar-simple/exportar.service.js
*/

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { limpiarAudioConFfmpeg } from '../../comun/ffmpeg.js';
import {
  asegurarCarpeta,
  escribirJson,
  leerJsonSiExiste,
  normalizarNombreArchivo,
  obtenerRutasDatosBase
} from '../../comun/archivos.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function obtenerRutaPreset() {
  return path.resolve(__dirname, '../../biblioteca/audio-limpio-simple.json');
}

function numeroValido(valor, valorPorDefecto) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : valorPorDefecto;
}

function enteroPositivo(valor, valorPorDefecto) {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0 ? Math.round(numero) : valorPorDefecto;
}

async function leerPresetAudioLimpio() {
  const rutaPreset = obtenerRutaPreset();
  const preset = await leerJsonSiExiste(rutaPreset, null);

  if (!preset) {
    throw new Error(`No se encontró el preset de audio requerido: ${rutaPreset}`);
  }

  if (!preset.audio || typeof preset.audio !== 'object') {
    throw new Error('El preset de audio no tiene configuración audio.');
  }

  if (!preset.filtros || typeof preset.filtros !== 'object') {
    throw new Error('El preset de audio no tiene configuración de filtros.');
  }

  return {
    ...preset,
    audio: {
      codecAudio: preset.audio.codecAudio || 'aac',
      audioBitrate: preset.audio.audioBitrate || '192k',
      frecuenciaMuestreo: enteroPositivo(preset.audio.frecuenciaMuestreo, 48000),
      canales: enteroPositivo(preset.audio.canales, 2),
      extension: preset.audio.extension || '.m4a'
    }
  };
}

function crearFiltroAudio(preset) {
  const filtros = preset.filtros || {};
  const partes = [];

  partes.push(`highpass=f=${enteroPositivo(filtros.highpassHz, 80)}`);
  partes.push(`lowpass=f=${enteroPositivo(filtros.lowpassHz, 12000)}`);

  if (filtros.reduccionRuido?.activo !== false) {
    const noiseFloor = numeroValido(filtros.reduccionRuido?.noiseFloor, -25);
    const noiseType = filtros.reduccionRuido?.noiseType || 'w';
    partes.push(`afftdn=nf=${noiseFloor}:nt=${noiseType}`);
  }

  if (filtros.compresor?.activo !== false) {
    const threshold = numeroValido(filtros.compresor?.threshold, -18);
    const ratio = numeroValido(filtros.compresor?.ratio, 3);
    const attack = numeroValido(filtros.compresor?.attack, 8);
    const release = numeroValido(filtros.compresor?.release, 250);
    const makeup = numeroValido(filtros.compresor?.makeup, 2);

    partes.push(
      `acompressor=threshold=${threshold}dB:ratio=${ratio}:attack=${attack}:release=${release}:makeup=${makeup}`
    );
  }

  if (filtros.normalizacionDinamica?.activo !== false) {
    const frameLen = enteroPositivo(filtros.normalizacionDinamica?.frameLen, 150);
    const gaussianSize = enteroPositivo(filtros.normalizacionDinamica?.gaussianSize, 15);
    const peak = numeroValido(filtros.normalizacionDinamica?.peak, 0.95);
    const maxGain = numeroValido(filtros.normalizacionDinamica?.maxGain, 8);

    partes.push(`dynaudnorm=f=${frameLen}:g=${gaussianSize}:p=${peak}:m=${maxGain}`);
  }

  if (filtros.normalizacionFinal?.activo !== false) {
    const integratedLoudness = numeroValido(filtros.normalizacionFinal?.integratedLoudness, -16);
    const truePeak = numeroValido(filtros.normalizacionFinal?.truePeak, -1.5);
    const loudnessRange = numeroValido(filtros.normalizacionFinal?.loudnessRange, 11);

    partes.push(`loudnorm=I=${integratedLoudness}:TP=${truePeak}:LRA=${loudnessRange}`);
  }

  return partes.join(',');
}

function validarEntrada({ entrada, entendimiento }) {
  if (!entrada?.video?.rutaOriginal) {
    throw new Error('No se puede limpiar audio porque falta la ruta del video original.');
  }

  if (!fs.existsSync(entrada.video.rutaOriginal)) {
    throw new Error(`No se puede limpiar audio porque no existe el video: ${entrada.video.rutaOriginal}`);
  }

  if (!entrada?.proyecto?.id) {
    throw new Error('No se puede limpiar audio porque falta el ID del proyecto.');
  }

  if (!entrada?.rutas?.carpetaProyecto) {
    throw new Error('No se puede limpiar audio porque falta la carpeta del proyecto.');
  }

  if (!entendimiento?.analisis) {
    throw new Error('No se puede limpiar audio porque falta el análisis del video.');
  }
}

function crearNombreAudioMejorado(entrada, preset) {
  const nombreBase = entrada.proyecto?.nombre || entrada.video?.nombreSeguro || entrada.proyecto?.id || 'audio';
  const nombreSeguro = normalizarNombreArchivo(nombreBase).replace(/\.[a-z0-9]+$/i, '');
  const extension = preset.audio.extension || '.m4a';

  return `${entrada.proyecto.id}-${nombreSeguro}-audio-limpio${extension}`;
}

async function validarAudioGenerado(rutaAudio) {
  let stats = null;

  try {
    stats = await fs.promises.stat(rutaAudio);
  } catch (_error) {
    throw new Error(`FFmpeg terminó, pero no se encontró el audio limpio: ${rutaAudio}`);
  }

  if (!stats.isFile() || stats.size <= 0) {
    throw new Error(`El audio limpio está vacío o no es válido: ${rutaAudio}`);
  }

  return stats;
}

function crearResultadoOmitido({ entrada, entendimiento, motivo }) {
  return {
    ok: true,
    etapa: 'audio',
    tipo: 'limpieza-simple',
    omitido: true,
    usarAudioMejorado: false,
    mensaje: motivo,
    rutaAudioMejorado: null,
    nombreAudioMejorado: null,
    analisisUsado: {
      tieneAudio: Boolean(entendimiento?.analisis?.tieneAudio),
      codecAudio: entendimiento?.analisis?.codecAudio || null
    },
    proyectoId: entrada?.proyecto?.id || null,
    creadoEn: new Date().toISOString()
  };
}

export async function limpiarAudioSimple({ entrada, entendimiento, opciones = {} }) {
  validarEntrada({ entrada, entendimiento });

  if (!entendimiento.analisis.tieneAudio) {
    const resultado = crearResultadoOmitido({
      entrada,
      entendimiento,
      motivo: 'El video no tiene pista de audio detectable. Se continúa con el flujo normal.'
    });

    const rutaResumenOmitido = path.join(entrada.rutas.carpetaProyecto, 'audio-limpio-simple.json');
    await escribirJson(rutaResumenOmitido, resultado);

    return {
      ...resultado,
      rutaResumenAudio: rutaResumenOmitido
    };
  }

  const preset = await leerPresetAudioLimpio();
  const rutasDatos = obtenerRutasDatosBase();
  const carpetaAudiosMejorados = asegurarCarpeta(rutasDatos.audiosMejorados);
  const nombreAudioMejorado = crearNombreAudioMejorado(entrada, preset);
  const rutaAudioMejorado = path.join(carpetaAudiosMejorados, nombreAudioMejorado);
  const rutaResumenAudio = path.join(entrada.rutas.carpetaProyecto, 'audio-limpio-simple.json');
  const filtroAudio = crearFiltroAudio(preset);

  await limpiarAudioConFfmpeg({
    rutaEntrada: entrada.video.rutaOriginal,
    rutaSalida: rutaAudioMejorado,
    filtroAudio,
    codecAudio: preset.audio.codecAudio,
    audioBitrate: preset.audio.audioBitrate,
    frecuenciaMuestreo: preset.audio.frecuenciaMuestreo,
    canales: preset.audio.canales
  });

  const stats = await validarAudioGenerado(rutaAudioMejorado);

  const resultado = {
    ok: true,
    etapa: 'audio',
    tipo: 'limpieza-simple',
    omitido: false,
    usarAudioMejorado: true,
    mensaje: 'Audio limpiado y mejorado correctamente.',
    rutaAudioMejorado,
    nombreAudioMejorado,
    pesoBytes: stats.size,
    presetUsado: {
      nombre: preset.nombre || 'audio-limpio-simple',
      descripcion: preset.descripcion || '',
      version: preset.version || null
    },
    render: {
      filtroAudio,
      codecAudio: preset.audio.codecAudio,
      audioBitrate: preset.audio.audioBitrate,
      frecuenciaMuestreo: preset.audio.frecuenciaMuestreo,
      canales: preset.audio.canales
    },
    analisisUsado: {
      tieneAudio: Boolean(entendimiento?.analisis?.tieneAudio),
      codecAudio: entendimiento?.analisis?.codecAudio || null,
      duracionSegundos: entendimiento?.analisis?.duracionSegundos || null
    },
    opciones,
    creadoEn: new Date().toISOString()
  };

  await escribirJson(rutaResumenAudio, resultado);

  return {
    ...resultado,
    rutaResumenAudio
  };
}
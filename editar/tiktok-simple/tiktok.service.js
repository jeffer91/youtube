/*
  Nombre completo: tiktok.service.js
  Ruta o ubicación: AutoVideoJeff/editar/tiktok-simple/tiktok.service.js
  Función:
    - Crear el plan de edición simple para TikTok.
    - Definir salida vertical 9:16.
    - Leer biblioteca/tiktok-simple.json.
    - Crear filtro FFmpeg.
    - Guardar edicion-tiktok-simple.json dentro del proyecto.
*/

import path from 'path';
import { fileURLToPath } from 'url';
import { escribirJson, leerJsonSiExiste, normalizarNombreArchivo } from '../../comun/archivos.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function obtenerRutaPreset() {
  return path.resolve(__dirname, '../../biblioteca/tiktok-simple.json');
}

function numeroValido(valor, valorPorDefecto) {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0 ? numero : valorPorDefecto;
}

function validarPreset(preset) {
  if (!preset || typeof preset !== 'object') {
    throw new Error('El preset TikTok no es válido o no existe.');
  }

  if (!preset.video || typeof preset.video !== 'object') {
    throw new Error('El preset TikTok no tiene configuración de video.');
  }

  if (!preset.exportacion || typeof preset.exportacion !== 'object') {
    throw new Error('El preset TikTok no tiene configuración de exportación.');
  }
}

async function leerPresetTikTok() {
  const rutaPreset = obtenerRutaPreset();
  const preset = await leerJsonSiExiste(rutaPreset, null);

  if (!preset) {
    throw new Error(`No se encontró el preset requerido: ${rutaPreset}`);
  }

  validarPreset(preset);

  return {
    ...preset,
    video: {
      ...preset.video,
      width: numeroValido(preset.video.width, 1080),
      height: numeroValido(preset.video.height, 1920),
      fps: numeroValido(preset.video.fps, 30),
      formato: preset.video.formato || '9:16'
    },
    exportacion: {
      ...preset.exportacion,
      contenedor: preset.exportacion.contenedor || 'mp4',
      codecVideo: preset.exportacion.codecVideo || 'libx264',
      codecAudio: preset.exportacion.codecAudio || 'aac',
      crf: numeroValido(preset.exportacion.crf, 23),
      presetFfmpeg: preset.exportacion.presetFfmpeg || 'veryfast',
      audioBitrate: preset.exportacion.audioBitrate || '160k'
    }
  };
}

function crearFiltroVertical(preset) {
  const ancho = preset.video.width;
  const alto = preset.video.height;
  const fps = preset.video.fps;

  return [
    `scale=${ancho}:${alto}:force_original_aspect_ratio=increase`,
    `crop=${ancho}:${alto}`,
    `fps=${fps}`,
    'setsar=1',
    'format=yuv420p'
  ].join(',');
}

function crearNombreExportado(entrada) {
  const nombreBase = entrada.proyecto?.nombre || entrada.video?.nombreSeguro || 'video';
  const nombreSeguro = normalizarNombreArchivo(nombreBase).replace(/\.[a-z0-9]+$/i, '');
  const fecha = new Date().toISOString().slice(0, 10);
  const idProyecto = entrada.proyecto?.id || Date.now();

  return `${nombreSeguro}-tiktok-${fecha}-${idProyecto}.mp4`;
}

export async function crearEdicionTikTokSimple({ entrada, entendimiento, opciones = {} }) {
  const preset = await leerPresetTikTok();
  const filtroVideo = crearFiltroVertical(preset);
  const nombreExportado = crearNombreExportado(entrada);
  const rutaEdicion = path.join(entrada.rutas.carpetaProyecto, 'edicion-tiktok-simple.json');

  const edicion = {
    ok: true,
    etapa: 'editar',
    tipo: 'tiktok-simple',
    plataforma: 'tiktok',
    presetUsado: {
      nombre: preset.nombre || 'tiktok-simple',
      descripcion: preset.descripcion || '',
      plataforma: preset.plataforma || 'tiktok'
    },
    entrada: {
      rutaVideoOriginal: entrada.video.rutaOriginal,
      nombreOriginal: entrada.video.nombreOriginal || null,
      orientacionDetectada: entendimiento?.analisis?.orientacion || 'desconocida',
      duracionSegundos: entendimiento?.analisis?.duracionSegundos || null,
      tieneAudio: Boolean(entendimiento?.analisis?.tieneAudio)
    },
    salida: {
      nombreExportado,
      extension: '.mp4',
      formato: preset.video.formato,
      width: preset.video.width,
      height: preset.video.height,
      fps: preset.video.fps
    },
    render: {
      filtroVideo,
      codecVideo: preset.exportacion.codecVideo,
      codecAudio: preset.exportacion.codecAudio,
      crf: preset.exportacion.crf,
      presetFfmpeg: preset.exportacion.presetFfmpeg,
      audioBitrate: preset.exportacion.audioBitrate
    },
    opciones,
    notas: [
      'Primera edición simple: convierte el video a formato vertical 9:16.',
      'Los subtítulos, cortes inteligentes, textos y transiciones quedan preparados para módulos futuros.'
    ],
    creadoEn: new Date().toISOString()
  };

  await escribirJson(rutaEdicion, edicion);

  return {
    ...edicion,
    rutaEdicion
  };
}
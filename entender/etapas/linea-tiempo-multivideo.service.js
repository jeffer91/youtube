import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffprobeStatic from 'ffprobe-static';
import { escribirJson } from '../../comun/archivos.js';

function resolverRutaFfprobe() {
  return typeof ffprobeStatic === 'string' ? ffprobeStatic : ffprobeStatic?.path;
}

const rutaFfprobe = resolverRutaFfprobe();
if (rutaFfprobe) ffmpeg.setFfprobePath(rutaFfprobe);

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function redondear(valor, decimales = 2) {
  const n = numero(valor, 0);
  return Number(n.toFixed(decimales));
}

function texto(valor, respaldo = '') {
  const limpio = String(valor ?? '').replace(/\s+/g, ' ').trim();
  return limpio || respaldo;
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
  return redondear(numerador / denominador, 2);
}

function existeArchivo(rutaArchivo) {
  try {
    return Boolean(rutaArchivo && fs.existsSync(rutaArchivo) && fs.statSync(rutaArchivo).isFile());
  } catch (_error) {
    return false;
  }
}

function pesoArchivo(rutaArchivo) {
  try {
    return fs.statSync(rutaArchivo).size;
  } catch (_error) {
    return 0;
  }
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

function extraerAnalisisDesdeMetadata({ video, metadata }) {
  const rutaVideo = video.rutaProyecto || video.rutaOriginal;
  const streamVideo = metadata?.streams?.find((stream) => stream.codec_type === 'video') || null;
  const streamAudio = metadata?.streams?.find((stream) => stream.codec_type === 'audio') || null;
  const ancho = numero(streamVideo?.width || streamVideo?.coded_width, null);
  const alto = numero(streamVideo?.height || streamVideo?.coded_height, null);
  const duracion = numero(metadata?.format?.duration || streamVideo?.duration || streamAudio?.duration, 0);
  return {
    ok: true,
    metodo: 'ffprobe',
    videoId: video.videoId || video.id,
    indice: video.indice,
    orden: video.orden,
    nombreOriginal: video.nombreOriginal,
    nombreSeguro: video.nombreSeguro || path.basename(rutaVideo || ''),
    rutaOriginal: rutaVideo,
    duracionSegundos: redondear(duracion, 2),
    ancho,
    alto,
    fps: obtenerFps(streamVideo),
    orientacion: calcularOrientacion(ancho, alto),
    pesoBytes: numero(metadata?.format?.size, pesoArchivo(rutaVideo)),
    formato: metadata?.format?.format_name || path.extname(rutaVideo || '').replace('.', '').toLowerCase() || null,
    codecVideo: streamVideo?.codec_name || null,
    codecAudio: streamAudio?.codec_name || null,
    tieneVideo: Boolean(streamVideo),
    tieneAudio: Boolean(streamAudio),
    advertencias: streamVideo ? [] : ['FFprobe no encontró stream de video.']
  };
}

function crearAnalisisBasico({ video, error = null }) {
  const rutaVideo = video.rutaProyecto || video.rutaOriginal;
  return {
    ok: existeArchivo(rutaVideo),
    metodo: 'archivo-basico',
    videoId: video.videoId || video.id,
    indice: video.indice,
    orden: video.orden,
    nombreOriginal: video.nombreOriginal,
    nombreSeguro: video.nombreSeguro || path.basename(rutaVideo || ''),
    rutaOriginal: rutaVideo,
    duracionSegundos: 0,
    ancho: null,
    alto: null,
    fps: null,
    orientacion: 'desconocida',
    pesoBytes: pesoArchivo(rutaVideo),
    formato: path.extname(rutaVideo || '').replace('.', '').toLowerCase() || null,
    codecVideo: null,
    codecAudio: null,
    tieneVideo: existeArchivo(rutaVideo),
    tieneAudio: false,
    advertencias: [error ? `FFprobe no pudo leer metadata completa: ${error.message}` : 'Metadata no disponible.']
  };
}

export async function analizarVideoParaLineaTiempo(video = {}) {
  const rutaVideo = video.rutaProyecto || video.rutaOriginal;
  if (!existeArchivo(rutaVideo)) {
    return {
      ...crearAnalisisBasico({ video, error: new Error(`No existe el archivo: ${rutaVideo}`) }),
      ok: false,
      advertencias: [`No existe el archivo: ${rutaVideo}`]
    };
  }

  try {
    const metadata = await leerMetadataConFfprobe(rutaVideo);
    return extraerAnalisisDesdeMetadata({ video, metadata });
  } catch (error) {
    return crearAnalisisBasico({ video, error });
  }
}

function seleccionarValorComun(items = [], clave, respaldo = null) {
  const conteo = new Map();
  for (const item of items) {
    const valor = item?.[clave];
    if (valor === null || valor === undefined || valor === '') continue;
    conteo.set(valor, (conteo.get(valor) || 0) + 1);
  }
  let seleccionado = respaldo;
  let mayor = 0;
  for (const [valor, cantidad] of conteo.entries()) {
    if (cantidad > mayor) {
      seleccionado = valor;
      mayor = cantidad;
    }
  }
  return seleccionado;
}

function crearItemLineaTiempo({ video, analisis, inicioGlobal }) {
  const duracion = Math.max(0, numero(analisis?.duracionSegundos, 0));
  const finGlobal = inicioGlobal + duracion;
  return {
    id: video.videoId || video.id,
    videoId: video.videoId || video.id,
    indice: video.indice,
    orden: video.orden,
    etiqueta: video.etiqueta,
    nombreOriginal: video.nombreOriginal,
    nombreSeguro: video.nombreSeguro,
    rutaOriginal: video.rutaProyecto || video.rutaOriginal,
    inicioGlobal: redondear(inicioGlobal, 2),
    finGlobal: redondear(finGlobal, 2),
    offsetGlobal: redondear(inicioGlobal, 2),
    duracionSegundos: redondear(duracion, 2),
    tieneAudio: Boolean(analisis?.tieneAudio),
    tieneVideo: Boolean(analisis?.tieneVideo),
    orientacion: analisis?.orientacion || 'desconocida',
    ancho: analisis?.ancho || null,
    alto: analisis?.alto || null,
    fps: analisis?.fps || null,
    codecVideo: analisis?.codecVideo || null,
    codecAudio: analisis?.codecAudio || null,
    estado: duracion > 0 ? 'analizado' : 'sin-duracion',
    advertencias: Array.isArray(analisis?.advertencias) ? analisis.advertencias : []
  };
}

function crearResumenLineaTiempo({ videos = [], analisisPorVideo = [], lineaTiempo = [] }) {
  const duracionTotal = lineaTiempo.reduce((total, item) => total + numero(item.duracionSegundos, 0), 0);
  const conAudio = lineaTiempo.filter((item) => item.tieneAudio).length;
  const sinDuracion = lineaTiempo.filter((item) => numero(item.duracionSegundos, 0) <= 0).length;
  return {
    totalVideos: videos.length,
    videosAnalizados: lineaTiempo.length,
    videosConAudio: conAudio,
    videosSinAudio: Math.max(0, lineaTiempo.length - conAudio),
    videosSinDuracion: sinDuracion,
    duracionTotalSegundos: redondear(duracionTotal, 2),
    duracionPromedioSegundos: lineaTiempo.length ? redondear(duracionTotal / lineaTiempo.length, 2) : 0,
    orientacionPredominante: seleccionarValorComun(lineaTiempo, 'orientacion', 'desconocida'),
    anchoPredominante: seleccionarValorComun(lineaTiempo, 'ancho', null),
    altoPredominante: seleccionarValorComun(lineaTiempo, 'alto', null),
    fpsPredominante: seleccionarValorComun(lineaTiempo, 'fps', null),
    tieneAudio: conAudio > 0,
    todosTienenAudio: lineaTiempo.length > 0 && conAudio === lineaTiempo.length,
    modo: lineaTiempo.length > 1 ? 'multivideo' : 'video-unico',
    esMultivideo: lineaTiempo.length > 1,
    advertencias: [
      ...(sinDuracion ? [`${sinDuracion} video(s) sin duración detectable.`] : []),
      ...analisisPorVideo.flatMap((item) => Array.isArray(item.advertencias) ? item.advertencias.map((adv) => `${item.videoId}: ${adv}`) : [])
    ]
  };
}

export async function crearLineaTiempoMultivideo({ entrada = null, videosNormalizados = null, carpetaProyecto = '' } = {}) {
  const videos = Array.isArray(videosNormalizados?.videosValidos) ? videosNormalizados.videosValidos : [];
  const analisisPorVideo = [];
  const lineaTiempo = [];
  let cursor = 0;

  for (const video of videos) {
    const analisis = await analizarVideoParaLineaTiempo(video);
    analisisPorVideo.push(analisis);
    const item = crearItemLineaTiempo({ video, analisis, inicioGlobal: cursor });
    lineaTiempo.push(item);
    cursor += numero(item.duracionSegundos, 0);
  }

  const resumen = crearResumenLineaTiempo({ videos, analisisPorVideo, lineaTiempo });
  const resultado = {
    ok: videos.length > 0,
    tipo: 'linea-tiempo-multivideo',
    proyectoId: entrada?.proyecto?.id || null,
    modo: resumen.modo,
    esMultivideo: resumen.esMultivideo,
    resumen,
    lineaTiempo,
    analisisPorVideo,
    creadoEn: new Date().toISOString()
  };

  if (carpetaProyecto) {
    const ruta = path.join(carpetaProyecto, 'entendimiento', 'linea-tiempo-multivideo.json');
    await escribirJson(ruta, { ...resultado, ruta });
    return { ...resultado, ruta };
  }

  return resultado;
}

export function convertirLocalAGlobal({ lineaTiempo = [], videoId, segundoLocal = 0 } = {}) {
  const item = lineaTiempo.find((video) => video.videoId === videoId || video.id === videoId);
  const offset = numero(item?.offsetGlobal, 0);
  return redondear(offset + numero(segundoLocal, 0), 2);
}

export default crearLineaTiempoMultivideo;

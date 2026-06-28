/*
  Modulo: biblioteca
  Funcion: analizar automaticamente archivos de recursos: tipo, duracion, resolucion, orientacion, audio y miniatura.
*/

import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import ffprobeStatic from 'ffprobe-static';
import ffmpegPath from 'ffmpeg-static';
import { detectarTipoArchivoBiblioteca, detectarFormatoInicialRecurso } from './recurso.modelo.js';
import { crearRutaWebBiblioteca } from './rutas-biblioteca.service.js';
import { ESTADOS_TECNICOS_RECURSO } from './biblioteca.config.js';

const FFPROBE = typeof ffprobeStatic === 'string' ? ffprobeStatic : ffprobeStatic?.path;
const FFMPEG = typeof ffmpegPath === 'string' ? ffmpegPath : ffmpegPath?.path || ffmpegPath;

function existeArchivo(rutaArchivo) {
  try {
    return Boolean(rutaArchivo && fs.existsSync(rutaArchivo) && fs.statSync(rutaArchivo).isFile());
  } catch (_error) {
    return false;
  }
}

function ejecutarProceso(comando, args = [], timeoutMs = 20000) {
  return new Promise((resolve) => {
    if (!comando) {
      resolve({ ok: false, code: -3, stdout: '', stderr: '', error: 'No existe comando ejecutable.' });
      return;
    }

    const child = spawn(comando, args, { windowsHide: true });
    let stdout = '';
    let stderr = '';
    let terminado = false;

    const timeout = setTimeout(() => {
      if (terminado) return;
      terminado = true;
      child.kill('SIGKILL');
      resolve({ ok: false, code: -1, stdout, stderr, error: `Timeout ejecutando ${path.basename(comando)}.` });
    }, timeoutMs);

    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });
    child.on('error', (error) => {
      if (terminado) return;
      terminado = true;
      clearTimeout(timeout);
      resolve({ ok: false, code: -2, stdout, stderr, error: error.message });
    });
    child.on('close', (code) => {
      if (terminado) return;
      terminado = true;
      clearTimeout(timeout);
      resolve({ ok: code === 0, code, stdout, stderr, error: code === 0 ? null : stderr || stdout || `Proceso finalizo con codigo ${code}` });
    });
  });
}

function numeroSeguro(valor, respaldo = null) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : respaldo;
}

function limpiarExtension(rutaArchivo = '') {
  return path.extname(rutaArchivo || '').toLowerCase();
}

function orientacionDesdeDimensiones(ancho = null, alto = null) {
  const w = Number(ancho);
  const h = Number(alto);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return 'desconocida';
  const ratio = w / h;
  if (ratio > 1.25) return 'horizontal';
  if (ratio < 0.8) return 'vertical';
  return 'cuadrada';
}

function leerDimensionPng(buffer) {
  const firmaPng = buffer.length >= 24 && buffer[0] === 0x89 && buffer.toString('ascii', 1, 4) === 'PNG';
  if (!firmaPng) return null;
  return { ancho: buffer.readUInt32BE(16), alto: buffer.readUInt32BE(20), metodo: 'png-ihdr' };
}

function leerDimensionGif(buffer) {
  const firma = buffer.length >= 10 ? buffer.toString('ascii', 0, 3) : '';
  if (firma !== 'GIF') return null;
  return { ancho: buffer.readUInt16LE(6), alto: buffer.readUInt16LE(8), metodo: 'gif-header' };
}

function leerDimensionJpeg(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset < buffer.length - 9) {
    if (buffer[offset] !== 0xff) { offset += 1; continue; }
    const marker = buffer[offset + 1];
    const largo = buffer.readUInt16BE(offset + 2);
    const esSof = [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker);
    if (esSof) return { alto: buffer.readUInt16BE(offset + 5), ancho: buffer.readUInt16BE(offset + 7), metodo: 'jpeg-sof' };
    if (!Number.isFinite(largo) || largo <= 0) break;
    offset += 2 + largo;
  }
  return null;
}

function leerDimensionWebp(buffer) {
  if (buffer.length < 30 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') return null;
  const chunk = buffer.toString('ascii', 12, 16);
  if (chunk === 'VP8X' && buffer.length >= 30) {
    const ancho = 1 + buffer.readUIntLE(24, 3);
    const alto = 1 + buffer.readUIntLE(27, 3);
    return { ancho, alto, metodo: 'webp-vp8x' };
  }
  return null;
}

async function leerDimensionesImagen(rutaArchivo) {
  const buffer = await fsp.readFile(rutaArchivo);
  return leerDimensionPng(buffer) || leerDimensionGif(buffer) || leerDimensionJpeg(buffer) || leerDimensionWebp(buffer) || null;
}

async function leerFfprobe(rutaArchivo) {
  if (!FFPROBE || !existeArchivo(FFPROBE)) return { ok: false, error: 'ffprobe no disponible.' };
  const resultado = await ejecutarProceso(FFPROBE, ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', rutaArchivo], 25000);
  if (!resultado.ok) return resultado;
  try {
    return { ok: true, data: JSON.parse(resultado.stdout || '{}') };
  } catch (error) {
    return { ok: false, error: `ffprobe devolvio JSON invalido: ${error.message}`, stdout: resultado.stdout, stderr: resultado.stderr };
  }
}

async function generarMiniaturaVideo({ rutaArchivo, recursoId }) {
  if (!FFMPEG || !existeArchivo(FFMPEG)) return { generada: false, mensaje: 'ffmpeg no disponible.' };
  const carpeta = path.join(path.dirname(rutaArchivo), 'miniaturas');
  await fsp.mkdir(carpeta, { recursive: true });
  const nombre = `${recursoId || path.basename(rutaArchivo, path.extname(rutaArchivo))}-thumb.jpg`;
  const rutaMiniatura = path.join(carpeta, nombre);
  const args = ['-y', '-ss', '00:00:01', '-i', rutaArchivo, '-frames:v', '1', '-vf', 'scale=480:-1', rutaMiniatura];
  const resultado = await ejecutarProceso(FFMPEG, args, 30000);
  if (!resultado.ok || !existeArchivo(rutaMiniatura)) {
    return { generada: false, mensaje: resultado.error || 'No se pudo generar miniatura.', detalle: resultado.stderr || resultado.stdout || '' };
  }
  return { generada: true, rutaAbsoluta: rutaMiniatura, rutaRelativa: crearRutaWebBiblioteca(rutaMiniatura), tipo: 'imagen', formato: 'jpg' };
}

function extraerMetadataFfprobe(data = {}) {
  const streams = Array.isArray(data.streams) ? data.streams : [];
  const video = streams.find((stream) => stream.codec_type === 'video') || null;
  const audio = streams.find((stream) => stream.codec_type === 'audio') || null;
  const duracion = numeroSeguro(data.format?.duration, numeroSeguro(video?.duration, numeroSeguro(audio?.duration, null)));
  const ancho = numeroSeguro(video?.width, null);
  const alto = numeroSeguro(video?.height, null);

  return {
    duracionSegundos: duracion,
    ancho,
    alto,
    tieneVideo: Boolean(video),
    tieneAudio: Boolean(audio),
    codecVideo: video?.codec_name || '',
    codecAudio: audio?.codec_name || '',
    bitrate: numeroSeguro(data.format?.bit_rate, null),
    streams: streams.map((stream) => ({ tipo: stream.codec_type, codec: stream.codec_name || '', ancho: stream.width || null, alto: stream.height || null, duracion: numeroSeguro(stream.duration, null) }))
  };
}

export async function analizarArchivoBiblioteca({ rutaArchivo, recurso = {}, tipo: tipoEntrada = '', generarMiniatura = true } = {}) {
  const errores = [];
  const advertencias = [];

  if (!rutaArchivo || !existeArchivo(rutaArchivo)) {
    return {
      ok: false,
      estadoTecnico: ESTADOS_TECNICOS_RECURSO.ERROR,
      mensaje: 'No existe archivo para analizar.',
      errores: ['No existe archivo para analizar.'],
      advertencias,
      analizadoEn: new Date().toISOString()
    };
  }

  const stat = fs.statSync(rutaArchivo);
  const extension = limpiarExtension(rutaArchivo);
  const tipo = detectarTipoArchivoBiblioteca({ nombreArchivo: rutaArchivo, tipo: tipoEntrada || recurso.tipo || '' });
  let dimensionesImagen = null;
  let metadata = {
    duracionSegundos: null,
    ancho: null,
    alto: null,
    tieneVideo: tipo === 'video',
    tieneAudio: tipo === 'audio',
    codecVideo: '',
    codecAudio: '',
    bitrate: null,
    streams: []
  };

  if (tipo === 'imagen') {
    try {
      dimensionesImagen = await leerDimensionesImagen(rutaArchivo);
      if (dimensionesImagen) {
        metadata = { ...metadata, ancho: dimensionesImagen.ancho, alto: dimensionesImagen.alto, tieneVideo: false, tieneAudio: false };
      } else {
        advertencias.push('No se pudo detectar dimensiones de imagen con lector local.');
      }
    } catch (error) {
      advertencias.push(`No se pudieron leer dimensiones de imagen: ${error.message}`);
    }
  }

  if (tipo === 'video' || tipo === 'audio' || (!metadata.ancho && !metadata.alto && tipo !== 'imagen')) {
    const ffprobe = await leerFfprobe(rutaArchivo);
    if (ffprobe.ok) {
      metadata = { ...metadata, ...extraerMetadataFfprobe(ffprobe.data) };
    } else if (tipo !== 'imagen') {
      errores.push(ffprobe.error || 'No se pudo analizar con ffprobe.');
    } else {
      advertencias.push(ffprobe.error || 'No se pudo complementar imagen con ffprobe.');
    }
  }

  const orientacion = orientacionDesdeDimensiones(metadata.ancho, metadata.alto);
  const formatoDetectado = detectarFormatoInicialRecurso({ tipo, ancho: metadata.ancho, alto: metadata.alto, orientacion });
  let miniatura = null;

  if (tipo === 'imagen') {
    miniatura = { generada: false, rutaAbsoluta: rutaArchivo, rutaRelativa: crearRutaWebBiblioteca(rutaArchivo), tipo: 'imagen', formato: extension.replace('.', '') || 'imagen', origen: 'archivo-original' };
  }

  if (tipo === 'video' && generarMiniatura) {
    try {
      miniatura = await generarMiniaturaVideo({ rutaArchivo, recursoId: recurso.id });
      if (!miniatura?.generada) advertencias.push(miniatura?.mensaje || 'No se genero miniatura de video.');
    } catch (error) {
      advertencias.push(`No se genero miniatura: ${error.message}`);
    }
  }

  const ok = errores.length === 0;
  return {
    ok,
    estadoTecnico: ok ? ESTADOS_TECNICOS_RECURSO.LISTO : ESTADOS_TECNICOS_RECURSO.ERROR,
    mensaje: ok ? 'Recurso analizado correctamente.' : 'Recurso guardado, pero el analisis automatico fallo.',
    tipo,
    extension,
    pesoBytes: stat.size,
    duracionSegundos: metadata.duracionSegundos,
    ancho: metadata.ancho,
    alto: metadata.alto,
    resolucion: metadata.ancho && metadata.alto ? `${metadata.ancho}x${metadata.alto}` : '',
    orientacion,
    formatoDetectado,
    tieneAudio: Boolean(metadata.tieneAudio),
    tieneVideo: Boolean(metadata.tieneVideo),
    codecVideo: metadata.codecVideo,
    codecAudio: metadata.codecAudio,
    bitrate: metadata.bitrate,
    streams: metadata.streams,
    miniatura,
    errores,
    advertencias,
    metodoImagen: dimensionesImagen?.metodo || null,
    analizadoEn: new Date().toISOString()
  };
}

export function fusionarAnalisisConRecurso(recurso = {}, analisis = {}) {
  const formatoManual = Boolean(recurso.formatoManual && recurso.formato && recurso.formato !== 'desconocido');
  const formato = formatoManual ? recurso.formato : (analisis.formatoDetectado || recurso.formato || 'desconocido');
  return {
    ...recurso,
    tipo: analisis.tipo || recurso.tipo,
    formato,
    tamanoFormato: formato,
    tamañoFormato: formato,
    estadoTecnico: analisis.estadoTecnico || recurso.estadoTecnico,
    estado: analisis.estadoTecnico || recurso.estado,
    duracionSegundos: analisis.duracionSegundos ?? recurso.duracionSegundos ?? null,
    ancho: analisis.ancho ?? recurso.ancho ?? null,
    alto: analisis.alto ?? recurso.alto ?? null,
    resolucion: analisis.resolucion || recurso.resolucion || '',
    orientacion: analisis.orientacion || recurso.orientacion || 'desconocida',
    tieneAudio: analisis.tieneAudio ?? recurso.tieneAudio ?? false,
    tieneVideo: analisis.tieneVideo ?? recurso.tieneVideo ?? false,
    miniatura: analisis.miniatura || recurso.miniatura || null,
    errores: [...(recurso.errores || []), ...(analisis.errores || [])],
    advertencias: [...(recurso.advertencias || []), ...(analisis.advertencias || [])],
    archivo: {
      ...(recurso.archivo || {}),
      pesoBytes: analisis.pesoBytes || recurso.archivo?.pesoBytes || 0,
      extension: analisis.extension || recurso.archivo?.extension || ''
    },
    analisisArchivo: analisis,
    actualizadoEn: new Date().toISOString()
  };
}

export default analizarArchivoBiblioteca;

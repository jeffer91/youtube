/*
  Laboratorio de efectos - Bloque 2
  Función: renderizar un video corto aplicando un solo efecto elegido.
*/

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import { obtenerEfectoLabPorId } from './catalogo-efectos-lab.js';
import { construirFiltroFfmpegLaboratorio } from './filtros-ffmpeg-lab.service.js';

export const VERSION_RENDER_LABORATORIO_EFECTOS = '1.0.0';

function texto(valor, respaldo = '') {
  const limpio = String(valor ?? '').replace(/\s+/g, ' ').trim();
  return limpio || respaldo;
}

function resolverFfmpeg() {
  return typeof ffmpegStatic === 'string' ? ffmpegStatic : ffmpegStatic?.path;
}

function existeArchivo(rutaArchivo) {
  try {
    return Boolean(rutaArchivo && fs.existsSync(rutaArchivo) && fs.statSync(rutaArchivo).isFile());
  } catch (_error) {
    return false;
  }
}

function asegurarCarpeta(rutaCarpeta) {
  const ruta = texto(rutaCarpeta, '');
  if (!ruta) throw new Error('Falta carpeta de salida para el laboratorio de efectos.');
  fs.mkdirSync(ruta, { recursive: true });
  return ruta;
}

function nombreSeguro(valor = '') {
  return texto(valor, 'efecto').toLowerCase().replace(/[^a-z0-9-_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'efecto';
}

function crearMarcaEjecucion() {
  return `${new Date().toISOString().replace(/[:.]/g, '-').replace('T', '-').replace('Z', '')}-${process.pid || 'app'}`;
}

function validarVideoEntrada(rutaVideo) {
  const ruta = texto(rutaVideo, '');
  if (!ruta) throw new Error('Falta video para probar el efecto.');
  if (!existeArchivo(ruta)) throw new Error(`No existe el video de entrada para el laboratorio: ${ruta}`);
  return ruta;
}

function crearRutaSalida({ carpetaSalida, efectoId, marcaEjecucion = crearMarcaEjecucion() }) {
  const carpeta = asegurarCarpeta(carpetaSalida);
  const nombre = `lab-${nombreSeguro(efectoId)}-${marcaEjecucion}.mp4`;
  return path.join(carpeta, nombre);
}

export function construirComandoFfmpegLaboratorio({ rutaVideo, rutaSalida, filtroVideo } = {}) {
  const entrada = texto(rutaVideo, '');
  const salida = texto(rutaSalida, '');
  const filtro = texto(filtroVideo, '');
  if (!entrada) throw new Error('Falta rutaVideo para construir comando de laboratorio.');
  if (!salida) throw new Error('Falta rutaSalida para construir comando de laboratorio.');
  if (!filtro) throw new Error('Falta filtroVideo para construir comando de laboratorio.');
  return [
    '-y',
    '-hide_banner',
    '-i', entrada,
    '-vf', filtro,
    '-map', '0:v:0',
    '-map', '0:a:0?',
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-crf', '22',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-movflags', '+faststart',
    '-shortest',
    salida
  ];
}

function ejecutarFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const ffmpeg = resolverFfmpeg();
    if (!ffmpeg || !fs.existsSync(ffmpeg)) return reject(new Error('No se encontró FFmpeg para el laboratorio de efectos.'));
    const proceso = spawn(ffmpeg, args, { windowsHide: true });
    let stdout = '';
    let stderr = '';
    proceso.stdout.on('data', (data) => { stdout += data.toString(); });
    proceso.stderr.on('data', (data) => { stderr += data.toString(); });
    proceso.on('error', (error) => reject(error));
    proceso.on('close', (code) => {
      if (code === 0) resolve({ ok: true, code, stdout, stderr });
      else reject(new Error(`FFmpeg no pudo renderizar el efecto de laboratorio. Código ${code}. ${stderr || stdout}`));
    });
  });
}

export function prepararPruebaEfectoLaboratorio({ rutaVideo, carpetaSalida, efectoId, textoPersonalizado = '', intensidad = null, marcaEjecucion = crearMarcaEjecucion() } = {}) {
  const efecto = obtenerEfectoLabPorId(efectoId);
  if (!efecto) throw new Error(`No existe el efecto de laboratorio: ${efectoId || 'sin efecto'}`);
  const filtro = construirFiltroFfmpegLaboratorio({ efectoId, textoPersonalizado, intensidad });
  const salida = crearRutaSalida({ carpetaSalida, efectoId, marcaEjecucion });
  const comando = construirComandoFfmpegLaboratorio({ rutaVideo: texto(rutaVideo, 'video-prueba.mp4'), rutaSalida: salida, filtroVideo: filtro.filtroVideo });
  return {
    ok: true,
    tipo: 'preparacion-laboratorio-efectos',
    version: VERSION_RENDER_LABORATORIO_EFECTOS,
    efecto,
    filtro,
    rutaSalida: salida,
    nombreSalida: path.basename(salida),
    comando,
    queDebeSalir: efecto.queDebeSalir,
    mensaje: `Prueba preparada para ${efecto.nombre}.`
  };
}

export async function renderizarEfectoLaboratorio({ rutaVideo, carpetaSalida, efectoId, textoPersonalizado = '', intensidad = null, marcaEjecucion = crearMarcaEjecucion() } = {}) {
  const entrada = validarVideoEntrada(rutaVideo);
  const preparacion = prepararPruebaEfectoLaboratorio({ rutaVideo: entrada, carpetaSalida, efectoId, textoPersonalizado, intensidad, marcaEjecucion });
  const inicio = Date.now();
  const ffmpeg = await ejecutarFfmpeg(preparacion.comando);
  const stats = await fs.promises.stat(preparacion.rutaSalida);
  if (!stats.isFile() || stats.size <= 0) throw new Error(`El laboratorio no generó un video válido: ${preparacion.rutaSalida}`);
  return {
    ok: true,
    tipo: 'resultado-laboratorio-efectos',
    version: VERSION_RENDER_LABORATORIO_EFECTOS,
    efecto: preparacion.efecto,
    filtro: preparacion.filtro,
    rutaEntrada: entrada,
    rutaSalida: preparacion.rutaSalida,
    nombreSalida: preparacion.nombreSalida,
    pesoBytes: stats.size,
    queDebeSalir: preparacion.queDebeSalir,
    ffmpeg: { ...ffmpeg, duracionMs: Date.now() - inicio },
    mensaje: `Efecto probado correctamente: ${preparacion.efecto.nombre}.`
  };
}

export default renderizarEfectoLaboratorio;

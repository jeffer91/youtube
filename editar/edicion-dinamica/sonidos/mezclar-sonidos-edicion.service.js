import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';

function resolverRutaFfmpeg() { return typeof ffmpegStatic === 'string' ? ffmpegStatic : ffmpegStatic?.path; }
function msDelay(segundos) { return Math.max(0, Math.round(Number(segundos || 0) * 1000)); }
function texto(valor, respaldo = '') { const limpio = String(valor ?? '').trim(); return limpio || respaldo; }

function ejecutarFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const rutaFfmpeg = resolverRutaFfmpeg();
    if (!rutaFfmpeg || !fs.existsSync(rutaFfmpeg)) return reject(new Error('No se encontró FFmpeg para mezclar sonidos de edición.'));
    const proceso = spawn(rutaFfmpeg, args, { windowsHide: true });
    let stdout = '';
    let stderr = '';
    proceso.stdout.on('data', (data) => { stdout += data.toString(); });
    proceso.stderr.on('data', (data) => { stderr += data.toString(); });
    proceso.on('error', (error) => reject(error));
    proceso.on('close', (code) => { if (code === 0) resolve({ ok: true, stdout, stderr, code }); else reject(new Error(`FFmpeg no pudo mezclar sonidos. Código ${code}. ${stderr || stdout}`)); });
  });
}

function validarAudioBase(rutaAudioBase) { if (!rutaAudioBase || !fs.existsSync(rutaAudioBase)) throw new Error(`No se encontró audio base para mezclar sonidos: ${rutaAudioBase || 'sin ruta'}`); }
function construirEntradasSonidos(eventos, sonidosBase) { return eventos.map((evento) => ({ ...evento, ruta: sonidosBase.sonidos[evento.sonido].ruta })); }

function resolverCarpetaSonidos({ carpetaSonidos, rutaVideoBase, rutaAudioBase } = {}) {
  const carpeta = texto(carpetaSonidos, '');
  if (carpeta) return carpeta;
  const base = texto(rutaVideoBase || rutaAudioBase, '');
  if (base) return path.join(path.dirname(base), 'sonidos-edicion');
  throw new Error('No se puede mezclar sonidos porque falta carpeta de sonidos y ruta de video base.');
}

function resolverNombreSalida(nombreSalida) {
  return texto(nombreSalida, 'audio-con-sonidos-edicion.m4a').replace(/[\\/:*?"<>|]/g, '-');
}

function construirFiltroAudio(eventosConRuta) {
  const filtros = ['[0:a]aresample=async=1:first_pts=0,volume=1.0[a0]'];
  const etiquetas = ['[a0]'];
  eventosConRuta.forEach((evento, index) => {
    const entradaIndex = index + 1;
    const etiqueta = `a${entradaIndex}`;
    const delay = msDelay(evento.tiempo);
    const volumen = Number(evento.volumen || 0.1).toFixed(3);
    filtros.push(`[${entradaIndex}:a]aresample=async=1:first_pts=0,adelay=${delay}|${delay},volume=${volumen}[${etiqueta}]`);
    etiquetas.push(`[${etiqueta}]`);
  });
  filtros.push(`${etiquetas.join('')}amix=inputs=${etiquetas.length}:duration=first:dropout_transition=0,alimiter=limit=0.92,aresample=async=1:first_pts=0[aout]`);
  return filtros.join(';');
}

export async function mezclarSonidosEdicion({ rutaVideoBase, rutaAudioBase = null, eventos = [], sonidosBase, carpetaSonidos, nombreSalida = 'audio-con-sonidos-edicion.m4a' } = {}) {
  if (!Array.isArray(eventos) || eventos.length === 0) return { ok: true, omitido: true, audioConSonidos: null, mensaje: 'No hay sonidos para mezclar.' };
  const audioBase = rutaAudioBase || rutaVideoBase;
  validarAudioBase(audioBase);
  const carpetaFinal = resolverCarpetaSonidos({ carpetaSonidos, rutaVideoBase, rutaAudioBase: audioBase });
  const nombreFinal = resolverNombreSalida(nombreSalida);
  await fs.promises.mkdir(carpetaFinal, { recursive: true });
  const rutaSalida = path.join(carpetaFinal, nombreFinal);
  const eventosConRuta = construirEntradasSonidos(eventos, sonidosBase);
  const filtroAudio = construirFiltroAudio(eventosConRuta);
  const args = ['-y', '-hide_banner', '-i', audioBase];
  for (const evento of eventosConRuta) args.push('-i', evento.ruta);
  args.push('-filter_complex', filtroAudio, '-map', '[aout]', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', rutaSalida);
  const inicio = Date.now();
  const ffmpeg = await ejecutarFfmpeg(args);
  const stats = await fs.promises.stat(rutaSalida);
  if (!stats.isFile() || stats.size <= 0) throw new Error(`El audio con sonidos está vacío o no se generó correctamente: ${rutaSalida}`);
  return { ok: true, omitido: false, audioConSonidos: rutaSalida, nombreAudio: path.basename(rutaSalida), audioBaseUsado: audioBase, eventosMezclados: eventosConRuta.length, filtroAudio, pesoBytes: stats.size, ffmpeg: { ...ffmpeg, duracionMs: Date.now() - inicio }, mensaje: 'Audio con sonidos mezclado en modo seguro, con menor volumen y sincronización protegida.' };
}

export default mezclarSonidosEdicion;

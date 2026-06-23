import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import { asegurarCarpeta } from '../../../comun/archivos.js';

function resolverRutaFfmpeg() {
  return typeof ffmpegStatic === 'string' ? ffmpegStatic : ffmpegStatic?.path;
}

function validarArchivoEntrada(rutaVideoOriginal) {
  if (!rutaVideoOriginal || typeof rutaVideoOriginal !== 'string') throw new Error('No se indicó video original para aplicar cortes.');
  if (!fs.existsSync(rutaVideoOriginal)) throw new Error(`No existe el video original para aplicar cortes: ${rutaVideoOriginal}`);
}

function validarSegmentos(segmentosConservados = []) {
  if (!Array.isArray(segmentosConservados) || segmentosConservados.length === 0) throw new Error('No hay segmentos conservados para unir.');
  for (const segmento of segmentosConservados) {
    if (Number(segmento.fin) <= Number(segmento.inicio)) throw new Error(`Segmento inválido en plan de cortes: ${JSON.stringify(segmento)}`);
  }
}

function crearFiltroConcatConAudio(segmentosConservados = []) {
  const filtros = [];
  segmentosConservados.forEach((segmento, index) => {
    filtros.push(`[0:v]trim=start=${segmento.inicio}:end=${segmento.fin},setpts=PTS-STARTPTS[v${index}]`);
    filtros.push(`[0:a]atrim=start=${segmento.inicio}:end=${segmento.fin},asetpts=PTS-STARTPTS[a${index}]`);
  });
  const entradas = segmentosConservados.map((_segmento, index) => `[v${index}][a${index}]`).join('');
  filtros.push(`${entradas}concat=n=${segmentosConservados.length}:v=1:a=1[vout][aout]`);
  return filtros.join(';');
}

function crearFiltroConcatSinAudio(segmentosConservados = []) {
  const filtros = [];
  segmentosConservados.forEach((segmento, index) => {
    filtros.push(`[0:v]trim=start=${segmento.inicio}:end=${segmento.fin},setpts=PTS-STARTPTS[v${index}]`);
  });
  const entradas = segmentosConservados.map((_segmento, index) => `[v${index}]`).join('');
  filtros.push(`${entradas}concat=n=${segmentosConservados.length}:v=1:a=0[vout]`);
  return filtros.join(';');
}

function ejecutarFfmpeg({ rutaVideoOriginal, rutaSalida, filtroComplex, tieneAudio = true }) {
  return new Promise((resolve, reject) => {
    const rutaFfmpeg = resolverRutaFfmpeg();
    if (!rutaFfmpeg || !fs.existsSync(rutaFfmpeg)) {
      reject(new Error('No se encontró FFmpeg para aplicar cortes.'));
      return;
    }

    const args = ['-y', '-hide_banner', '-i', rutaVideoOriginal, '-filter_complex', filtroComplex, '-map', '[vout]'];

    if (tieneAudio) {
      args.push('-map', '[aout]', '-c:a', 'aac', '-b:a', '192k');
    }

    args.push('-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-movflags', '+faststart', rutaSalida);

    const proceso = spawn(rutaFfmpeg, args, { windowsHide: true });
    let stdout = '';
    let stderr = '';
    proceso.stdout.on('data', (data) => { stdout += data.toString(); });
    proceso.stderr.on('data', (data) => { stderr += data.toString(); });
    proceso.on('error', (error) => reject(new Error(`FFmpeg no pudo aplicar cortes: ${error.message}`)));
    proceso.on('close', (code) => {
      if (code === 0) resolve({ ok: true, code, stdout, stderr, tieneAudio });
      else reject(new Error(`FFmpeg no pudo aplicar cortes. Código ${code}. ${stderr || stdout}`));
    });
  });
}

export async function aplicarCortesVideo({ rutaVideoOriginal, segmentosConservados = [], carpetaCortes, nombreSalida = 'video-sin-silencios.mp4', tieneAudio = true } = {}) {
  validarArchivoEntrada(rutaVideoOriginal);
  validarSegmentos(segmentosConservados);
  const carpetaVideos = path.join(carpetaCortes, 'videos');
  asegurarCarpeta(carpetaVideos);
  const rutaSalida = path.join(carpetaVideos, nombreSalida);
  const filtroComplex = tieneAudio ? crearFiltroConcatConAudio(segmentosConservados) : crearFiltroConcatSinAudio(segmentosConservados);
  const inicio = Date.now();
  const ffmpeg = await ejecutarFfmpeg({ rutaVideoOriginal, rutaSalida, filtroComplex, tieneAudio });
  const stats = await fs.promises.stat(rutaSalida);
  if (!stats.isFile() || stats.size <= 0) throw new Error(`El video sin silencios está vacío o no se generó correctamente: ${rutaSalida}`);
  return { ok: true, rutaSalida, nombreSalida, pesoBytes: stats.size, segmentosProcesados: segmentosConservados.length, tieneAudio, ffmpeg: { ...ffmpeg, filtroComplex, duracionMs: Date.now() - inicio } };
}

export default aplicarCortesVideo;

import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { escribirJson } from '../../comun/archivos.js';

if (ffmpegStatic) ffmpeg.setFfmpegPath(ffmpegStatic);

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function texto(valor, respaldo = '') {
  const limpio = String(valor ?? '').replace(/\s+/g, ' ').trim();
  return limpio || respaldo;
}

function existeArchivo(rutaArchivo) {
  try {
    return Boolean(rutaArchivo && fs.existsSync(rutaArchivo) && fs.statSync(rutaArchivo).isFile());
  } catch (_error) {
    return false;
  }
}

function asegurarCarpeta(rutaCarpeta) {
  fs.mkdirSync(rutaCarpeta, { recursive: true });
  return rutaCarpeta;
}

function normalizarRutaFfconcat(rutaArchivo) {
  return String(rutaArchivo || '').replace(/\\/g, '/').replace(/'/g, "'\\''");
}

function nombreSeguroVideoMaestro(proyectoId = 'proyecto') {
  const base = texto(proyectoId, 'proyecto').replace(/[^a-zA-Z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  return `${base || 'proyecto'}-maestro-multivideo.mp4`;
}

function crearListaConcat(videos = []) {
  return videos.map((video) => `file '${normalizarRutaFfconcat(video.rutaProyecto || video.rutaOriginal)}'`).join('\n');
}

function ejecutarConcatDemuxer({ rutaLista, rutaSalida }) {
  return new Promise((resolve, reject) => {
    const inicio = Date.now();
    ffmpeg()
      .input(rutaLista)
      .inputOptions(['-f concat', '-safe 0'])
      .outputOptions([
        '-map 0:v:0?',
        '-map 0:a:0?',
        '-c:v libx264',
        '-preset veryfast',
        '-crf 23',
        '-pix_fmt yuv420p',
        '-c:a aac',
        '-b:a 128k',
        '-movflags +faststart',
        '-y'
      ])
      .on('end', () => resolve({ ok: true, metodo: 'concat-demuxer-reencode', duracionMs: Date.now() - inicio }))
      .on('error', (error) => reject(error))
      .save(rutaSalida);
  });
}

function copiarVideoUnico({ video, rutaSalida }) {
  fs.copyFileSync(video.rutaProyecto || video.rutaOriginal, rutaSalida);
  return { ok: true, metodo: 'copia-video-unico', duracionMs: 0 };
}

function obtenerPeso(rutaArchivo) {
  try {
    return fs.statSync(rutaArchivo).size;
  } catch (_error) {
    return 0;
  }
}

function crearVideoMaestroDesdeSalida({ proyectoId, rutaSalida, carpetaSalida, videos, resultadoFfmpeg }) {
  return {
    id: 'video-maestro-multivideo',
    videoId: 'video-maestro',
    indice: 0,
    orden: 1,
    etiqueta: 'Video maestro multivideo',
    nombreOriginal: path.basename(rutaSalida),
    nombreSeguro: path.basename(rutaSalida),
    extension: path.extname(rutaSalida).toLowerCase(),
    tipo: 'video/maestro-multivideo',
    tamanoBytes: obtenerPeso(rutaSalida),
    rutaProyecto: rutaSalida,
    rutaOriginal: rutaSalida,
    origen: 'produccion-maestro-multivideo',
    existe: existeArchivo(rutaSalida),
    estado: existeArchivo(rutaSalida) ? 'listo' : 'faltante',
    carpetaSalida,
    videosFuente: videos.map((video) => ({
      videoId: video.videoId || video.id || null,
      nombreOriginal: video.nombreOriginal || video.nombreSeguro || null,
      rutaOriginal: video.rutaProyecto || video.rutaOriginal || null,
      orden: video.orden ?? null,
      indice: video.indice ?? null
    })),
    union: resultadoFfmpeg,
    guardadoEn: new Date().toISOString()
  };
}

export async function unirVideosMaestroMultivideo({ proyectoId, carpetaProyecto, videos = [], lineaTiempoGlobal = null } = {}) {
  const videosValidos = (Array.isArray(videos) ? videos : []).filter((video) => existeArchivo(video.rutaProyecto || video.rutaOriginal));
  if (!videosValidos.length) throw new Error('No hay videos válidos para crear el video maestro multivideo.');

  const carpetaSalida = asegurarCarpeta(path.join(carpetaProyecto, 'produccion', 'maestro-multivideo'));
  const rutaSalida = path.join(carpetaSalida, nombreSeguroVideoMaestro(proyectoId));
  const rutaLista = path.join(carpetaSalida, 'videos-concat.txt');
  await fs.promises.writeFile(rutaLista, crearListaConcat(videosValidos), 'utf8');

  let resultadoFfmpeg;
  if (videosValidos.length === 1) {
    resultadoFfmpeg = copiarVideoUnico({ video: videosValidos[0], rutaSalida });
  } else {
    resultadoFfmpeg = await ejecutarConcatDemuxer({ rutaLista, rutaSalida });
  }

  const videoMaestro = crearVideoMaestroDesdeSalida({ proyectoId, rutaSalida, carpetaSalida, videos: videosValidos, resultadoFfmpeg });
  const resultado = {
    ok: videoMaestro.existe,
    tipo: 'union-videos-maestro-multivideo',
    proyectoId,
    totalVideosFuente: videosValidos.length,
    videoMaestro,
    lineaTiempoGlobal,
    rutaLista,
    rutaSalida,
    metodo: resultadoFfmpeg.metodo,
    mensaje: videosValidos.length > 1
      ? `${videosValidos.length} video(s) unidos en un maestro multivideo.`
      : 'Video único copiado como maestro compatible.',
    creadoEn: new Date().toISOString()
  };

  const rutaJson = path.join(carpetaSalida, 'union-videos-maestro.json');
  await escribirJson(rutaJson, { ...resultado, rutaJson });
  return { ...resultado, rutaJson };
}

export default unirVideosMaestroMultivideo;

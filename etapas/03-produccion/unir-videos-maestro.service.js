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

function crearMarcaEjecucion() {
  return `${new Date().toISOString().replace(/[:.]/g, '-').replace('T', '-').replace('Z', '')}-${process.pid || 'app'}`;
}

function limpiarArchivo(rutaArchivo) {
  try {
    if (rutaArchivo && fs.existsSync(rutaArchivo)) fs.unlinkSync(rutaArchivo);
  } catch (error) {
    throw new Error(`No se pudo preparar el archivo de salida: ${rutaArchivo}. El archivo está ocupado o bloqueado por Windows. Detalle: ${error.message}`);
  }
}

function normalizarRutaFfconcat(rutaArchivo) {
  return String(rutaArchivo || '').replace(/\\/g, '/').replace(/'/g, "'\\''");
}

function nombreSeguroVideoMaestro(proyectoId = 'proyecto', marcaEjecucion = crearMarcaEjecucion()) {
  const base = texto(proyectoId, 'proyecto').replace(/[^a-zA-Z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  const marca = texto(marcaEjecucion, crearMarcaEjecucion()).replace(/[^a-zA-Z0-9-_]/g, '-');
  return `${base || 'proyecto'}-maestro-multivideo-${marca}.mp4`;
}

function crearListaConcat(videos = []) {
  return videos.map((video) => `file '${normalizarRutaFfconcat(video.rutaProyecto || video.rutaOriginal)}'`).join('\n');
}

function construirErrorFfmpeg(prefijo, error, stdout = '', stderr = '') {
  const partes = [error?.message || 'Error desconocido de FFmpeg'];
  const salida = String(stdout || '').slice(-800);
  const detalle = String(stderr || '').slice(-1800);
  if (salida) partes.push(`STDOUT: ${salida}`);
  if (detalle) partes.push(`STDERR: ${detalle}`);
  return new Error(`${prefijo}: ${partes.join(' | ')}`);
}

function ejecutarConcatDemuxer({ rutaLista, rutaSalida, metodo = 'concat-demuxer-reencode' }) {
  return new Promise((resolve, reject) => {
    const inicio = Date.now();
    limpiarArchivo(rutaSalida);
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
        '-ar 48000',
        '-ac 2',
        '-movflags +faststart',
        '-y'
      ])
      .on('end', () => resolve({ ok: true, metodo, duracionMs: Date.now() - inicio }))
      .on('error', (error, stdout, stderr) => reject(construirErrorFfmpeg(`FFmpeg no pudo unir videos con ${metodo}`, error, stdout, stderr)))
      .save(rutaSalida);
  });
}

function copiarVideoUnico({ video, rutaSalida }) {
  limpiarArchivo(rutaSalida);
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

function obtenerObjetivoVideo(lineaTiempoGlobal = null) {
  const resumen = lineaTiempoGlobal?.resumen || {};
  const orientacion = texto(resumen.orientacionPredominante, 'horizontal');
  if (orientacion === 'vertical') return { width: 1080, height: 1920, fps: 30, orientacion };
  if (orientacion === 'cuadrada') return { width: 1080, height: 1080, fps: 30, orientacion };
  return { width: 1920, height: 1080, fps: 30, orientacion: orientacion || 'horizontal' };
}

function crearFiltroEstandarizacion({ width, height, fps }) {
  return [
    `scale=${width}:${height}:force_original_aspect_ratio=decrease`,
    `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
    'setsar=1',
    `fps=${fps || 30}`,
    'format=yuv420p'
  ].join(',');
}

function ejecutarEstandarizacionClip({ video, rutaSalida, objetivo }) {
  return new Promise((resolve, reject) => {
    const rutaEntrada = video.rutaProyecto || video.rutaOriginal;
    const inicio = Date.now();
    limpiarArchivo(rutaSalida);
    ffmpeg(rutaEntrada)
      .videoFilters(crearFiltroEstandarizacion(objetivo))
      .outputOptions([
        '-map 0:v:0',
        '-map 0:a:0?',
        '-c:v libx264',
        '-preset veryfast',
        '-crf 23',
        '-pix_fmt yuv420p',
        '-c:a aac',
        '-b:a 128k',
        '-ar 48000',
        '-ac 2',
        '-movflags +faststart',
        '-shortest',
        '-y'
      ])
      .on('end', () => resolve({
        ok: true,
        videoId: video.videoId || video.id || null,
        rutaOriginal: rutaEntrada,
        rutaEstandarizada: rutaSalida,
        metodo: 'clip-estandarizado',
        objetivo,
        duracionMs: Date.now() - inicio
      }))
      .on('error', (error, stdout, stderr) => reject(construirErrorFfmpeg(`FFmpeg no pudo estandarizar ${video.videoId || video.id || path.basename(rutaEntrada)}`, error, stdout, stderr)))
      .save(rutaSalida);
  });
}

async function estandarizarVideosParaConcat({ videos = [], carpetaSalida, lineaTiempoGlobal = null, marcaEjecucion = crearMarcaEjecucion() } = {}) {
  const objetivo = obtenerObjetivoVideo(lineaTiempoGlobal);
  const carpetaClips = asegurarCarpeta(path.join(carpetaSalida, 'clips-estandarizados', marcaEjecucion));
  const clips = [];

  for (const video of videos) {
    const videoId = video.videoId || video.id || `video-${clips.length + 1}`;
    const nombreSeguro = `${String(clips.length + 1).padStart(2, '0')}-${String(videoId).replace(/[^a-zA-Z0-9-_]/g, '-')}.mp4`;
    const rutaSalida = path.join(carpetaClips, nombreSeguro);
    const resultado = await ejecutarEstandarizacionClip({ video, rutaSalida, objetivo });
    clips.push({
      ...video,
      id: videoId,
      videoId,
      rutaOriginalFuente: video.rutaProyecto || video.rutaOriginal,
      rutaProyecto: rutaSalida,
      rutaOriginal: rutaSalida,
      nombreOriginal: video.nombreOriginal || path.basename(video.rutaProyecto || video.rutaOriginal || rutaSalida),
      nombreSeguro: path.basename(rutaSalida),
      estandarizacion: resultado
    });
  }

  return { clips, objetivo, carpetaClips, marcaEjecucion };
}

async function ejecutarUnionConFallback({ videosValidos = [], rutaLista, rutaSalida, carpetaSalida, lineaTiempoGlobal = null, marcaEjecucion = crearMarcaEjecucion() } = {}) {
  try {
    return await ejecutarConcatDemuxer({ rutaLista, rutaSalida, metodo: 'concat-demuxer-reencode' });
  } catch (errorPrimario) {
    const estandarizado = await estandarizarVideosParaConcat({ videos: videosValidos, carpetaSalida, lineaTiempoGlobal, marcaEjecucion });
    const rutaListaEstandarizada = path.join(carpetaSalida, `videos-concat-estandarizados-${marcaEjecucion}.txt`);
    await fs.promises.writeFile(rutaListaEstandarizada, crearListaConcat(estandarizado.clips), 'utf8');
    const resultadoFallback = await ejecutarConcatDemuxer({
      rutaLista: rutaListaEstandarizada,
      rutaSalida,
      metodo: 'fallback-estandarizado-concat-demuxer'
    });
    return {
      ...resultadoFallback,
      errorPrimario: errorPrimario.message,
      rutaListaEstandarizada,
      carpetaClipsEstandarizados: estandarizado.carpetaClips,
      clipsEstandarizados: estandarizado.clips.map((clip) => ({
        videoId: clip.videoId,
        rutaOriginalFuente: clip.rutaOriginalFuente,
        rutaEstandarizada: clip.rutaProyecto,
        nombreSeguro: clip.nombreSeguro
      })),
      objetivoEstandarizacion: estandarizado.objetivo
    };
  }
}

function crearVideoMaestroDesdeSalida({ proyectoId, rutaSalida, carpetaSalida, videos, resultadoFfmpeg, marcaEjecucion }) {
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
    marcaEjecucion,
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

  const marcaEjecucion = crearMarcaEjecucion();
  const carpetaSalida = asegurarCarpeta(path.join(carpetaProyecto, 'produccion', 'maestro-multivideo'));
  const rutaSalida = path.join(carpetaSalida, nombreSeguroVideoMaestro(proyectoId, marcaEjecucion));
  const rutaLista = path.join(carpetaSalida, `videos-concat-${marcaEjecucion}.txt`);
  await fs.promises.writeFile(rutaLista, crearListaConcat(videosValidos), 'utf8');

  let resultadoFfmpeg;
  if (videosValidos.length === 1) {
    resultadoFfmpeg = copiarVideoUnico({ video: videosValidos[0], rutaSalida });
  } else {
    resultadoFfmpeg = await ejecutarUnionConFallback({ videosValidos, rutaLista, rutaSalida, carpetaSalida, lineaTiempoGlobal, marcaEjecucion });
  }

  const videoMaestro = crearVideoMaestroDesdeSalida({ proyectoId, rutaSalida, carpetaSalida, videos: videosValidos, resultadoFfmpeg, marcaEjecucion });
  const resultado = {
    ok: videoMaestro.existe,
    tipo: 'union-videos-maestro-multivideo',
    proyectoId,
    marcaEjecucion,
    totalVideosFuente: videosValidos.length,
    videoMaestro,
    lineaTiempoGlobal,
    rutaLista,
    rutaSalida,
    metodo: resultadoFfmpeg.metodo,
    fallbackAplicado: resultadoFfmpeg.metodo === 'fallback-estandarizado-concat-demuxer',
    resultadoFfmpeg,
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

import fs from 'fs';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import { obtenerInfoFfmpeg } from '../comun/ffmpeg.js';

function resolverRuta(paquete) {
  return typeof paquete === 'string' ? paquete : paquete?.path || null;
}

function existeArchivo(ruta) {
  return Boolean(ruta && fs.existsSync(ruta));
}

export async function verificarFfmpegDiagnostico() {
  const rutaFfmpeg = resolverRuta(ffmpegStatic);
  const rutaFfprobe = resolverRuta(ffprobeStatic);
  const infoCentral = obtenerInfoFfmpeg();
  const errores = [];
  const advertencias = [];

  if (!rutaFfmpeg) errores.push('No se encontró ffmpeg-static.');
  else if (!existeArchivo(rutaFfmpeg)) errores.push(`FFmpeg no existe en disco: ${rutaFfmpeg}`);

  if (!rutaFfprobe) errores.push('No se encontró ffprobe-static.');
  else if (!existeArchivo(rutaFfprobe)) errores.push(`FFprobe no existe en disco: ${rutaFfprobe}`);

  if (!infoCentral?.configurado) {
    advertencias.push(`El módulo comun/ffmpeg.js reporta problemas: ${(infoCentral?.errores || []).join(' ')}`.trim());
  }

  return {
    ok: errores.length === 0,
    bloqueante: errores.length > 0,
    etapa: 'diagnostico-ffmpeg',
    ffmpegPath: rutaFfmpeg,
    ffprobePath: rutaFfprobe,
    central: infoCentral,
    errores,
    advertencias,
    mensaje: errores.length === 0 ? 'FFmpeg y FFprobe están disponibles.' : `FFmpeg no está listo: ${errores.join(' ')}`,
    creadoEn: new Date().toISOString()
  };
}

export default verificarFfmpegDiagnostico;

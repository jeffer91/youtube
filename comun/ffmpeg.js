/*
  Nombre completo: ffmpeg.js
  Ruta o ubicación: AutoVideoJeff/comun/ffmpeg.js
  Función o funciones:
    - Centralizar el uso de FFmpeg en toda la app.
    - Configurar ffmpeg-static y ffprobe-static.
    - Ejecutar la generación final del video usando un filtro de video.
    - Evitar que cada módulo escriba comandos FFmpeg por separado.
  Con qué se conecta:
    - entender/analisis-simple/analisis.service.js
    - salida/exportar-simple/exportar.service.js
    - package.json
*/

import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';

ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);

export function exportarConFfmpeg({
  rutaEntrada,
  rutaSalida,
  filtroVideo,
  codecVideo = 'libx264',
  codecAudio = 'aac',
  crf = 23,
  presetFfmpeg = 'veryfast'
}) {
  return new Promise((resolve, reject) => {
    const comando = ffmpeg(rutaEntrada)
      .videoFilters(filtroVideo)
      .outputOptions([
        '-map 0:v:0',
        '-map 0:a?',
        `-c:v ${codecVideo}`,
        `-preset ${presetFfmpeg}`,
        `-crf ${crf}`,
        `-c:a ${codecAudio}`,
        '-b:a 160k',
        '-movflags +faststart',
        '-pix_fmt yuv420p',
        '-shortest'
      ])
      .on('end', () => {
        resolve({
          ok: true,
          rutaSalida
        });
      })
      .on('error', (error) => {
        reject(new Error(`FFmpeg no pudo generar el video: ${error.message}`));
      });

    comando.save(rutaSalida);
  });
}

export function obtenerInfoFfmpeg() {
  return {
    ffmpegPath: ffmpegStatic,
    ffprobePath: ffprobeStatic.path,
    configurado: Boolean(ffmpegStatic && ffprobeStatic.path)
  };
}

/*
  Nombre completo: tiktok-cuadrado-centro.config.js
  Ruta o ubicación: youtube/editar/tiktok-cuadrado-centro/tiktok-cuadrado-centro.config.js

  Función o funciones:
    - Definir la configuración central del preset TikTok cuadrado centrado.
    - Mantener en un solo lugar las medidas de salida, calidad, FPS y color de franjas.
    - Permitir que el preset crezca sin tocar la lógica interna de cada función.

  Con qué se conecta:
    - editar/tiktok-cuadrado-centro/normalizar-medidas-video.js
    - editar/tiktok-cuadrado-centro/calcular-lienzo-vertical.js
    - editar/tiktok-cuadrado-centro/construir-filtro-ffmpeg.js
    - editar/tiktok-cuadrado-centro/tiktok-cuadrado-centro.service.js
*/

export const TIKTOK_CUADRADO_CENTRO_CONFIG = Object.freeze({
  nombre: 'tiktok-cuadrado-centro',
  version: '1.0.0',
  plataforma: 'tiktok',
  modo: 'cuadrado-centro',

  descripcion:
    'Convierte videos horizontales o verticales a TikTok 9:16 usando un recorte cuadrado centrado y franjas negras arriba y abajo.',

  video: {
    formato: '9:16',

    /*
      Salida final compatible con TikTok, Reels y Shorts.
      El video final tendrá 1080 de ancho por 1920 de alto.
    */
    width: 1080,
    height: 1920,

    /*
      El contenido principal se deja cuadrado y centrado.
      Esto evita cortes agresivos tipo zoom vertical.
    */
    contenidoWidth: 1080,
    contenidoHeight: 1080,

    /*
      FPS fijo para una exportación estable.
      Si el video original tiene FPS raro, se normaliza a 30.
    */
    fps: 30,

    /*
      Franjas superior e inferior.
      black es aceptado directamente por FFmpeg.
    */
    colorFondo: 'black',

    /*
      Relación de aspecto de píxel.
      setsar=1 evita deformaciones en reproductores.
    */
    sar: 1
  },

  recorte: {
    tipo: 'cuadrado-centrado',
    estrategia: 'usar-el-lado-menor',
    mantenerCentro: true
  },

  exportacion: {
    codecVideo: 'libx264',
    codecAudio: 'aac',
    crf: 20,
    presetFfmpeg: 'veryfast',
    audioBitrate: '128k',
    pixFmt: 'yuv420p'
  },

  archivos: {
    nombreEdicion: 'edicion-tiktok-cuadrado-centro.json',
    prefijoExportado: 'tiktok-cuadrado-centro'
  },

  notas: [
    'Este preset no estira el video.',
    'Primero recorta el centro en formato cuadrado.',
    'Luego escala el cuadrado a 1080x1080.',
    'Finalmente monta el cuadrado sobre un lienzo vertical 1080x1920 con franjas negras arriba y abajo.'
  ]
});

export function obtenerConfigTikTokCuadradoCentro() {
  /*
    Se devuelve una copia para evitar que otros módulos modifiquen
    accidentalmente la configuración base.
  */
  return JSON.parse(JSON.stringify(TIKTOK_CUADRADO_CENTRO_CONFIG));
}
/*
  Bloque 11
  Funcion: configuracion para render final real por plataforma.
*/

export const RENDER_PLATAFORMAS_CONFIG = Object.freeze({
  version: '1.0.0',
  carpetaExportados: 'datos/videos-exportados',
  codecVideo: 'libx264',
  codecAudio: 'aac',
  crf: 23,
  presetFfmpeg: 'veryfast',
  audioBitrate: '192k',
  estrategiaAjuste: 'contener_con_fondo_negro',
  renderizarBaseOtraVez: false,
  formatos: Object.freeze({
    '9:16': Object.freeze({ width: 1080, height: 1920 }),
    '16:9': Object.freeze({ width: 1920, height: 1080 }),
    '1:1': Object.freeze({ width: 1080, height: 1080 })
  })
});

export function obtenerFormatoRender(formato = '9:16') {
  return RENDER_PLATAFORMAS_CONFIG.formatos[formato] || RENDER_PLATAFORMAS_CONFIG.formatos['9:16'];
}

/*
  Modulo: exportacion
  Funcion: plataformas, tamanos y zonas seguras de salida.
*/

export const PLATAFORMAS_EXPORTACION = Object.freeze({
  tiktok: Object.freeze({
    id: 'tiktok',
    nombre: 'TikTok',
    formato: '9:16',
    width: 1080,
    height: 1920,
    fps: 30,
    zonaSegura: Object.freeze({ top: 170, bottom: 300, left: 80, right: 80 }),
    subtitulos: 'dinamicos_con_contorno'
  }),
  reels: Object.freeze({
    id: 'reels',
    nombre: 'Instagram Reels',
    formato: '9:16',
    width: 1080,
    height: 1920,
    fps: 30,
    zonaSegura: Object.freeze({ top: 170, bottom: 280, left: 80, right: 80 }),
    subtitulos: 'dinamicos_con_contorno'
  }),
  shorts: Object.freeze({
    id: 'shorts',
    nombre: 'YouTube Shorts',
    formato: '9:16',
    width: 1080,
    height: 1920,
    fps: 30,
    zonaSegura: Object.freeze({ top: 170, bottom: 260, left: 80, right: 80 }),
    subtitulos: 'dinamicos_con_contorno'
  }),
  youtube: Object.freeze({
    id: 'youtube',
    nombre: 'YouTube horizontal',
    formato: '16:9',
    width: 1920,
    height: 1080,
    fps: 30,
    zonaSegura: Object.freeze({ top: 80, bottom: 150, left: 120, right: 120 }),
    subtitulos: 'frases_claras_con_contorno'
  }),
  facebook: Object.freeze({
    id: 'facebook',
    nombre: 'Facebook',
    formato: '16:9',
    width: 1920,
    height: 1080,
    fps: 30,
    zonaSegura: Object.freeze({ top: 90, bottom: 150, left: 120, right: 120 }),
    subtitulos: 'frases_claras_con_contorno'
  }),
  instagram: Object.freeze({
    id: 'instagram',
    nombre: 'Instagram cuadrado',
    formato: '1:1',
    width: 1080,
    height: 1080,
    fps: 30,
    zonaSegura: Object.freeze({ top: 110, bottom: 170, left: 90, right: 90 }),
    subtitulos: 'compactos_con_contorno'
  })
});

export const PLATAFORMAS_DEFECTO = ['tiktok', 'reels', 'shorts', 'youtube'];

export function obtenerIdsPlataformas() {
  return Object.keys(PLATAFORMAS_EXPORTACION);
}

export function obtenerPlataformaExportacion(plataformaId) {
  return PLATAFORMAS_EXPORTACION[plataformaId] || null;
}

/*
  Bloque 11
  Funcion: construir filtros FFmpeg para adaptar el video a cada formato final.
*/

import { obtenerFormatoRender } from './render-plataformas.config.js';

export function crearFiltroContenerFormato({ formato = '9:16', width = null, height = null } = {}) {
  const dimensiones = width && height ? { width, height } : obtenerFormatoRender(formato);
  const w = Number(dimensiones.width);
  const h = Number(dimensiones.height);
  if (!w || !h) throw new Error(`Dimensiones invalidas para formato ${formato}.`);

  return [
    `scale=${w}:${h}:force_original_aspect_ratio=decrease`,
    `pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:black`,
    'setsar=1'
  ].join(',');
}

export function crearNombreExportacionPlataforma({ nombreBase = 'video', plataforma = 'tiktok', formato = '9:16' } = {}) {
  const limpio = String(nombreBase || 'video').replace(/\.[a-z0-9]+$/i, '').replace(/[^a-zA-Z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  const formatoLimpio = String(formato).replace(':', 'x');
  return `${limpio}-${plataforma}-${formatoLimpio}.mp4`;
}

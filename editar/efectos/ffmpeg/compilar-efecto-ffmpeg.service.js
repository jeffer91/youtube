/*
  Bloque 4: Compilador FFmpeg de efectos
  Funcion: convertir un efecto planificado en un filtro FFmpeg simple y seguro.
*/

import { obtenerRecetaFfmpeg, TIPOS_RECETA_FFMPEG } from './efectos-ffmpeg.recetas.js';

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function textoSeguro(valor = '') {
  return String(valor || '')
    .replace(/\\/g, ' ')
    .replace(/'/g, '’')
    .replace(/:/g, ' ')
    .replace(/\[/g, '(')
    .replace(/\]/g, ')')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 64);
}

function posicionY(posicion = 'centro') {
  if (posicion === 'superior') return 'h*0.16';
  if (posicion === 'inferior') return 'h*0.76';
  return '(h-text_h)/2';
}

function construirEnable(efecto = {}) {
  const inicio = numero(efecto.inicio, 0).toFixed(3);
  const fin = numero(efecto.fin, numero(efecto.inicio, 0) + 1.8).toFixed(3);
  return `between(t\,${inicio}\,${fin})`;
}

function filtroZoom({ receta, width = 1080, height = 1920 }) {
  const factor = Math.max(0.94, Math.min(0.995, numero(receta.factor, 0.982)));
  const ancho = Math.max(2, Math.round(numero(width, 1080) * factor / 2) * 2);
  const alto = Math.max(2, Math.round(numero(height, 1920) * factor / 2) * 2);
  return `crop=w=${ancho}:h=${alto}:x=(iw-ow)/2:y=(ih-oh)/2,scale=${Math.round(numero(width, 1080))}:${Math.round(numero(height, 1920))}`;
}

function filtroColor({ receta }) {
  const contraste = numero(receta.contraste, 1.06).toFixed(2);
  const saturacion = numero(receta.saturacion, 1.06).toFixed(2);
  const brillo = numero(receta.brillo, 0.010).toFixed(3);
  return `eq=contrast=${contraste}:saturation=${saturacion}:brightness=${brillo}`;
}

function filtroNitidez({ receta }) {
  const fuerza = Math.max(0.08, Math.min(0.80, numero(receta.fuerza, 0.30))).toFixed(2);
  return `unsharp=3:3:${fuerza}:3:3:0.08`;
}

function filtroTexto({ receta, efecto }) {
  const texto = textoSeguro(efecto.texto || efecto.nombre || receta.texto || efecto.efectoId);
  if (!texto) return null;
  const tamano = Math.max(24, Math.min(72, Math.round(numero(receta.tamano, 48))));
  return [
    'drawtext',
    `text='${texto}'`,
    'x=(w-text_w)/2',
    `y=${posicionY(receta.posicion)}`,
    `fontsize=${tamano}`,
    'fontcolor=white',
    'borderw=4',
    'bordercolor=black@0.88',
    'shadowcolor=black@0.55',
    'shadowx=2',
    'shadowy=2',
    'box=1',
    'boxcolor=black@0.42',
    'boxborderw=14',
    `enable='${construirEnable(efecto)}'`
  ].join(':');
}

function filtroCaja({ receta }) {
  const grosor = Math.max(3, Math.min(18, Math.round(numero(receta.grosor, 6))));
  const opacidad = Math.max(0.04, Math.min(0.35, numero(receta.opacidad, 0.12))).toFixed(2);
  if (receta.zona === 'inferior') return `drawbox=x=0:y=ih*0.72:w=iw:h=ih*0.28:color=black@${opacidad}:t=fill`;
  return `drawbox=x=0:y=0:w=iw:h=ih:color=white@${opacidad}:t=${grosor}`;
}

function filtroBarra({ receta, duracionVideo = 0 }) {
  const duracion = Math.max(0.1, numero(duracionVideo, 0.1));
  const alto = Math.max(4, Math.min(24, Math.round(numero(receta.alto, 12))));
  return `drawbox=x=0:y=0:w='iw*min(t/${duracion.toFixed(3)}\,1)':h=${alto}:color=white@0.58:t=fill`;
}

function filtroFade({ receta, efecto, duracionVideo = 0 }) {
  const modo = receta.modo === 'out' ? 'out' : 'in';
  const duracion = Math.max(0.4, Math.min(1.2, numero(efecto.duracion, 0.8)));
  const inicio = modo === 'out' ? Math.max(0, numero(duracionVideo, 0) - duracion - 0.1) : numero(efecto.inicio, 0);
  return `fade=t=${modo}:st=${inicio.toFixed(3)}:d=${duracion.toFixed(3)}`;
}

export function compilarEfectoFfmpeg(efecto = {}, contexto = {}) {
  const receta = obtenerRecetaFfmpeg(efecto.efectoId || efecto.id);
  if (!receta) return { ok: false, omitido: true, efecto, filtro: null, motivo: 'No existe receta FFmpeg para el efecto.' };

  const base = { receta, efecto, width: contexto.width || 1080, height: contexto.height || 1920, duracionVideo: contexto.duracionSegundos || 0 };
  let filtro = null;

  if (receta.tipo === TIPOS_RECETA_FFMPEG.ZOOM) filtro = filtroZoom(base);
  if (receta.tipo === TIPOS_RECETA_FFMPEG.COLOR) filtro = filtroColor(base);
  if (receta.tipo === TIPOS_RECETA_FFMPEG.NITIDEZ) filtro = filtroNitidez(base);
  if (receta.tipo === TIPOS_RECETA_FFMPEG.TEXTO || receta.tipo === TIPOS_RECETA_FFMPEG.MARCA) filtro = filtroTexto(base);
  if (receta.tipo === TIPOS_RECETA_FFMPEG.CAJA) filtro = filtroCaja(base);
  if (receta.tipo === TIPOS_RECETA_FFMPEG.BARRA) filtro = filtroBarra(base);
  if (receta.tipo === TIPOS_RECETA_FFMPEG.FADE) filtro = filtroFade(base);
  if (receta.tipo === TIPOS_RECETA_FFMPEG.VINETA) filtro = 'vignette';
  if (receta.tipo === TIPOS_RECETA_FFMPEG.BLUR) filtro = 'gblur=sigma=1.2';

  return {
    ok: Boolean(filtro),
    omitido: !filtro,
    efecto,
    receta,
    filtro,
    motivo: filtro ? 'Efecto compilado.' : 'La receta no genero filtro.'
  };
}

export default compilarEfectoFfmpeg;

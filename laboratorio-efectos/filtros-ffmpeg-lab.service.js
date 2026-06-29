/*
  Laboratorio de efectos - Bloque 2
  Función: convertir un efecto del catálogo en una cadena FFmpeg visible y segura.
*/

import { obtenerEfectoLabPorId, validarEfectoLab } from './catalogo-efectos-lab.js';

export const VERSION_FILTROS_FFMPEG_LAB = '1.0.0';

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function texto(valor, respaldo = '') {
  const limpio = String(valor ?? '').replace(/\s+/g, ' ').trim();
  return limpio || respaldo;
}

function limpiarTextoDrawtext(valor = '') {
  return texto(valor, 'EFECTO').replace(/[\\']/g, '').replace(/:/g, ' ').slice(0, 42);
}

function intensidadFactor(intensidad = 'normal') {
  const valor = texto(intensidad, 'normal').toLowerCase();
  if (valor === 'suave') return 0.72;
  if (valor === 'fuerte') return 1.28;
  return 1;
}

function enableEntre(inicio = 0, duracion = 1) {
  const desde = Math.max(0, numero(inicio, 0));
  const hasta = Math.max(desde + 0.2, desde + numero(duracion, 1));
  return `between(t\,${desde.toFixed(3)}\,${hasta.toFixed(3)})`;
}

function filtroBase() {
  return 'scale=trunc(iw/2)*2:trunc(ih/2)*2,setsar=1';
}

function filtroZoomEstatico(factor = 1.1) {
  const z = Math.max(1.01, Math.min(1.35, numero(factor, 1.1)));
  return `scale=trunc(iw*${z.toFixed(3)}/2)*2:trunc(ih*${z.toFixed(3)}/2)*2,crop=trunc(iw/${z.toFixed(3)}/2)*2:trunc(ih/${z.toFixed(3)}/2)*2:(iw-ow)/2:(ih-oh)/2`;
}

function filtroZoomOut(factor = 1.1) {
  const z = Math.max(1.01, Math.min(1.25, numero(factor, 1.1)));
  return `scale=trunc(iw*${z.toFixed(3)}/2)*2:trunc(ih*${z.toFixed(3)}/2)*2,crop=trunc(iw/${z.toFixed(3)}/2)*2:trunc(ih/${z.toFixed(3)}/2)*2:(iw-ow)/2:(ih-oh)/2`;
}

function filtroFlash({ color = 'white@0.45', inicio = 1, duracion = 0.5 } = {}) {
  return `drawbox=x=0:y=0:w=iw:h=ih:color=${color}:t=fill:enable='${enableEntre(inicio, duracion)}'`;
}

function filtroBarras({ color = 'white@0.55', inicio = 1, duracion = 0.6, grosor = 18 } = {}) {
  const e = enableEntre(inicio, duracion);
  const g = Math.max(8, Math.min(70, numero(grosor, 18)));
  return `drawbox=x=0:y=h*0.08:w=iw:h=${g}:color=${color}:t=fill:enable='${e}',drawbox=x=0:y=h*0.90:w=iw:h=${g}:color=${color}:t=fill:enable='${e}'`;
}

function filtroMarco({ color = 'white@0.55', grosor = 8 } = {}) {
  const g = Math.max(3, Math.min(40, numero(grosor, 8)));
  return `drawbox=x=0:y=0:w=iw:h=ih:color=${color}:t=${g}`;
}

function filtroTexto({ textoEfecto = 'EFECTO', posicion = 'centro', inicio = 0.5, duracion = 2, tamano = 54, caja = true, colorCaja = 'black@0.38' } = {}) {
  const t = limpiarTextoDrawtext(textoEfecto).toUpperCase();
  const size = Math.max(24, Math.min(96, numero(tamano, 54)));
  const e = enableEntre(inicio, duracion);
  const y = posicion === 'superior'
    ? 'h*0.12'
    : posicion === 'inferior'
      ? 'h*0.76'
      : posicion === 'subtitulo'
        ? 'h*0.82'
        : '(h-text_h)/2';
  const x = '(w-text_w)/2';
  const partes = [
    'drawtext',
    `text='${t}'`,
    `x=${x}`,
    `y=${y}`,
    `fontsize=${size}`,
    'fontcolor=white',
    'borderw=5',
    'bordercolor=black@0.86',
    'shadowcolor=black@0.58',
    'shadowx=3',
    'shadowy=3'
  ];
  if (caja) partes.push('box=1', `boxcolor=${colorCaja}`, 'boxborderw=18');
  partes.push(`enable='${e}'`);
  return partes.join(':');
}

function filtroWipe({ inicio = 1, duracion = 0.7, color = 'white@0.62' } = {}) {
  const desde = Math.max(0, numero(inicio, 0));
  const dur = Math.max(0.2, numero(duracion, 0.7));
  const hasta = desde + dur;
  return `drawbox=x='-w+(2*w*((t-${desde.toFixed(3)})/${dur.toFixed(3)}))':y=0:w=iw:h=ih:color=${color}:t=fill:enable='between(t\,${desde.toFixed(3)}\,${hasta.toFixed(3)})'`;
}

function filtroRebote({ inicio = 2, duracion = 0.8, amplitud = 14 } = {}) {
  const e = enableEntre(inicio, duracion);
  const a = Math.max(4, Math.min(40, numero(amplitud, 14)));
  return `crop=w=iw-${a * 2}:h=ih-${a * 2}:x='${a}+${a}*sin(80*t)':y='${a}+${Math.round(a * 0.7)}*cos(70*t)':enable='${e}',scale=trunc(iw/2)*2:trunc(ih/2)*2`;
}

function filtroColorPorEfecto(efectoId, factor = 1) {
  const f = Math.max(0.5, Math.min(1.6, factor));
  if (efectoId === 'look-cine-calido') return `eq=contrast=${(1.06 * f).toFixed(2)}:brightness=0.01:saturation=${(1.12 * f).toFixed(2)},colorbalance=rs=.06:gs=.02:bs=-.04`;
  if (efectoId === 'blanco-negro-drama') return 'hue=s=0,eq=contrast=1.18:brightness=0.00';
  if (efectoId === 'contraste-redes') return `eq=contrast=${(1.16 * f).toFixed(2)}:brightness=0.015:saturation=${(1.18 * f).toFixed(2)}`;
  if (efectoId === 'viñeta-cine' || efectoId === 'foco-centro') return 'vignette=PI/4:eval=frame';
  if (efectoId === 'look-shorts-brillante') return 'eq=contrast=1.10:brightness=0.025:saturation=1.20';
  return 'eq=contrast=1.06:brightness=0.005:saturation=1.08';
}

function construirFiltrosPorId({ efecto, textoPersonalizado = '', intensidad = null } = {}) {
  const id = efecto.id;
  const p = efecto.parametros || {};
  const factor = intensidadFactor(intensidad || efecto.intensidadBase);
  const inicio = numero(efecto.segundoInicioPrueba, 0.8);
  const textoFinal = textoPersonalizado || efecto.textoPrueba || efecto.nombre;

  switch (id) {
    case 'zoom-in-centro': return [filtroZoomEstatico(1.12 * factor)];
    case 'zoom-out-centro': return [filtroZoomOut(1.10 * factor)];
    case 'zoom-pulso': return [filtroZoomEstatico(1.06 * factor), filtroFlash({ color: 'white@0.12', inicio, duracion: 0.8 })];
    case 'punch-in-rapido': return [filtroZoomEstatico(1.18 * factor), filtroFlash({ color: 'white@0.18', inicio, duracion: 0.35 })];
    case 'zoom-dramatico-final': return [filtroZoomEstatico(1.22 * factor), filtroTexto({ textoEfecto: 'FINAL', posicion: 'centro', inicio, duracion: 1.2, tamano: 54 })];
    case 'shake-suave': return [filtroRebote({ inicio, duracion: p.duracion || 0.55, amplitud: 10 * factor })];
    case 'flash-blanco-impacto': return [filtroFlash({ color: p.color || 'white@0.55', inicio, duracion: p.duracion || 0.45 })];
    case 'golpe-rojo': return [filtroFlash({ color: p.color || 'red@0.38', inicio, duracion: p.duracion || 0.5 })];
    case 'explosion-texto-boom': return [filtroFlash({ color: 'red@0.20', inicio, duracion: 0.9 }), filtroTexto({ textoEfecto: textoFinal, posicion: 'centro', inicio, duracion: p.duracion || 0.9, tamano: p.fuenteTamano || 82, colorCaja: 'red@0.28' })];
    case 'flash-barras-cine': return [filtroFlash({ color: 'white@0.34', inicio, duracion: p.duracion || 0.55 }), filtroBarras({ inicio, duracion: p.duracion || 0.55 })];
    case 'transicion-flash-blanco': return [filtroFlash({ color: p.color || 'white@0.60', inicio, duracion: p.duracion || 0.5 })];
    case 'transicion-fundido-negro': return [filtroFlash({ color: p.color || 'black@0.62', inicio, duracion: p.duracion || 0.65 })];
    case 'transicion-barras-horizontales': return [filtroBarras({ inicio, duracion: p.duracion || 0.6, grosor: p.grosor || 20 })];
    case 'transicion-glitch-rgb': return [filtroFlash({ color: p.color || 'magenta@0.22', inicio, duracion: p.duracion || 0.55 }), 'eq=saturation=1.45:contrast=1.10'];
    case 'transicion-wipe-lateral': return [filtroWipe({ inicio, duracion: p.duracion || 0.7 })];
    case 'paneo-suave-horizontal': return [filtroZoomEstatico(1.04), filtroMarco({ color: 'white@0.18', grosor: 4 })];
    case 'pulso-camara-suave': return [filtroZoomEstatico(1.035), filtroFlash({ color: 'white@0.10', inicio: 0.8, duracion: 1.2 })];
    case 'foco-centro': return [filtroColorPorEfecto(id, factor)];
    case 'rebote-mini': return [filtroRebote({ inicio, duracion: p.duracion || 0.8, amplitud: p.amplitud || 14 })];
    case 'camara-energia-redes': return [filtroZoomEstatico(1.08), filtroBarras({ color: 'white@0.18', inicio: 0.3, duracion: 0.7, grosor: 10 })];
    case 'look-cine-calido':
    case 'blanco-negro-drama':
    case 'contraste-redes':
    case 'viñeta-cine':
    case 'look-shorts-brillante': return [filtroColorPorEfecto(id, factor)];
    case 'luz-flash-suave': return [filtroColorPorEfecto('contraste-redes', 0.8), filtroFlash({ color: p.color || 'white@0.24', inicio, duracion: p.duracion || 0.8 })];
    case 'titulo-centro-grande': return [filtroTexto({ textoEfecto: textoFinal, posicion: 'centro', inicio, duracion: p.duracion || 2.2, tamano: p.fuenteTamano || 64 })];
    case 'lower-third-simple': return [filtroTexto({ textoEfecto: textoFinal, posicion: 'inferior', inicio, duracion: p.duracion || 3.0, tamano: p.fuenteTamano || 46 })];
    case 'subtitulo-muestra': return [filtroTexto({ textoEfecto: textoFinal, posicion: 'subtitulo', inicio, duracion: p.duracion || 4.0, tamano: p.fuenteTamano || 42, caja: false })];
    case 'etiqueta-superior': return [filtroTexto({ textoEfecto: textoFinal, posicion: 'superior', inicio, duracion: p.duracion || 3.0, tamano: p.fuenteTamano || 34 })];
    case 'texto-alerta-rojo': return [filtroTexto({ textoEfecto: textoFinal, posicion: 'centro', inicio, duracion: p.duracion || 1.8, tamano: p.fuenteTamano || 58, colorCaja: p.colorCaja || 'red@0.35' })];
    case 'formato-viral-gancho': return [filtroZoomEstatico(1.06), filtroTexto({ textoEfecto: textoFinal, posicion: 'superior', inicio, duracion: p.duracionTexto || 2.4, tamano: 48, colorCaja: 'blue@0.38' })];
    case 'barras-cinematograficas': return [`drawbox=x=0:y=0:w=iw:h=ih*${numero(p.altoRelativo, 0.08)}:color=black@0.88:t=fill,drawbox=x=0:y=ih-ih*${numero(p.altoRelativo, 0.08)}:w=iw:h=ih*${numero(p.altoRelativo, 0.08)}:color=black@0.88:t=fill`];
    case 'marco-social': return [filtroMarco({ color: p.color || 'white@0.55', grosor: p.grosor || 8 })];
    case 'callout-superior': return [filtroTexto({ textoEfecto: textoFinal, posicion: 'superior', inicio, duracion: p.duracion || 2.5, tamano: p.fuenteTamano || 48, colorCaja: 'black@0.42' })];
    default: return [filtroFlash({ color: 'white@0.25', inicio, duracion: 0.6 }), filtroTexto({ textoEfecto: efecto.nombre, posicion: 'centro', inicio, duracion: 1.4 })];
  }
}

export function construirFiltroFfmpegLaboratorio({ efectoId, textoPersonalizado = '', intensidad = null } = {}) {
  const efecto = obtenerEfectoLabPorId(efectoId);
  const validacion = validarEfectoLab(efecto);
  if (!validacion.ok) throw new Error(validacion.mensaje);
  const filtros = [filtroBase(), ...construirFiltrosPorId({ efecto, textoPersonalizado, intensidad }), 'format=yuv420p'].filter(Boolean);
  return {
    ok: true,
    tipo: 'filtro-ffmpeg-laboratorio-efectos',
    version: VERSION_FILTROS_FFMPEG_LAB,
    efecto,
    filtroVideo: filtros.join(','),
    filtros,
    queDebeSalir: efecto.queDebeSalir,
    compatibleFfmpeg: efecto.compatibleFfmpeg,
    requiereTexto: efecto.requiereTexto,
    textoUsado: textoPersonalizado || efecto.textoPrueba || '',
    intensidadUsada: intensidad || efecto.intensidadBase,
    mensaje: `Filtro listo para probar: ${efecto.nombre}.`
  };
}

export default construirFiltroFfmpegLaboratorio;

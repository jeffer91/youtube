/*
  Laboratorio de efectos - filtros FFmpeg
  Función: convertir un efecto del catálogo en una cadena FFmpeg visible, segura y validada.
*/

import { obtenerEfectoLabPorId, validarEfectoLab } from './catalogo-efectos-lab.js';

export const VERSION_FILTROS_FFMPEG_LAB = '1.1.5';

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function texto(valor, respaldo = '') {
  const limpio = String(valor ?? '').replace(/\s+/g, ' ').trim();
  return limpio || respaldo;
}

function limpiarTextoDrawtext(valor = '') {
  return texto(valor, 'EFECTO')
    .replace(/[\\'":%{}[\]]/g, '')
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 42) || 'EFECTO';
}

function intensidadFactor(intensidad = 'normal') {
  const valor = texto(intensidad, 'normal').toLowerCase();
  if (valor === 'suave') return 0.72;
  if (valor === 'fuerte') return 1.28;
  return 1;
}

function inicioVisible(valor = 0.8, maximo = 1.8) {
  return Math.max(0.2, Math.min(numero(valor, 0.8), maximo));
}

function duracionVisible(valor = 0.7, minimo = 0.25, maximo = 2.4) {
  return Math.max(minimo, Math.min(numero(valor, 0.7), maximo));
}

function enableEntre(inicio = 0, duracion = 1) {
  const desde = Math.max(0, numero(inicio, 0));
  const hasta = Math.max(desde + 0.2, desde + duracionVisible(duracion, 0.2, 3.0));
  return `between(t,${desde.toFixed(3)},${hasta.toFixed(3)})`;
}

function cuadroDesdeSegundo(segundo = 0) {
  return Math.round(Math.max(0, numero(segundo, 0)) * 30);
}

function compuertaFrames(inicioFrame = 0, finFrame = 1) {
  const desde = Math.max(0, Math.round(numero(inicioFrame, 0)));
  const hasta = Math.max(desde + 1, Math.round(numero(finFrame, desde + 1)));
  return `(gte(on\,${desde})*lte(on\,${hasta}))`;
}

function compuertaTiempo(inicio = 0, duracion = 1) {
  const desde = Math.max(0, numero(inicio, 0));
  const hasta = desde + duracionVisible(duracion, 0.2, 3.0);
  return `(gte(t\,${desde.toFixed(3)})*lte(t\,${hasta.toFixed(3)}))`;
}

function filtroBase() {
  return 'scale=trunc(iw/2)*2:trunc(ih/2)*2,setsar=1';
}

function filtroZoompanCentro({ expresionZoom = '1.000', expresionX = null, expresionY = null } = {}) {
  const x = expresionX || 'iw/2-(iw/zoom/2)';
  const y = expresionY || 'ih/2-(ih/zoom/2)';
  return [
    'fps=30',
    `zoompan=z='${expresionZoom}':d=1:x='${x}':y='${y}':s=720x1280:fps=30`,
    'setsar=1'
  ].join(',');
}

function filtroZoomInCentroProgresivo(factor = 1.38) {
  const z = Math.max(1.18, Math.min(1.58, numero(factor, 1.38)));
  const incrementoPorFrame = Math.max(0.0024, Math.min(0.0048, (z - 1) / 120));
  return filtroZoompanCentro({ expresionZoom: `min(1+on*${incrementoPorFrame.toFixed(5)}\,${z.toFixed(3)})` });
}

function filtroZoomOutCentroProgresivo(factor = 1.32) {
  const zInicio = Math.max(1.16, Math.min(1.55, numero(factor, 1.32)));
  const decrementoPorFrame = Math.max(0.0018, Math.min(0.0042, (zInicio - 1) / 120));
  return filtroZoompanCentro({ expresionZoom: `max(${zInicio.toFixed(3)}-on*${decrementoPorFrame.toFixed(5)}\,1.000)` });
}

function filtroZoomPulsoProgresivo({ amplitud = 0.055, base = 1.06, velocidad = 0.18 } = {}) {
  const a = Math.max(0.018, Math.min(0.12, numero(amplitud, 0.055)));
  const b = Math.max(1.02, Math.min(1.16, numero(base, 1.06)));
  const v = Math.max(0.08, Math.min(0.35, numero(velocidad, 0.18)));
  return filtroZoompanCentro({ expresionZoom: `max(1.000\,${b.toFixed(3)}+${a.toFixed(3)}*sin(on*${v.toFixed(3)}))` });
}

function filtroPunchInProgresivo({ inicio = 1.0, duracion = 0.75, factor = 1.26 } = {}) {
  const desde = cuadroDesdeSegundo(inicioVisible(inicio, 2.2));
  const frames = Math.max(12, Math.round(duracionVisible(duracion, 0.35, 1.2) * 30));
  const hasta = desde + frames;
  const gate = compuertaFrames(desde, hasta);
  const amp = Math.max(0.12, Math.min(0.36, numero(factor, 1.26) - 1));
  return filtroZoompanCentro({ expresionZoom: `1+${gate}*${amp.toFixed(3)}*sin((on-${desde})*PI/${frames})` });
}

function filtroZoomFinalProgresivo({ inicio = 1.2, factor = 1.42 } = {}) {
  const desde = cuadroDesdeSegundo(inicioVisible(inicio, 1.4));
  const z = Math.max(1.20, Math.min(1.58, numero(factor, 1.42)));
  const incremento = Math.max(0.0026, Math.min(0.0050, (z - 1) / 110));
  const gate = `(gte(on\,${desde}))`;
  return filtroZoompanCentro({ expresionZoom: `min(1+${gate}*(on-${desde})*${incremento.toFixed(5)}\,${z.toFixed(3)})` });
}

function filtroPaneoHorizontalProgresivo({ factor = 1.12, velocidad = 0.018 } = {}) {
  const z = Math.max(1.06, Math.min(1.22, numero(factor, 1.12)));
  const v = Math.max(0.006, Math.min(0.035, numero(velocidad, 0.018)));
  return filtroZoompanCentro({
    expresionZoom: z.toFixed(3),
    expresionX: `(iw-iw/zoom)*(0.5+0.45*sin(on*${v.toFixed(3)}))`,
    expresionY: 'ih/2-(ih/zoom/2)'
  });
}

function filtroCamaraEnergia({ amplitud = 0.075, velocidad = 0.23 } = {}) {
  const a = Math.max(0.035, Math.min(0.13, numero(amplitud, 0.075)));
  const v = Math.max(0.12, Math.min(0.36, numero(velocidad, 0.23)));
  return filtroZoompanCentro({
    expresionZoom: `max(1.000\,1.075+${a.toFixed(3)}*sin(on*${v.toFixed(3)}))`,
    expresionX: `(iw-iw/zoom)*(0.5+0.32*sin(on*${(v * 0.72).toFixed(3)}))`,
    expresionY: `(ih-ih/zoom)*(0.5+0.22*cos(on*${(v * 0.84).toFixed(3)}))`
  });
}

function filtroZoomCentroVisible(factor = 1.18) {
  const z = Math.max(1.08, Math.min(1.45, numero(factor, 1.18)));
  return [
    `scale=trunc(iw*${z.toFixed(3)}/2)*2:trunc(ih*${z.toFixed(3)}/2)*2`,
    `crop=trunc(iw/${z.toFixed(3)}/2)*2:trunc(ih/${z.toFixed(3)}/2)*2:(iw-ow)/2:(ih-oh)/2`,
    'setsar=1'
  ].join(',');
}

function filtroFlash({ color = 'white@0.45', inicio = 1, duracion = 0.5 } = {}) {
  return `drawbox=x=0:y=0:w=iw:h=ih:color=${color}:t=fill:enable='${enableEntre(inicioVisible(inicio, 2.2), duracion)}'`;
}

function filtroBarras({ color = 'white@0.55', inicio = 1, duracion = 0.6, grosor = 18 } = {}) {
  const e = enableEntre(inicioVisible(inicio, 2.2), duracion);
  const g = Math.max(8, Math.min(70, numero(grosor, 18)));
  return `drawbox=x=0:y=ih*0.08:w=iw:h=${g}:color=${color}:t=fill:enable='${e}',drawbox=x=0:y=ih*0.90:w=iw:h=${g}:color=${color}:t=fill:enable='${e}'`;
}

function filtroMarco({ color = 'white@0.55', grosor = 8 } = {}) {
  const g = Math.max(3, Math.min(40, numero(grosor, 8)));
  return `drawbox=x=0:y=0:w=iw:h=ih:color=${color}:t=${g}`;
}

function filtroTexto({ textoEfecto = 'EFECTO', posicion = 'centro', inicio = 0.5, duracion = 2, tamano = 54, caja = true, colorCaja = 'black@0.38' } = {}) {
  const t = limpiarTextoDrawtext(textoEfecto).toUpperCase();
  const size = Math.max(24, Math.min(96, numero(tamano, 54)));
  const e = enableEntre(inicioVisible(inicio, 2.2), duracion);
  const y = posicion === 'superior'
    ? 'h*0.12'
    : posicion === 'inferior'
      ? 'h*0.76'
      : posicion === 'subtitulo'
        ? 'h*0.82'
        : '(h-text_h)/2';
  const x = '(w-text_w)/2';
  const partes = [
    `drawtext=text='${t}'`,
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

function filtroTextoBoomComic({ textoEfecto = 'BOOM', inicio = 1.0, duracion = 0.9 } = {}) {
  const t = limpiarTextoDrawtext(textoEfecto || 'BOOM').toUpperCase();
  const i = inicioVisible(inicio, 2.0);
  const d = duracionVisible(duracion, 0.35, 1.3);
  const e = enableEntre(i, d);

  return [
    `drawbox=x=iw*0.23:y=ih*0.42:w=iw*0.54:h=ih*0.17:color=white@0.86:t=fill:enable='${e}'`,
    `drawbox=x=iw*0.26:y=ih*0.45:w=iw*0.48:h=ih*0.11:color=yellow@0.95:t=fill:enable='${e}'`,
    `drawbox=x=iw*0.19:y=ih*0.49:w=iw*0.10:h=8:color=white@0.95:t=fill:enable='${e}'`,
    `drawbox=x=iw*0.71:y=ih*0.49:w=iw*0.10:h=8:color=white@0.95:t=fill:enable='${e}'`,
    `drawbox=x=iw*0.49:y=ih*0.34:w=8:h=ih*0.10:color=yellow@0.95:t=fill:enable='${e}'`,
    `drawbox=x=iw*0.49:y=ih*0.56:w=8:h=ih*0.10:color=yellow@0.95:t=fill:enable='${e}'`,
    `drawtext=text='${t}':x=(w-text_w)/2:y=(h-text_h)/2:fontsize=98:fontcolor=white:borderw=12:bordercolor=black@0.98:shadowcolor=black@0.70:shadowx=4:shadowy=4:enable='${e}'`,
    `drawtext=text='${t}':x=(w-text_w)/2:y=(h-text_h)/2:fontsize=82:fontcolor=yellow:borderw=5:bordercolor=0xFF7A00@0.98:shadowcolor=black@0.35:shadowx=2:shadowy=2:enable='${e}'`
  ].join(',');
}

function filtroWipe({ inicio = 1, duracion = 0.7, color = 'white@0.62' } = {}) {
  const desde = inicioVisible(inicio, 2.0);
  const dur = duracionVisible(duracion, 0.25, 1.2);
  const hasta = desde + dur;
  return `drawbox=x='-iw+(2*iw*((t-${desde.toFixed(3)})/${dur.toFixed(3)}))':y=0:w=iw:h=ih:color=${color}:t=fill:enable='between(t,${desde.toFixed(3)},${hasta.toFixed(3)})'`;
}

function filtroRebote({ inicio = 1.2, duracion = 0.8, amplitud = 14 } = {}) {
  const i = inicioVisible(inicio, 2.2);
  const d = duracionVisible(duracion, 0.35, 1.2);
  const gate = compuertaTiempo(i, d);
  const a = Math.round(Math.max(4, Math.min(42, numero(amplitud, 14))));
  const ay = Math.round(a * 0.7);
  return `crop=w=iw-${a * 2}:h=ih-${a * 2}:x='${a}+${gate}*${a}*sin(80*t)':y='${a}+${gate}*${ay}*cos(70*t)',scale=trunc((iw+${a * 2})/2)*2:trunc((ih+${a * 2})/2)*2`;
}

function filtroGlitchRgb({ inicio = 1.2, duracion = 0.55 } = {}) {
  const e = enableEntre(inicioVisible(inicio, 2.0), duracion);
  return `eq=saturation=1.24:contrast=1.08,drawbox=x=0:y=0:w=iw:h=ih:color=magenta@0.20:t=fill:enable='${e}',drawbox=x=0:y=ih*0.48:w=iw:h=8:color=cyan@0.38:t=fill:enable='${e}',drawbox=x=0:y=ih*0.56:w=iw:h=5:color=red@0.22:t=fill:enable='${e}'`;
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
  const inicio = inicioVisible(efecto.segundoInicioPrueba, 2.0);
  const textoFinal = textoPersonalizado || efecto.textoPrueba || efecto.nombre;

  switch (id) {
    case 'zoom-in-centro':
      return [filtroZoomInCentroProgresivo(1.38 * factor)];

    case 'zoom-out-centro':
      return [filtroZoomOutCentroProgresivo(1.32 * factor)];

    case 'zoom-pulso':
      return [filtroZoomPulsoProgresivo({ amplitud: 0.055 * factor, base: 1.055, velocidad: 0.18 })];

    case 'punch-in-rapido':
      return [filtroPunchInProgresivo({ inicio, duracion: p.duracion || 0.75, factor: 1.28 * factor })];

    case 'zoom-dramatico-final':
      return [filtroZoomFinalProgresivo({ inicio: 1.0, factor: 1.36 * factor })];

    case 'shake-suave': return [filtroRebote({ inicio, duracion: p.duracion || 0.55, amplitud: 10 * factor })];
    case 'flash-blanco-impacto': return [filtroFlash({ color: p.color || 'white@0.55', inicio, duracion: p.duracion || 0.45 })];
    case 'golpe-rojo': return [filtroFlash({ color: p.color || 'red@0.38', inicio, duracion: p.duracion || 0.5 })];
    case 'explosion-texto-boom': return [filtroPunchInProgresivo({ inicio, duracion: 0.70, factor: 1.24 }), filtroFlash({ color: 'white@0.18', inicio, duracion: 0.16 }), filtroFlash({ color: 'red@0.10', inicio: inicio + 0.06, duracion: 0.45 }), filtroTextoBoomComic({ textoEfecto: textoFinal || 'BOOM', inicio: inicio + 0.02, duracion: p.duracion || 0.85 })];
    case 'flash-barras-cine': return [filtroFlash({ color: 'white@0.34', inicio, duracion: p.duracion || 0.55 }), filtroBarras({ inicio, duracion: p.duracion || 0.55 })];
    case 'transicion-flash-blanco': return [filtroFlash({ color: p.color || 'white@0.60', inicio, duracion: p.duracion || 0.5 })];
    case 'transicion-fundido-negro': return [filtroFlash({ color: p.color || 'black@0.62', inicio, duracion: p.duracion || 0.65 })];
    case 'transicion-barras-horizontales': return [filtroBarras({ inicio, duracion: p.duracion || 0.6, grosor: p.grosor || 20 })];
    case 'transicion-glitch-rgb': return [filtroGlitchRgb({ inicio, duracion: p.duracion || 0.55 })];
    case 'transicion-wipe-lateral': return [filtroWipe({ inicio, duracion: p.duracion || 0.7 })];
    case 'paneo-suave-horizontal': return [filtroPaneoHorizontalProgresivo({ factor: 1.10 * factor, velocidad: 0.018 })];
    case 'pulso-camara-suave': return [filtroZoomPulsoProgresivo({ amplitud: 0.030 * factor, base: 1.035, velocidad: 0.11 })];
    case 'foco-centro': return [filtroColorPorEfecto(id, factor)];
    case 'rebote-mini': return [filtroRebote({ inicio, duracion: p.duracion || 0.8, amplitud: p.amplitud || 14 })];
    case 'camara-energia-redes': return [filtroCamaraEnergia({ amplitud: 0.065 * factor, velocidad: 0.23 }), filtroBarras({ color: 'white@0.16', inicio: 0.35, duracion: 0.6, grosor: 10 })];
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
    case 'formato-viral-gancho': return [filtroZoomPulsoProgresivo({ amplitud: 0.050 * factor, base: 1.055, velocidad: 0.18 }), filtroTexto({ textoEfecto: textoFinal, posicion: 'superior', inicio, duracion: p.duracionTexto || 2.4, tamano: 48, colorCaja: 'blue@0.38' })];
    case 'barras-cinematograficas': return [`drawbox=x=0:y=0:w=iw:h=ih*${numero(p.altoRelativo, 0.08)}:color=black@0.88:t=fill,drawbox=x=0:y=ih-ih*${numero(p.altoRelativo, 0.08)}:w=iw:h=ih*${numero(p.altoRelativo, 0.08)}:color=black@0.88:t=fill`];
    case 'marco-social': return [filtroMarco({ color: p.color || 'white@0.55', grosor: p.grosor || 8 })];
    case 'callout-superior': return [filtroTexto({ textoEfecto: textoFinal, posicion: 'superior', inicio, duracion: p.duracion || 2.5, tamano: p.fuenteTamano || 48, colorCaja: 'black@0.42' })];
    default: return [filtroFlash({ color: 'white@0.25', inicio, duracion: 0.6 }), filtroTexto({ textoEfecto: efecto.nombre, posicion: 'centro', inicio, duracion: 1.4 })];
  }
}

function validarFiltroVideoSeguro(filtroVideo = '') {
  const errores = [];
  const filtro = texto(filtroVideo, '');
  if (!filtro) errores.push('filtro vacío');
  if (/undefined|null/gi.test(filtro)) errores.push('contiene undefined/null');
  if (filtro.includes('\n') || filtro.includes('\r')) errores.push('contiene saltos de línea');
  if (!filtro.includes('format=yuv420p')) errores.push('no normaliza formato yuv420p');
  return { ok: errores.length === 0, errores };
}

export function construirFiltroFfmpegLaboratorio({ efectoId, textoPersonalizado = '', intensidad = null } = {}) {
  const efecto = obtenerEfectoLabPorId(efectoId);
  const validacion = validarEfectoLab(efecto);
  if (!validacion.ok) throw new Error(validacion.mensaje);
  const textoUsado = limpiarTextoDrawtext(textoPersonalizado || efecto.textoPrueba || '');
  const filtros = [filtroBase(), ...construirFiltrosPorId({ efecto, textoPersonalizado: textoUsado, intensidad }), 'format=yuv420p'].filter(Boolean);
  const filtroVideo = filtros.join(',');
  const seguridad = validarFiltroVideoSeguro(filtroVideo);
  if (!seguridad.ok) throw new Error(`Filtro inseguro para ${efecto.id}: ${seguridad.errores.join(', ')}`);
  return {
    ok: true,
    tipo: 'filtro-ffmpeg-laboratorio-efectos',
    version: VERSION_FILTROS_FFMPEG_LAB,
    efecto,
    filtroVideo,
    filtros,
    seguridad,
    queDebeSalir: efecto.queDebeSalir,
    compatibleFfmpeg: efecto.compatibleFfmpeg,
    requiereTexto: efecto.requiereTexto,
    textoUsado,
    intensidadUsada: intensidad || efecto.intensidadBase,
    mensaje: `Filtro listo para probar: ${efecto.nombre}.`
  };
}

export default construirFiltroFfmpegLaboratorio;

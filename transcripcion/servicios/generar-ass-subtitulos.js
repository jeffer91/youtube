import { TRANSCRIPCION_CONFIG, limitarNumero, normalizarEstiloSubtitulos } from '../transcripcion.config.js';
import { normalizarSegmentos } from './normalizar-segmentos.js';

function pad(numero, tamano = 2) {
  return String(numero).padStart(tamano, '0');
}

function tiempoAss(segundos) {
  const total = Math.max(0, Math.round(Number(segundos || 0) * 100));
  const h = Math.floor(total / 360000);
  const m = Math.floor((total % 360000) / 6000);
  const s = Math.floor((total % 6000) / 100);
  const cs = total % 100;
  return `${h}:${pad(m)}:${pad(s)}.${pad(cs)}`;
}

function limpiarTexto(texto) {
  return String(texto || '').replace(/\r?\n+/g, ' ').replace(/\s+/g, ' ').replace(/[{}]/g, '').trim();
}

function partirLineas(texto, maxCaracteresLinea, maxLineas) {
  const palabras = limpiarTexto(texto).split(' ').filter(Boolean);
  const lineas = [];
  let actual = '';
  for (const palabra of palabras) {
    const candidato = actual ? `${actual} ${palabra}` : palabra;
    if (candidato.length <= maxCaracteresLinea) actual = candidato;
    else {
      if (actual) lineas.push(actual);
      actual = palabra;
    }
  }
  if (actual) lineas.push(actual);
  return lineas.slice(0, maxLineas).join('\\N');
}

function obtenerEstilo(opciones = {}) {
  const estilo = normalizarEstiloSubtitulos(opciones.estilo || TRANSCRIPCION_CONFIG.subtitulos.estilo);
  const base = {
    nombre: 'AutoVideoJeff',
    fuente: TRANSCRIPCION_CONFIG.subtitulos.fuente,
    tamano: TRANSCRIPCION_CONFIG.subtitulos.tamanoFuente,
    primario: TRANSCRIPCION_CONFIG.subtitulos.colorPrimario,
    borde: TRANSCRIPCION_CONFIG.subtitulos.colorBorde,
    sombraColor: TRANSCRIPCION_CONFIG.subtitulos.colorSombra,
    outline: TRANSCRIPCION_CONFIG.subtitulos.grosorBorde,
    sombra: TRANSCRIPCION_CONFIG.subtitulos.sombra,
    margenV: TRANSCRIPCION_CONFIG.subtitulos.margenInferior
  };
  if (estilo === 'elegante') return { ...base, tamano: 50, outline: 3, sombra: 1, margenV: 185 };
  if (estilo === 'minimalista') return { ...base, tamano: 44, outline: 2, sombra: 0, margenV: 190 };
  if (estilo === 'alto-contraste') return { ...base, tamano: 60, primario: '&H0000FFFF', outline: 5, sombra: 3, margenV: 160 };
  return base;
}

function cabeceraAss(estilo, width = 1080, height = 1920) {
  const lineas = [];
  lineas.push('[Script Info]');
  lineas.push('Title: AutoVideoJeff Subtitles');
  lineas.push('ScriptType: v4.00+');
  lineas.push('WrapStyle: 0');
  lineas.push('ScaledBorderAndShadow: yes');
  lineas.push(`PlayResX: ${width}`);
  lineas.push(`PlayResY: ${height}`);
  lineas.push('');
  lineas.push('[V4+ Styles]');
  lineas.push('Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding');
  lineas.push(`Style: ${estilo.nombre},${estilo.fuente},${estilo.tamano},${estilo.primario},&H000000FF,${estilo.borde},${estilo.sombraColor},-1,0,0,0,100,100,0,0,1,${estilo.outline},${estilo.sombra},2,70,70,${estilo.margenV},1`);
  lineas.push('');
  lineas.push('[Events]');
  lineas.push('Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text');
  return lineas.join('\n');
}

export function generarContenidoAss(segmentos = [], opciones = {}) {
  const config = opciones.config || TRANSCRIPCION_CONFIG;
  const estilo = obtenerEstilo({ estilo: opciones.estilo || config.subtitulos.estilo });
  const normalizados = normalizarSegmentos(segmentos, { config });
  const salida = [cabeceraAss(estilo, opciones.width || 1080, opciones.height || 1920)];
  const maxLinea = limitarNumero(opciones.maxCaracteresLinea || config.subtitulos.maxCaracteresLinea, 16, 60, 32);
  const maxLineas = limitarNumero(opciones.maxLineasPorSubtitulo || config.subtitulos.maxLineasPorSubtitulo, 1, 3, 2);
  for (const seg of normalizados) {
    salida.push(`Dialogue: 0,${tiempoAss(seg.inicio)},${tiempoAss(seg.fin)},${estilo.nombre},,0,0,0,,${partirLineas(seg.texto, maxLinea, maxLineas)}`);
  }
  return `${salida.join('\n')}\n`;
}

export function crearResumenAss(segmentos = [], opciones = {}) {
  const estilo = obtenerEstilo(opciones);
  const normalizados = normalizarSegmentos(segmentos);
  return { formato: 'ass', estilo: estilo.nombre, cantidadSubtitulos: normalizados.length, fuente: estilo.fuente, tamanoFuente: estilo.tamano, margenVertical: estilo.margenV };
}

export default generarContenidoAss;

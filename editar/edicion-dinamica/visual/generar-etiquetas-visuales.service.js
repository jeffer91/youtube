import { escaparTextoFfmpeg } from '../../../transcripcion/capas/escapar-texto-ffmpeg.js';

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function limpiarEtiqueta(texto) {
  const limpio = String(texto || '').replace(/\s+/g, ' ').trim();
  if (!limpio) return 'CLAVE';
  return limpio.length > 26 ? `${limpio.slice(0, 23).trim()}...` : limpio;
}

function construirEnable(inicio, fin) {
  return `between(t\\,${numero(inicio).toFixed(3)}\\,${numero(fin).toFixed(3)})`;
}

function construirDrawtextEtiqueta(evento, index) {
  const texto = escaparTextoFfmpeg(limpiarEtiqueta(evento.texto || evento.tipo || 'CLAVE'));
  const inicio = numero(evento.inicio, 0);
  const fin = numero(evento.fin, inicio + 1.5);
  const y = index % 2 === 0 ? 'h*0.16' : 'h*0.23';
  const enable = construirEnable(inicio, fin);

  return [
    'drawtext',
    `text='${texto}'`,
    'x=(w-text_w)/2',
    `y=${y}`,
    'fontsize=48',
    'fontcolor=white',
    'borderw=4',
    'bordercolor=black@0.90',
    'shadowcolor=black@0.60',
    'shadowx=2',
    'shadowy=2',
    'box=1',
    'boxcolor=black@0.45',
    'boxborderw=18',
    `enable='${enable}'`
  ].join(':');
}

export function generarEtiquetasVisuales({ eventos = [], opciones = {} } = {}) {
  if (opciones?.agregarEtiquetasVisuales === false) {
    return { ok: true, omitido: true, filtros: [], eventos: [], mensaje: 'Etiquetas visuales desactivadas.' };
  }

  const seleccionados = eventos
    .filter((evento) => ['punch-in', 'texto-flotante', 'momento-importante'].includes(evento.tipo))
    .slice(0, 8);

  const filtros = seleccionados.map((evento, index) => ({
    id: index + 1,
    tipo: 'etiqueta-visual',
    inicio: evento.inicio,
    fin: evento.fin,
    texto: evento.texto || 'CLAVE',
    filtro: construirDrawtextEtiqueta(evento, index)
  }));

  return {
    ok: true,
    omitido: filtros.length === 0,
    filtros,
    eventos: seleccionados,
    mensaje: filtros.length > 0 ? 'Etiquetas visuales generadas.' : 'No hubo eventos suficientes para etiquetas visuales.'
  };
}

export default generarEtiquetasVisuales;

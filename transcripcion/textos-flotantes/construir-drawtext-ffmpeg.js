import { normalizarTextosFlotantes } from './normalizar-textos-flotantes.js';
import { obtenerEstiloTextoFlotante, obtenerYPorPosicion } from './estilos-textos-flotantes.js';
import { escaparTextoFfmpeg } from '../capas/escapar-texto-ffmpeg.js';

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function construirEnable(inicio, fin) {
  return `between(t\\,${numero(inicio).toFixed(3)}\\,${numero(fin).toFixed(3)})`;
}

function construirFiltroDrawtext(textoFlotante) {
  const estilo = obtenerEstiloTextoFlotante(textoFlotante.estilo);
  const texto = escaparTextoFfmpeg(textoFlotante.texto);
  const y = obtenerYPorPosicion(estilo, textoFlotante.posicion);
  const enable = construirEnable(textoFlotante.inicio, textoFlotante.fin);
  return ['drawtext', `text='${texto}'`, `x=${estilo.x}`, `y=${y}`, `fontsize=${estilo.fontSize}`, `fontcolor=${estilo.fontColor}`, `borderw=${estilo.borderW}`, `bordercolor=${estilo.borderColor}`, `shadowcolor=${estilo.shadowColor}`, `shadowx=${estilo.shadowX}`, `shadowy=${estilo.shadowY}`, `box=${estilo.box}`, `boxcolor=${estilo.boxColor}`, `boxborderw=${estilo.boxBorderW}`, `enable='${enable}'`].join(':');
}

export function construirDrawtextsFfmpeg(textos = [], opciones = {}) {
  const normalizados = normalizarTextosFlotantes(textos, opciones);
  return normalizados.map((textoFlotante) => ({ id: textoFlotante.id, inicio: textoFlotante.inicio, fin: textoFlotante.fin, texto: textoFlotante.texto, filtro: construirFiltroDrawtext(textoFlotante) }));
}

export default construirDrawtextsFfmpeg;

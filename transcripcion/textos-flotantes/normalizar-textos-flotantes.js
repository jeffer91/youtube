import { ESTILOS_TEXTOS_FLOTANTES, limitarNumero, normalizarTexto, obtenerConfigTranscripcion } from '../transcripcion.config.js';
import { POSICIONES_TEXTO_FLOTANTE, posicionPermitida } from './estilos-textos-flotantes.js';

function redondear(valor, decimales = 3) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return 0;
  const factor = 10 ** decimales;
  return Math.round(numero * factor) / factor;
}

function limpiarTexto(valor, maxCaracteres) {
  const limpio = normalizarTexto(valor, '').replace(/\s+/g, ' ').trim();
  if (limpio.length <= maxCaracteres) return limpio;
  return `${limpio.slice(0, Math.max(8, maxCaracteres - 3)).trim()}...`;
}

function normalizarEstilo(estilo) {
  const limpio = normalizarTexto(estilo, ESTILOS_TEXTOS_FLOTANTES.BADGE).toLowerCase();
  const permitidos = Object.values(ESTILOS_TEXTOS_FLOTANTES);
  return permitidos.includes(limpio) ? limpio : ESTILOS_TEXTOS_FLOTANTES.BADGE;
}

function normalizarPosicion(posicion) {
  const limpia = normalizarTexto(posicion, POSICIONES_TEXTO_FLOTANTE.ARRIBA).toLowerCase();
  return posicionPermitida(limpia) ? limpia : POSICIONES_TEXTO_FLOTANTE.ARRIBA;
}

function seSolapa(a, b) {
  return a.inicio < b.fin && b.inicio < a.fin;
}

function quitarSolapados(items) {
  const salida = [];
  for (const item of items) {
    if (!salida.some((guardado) => seSolapa(guardado, item))) salida.push(item);
  }
  return salida;
}

export function normalizarTextosFlotantes(textos = [], opciones = {}) {
  const config = obtenerConfigTranscripcion(opciones);
  if (!Array.isArray(textos) || textos.length === 0) return [];
  const cantidadMaxima = limitarNumero(config.textosFlotantes.cantidadMaxima, 1, 12, 6);
  const duracionMinima = limitarNumero(config.textosFlotantes.duracionMinima, 0.4, 5, 1.2);
  const duracionMaxima = limitarNumero(config.textosFlotantes.duracionMaxima, 1, 8, 4);
  const maxCaracteresTexto = limitarNumero(config.textosFlotantes.maxCaracteresTexto, 8, 80, 42);
  let normalizados = textos.map((item, index) => {
    const texto = limpiarTexto(item?.texto || item?.titulo || item?.frase, maxCaracteresTexto);
    if (!texto) return null;
    const inicio = Math.max(0, Number(item?.inicio ?? item?.start ?? 0));
    let fin = Number(item?.fin ?? item?.end ?? inicio + duracionMinima);
    if (!Number.isFinite(fin) || fin <= inicio) fin = inicio + duracionMinima;
    const duracion = fin - inicio;
    if (duracion < duracionMinima) fin = inicio + duracionMinima;
    if (duracion > duracionMaxima) fin = inicio + duracionMaxima;
    return { id: index + 1, inicio: redondear(inicio), fin: redondear(fin), duracion: redondear(fin - inicio), texto, tipo: normalizarTexto(item?.tipo, 'clave').toLowerCase(), prioridad: limitarNumero(item?.prioridad, 1, 99, index + 1), posicion: normalizarPosicion(item?.posicion || config.textosFlotantes.posicionPredeterminada), estilo: normalizarEstilo(item?.estilo || config.textosFlotantes.estiloPredeterminado), motivo: limpiarTexto(item?.motivo || '', 140), origen: item?.origen || 'normalizado' };
  }).filter(Boolean).sort((a, b) => a.prioridad - b.prioridad || a.inicio - b.inicio);
  if (config.textosFlotantes.evitarSolapamiento) normalizados = quitarSolapados(normalizados);
  return normalizados.slice(0, cantidadMaxima).map((item, index) => ({ ...item, id: index + 1, prioridad: index + 1 }));
}

export default normalizarTextosFlotantes;

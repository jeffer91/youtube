/*
  Nombre completo: validar-respuesta-gemini.js
  Ruta: transcripcion/gemini/validar-respuesta-gemini.js
*/

import { ESTILOS_TEXTOS_FLOTANTES, limitarNumero, normalizarTexto, obtenerConfigTranscripcion } from '../transcripcion.config.js';
import { normalizarSegmentos } from '../servicios/normalizar-segmentos.js';

const POSICIONES_PERMITIDAS = Object.freeze(['arriba', 'centro', 'abajo']);
const TIPOS_PERMITIDOS = Object.freeze(['clave', 'alerta', 'error', 'beneficio', 'paso', 'gancho', 'dato', 'resumen']);

function redondear(valor, decimales = 3) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return 0;
  const factor = 10 ** decimales;
  return Math.round(numero * factor) / factor;
}

function limpiarTextoMomento(texto, maxCaracteres) {
  const limpio = normalizarTexto(texto, '').replace(/\s+/g, ' ').trim();
  if (limpio.length <= maxCaracteres) return limpio;
  return `${limpio.slice(0, Math.max(8, maxCaracteres - 3)).trim()}...`;
}

function normalizarPosicion(posicion) {
  const limpia = normalizarTexto(posicion, 'arriba').toLowerCase();
  return POSICIONES_PERMITIDAS.includes(limpia) ? limpia : 'arriba';
}

function normalizarTipo(tipo) {
  const limpio = normalizarTexto(tipo, 'clave').toLowerCase();
  return TIPOS_PERMITIDOS.includes(limpio) ? limpio : 'clave';
}

function normalizarEstilo(estilo) {
  const limpio = normalizarTexto(estilo, ESTILOS_TEXTOS_FLOTANTES.BADGE).toLowerCase();
  const permitidos = Object.values(ESTILOS_TEXTOS_FLOTANTES);
  return permitidos.includes(limpio) ? limpio : ESTILOS_TEXTOS_FLOTANTES.BADGE;
}

function obtenerMomentosDesdeRespuesta(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.momentosImportantes)) return data.momentosImportantes;
  if (Array.isArray(data?.textosFlotantes)) return data.textosFlotantes;
  if (Array.isArray(data?.momentos)) return data.momentos;
  return [];
}

function calcularDuracionVideo(segmentos = []) {
  if (!Array.isArray(segmentos) || segmentos.length === 0) return null;
  return Math.max(...segmentos.map((segmento) => Number(segmento.fin) || 0));
}

function ajustarTiempo({ inicio, fin, segmentos, duracionMinima, duracionMaxima }) {
  const duracionVideo = calcularDuracionVideo(segmentos);
  const inicioSeguro = Math.max(0, Number(inicio) || 0);
  let finSeguro = Number(fin) || inicioSeguro + duracionMinima;
  if (duracionVideo !== null) finSeguro = Math.min(finSeguro, duracionVideo);
  if (finSeguro <= inicioSeguro) finSeguro = inicioSeguro + duracionMinima;
  const duracion = finSeguro - inicioSeguro;
  if (duracion < duracionMinima) finSeguro = inicioSeguro + duracionMinima;
  if (duracion > duracionMaxima) finSeguro = inicioSeguro + duracionMaxima;
  if (duracionVideo !== null && finSeguro > duracionVideo) finSeguro = duracionVideo;
  return { inicio: redondear(inicioSeguro), fin: redondear(Math.max(finSeguro, inicioSeguro + 0.4)) };
}

function seSolapa(a, b) {
  return a.inicio < b.fin && b.inicio < a.fin;
}

function quitarSolapados(momentos) {
  const resultado = [];
  for (const momento of momentos) {
    const existeSolape = resultado.some((item) => seSolapa(item, momento));
    if (!existeSolape) resultado.push(momento);
  }
  return resultado;
}

export function validarRespuestaGemini({ respuesta, segmentos = [], opciones = {} } = {}) {
  const config = obtenerConfigTranscripcion(opciones);
  const segmentosNormalizados = normalizarSegmentos(segmentos, { config });
  const momentos = obtenerMomentosDesdeRespuesta(respuesta);
  const maxTextos = limitarNumero(config.gemini.cantidadMaximaTextos || config.textosFlotantes.cantidadMaxima, 1, 12, 6);
  const duracionMinima = limitarNumero(config.textosFlotantes.duracionMinima, 0.5, 4, 1.2);
  const duracionMaxima = limitarNumero(config.textosFlotantes.duracionMaxima, 1, 8, 4);
  const maxCaracteresTexto = limitarNumero(config.textosFlotantes.maxCaracteresTexto, 12, 80, 42);
  const advertencias = [];
  if (!Array.isArray(momentos) || momentos.length === 0) {
    return { ok: false, momentosImportantes: [], cantidad: 0, advertencias: ['Gemini no devolvió momentos importantes válidos.'], error: 'Sin momentos importantes.' };
  }
  let normalizados = momentos.map((momento, index) => {
    const texto = limpiarTextoMomento(momento?.texto || momento?.titulo || momento?.frase, maxCaracteresTexto);
    if (!texto) {
      advertencias.push(`Momento ${index + 1} omitido por no tener texto.`);
      return null;
    }
    const tiempos = ajustarTiempo({ inicio: momento?.inicio ?? momento?.start, fin: momento?.fin ?? momento?.end, segmentos: segmentosNormalizados, duracionMinima, duracionMaxima });
    return { id: index + 1, inicio: tiempos.inicio, fin: tiempos.fin, duracion: redondear(tiempos.fin - tiempos.inicio), texto, tipo: normalizarTipo(momento?.tipo), prioridad: limitarNumero(momento?.prioridad, 1, 10, index + 1), posicion: normalizarPosicion(momento?.posicion), estilo: normalizarEstilo(momento?.estilo), motivo: limpiarTextoMomento(momento?.motivo || '', 120), origen: 'gemini' };
  }).filter(Boolean).sort((a, b) => a.prioridad - b.prioridad || a.inicio - b.inicio);
  if (config.textosFlotantes.evitarSolapamiento) normalizados = quitarSolapados(normalizados);
  normalizados = normalizados.slice(0, maxTextos).map((momento, index) => ({ ...momento, id: index + 1 }));
  return { ok: normalizados.length > 0, momentosImportantes: normalizados, cantidad: normalizados.length, advertencias, error: normalizados.length > 0 ? null : 'No quedaron momentos válidos después de la validación.', validadoEn: new Date().toISOString() };
}

export default validarRespuestaGemini;

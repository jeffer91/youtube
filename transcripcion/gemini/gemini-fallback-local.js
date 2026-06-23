import { limitarNumero, normalizarTexto, obtenerConfigTranscripcion } from '../transcripcion.config.js';
import { normalizarSegmentos } from '../servicios/normalizar-segmentos.js';

const PALABRAS_CLAVE = Object.freeze(['importante', 'clave', 'ojo', 'atención', 'problema', 'solución', 'error', 'resultado', 'beneficio', 'recuerda', 'no hagas', 'debes', 'tienes que', 'recomendación', 'paso', 'primero', 'segundo', 'finalmente']);

function limpiarTexto(valor) {
  return normalizarTexto(valor, '').replace(/\s+/g, ' ').trim();
}

function contienePalabraClave(texto) {
  const lower = limpiarTexto(texto).toLowerCase();
  return PALABRAS_CLAVE.some((palabra) => lower.includes(palabra));
}

function puntuarSegmento(segmento, index) {
  const texto = limpiarTexto(segmento.texto);
  const lower = texto.toLowerCase();
  let puntaje = 0;
  if (contienePalabraClave(texto)) puntaje += 5;
  if (texto.length >= 35 && texto.length <= 140) puntaje += 2;
  if (/[!?]/.test(texto)) puntaje += 2;
  if (lower.includes('no ') || lower.includes('nunca ')) puntaje += 1;
  if (lower.includes('cómo') || lower.includes('por qué') || lower.includes('para qué')) puntaje += 1;
  if (index === 0) puntaje += 1;
  return puntaje;
}

function crearTextoFlotanteLocal(segmento) {
  const texto = limpiarTexto(segmento.texto);
  const lower = texto.toLowerCase();
  if (lower.includes('error')) return 'EVITA ESTE ERROR';
  if (lower.includes('problema')) return 'PROBLEMA CLAVE';
  if (lower.includes('solución')) return 'LA SOLUCIÓN';
  if (lower.includes('importante') || lower.includes('clave')) return 'PUNTO CLAVE';
  if (lower.includes('recuerda')) return 'RECUERDA ESTO';
  if (lower.includes('beneficio')) return 'BENEFICIO CLAVE';
  if (lower.includes('paso') || lower.includes('primero') || lower.includes('segundo')) return 'PASO IMPORTANTE';
  const palabras = texto.replace(/[.,;:!?]/g, '').split(' ').filter(Boolean).slice(0, 5).join(' ');
  return palabras.length > 0 ? palabras.toUpperCase() : 'IDEA IMPORTANTE';
}

function seSolapa(a, b) {
  return a.inicio < b.fin && b.inicio < a.fin;
}

function quitarSolapados(momentos) {
  const salida = [];
  for (const momento of momentos) {
    if (!salida.some((item) => seSolapa(item, momento))) salida.push(momento);
  }
  return salida;
}

export function generarMomentosFallbackLocal({ transcripcion, segmentos = null, opciones = {}, motivo = 'Gemini no disponible' } = {}) {
  const config = obtenerConfigTranscripcion(opciones);
  const normalizados = normalizarSegmentos(segmentos || transcripcion?.segmentos || [], { config });
  const cantidadMaxima = limitarNumero(config.textosFlotantes.cantidadMaxima || config.gemini.cantidadMaximaTextos, 1, 12, 6);
  if (normalizados.length === 0) {
    return { ok: false, origen: 'fallback-local', mensaje: 'No hay segmentos para detectar momentos locales.', motivo, momentosImportantes: [], cantidad: 0, creadoEn: new Date().toISOString() };
  }
  const candidatos = normalizados.map((segmento, index) => ({ segmento, index, puntaje: puntuarSegmento(segmento, index) })).filter((item) => item.puntaje > 0).sort((a, b) => b.puntaje - a.puntaje || a.segmento.inicio - b.segmento.inicio);
  const base = candidatos.length > 0 ? candidatos : normalizados.slice(0, cantidadMaxima).map((segmento, index) => ({ segmento, index, puntaje: 1 }));
  let momentos = base.map((item, index) => {
    const duracionMaxima = limitarNumero(config.textosFlotantes.duracionMaxima, 1, 8, 4);
    const inicio = item.segmento.inicio;
    const fin = Math.min(item.segmento.fin, inicio + duracionMaxima);
    return { id: index + 1, inicio, fin, duracion: Math.max(0.4, fin - inicio), texto: crearTextoFlotanteLocal(item.segmento), tipo: contienePalabraClave(item.segmento.texto) ? 'clave' : 'dato', prioridad: index + 1, posicion: index % 2 === 0 ? 'arriba' : 'centro', estilo: index % 2 === 0 ? 'badge' : 'impacto', motivo: `Detectado localmente. Puntaje: ${item.puntaje}`, origen: 'fallback-local' };
  });
  if (config.textosFlotantes.evitarSolapamiento) momentos = quitarSolapados(momentos);
  momentos = momentos.slice(0, cantidadMaxima).map((momento, index) => ({ ...momento, id: index + 1, prioridad: index + 1 }));
  return { ok: momentos.length > 0, origen: 'fallback-local', mensaje: momentos.length > 0 ? 'Se generaron momentos importantes con reglas locales.' : 'No se pudieron generar momentos locales.', motivo, momentosImportantes: momentos, cantidad: momentos.length, creadoEn: new Date().toISOString() };
}

export default generarMomentosFallbackLocal;

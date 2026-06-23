import { limitarNumero, obtenerConfigTranscripcion } from '../transcripcion.config.js';
import { crearBloquesPorLongitud, limitarTextoCompleto } from './normalizar-texto-transcripcion.js';

function redondear(valor, decimales = 3) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return 0;
  const factor = 10 ** decimales;
  return Math.round(numero * factor) / factor;
}

function calcularDuracionPorBloque({ cantidadBloques, duracionSegundos, config }) {
  const duracionBase = limitarNumero(config.transcripcion.duracionSegmentoPorDefecto, 1, 8, 3);
  const duracionVideo = Number(duracionSegundos);
  if (!Number.isFinite(duracionVideo) || duracionVideo <= 0 || cantidadBloques <= 0) return duracionBase;
  const calculada = duracionVideo / cantidadBloques;
  return limitarNumero(calculada, 1.2, 6, duracionBase);
}

export function segmentarTextoManual({ texto = '', duracionSegundos = null, opciones = {} } = {}) {
  const config = obtenerConfigTranscripcion(opciones);
  const textoCompleto = limitarTextoCompleto(texto, { maxCaracteres: config.transcripcion.maxCaracteresTextoCompleto });
  if (!textoCompleto) return { textoCompleto: '', segmentos: [] };
  const bloques = crearBloquesPorLongitud(textoCompleto, { maxCaracteres: config.transcripcion.maxCaracteresSegmento });
  const duracionPorBloque = calcularDuracionPorBloque({ cantidadBloques: bloques.length, duracionSegundos, config });
  const separacion = limitarNumero(config.transcripcion.separacionMinimaSegmentos, 0, 0.5, 0.05);
  let cursor = 0;
  const segmentos = bloques.map((bloque, index) => {
    const inicio = redondear(cursor);
    const fin = redondear(inicio + duracionPorBloque);
    cursor = fin + separacion;
    return { id: index + 1, inicio, fin, duracion: redondear(fin - inicio), texto: bloque, origen: 'manual-segmentado' };
  });
  return { textoCompleto, segmentos };
}

export default segmentarTextoManual;

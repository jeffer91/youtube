import { convertirTiempoOriginalAEditado, convertirRangoOriginalAEditado } from './crear-mapa-tiempo.js';
import { redondearTiempo } from '../edicion-dinamica.config.js';

export function estaTiempoConservado(tiempoOriginal, mapaTiempo) {
  return convertirTiempoOriginalAEditado(tiempoOriginal, mapaTiempo) !== null;
}

export function convertirTiempoSeguro(tiempoOriginal, mapaTiempo, valorPorDefecto = null) {
  const convertido = convertirTiempoOriginalAEditado(tiempoOriginal, mapaTiempo);
  return convertido === null ? valorPorDefecto : convertido;
}

export function convertirRangoSeguro({ inicio, fin, mapaTiempo, duracionMinima = 0.08 } = {}) {
  const rango = convertirRangoOriginalAEditado({ inicio, fin, mapaTiempo });
  if (!rango) return null;
  if (rango.duracion < duracionMinima) return null;
  return rango;
}

export function obtenerBloquePorTiempoOriginal(tiempoOriginal, mapaTiempo) {
  const tiempo = Number(tiempoOriginal);
  if (!Number.isFinite(tiempo)) return null;
  return mapaTiempo?.bloques?.find((bloque) => tiempo >= bloque.originalInicio && tiempo <= bloque.originalFin) || null;
}

export function calcularDesplazamientoTiempo(tiempoOriginal, mapaTiempo) {
  const editado = convertirTiempoOriginalAEditado(tiempoOriginal, mapaTiempo);
  if (editado === null) return null;
  return redondearTiempo(Number(tiempoOriginal) - editado);
}

export default convertirTiempoSeguro;

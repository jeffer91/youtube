import { redondearTiempo, limitarNumero } from '../edicion-dinamica.config.js';

function crearSilencioNormalizado(silencio, opciones = {}) {
  const duracionVideo = Number(opciones.duracionSegundos);
  const limiteFinal = Number.isFinite(duracionVideo) && duracionVideo > 0 ? duracionVideo : Infinity;
  const inicio = limitarNumero(silencio?.inicio, 0, limiteFinal, 0);
  const fin = limitarNumero(silencio?.fin, 0, limiteFinal, 0);
  const duracion = redondearTiempo(fin - inicio);
  if (!Number.isFinite(inicio) || !Number.isFinite(fin)) return null;
  if (fin <= inicio || duracion <= 0) return null;
  if (duracion < Number(opciones.silencioMinimoSegundos || 0)) return null;
  return { inicio: redondearTiempo(inicio), fin: redondearTiempo(fin), duracion, origen: silencio?.origen || 'normalizado' };
}

function unirSilenciosCercanos(silencios, separacionMaxima = 0.05) {
  const unidos = [];
  for (const silencio of silencios) {
    const ultimo = unidos[unidos.length - 1];
    if (!ultimo) {
      unidos.push({ ...silencio });
      continue;
    }
    if (silencio.inicio <= ultimo.fin + separacionMaxima) {
      ultimo.fin = redondearTiempo(Math.max(ultimo.fin, silencio.fin));
      ultimo.duracion = redondearTiempo(ultimo.fin - ultimo.inicio);
      ultimo.origen = `${ultimo.origen}+unido`;
    } else {
      unidos.push({ ...silencio });
    }
  }
  return unidos;
}

export function normalizarSilencios(silencios = [], opciones = {}) {
  if (!Array.isArray(silencios)) return [];
  const normalizados = silencios.map((silencio) => crearSilencioNormalizado(silencio, opciones)).filter(Boolean).sort((a, b) => a.inicio - b.inicio);
  return unirSilenciosCercanos(normalizados);
}

export default normalizarSilencios;

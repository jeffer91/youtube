import { redondearTiempo, limitarNumero } from '../edicion-dinamica.config.js';

function crearCorteDesdeSilencio(silencio, config) {
  const inicioCorte = redondearTiempo(silencio.inicio + config.cortes.margenDespuesFrase);
  const finCorte = redondearTiempo(silencio.fin - config.cortes.margenAntesFrase);
  const duracion = redondearTiempo(finCorte - inicioCorte);
  if (duracion <= 0) return null;
  return { inicio: inicioCorte, fin: finCorte, duracion, origen: 'silencio', silencioOriginal: { inicio: silencio.inicio, fin: silencio.fin, duracion: silencio.duracion } };
}

function fusionarCortes(cortes = []) {
  const ordenados = [...cortes].sort((a, b) => a.inicio - b.inicio);
  const fusionados = [];
  for (const corte of ordenados) {
    const ultimo = fusionados[fusionados.length - 1];
    if (!ultimo) {
      fusionados.push({ ...corte });
      continue;
    }
    if (corte.inicio <= ultimo.fin) {
      ultimo.fin = redondearTiempo(Math.max(ultimo.fin, corte.fin));
      ultimo.duracion = redondearTiempo(ultimo.fin - ultimo.inicio);
    } else {
      fusionados.push({ ...corte });
    }
  }
  return fusionados;
}

function crearSegmentosConservados({ cortes, duracionOriginal, config }) {
  const segmentos = [];
  let cursor = 0;
  for (const corte of cortes) {
    const inicio = redondearTiempo(cursor);
    const fin = redondearTiempo(corte.inicio);
    const duracion = redondearTiempo(fin - inicio);
    if (duracion >= config.cortes.duracionMinimaSegmento) segmentos.push({ inicio, fin, duracion, origen: 'conservado-antes-corte' });
    cursor = Math.max(cursor, corte.fin);
  }
  const duracionFinal = Number(duracionOriginal);
  if (Number.isFinite(duracionFinal) && duracionFinal > cursor) {
    const inicio = redondearTiempo(cursor);
    const fin = redondearTiempo(duracionFinal);
    const duracion = redondearTiempo(fin - inicio);
    if (duracion >= config.cortes.duracionMinimaSegmento) segmentos.push({ inicio, fin, duracion, origen: 'conservado-final' });
  }
  return segmentos.map((segmento, index) => ({ id: index + 1, ...segmento }));
}

export function crearPlanCortes({ silencios = [], duracionSegundos = null, config, opciones = {} } = {}) {
  const duracionOriginal = limitarNumero(duracionSegundos, 0, 24 * 60 * 60, 0);
  const cortesCandidatos = silencios.map((silencio) => crearCorteDesdeSilencio(silencio, config)).filter(Boolean).filter((corte) => corte.duracion >= config.cortes.silencioMinimoSegundos);
  const cortesLimitados = fusionarCortes(cortesCandidatos).slice(0, config.cortes.maximoCortes);
  const segmentosConservados = crearSegmentosConservados({ cortes: cortesLimitados, duracionOriginal, config });
  const segundosEliminados = redondearTiempo(cortesLimitados.reduce((total, corte) => total + corte.duracion, 0));
  const duracionEditada = redondearTiempo(segmentosConservados.reduce((total, segmento) => total + segmento.duracion, 0));
  const porcentajeEliminado = duracionOriginal > 0 ? redondearTiempo(segundosEliminados / duracionOriginal, 4) : 0;
  return { ok: true, etapa: 'crear-plan-cortes', intensidad: config.intensidad, duracionOriginal, duracionEditada, segundosEliminados, porcentajeEliminado, silenciosAnalizados: silencios.length, cortes: cortesLimitados.map((corte, index) => ({ id: index + 1, ...corte })), segmentosConservados, configAplicada: { ruidoDb: config.cortes.ruidoDb, silencioMinimoSegundos: config.cortes.silencioMinimoSegundos, margenAntesFrase: config.cortes.margenAntesFrase, margenDespuesFrase: config.cortes.margenDespuesFrase, duracionMinimaSegmento: config.cortes.duracionMinimaSegmento, maximoCortes: config.cortes.maximoCortes }, opciones: { modoSeguro: config.modoSeguro, intensidadSolicitada: opciones.intensidadEdicion || opciones.modoEdicionDinamica || null }, creadoEn: new Date().toISOString() };
}

export default crearPlanCortes;

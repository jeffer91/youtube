/*
  Modulo: audio
  Funcion: crear instrucciones para silenciar una zona puntual del audio.
*/

function normalizarTiempo(valor, defecto = 0) {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= 0 ? numero : defecto;
}

export function crearPlanSilenciarSegmento(segmento = {}, opciones = {}) {
  const inicio = normalizarTiempo(segmento.inicio, 0);
  const fin = normalizarTiempo(segmento.fin, opciones.duracionMaxima || 3);
  if (fin <= inicio) throw new Error('El segmento a silenciar debe tener un fin mayor al inicio.');

  return {
    tipo: 'silenciar_segmento',
    inicio,
    fin,
    duracion: Number((fin - inicio).toFixed(3)),
    motivo: segmento.motivo || 'ruido_inicial',
    filtroFfmpeg: `volume=enable='between(t,${inicio},${fin})':volume=0`,
    seguroParaVoz: segmento.seguroParaVoz !== false,
    creadoEn: new Date().toISOString()
  };
}

export function crearPlanesSilencio(segmentos = []) {
  return segmentos.map((segmento) => crearPlanSilenciarSegmento(segmento));
}

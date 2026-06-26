/*
  Modulo: audio
  Funcion: crear instrucciones para cortar solo el inicio ruidoso si conviene.
*/

export function crearPlanCorteInicioRuidoso(ruido = {}, opciones = {}) {
  const maximo = Number(opciones.maximoCorteSegundos ?? 3);
  const finRuido = Number(ruido.fin ?? 0);
  const corteHasta = Math.max(0, Math.min(Number.isFinite(finRuido) ? finRuido : 0, maximo));

  return {
    tipo: 'cortar_inicio_ruidoso',
    aplicar: corteHasta > 0,
    inicioOriginal: 0,
    iniciarVideoEn: corteHasta,
    maximoPermitido: maximo,
    motivo: ruido.mensaje || 'Ruido inicial detectado.',
    requiereRevisionProduccion: corteHasta > 1.5,
    creadoEn: new Date().toISOString()
  };
}

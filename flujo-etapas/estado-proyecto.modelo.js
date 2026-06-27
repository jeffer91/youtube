/*
  Bloque 3: Estado de proyecto por etapas
  Función: definir etapas, estados y estructura estándar para el nuevo flujo de AutoVideoJeff.
*/

export const ETAPAS_AUTOVIDEO = Object.freeze({
  NUEVO_PROYECTO: 'nuevo-proyecto',
  ENTENDIMIENTO: 'entendimiento',
  PLAN_EDICION: 'plan-edicion',
  PRODUCCION: 'produccion',
  ADAPTACION: 'adaptacion-plataformas',
  RESULTADO: 'resultado'
});

export const ORDEN_ETAPAS_AUTOVIDEO = Object.freeze([
  ETAPAS_AUTOVIDEO.NUEVO_PROYECTO,
  ETAPAS_AUTOVIDEO.ENTENDIMIENTO,
  ETAPAS_AUTOVIDEO.PLAN_EDICION,
  ETAPAS_AUTOVIDEO.PRODUCCION,
  ETAPAS_AUTOVIDEO.ADAPTACION,
  ETAPAS_AUTOVIDEO.RESULTADO
]);

export const ESTADOS_PROYECTO_ETAPAS = Object.freeze({
  CREADO: 'creado',
  ENTENDIENDO: 'entendiendo',
  ENTENDIDO: 'entendido',
  PLANIFICANDO: 'planificando',
  PLANIFICADO: 'planificado',
  PRODUCIENDO: 'produciendo',
  PRODUCIDO: 'producido',
  ADAPTANDO: 'adaptando',
  ADAPTADO: 'adaptado',
  EXPORTANDO: 'exportando',
  FINALIZADO: 'finalizado',
  ERROR: 'error'
});

export const CARPETAS_RESULTADO_ETAPA = Object.freeze({
  [ETAPAS_AUTOVIDEO.ENTENDIMIENTO]: '01-entendimiento',
  [ETAPAS_AUTOVIDEO.PLAN_EDICION]: '02-plan',
  [ETAPAS_AUTOVIDEO.PRODUCCION]: '03-produccion',
  [ETAPAS_AUTOVIDEO.ADAPTACION]: '04-adaptacion',
  [ETAPAS_AUTOVIDEO.RESULTADO]: '05-resultado'
});

export const ARCHIVOS_RESULTADO_ETAPA = Object.freeze({
  [ETAPAS_AUTOVIDEO.ENTENDIMIENTO]: 'reporte-entendimiento.json',
  [ETAPAS_AUTOVIDEO.PLAN_EDICION]: 'plan-edicion.json',
  [ETAPAS_AUTOVIDEO.PRODUCCION]: 'produccion.json',
  [ETAPAS_AUTOVIDEO.ADAPTACION]: 'adaptacion-plataformas.json',
  [ETAPAS_AUTOVIDEO.RESULTADO]: 'reporte-final.json'
});

export function etapaEsValida(etapa) {
  return ORDEN_ETAPAS_AUTOVIDEO.includes(etapa);
}

export function obtenerIndiceEtapa(etapa) {
  return ORDEN_ETAPAS_AUTOVIDEO.indexOf(etapa);
}

export function obtenerSiguienteEtapa(etapaActual) {
  const indice = obtenerIndiceEtapa(etapaActual);
  if (indice < 0) return ETAPAS_AUTOVIDEO.NUEVO_PROYECTO;
  return ORDEN_ETAPAS_AUTOVIDEO[indice + 1] || null;
}

export function obtenerEtapaAnterior(etapaActual) {
  const indice = obtenerIndiceEtapa(etapaActual);
  if (indice <= 0) return null;
  return ORDEN_ETAPAS_AUTOVIDEO[indice - 1] || null;
}

export function crearEstadoProyectoEtapas({ proyectoId, nombre = 'Proyecto AutoVideoJeff', etapaActual = ETAPAS_AUTOVIDEO.NUEVO_PROYECTO, estado = ESTADOS_PROYECTO_ETAPAS.CREADO, datos = {} } = {}) {
  if (!proyectoId) throw new Error('No se puede crear estado de proyecto sin proyectoId.');
  const etapaNormalizada = etapaEsValida(etapaActual) ? etapaActual : ETAPAS_AUTOVIDEO.NUEVO_PROYECTO;
  const fecha = new Date().toISOString();
  return {
    ok: true,
    version: '1.0.0-etapas',
    proyectoId,
    nombre,
    estado,
    etapaActual: etapaNormalizada,
    etapaAnterior: obtenerEtapaAnterior(etapaNormalizada),
    siguienteEtapa: obtenerSiguienteEtapa(etapaNormalizada),
    etapasCompletadas: [],
    etapasConError: [],
    archivosPorEtapa: {},
    historial: [
      {
        fecha,
        etapa: etapaNormalizada,
        estado,
        mensaje: 'Estado de proyecto por etapas creado.'
      }
    ],
    datos,
    creadoEn: fecha,
    actualizadoEn: fecha
  };
}

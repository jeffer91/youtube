/*
  Bloque 2 - Contexto para Plan de edición
  Función: definir el contrato que absorberá Entendimiento + Biblioteca + imágenes sugeridas antes de llamar a IA.
*/

export const VERSION_CONTEXTO_PLAN = '1.1.0';

export const PARTES_CONTEXTO_PLAN = Object.freeze([
  'proyecto',
  'entendimiento',
  'transcripcion',
  'segmentos',
  'frames',
  'momentosClave',
  'necesidades',
  'bibliotecaGeneral',
  'bibliotecaProyecto',
  'imagenesSugeridas',
  'recursosPlan',
  'salidaEsperada'
]);

export const SALIDA_PLAN_IA = Object.freeze({
  modo: 'resumen-humano-json-tecnico',
  opciones: 2,
  seleccionAutomatica: true,
  entregaPorPartes: true,
  partes: [
    'resumenEstrategico',
    'estructuraNarrativa',
    'timelineSegundos',
    'textosPantalla',
    'subtitulos',
    'recursosBiblioteca',
    'imagenesSugeridas',
    'audioEfectosTransiciones',
    'validacionFinal'
  ],
  formatoTecnico: {
    timeline: 'array de acciones con inicio, fin, accion, textoPantalla, recursoBiblioteca, imagenSugerida, efecto, audio y motivo',
    recursos: 'referencias a biblioteca general/proyecto sin copiar archivos',
    imagenesSugeridas: 'imágenes pedidas por Entendimiento: pendientes como requeridas y guardadas como disponibles',
    validacion: 'errores, advertencias y compatibilidad con Producción'
  }
});

export function crearContextoPlanModelo({ proyectoId, proyecto = {}, resumen = {}, entendimiento = {}, transcripcion = {}, segmentos = [], frames = [], momentosClave = [], necesidades = [], biblioteca = {}, recursosPlan = [], contextoIA = {}, solicitud = {} } = {}) {
  return {
    ok: true,
    tipo: 'contexto-plan-edicion',
    version: VERSION_CONTEXTO_PLAN,
    proyectoId,
    proyecto,
    resumen,
    entendimiento,
    transcripcion,
    segmentos,
    frames,
    momentosClave,
    necesidades,
    biblioteca,
    recursosPlan,
    salidaEsperada: SALIDA_PLAN_IA,
    contextoIA,
    solicitud,
    partesIncluidas: PARTES_CONTEXTO_PLAN,
    creadoEn: new Date().toISOString()
  };
}

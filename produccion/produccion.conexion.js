/*
  Modulo: produccion
  Funcion: punto unico de conexion para revision y aprobacion.
*/

export { PRODUCCION_CONFIG } from './produccion.config.js';
export { crearPlanProduccionModelo, crearElementoProduccion, validarPlanProduccion } from './produccion.modelo.js';
export { crearPlanProduccion } from './crear-plan-produccion.service.js';
export { guardarPlanProduccion, cargarPlanProduccion, obtenerRutaPlanProduccion } from './cargar-plan-produccion.service.js';
export { reemplazarRecursoProduccion } from './reemplazar-recurso-produccion.service.js';
export { aprobarElementoProduccion, aprobarElementosPorTipo } from './aprobar-elemento-produccion.service.js';
export { rechazarElementoProduccion } from './rechazar-elemento-produccion.service.js';
export { aprobarProduccionFinal, calcularEstadoProduccion } from './aprobar-produccion-final.service.js';

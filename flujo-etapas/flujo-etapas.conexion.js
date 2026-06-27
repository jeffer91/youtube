/*
  Bloque 3: Estado de proyecto por etapas
  Función: punto único de conexión para el control del nuevo flujo por etapas.
*/

export {
  ETAPAS_AUTOVIDEO,
  ORDEN_ETAPAS_AUTOVIDEO,
  ESTADOS_PROYECTO_ETAPAS,
  CARPETAS_RESULTADO_ETAPA,
  ARCHIVOS_RESULTADO_ETAPA,
  etapaEsValida,
  obtenerIndiceEtapa,
  obtenerSiguienteEtapa,
  obtenerEtapaAnterior,
  crearEstadoProyectoEtapas
} from './estado-proyecto.modelo.js';

export {
  validarTransicionEtapa,
  exigirTransicionEtapa
} from './validar-transicion-etapa.service.js';

export {
  obtenerCarpetaProyectoEtapas,
  obtenerRutaEstadoProyecto,
  cargarEstadoProyectoEtapas,
  guardarEstadoProyectoEtapas,
  avanzarEstadoProyectoEtapas,
  marcarErrorEstadoProyectoEtapas
} from './estado-proyecto.service.js';

export {
  obtenerCarpetaResultadoEtapa,
  obtenerRutaResultadoEtapa,
  guardarResultadoEtapa
} from './guardar-resultado-etapa.service.js';

export {
  cargarResultadoEtapa,
  existeResultadoEtapa
} from './cargar-resultado-etapa.service.js';

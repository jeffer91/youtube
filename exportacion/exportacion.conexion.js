/*
  Modulo: exportacion
  Funcion: punto unico de conexion para exportaciones por plataforma.
*/

export { PLATAFORMAS_EXPORTACION, PLATAFORMAS_DEFECTO, obtenerIdsPlataformas, obtenerPlataformaExportacion } from './plataformas.config.js';
export { crearExportacionModelo, normalizarPlataformas, validarExportacionModelo } from './exportacion.modelo.js';
export { prepararExportaciones } from './preparar-exportaciones.service.js';
export { crearPlanExportacionVertical } from './exportar-vertical.service.js';
export { crearPlanExportacionHorizontal } from './exportar-horizontal.service.js';
export { crearPlanExportacionCuadrado } from './exportar-cuadrado.service.js';
export { validarExportacion, validarExportaciones } from './validar-exportacion.service.js';
export { crearResultadoPlataformas } from './resultado-plataformas.service.js';

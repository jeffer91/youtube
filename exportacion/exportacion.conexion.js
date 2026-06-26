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
export { RENDER_PLATAFORMAS_CONFIG, obtenerFormatoRender } from './render-plataformas.config.js';
export { crearFiltroContenerFormato, crearNombreExportacionPlataforma } from './filtros-render-plataformas.service.js';
export { renderizarPlataforma } from './renderizar-plataforma.service.js';
export { renderizarPlataformasPendientes } from './renderizar-plataformas-pendientes.service.js';

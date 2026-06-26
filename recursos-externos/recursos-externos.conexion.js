/*
  Modulo: recursos-externos
  Funcion: punto unico de conexion para busqueda y preparacion de recursos externos.
*/

export { FUENTES_RECURSOS_CONFIG, listarFuentesRecursos } from './fuentes-recursos.config.js';
export { construirConsultaImagen, prepararBusquedaImagenes, normalizarResultadoImagen } from './buscar-imagenes.service.js';
export { construirConsultaClip, prepararBusquedaClips, normalizarResultadoClip } from './buscar-videos.service.js';
export { nombrarRecurso, crearNombreEntendibleRecurso } from './nombrar-recurso.service.js';
export { prepararDescargaRecurso } from './descargar-recurso.service.js';
export { crearRegistroFuenteRecurso, aplicarFuenteARecurso } from './guardar-fuente-recurso.service.js';
export { validarRecursoExterno } from './validar-recurso-externo.service.js';

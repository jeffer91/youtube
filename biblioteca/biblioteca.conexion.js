/*
  Modulo: biblioteca
  Funcion: punto unico de conexion para biblioteca general.
*/

export { BIBLIOTECA_CONFIG, obtenerTiposBiblioteca } from './biblioteca.config.js';
export { CATEGORIAS_BIBLIOTECA, obtenerCategoriaBiblioteca, listarCategoriasBiblioteca } from './categorias.config.js';
export { crearRecursoModelo, validarRecursoModelo, limpiarNombreRecurso } from './recurso.modelo.js';
export { listarRecursosBiblioteca, obtenerRutaIndiceBiblioteca } from './listar-recursos.service.js';
export { guardarRecursoBiblioteca } from './guardar-recurso.service.js';
export { buscarRecursosBiblioteca, buscarPrimerRecurso } from './buscar-recurso.service.js';
export { clasificarRecurso } from './clasificar-recurso.service.js';
export { validarLicenciaRecurso, marcarLicenciaRevisada } from './validar-licencia-recurso.service.js';
export { recomendarRecursosProduccion } from './seleccionar-recursos-produccion.service.js';

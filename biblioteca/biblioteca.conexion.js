/*
  Modulo: biblioteca
  Funcion: punto unico de conexion para biblioteca general permanente.
*/

export {
  BIBLIOTECA_CONFIG,
  ALCANCES_BIBLIOTECA,
  ESTADOS_TECNICOS_RECURSO,
  TIPOS_ARCHIVO_BIBLIOTECA,
  FORMATOS_RECURSO_BIBLIOTECA,
  obtenerTiposBiblioteca,
  obtenerFormatosBiblioteca,
  obtenerExtensionesPermitidasBiblioteca,
  extensionPermitidaBiblioteca
} from './biblioteca.config.js';
export { ESTILOS_VIDEO_BASE, listarEstilosVideo, obtenerEstiloVideo, normalizarEstiloVideo, normalizarListaEstilosVideo } from './estilos-video.config.js';
export { CATEGORIAS_BIBLIOTECA, obtenerCategoriaBiblioteca, listarCategoriasBiblioteca, normalizarCategoriaBiblioteca, crearCategoriaEditable } from './categorias.config.js';
export {
  obtenerRutaBibliotecaRaiz,
  obtenerRutasBibliotecaGeneral,
  asegurarEstructuraBibliotecaGeneral,
  obtenerCarpetaDestinoRecursoGeneral,
  crearNombreArchivoBiblioteca,
  crearRutaWebBiblioteca,
  existeRutaArchivo
} from './rutas-biblioteca.service.js';
export {
  crearRecursoModelo,
  validarRecursoModelo,
  limpiarNombreRecurso,
  detectarTipoArchivoBiblioteca,
  detectarFormatoInicialRecurso
} from './recurso.modelo.js';
export { analizarArchivoBiblioteca, fusionarAnalisisConRecurso } from './analizar-recurso.service.js';
export { listarRecursosBiblioteca, obtenerRutaIndiceBiblioteca, leerIndiceBibliotecaGeneral, escribirIndiceBibliotecaGeneral } from './listar-recursos.service.js';
export { guardarRecursoBiblioteca } from './guardar-recurso.service.js';
export { buscarRecursosBiblioteca, buscarPrimerRecurso } from './buscar-recurso.service.js';
export { clasificarRecurso } from './clasificar-recurso.service.js';
export { validarLicenciaRecurso, marcarLicenciaRevisada } from './validar-licencia-recurso.service.js';
export { resolverBibliotecaParaPlan, crearProyectoBibliotecaPlan } from './resolver-biblioteca-plan.service.js';
export { recomendarRecursosProduccion } from './seleccionar-recursos-produccion.service.js';

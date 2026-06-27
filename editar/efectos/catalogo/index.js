/*
  Bloque 1: Catalogo de efectos
  Funcion: punto unico de importacion para el motor futuro de efectos.
*/

export {
  CATEGORIAS_EFECTO,
  SOPORTES_FORMATO_EFECTO,
  NIVELES_INTENSIDAD_EFECTO,
  CAMPOS_REQUERIDOS_EFECTO,
  validarEfectoCatalogo,
  validarCatalogoEfectos
} from './efectos.schema.js';

export {
  INTENSIDADES_EFECTOS,
  INTENSIDAD_PREDETERMINADA_EFECTOS,
  obtenerIntensidadEfectos
} from './intensidades.config.js';

export {
  PERFILES_EFECTOS,
  PERFIL_EFECTOS_PREDETERMINADO,
  obtenerPerfilEfectos,
  listarPerfilesEfectos
} from './perfiles-efectos.config.js';

export {
  CATALOGO_EFECTOS,
  TOTAL_EFECTOS_CATALOGO,
  listarEfectosCatalogo,
  buscarEfectoPorId,
  filtrarEfectosPorPerfil
} from './efectos.catalogo.js';

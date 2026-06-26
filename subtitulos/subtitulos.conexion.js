/*
  Modulo: subtitulos
  Funcion: punto unico de conexion para subtitulos multiplataforma.
*/

export { SUBTITULOS_CONFIG, obtenerEstiloSubtitulo } from './subtitulos.config.js';
export { generarSubtitulosDesdeSegmentos, generarSubtitulosPlan } from './generar-subtitulos.service.js';
export { crearSubtitulosParaPlataforma, crearSubtitulosMultiplataforma } from './subtitulos-plataforma.service.js';
export { calcularPosicionSubtitulos } from './posicionar-subtitulos.service.js';
export { resolverEstiloSubtitulo, crearCssSubtitulo } from './estilos-subtitulos.service.js';
export { convertirSubtitulosASrt, convertirSubtitulosAJson } from './exportar-subtitulos.service.js';
export { validarSubtitulo, validarSubtitulos } from './validar-subtitulos.service.js';

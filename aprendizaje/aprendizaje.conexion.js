/*
  Modulo: aprendizaje
  Funcion: punto unico de conexion para memoria y reglas de edicion.
*/

export { APRENDIZAJE_CONFIG } from './aprendizaje.config.js';
export { crearReglaAprendizaje, validarReglaAprendizaje } from './regla-aprendizaje.modelo.js';
export { cargarMemoriaEdicion, guardarMemoriaEdicion, obtenerRutaMemoriaEdicion } from './memoria-edicion.service.js';
export { guardarCorreccionAprendizaje } from './guardar-correccion.service.js';
export { aprenderDeReemplazo } from './aprender-de-reemplazo.service.js';
export { obtenerReglasAplicables, aplicarAprendizajeASugerencias, registrarUsoRegla } from './aplicar-aprendizaje.service.js';

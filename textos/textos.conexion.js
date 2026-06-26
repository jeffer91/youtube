/*
  Modulo: textos
  Funcion: punto unico de conexion para textos, graficos y tablas.
*/

export { TEXTOS_CONFIG, obtenerLimiteTextosPorPerfil } from './textos.config.js';
export { detectarTextosRelevantes } from './detectar-textos-relevantes.service.js';
export { generarTextosPantalla } from './generar-textos-pantalla.service.js';
export { generarGraficosVisuales } from './generar-graficos.service.js';
export { generarTablaVisual, generarTablasVisuales } from './generar-tablas-visuales.service.js';
export { calcularPosicionTexto, aplicarPosicionesTextos } from './posicionar-textos.service.js';
export { validarTextoPantalla, validarTextosPantalla } from './validar-textos.service.js';

/*
  Modulo: visual
  Funcion: punto unico de conexion para decisiones visuales.
*/

export { VISUAL_CONFIG, obtenerIntensidadVisual } from './visual.config.js';
export { detectarSujeto, resumirSujeto } from './detectar-sujeto.service.js';
export { detectarRostro } from './detectar-rostro.service.js';
export { detectarZonasSeguras } from './detectar-zonas-seguras.service.js';
export { crearPlanRemoverFondo } from './remover-fondo.service.js';
export { crearPlanFondo } from './aplicar-fondo.service.js';
export { crearPlanZoom } from './aplicar-zoom.service.js';
export { crearPlanAnimaciones } from './aplicar-animaciones.service.js';
export { crearPlanEfectos } from './aplicar-efectos.service.js';
export { crearPlanEncuadreDinamico } from './encuadre-dinamico.service.js';

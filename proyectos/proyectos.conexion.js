/*
  Modulo: proyectos
  Funcion: punto unico de conexion para el resto de la app.
*/

export { PROYECTOS_CONFIG } from './proyectos.config.js';
export { crearProyectoModelo, normalizarProyecto, validarProyectoBase } from './proyecto.modelo.js';
export { crearProyecto } from './crear-proyecto.service.js';
export { cargarProyecto, existeProyecto } from './cargar-proyecto.service.js';
export { guardarProyecto } from './guardar-proyecto.service.js';
export { listarProyectos } from './listar-proyectos.service.js';
export { obtenerRutasProyecto, asegurarEstructuraProyecto } from './rutas-proyecto.service.js';

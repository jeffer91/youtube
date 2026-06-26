/*
  Modulo: perfiles
  Funcion: punto unico de conexion para perfiles de edicion.
*/

export { PERFILES_EDICION, PERFIL_DEFECTO, obtenerIdsPerfiles } from './perfiles.config.js';
export { crearPerfilModelo, normalizarPerfilId, validarPerfilModelo } from './perfil.modelo.js';
export { obtenerPerfil, listarPerfiles, existePerfil } from './obtener-perfil.service.js';
export { aplicarPerfilAProyecto, obtenerOpcionesEdicionDesdePerfil } from './aplicar-perfil.service.js';
export { guardarPreferenciasPerfil, cargarPreferenciasPerfil } from './guardar-preferencias-perfil.service.js';
export { registrarMemoriaPerfil, obtenerMemoriaPerfil } from './memoria-perfil.service.js';
export { validarPerfil, validarTodosLosPerfiles } from './validar-perfil.service.js';

import { PERFILES_VERSION, PERFIL_PREDETERMINADO, PERFILES_VISUALES, listarPerfilesVisuales } from './perfiles.config.js';
import { obtenerPerfilVisual, existePerfilVisual, obtenerResumenPerfilesVisuales } from './obtener-perfil.service.js';
import { aplicarPerfilVisualAOpciones } from './aplicar-perfil-a-opciones.js';
import { validarPerfilVisual, validarTodosLosPerfiles } from './validar-perfil.js';

export function aplicarPerfilVisual(opciones = {}) {
  return aplicarPerfilVisualAOpciones(opciones);
}

export {
  PERFILES_VERSION,
  PERFIL_PREDETERMINADO,
  PERFILES_VISUALES,
  listarPerfilesVisuales,
  obtenerPerfilVisual,
  existePerfilVisual,
  obtenerResumenPerfilesVisuales,
  aplicarPerfilVisualAOpciones,
  validarPerfilVisual,
  validarTodosLosPerfiles
};

export default {
  PERFILES_VERSION,
  PERFIL_PREDETERMINADO,
  PERFILES_VISUALES,
  listarPerfilesVisuales,
  obtenerPerfilVisual,
  existePerfilVisual,
  obtenerResumenPerfilesVisuales,
  aplicarPerfilVisual,
  aplicarPerfilVisualAOpciones,
  validarPerfilVisual,
  validarTodosLosPerfiles
};

import { PERFIL_PREDETERMINADO, PERFILES_VISUALES, listarPerfilesVisuales } from './perfiles.config.js';
import { validarPerfilVisual } from './validar-perfil.js';

function normalizarIdPerfil(valor) {
  if (typeof valor !== 'string') return PERFIL_PREDETERMINADO;
  const id = valor.trim().toLowerCase();
  return id || PERFIL_PREDETERMINADO;
}

function clonar(valor) {
  return JSON.parse(JSON.stringify(valor));
}

export function obtenerPerfilVisual(idPerfil = PERFIL_PREDETERMINADO) {
  const id = normalizarIdPerfil(idPerfil);
  const perfil = PERFILES_VISUALES[id] || PERFILES_VISUALES[PERFIL_PREDETERMINADO];
  const copia = clonar(perfil);
  const validacion = validarPerfilVisual(copia);

  if (!validacion.ok) {
    throw new Error(`Perfil visual inválido: ${validacion.errores.join(' ')}`);
  }

  return copia;
}

export function existePerfilVisual(idPerfil) {
  const id = normalizarIdPerfil(idPerfil);
  return Boolean(PERFILES_VISUALES[id]);
}

export function obtenerResumenPerfilesVisuales() {
  return {
    ok: true,
    predeterminado: PERFIL_PREDETERMINADO,
    perfiles: listarPerfilesVisuales()
  };
}

export default obtenerPerfilVisual;

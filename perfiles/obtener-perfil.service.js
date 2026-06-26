/*
  Modulo: perfiles
  Funcion: obtener perfiles por id o listar perfiles disponibles.
*/

import { PERFILES_EDICION, PERFIL_DEFECTO } from './perfiles.config.js';
import { crearPerfilModelo, normalizarPerfilId } from './perfil.modelo.js';

export function obtenerPerfil(perfilId = PERFIL_DEFECTO, ajustes = {}) {
  return crearPerfilModelo(normalizarPerfilId(perfilId), ajustes);
}

export function listarPerfiles() {
  return Object.values(PERFILES_EDICION).map((perfil) => crearPerfilModelo(perfil.id));
}

export function existePerfil(perfilId) {
  return Boolean(PERFILES_EDICION[normalizarPerfilId(perfilId)]);
}

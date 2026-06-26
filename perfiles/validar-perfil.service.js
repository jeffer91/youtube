/*
  Modulo: perfiles
  Funcion: validar perfiles y configuraciones relacionadas.
*/

import { obtenerIdsPerfiles } from './perfiles.config.js';
import { obtenerPerfil, listarPerfiles } from './obtener-perfil.service.js';
import { validarPerfilModelo } from './perfil.modelo.js';

export function validarPerfil(perfilId) {
  const perfil = obtenerPerfil(perfilId);
  const validacion = validarPerfilModelo(perfil);
  return {
    ok: validacion.ok,
    perfil,
    errores: validacion.errores
  };
}

export function validarTodosLosPerfiles() {
  const perfiles = listarPerfiles();
  const resultados = perfiles.map((perfil) => ({ perfil: perfil.id, ...validarPerfil(perfil.id) }));
  const errores = resultados.flatMap((resultado) => resultado.errores.map((error) => `${resultado.perfil}: ${error}`));
  return {
    ok: errores.length === 0 && perfiles.length === obtenerIdsPerfiles().length,
    total: perfiles.length,
    errores,
    resultados
  };
}

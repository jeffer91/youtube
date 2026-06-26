/*
  Modulo: perfiles
  Funcion: modelo y normalizacion de perfiles de edicion.
*/

import { PERFILES_EDICION, PERFIL_DEFECTO, obtenerIdsPerfiles } from './perfiles.config.js';

export function clonarPerfil(perfil) {
  return JSON.parse(JSON.stringify(perfil));
}

export function normalizarPerfilId(perfilId = PERFIL_DEFECTO) {
  const id = String(perfilId || PERFIL_DEFECTO).trim().toLowerCase();
  return obtenerIdsPerfiles().includes(id) ? id : PERFIL_DEFECTO;
}

export function crearPerfilModelo(perfilId = PERFIL_DEFECTO, ajustes = {}) {
  const id = normalizarPerfilId(perfilId);
  const base = clonarPerfil(PERFILES_EDICION[id]);
  return {
    ...base,
    ...ajustes,
    id: base.id,
    nombre: ajustes.nombre || base.nombre,
    memoria: ajustes.memoria || {},
    actualizadoEn: new Date().toISOString()
  };
}

export function validarPerfilModelo(perfil = {}) {
  const errores = [];
  if (!perfil.id) errores.push('El perfil no tiene id.');
  if (!perfil.nombre) errores.push('El perfil no tiene nombre.');
  if (!perfil.categoria) errores.push('El perfil no tiene categoria.');
  if (!perfil.instruccionesGemini) errores.push('El perfil no tiene instrucciones Gemini.');
  return { ok: errores.length === 0, errores };
}

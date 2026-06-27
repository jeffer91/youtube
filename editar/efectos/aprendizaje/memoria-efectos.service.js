/*
  Bloque 13: Aprendizaje de efectos por perfil
  Función: guardar una memoria local separada para el motor de efectos.
*/

import path from 'path';
import { escribirJson, leerJsonSiExiste, obtenerRutaDatos } from '../../../comun/archivos.js';

const VERSION_MEMORIA_EFECTOS = '1.0.0';

function rutaBase(opciones = {}) {
  return opciones.baseDir || obtenerRutaDatos();
}

export function obtenerRutaMemoriaEfectos(opciones = {}) {
  return path.join(rutaBase(opciones), 'efectos', 'memoria-efectos.json');
}

function crearMemoriaVacia() {
  return {
    version: VERSION_MEMORIA_EFECTOS,
    perfiles: {},
    global: {
      efectos: {},
      totalProcesos: 0
    },
    actualizadoEn: new Date().toISOString()
  };
}

function normalizarPerfil(memoria, perfil = 'general') {
  const id = String(perfil || 'general').trim().toLowerCase() || 'general';
  if (!memoria.perfiles[id]) {
    memoria.perfiles[id] = {
      perfil: id,
      efectos: {},
      categorias: {},
      totalProcesos: 0,
      actualizadoEn: new Date().toISOString()
    };
  }
  return memoria.perfiles[id];
}

function normalizarEfecto(registro = {}, efectoId = '') {
  return {
    efectoId: registro.efectoId || efectoId,
    usos: Number(registro.usos || 0),
    aplicados: Number(registro.aplicados || 0),
    omitidos: Number(registro.omitidos || 0),
    advertencias: Number(registro.advertencias || 0),
    puntaje: Number(registro.puntaje || 0),
    ultimaCategoria: registro.ultimaCategoria || '',
    ultimoOrigen: registro.ultimoOrigen || 'local',
    ultimoMensaje: registro.ultimoMensaje || '',
    actualizadoEn: registro.actualizadoEn || null
  };
}

export async function cargarMemoriaEfectos(opciones = {}) {
  const memoria = await leerJsonSiExiste(obtenerRutaMemoriaEfectos(opciones), crearMemoriaVacia());
  return {
    ...crearMemoriaVacia(),
    ...memoria,
    perfiles: memoria?.perfiles || {},
    global: memoria?.global || { efectos: {}, totalProcesos: 0 }
  };
}

export async function guardarMemoriaEfectos(memoria = {}, opciones = {}) {
  const datos = {
    ...crearMemoriaVacia(),
    ...memoria,
    version: VERSION_MEMORIA_EFECTOS,
    actualizadoEn: new Date().toISOString()
  };
  await escribirJson(obtenerRutaMemoriaEfectos(opciones), datos);
  return datos;
}

export function obtenerRegistroPerfil(memoria = {}, perfil = 'general') {
  return normalizarPerfil(memoria, perfil);
}

export function obtenerRegistroEfecto(registroPerfil = {}, efectoId = '') {
  const id = String(efectoId || '').trim();
  if (!id) return null;
  if (!registroPerfil.efectos[id]) registroPerfil.efectos[id] = normalizarEfecto({}, id);
  return registroPerfil.efectos[id];
}

export function normalizarMemoriaEfectos(memoria = {}) {
  const base = { ...crearMemoriaVacia(), ...memoria, perfiles: memoria.perfiles || {}, global: memoria.global || { efectos: {}, totalProcesos: 0 } };
  Object.entries(base.perfiles).forEach(([perfilId, perfil]) => {
    const perfilNormalizado = normalizarPerfil(base, perfilId);
    Object.entries(perfil?.efectos || {}).forEach(([efectoId, registro]) => {
      perfilNormalizado.efectos[efectoId] = normalizarEfecto(registro, efectoId);
    });
  });
  return base;
}

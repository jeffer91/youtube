/*
  Modulo: perfiles
  Funcion: guardar preferencias editables por perfil.
*/

import fs from 'fs/promises';
import path from 'path';
import { obtenerPerfil } from './obtener-perfil.service.js';

const RUTA_PREFERENCIAS = path.join('salida', 'preferencias', 'perfiles.json');

async function leerPreferencias(baseDir = process.cwd()) {
  const ruta = path.join(baseDir, RUTA_PREFERENCIAS);
  try {
    return JSON.parse(await fs.readFile(ruta, 'utf-8'));
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }
}

export async function guardarPreferenciasPerfil(perfilId, preferencias = {}, opciones = {}) {
  const baseDir = opciones.baseDir || process.cwd();
  const perfil = obtenerPerfil(perfilId);
  const ruta = path.join(baseDir, RUTA_PREFERENCIAS);
  const actuales = await leerPreferencias(baseDir);

  actuales[perfil.id] = {
    ...(actuales[perfil.id] || {}),
    ...preferencias,
    actualizadoEn: new Date().toISOString()
  };

  await fs.mkdir(path.dirname(ruta), { recursive: true });
  await fs.writeFile(ruta, JSON.stringify(actuales, null, 2), 'utf-8');
  return actuales[perfil.id];
}

export async function cargarPreferenciasPerfil(perfilId, opciones = {}) {
  const baseDir = opciones.baseDir || process.cwd();
  const perfil = obtenerPerfil(perfilId);
  const preferencias = await leerPreferencias(baseDir);
  return preferencias[perfil.id] || {};
}

/*
  Modulo: aprendizaje
  Funcion: leer y escribir memoria local de edicion.
*/

import fs from 'fs/promises';
import path from 'path';
import { APRENDIZAJE_CONFIG } from './aprendizaje.config.js';
import { crearReglaAprendizaje } from './regla-aprendizaje.modelo.js';

export function obtenerRutaMemoriaEdicion(baseDir = process.cwd()) {
  return path.join(baseDir, APRENDIZAJE_CONFIG.carpetaRaiz, APRENDIZAJE_CONFIG.archivoMemoria);
}

export async function cargarMemoriaEdicion(opciones = {}) {
  const baseDir = opciones.baseDir || process.cwd();
  try {
    const datos = JSON.parse(await fs.readFile(obtenerRutaMemoriaEdicion(baseDir), 'utf-8'));
    const reglas = Array.isArray(datos.reglas) ? datos.reglas.map(crearReglaAprendizaje) : [];
    return { version: APRENDIZAJE_CONFIG.version, reglas };
  } catch (error) {
    if (error.code === 'ENOENT') return { version: APRENDIZAJE_CONFIG.version, reglas: [] };
    throw error;
  }
}

export async function guardarMemoriaEdicion(memoria = {}, opciones = {}) {
  const baseDir = opciones.baseDir || process.cwd();
  const ruta = obtenerRutaMemoriaEdicion(baseDir);
  const datos = {
    version: APRENDIZAJE_CONFIG.version,
    reglas: (memoria.reglas || []).map(crearReglaAprendizaje),
    actualizadoEn: new Date().toISOString()
  };
  await fs.mkdir(path.dirname(ruta), { recursive: true });
  await fs.writeFile(ruta, JSON.stringify(datos, null, 2), 'utf-8');
  return datos;
}

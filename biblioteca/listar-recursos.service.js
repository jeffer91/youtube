/*
  Modulo: biblioteca
  Funcion: leer el indice general de recursos.
*/

import fs from 'fs/promises';
import path from 'path';
import { BIBLIOTECA_CONFIG } from './biblioteca.config.js';
import { crearRecursoModelo } from './recurso.modelo.js';

export function obtenerRutaIndiceBiblioteca(baseDir = process.cwd()) {
  return path.join(baseDir, BIBLIOTECA_CONFIG.carpetaRaiz, BIBLIOTECA_CONFIG.archivoIndice);
}

export async function listarRecursosBiblioteca(opciones = {}) {
  const baseDir = opciones.baseDir || process.cwd();
  const rutaIndice = obtenerRutaIndiceBiblioteca(baseDir);
  try {
    const datos = JSON.parse(await fs.readFile(rutaIndice, 'utf-8'));
    const recursos = Array.isArray(datos.recursos) ? datos.recursos : [];
    return recursos.map(crearRecursoModelo);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

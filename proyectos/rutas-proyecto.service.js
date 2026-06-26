/*
  Modulo: proyectos
  Funcion: resolver y crear rutas fisicas para cada proyecto.
*/

import path from 'path';
import fs from 'fs/promises';
import { PROYECTOS_CONFIG } from './proyectos.config.js';

export function obtenerRutaRaizProyecto(proyectoId, baseDir = process.cwd()) {
  if (!proyectoId) throw new Error('No se puede resolver la ruta del proyecto sin id.');
  return path.join(baseDir, PROYECTOS_CONFIG.carpetaRaiz, proyectoId);
}

export function obtenerRutasProyecto(proyectoId, baseDir = process.cwd()) {
  const raiz = obtenerRutaRaizProyecto(proyectoId, baseDir);
  const rutas = { raiz, archivoProyecto: path.join(raiz, PROYECTOS_CONFIG.archivoProyecto) };
  Object.entries(PROYECTOS_CONFIG.subcarpetas).forEach(([clave, carpeta]) => {
    rutas[clave] = path.join(raiz, carpeta);
  });
  return rutas;
}

export async function asegurarEstructuraProyecto(proyectoId, baseDir = process.cwd()) {
  const rutas = obtenerRutasProyecto(proyectoId, baseDir);
  await fs.mkdir(rutas.raiz, { recursive: true });
  await Promise.all(
    Object.keys(PROYECTOS_CONFIG.subcarpetas).map((clave) => fs.mkdir(rutas[clave], { recursive: true }))
  );
  return rutas;
}

export function convertirRutasRelativasProyecto(rutas = {}, baseDir = process.cwd()) {
  const normalizadas = {};
  Object.entries(rutas).forEach(([clave, valor]) => {
    normalizadas[clave] = path.relative(baseDir, valor).replace(/\\/g, '/');
  });
  return normalizadas;
}

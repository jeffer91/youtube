/*
  Modulo: proyectos
  Funcion: cargar un proyecto desde disco.
*/

import fs from 'fs/promises';
import { normalizarProyecto } from './proyecto.modelo.js';
import { obtenerRutasProyecto } from './rutas-proyecto.service.js';

export async function cargarProyecto(proyectoId, opciones = {}) {
  const baseDir = opciones.baseDir || process.cwd();
  const rutas = obtenerRutasProyecto(proyectoId, baseDir);
  const contenido = await fs.readFile(rutas.archivoProyecto, 'utf-8');
  const datos = JSON.parse(contenido);
  return normalizarProyecto(datos);
}

export async function existeProyecto(proyectoId, opciones = {}) {
  try {
    await cargarProyecto(proyectoId, opciones);
    return true;
  } catch (_error) {
    return false;
  }
}

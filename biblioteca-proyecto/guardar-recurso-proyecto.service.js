/*
  Modulo: biblioteca-proyecto
  Funcion: guardar recursos usados o sugeridos dentro de un proyecto.
*/

import fs from 'fs/promises';
import path from 'path';
import { BIBLIOTECA_PROYECTO_CONFIG } from './biblioteca-proyecto.config.js';
import { crearRecursoModelo } from '../biblioteca/biblioteca.conexion.js';

function rutaIndiceProyecto(proyecto = {}, baseDir = process.cwd()) {
  const carpeta = proyecto.rutas?.biblioteca || path.join('salida', 'proyectos', proyecto.id || 'sin-id', BIBLIOTECA_PROYECTO_CONFIG.carpeta);
  return path.join(baseDir, carpeta, BIBLIOTECA_PROYECTO_CONFIG.archivoIndice);
}

async function leerIndiceProyecto(proyecto, baseDir) {
  try {
    return JSON.parse(await fs.readFile(rutaIndiceProyecto(proyecto, baseDir), 'utf-8'));
  } catch (error) {
    if (error.code === 'ENOENT') return { version: BIBLIOTECA_PROYECTO_CONFIG.version, recursos: [] };
    throw error;
  }
}

export async function guardarRecursoProyecto(proyecto = {}, recursoDatos = {}, opciones = {}) {
  const baseDir = opciones.baseDir || process.cwd();
  const recurso = crearRecursoModelo({
    ...recursoDatos,
    proyectoId: proyecto.id,
    estadoUso: recursoDatos.estadoUso || BIBLIOTECA_PROYECTO_CONFIG.estadosUso.sugerido
  });
  const indice = await leerIndiceProyecto(proyecto, baseDir);
  const recursos = indice.recursos.filter((item) => item.id !== recurso.id);
  recursos.push(recurso);

  const ruta = rutaIndiceProyecto(proyecto, baseDir);
  await fs.mkdir(path.dirname(ruta), { recursive: true });
  await fs.writeFile(ruta, JSON.stringify({ ...indice, recursos }, null, 2), 'utf-8');
  return recurso;
}

export { rutaIndiceProyecto };

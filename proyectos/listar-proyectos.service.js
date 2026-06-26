/*
  Modulo: proyectos
  Funcion: listar proyectos guardados.
*/

import fs from 'fs/promises';
import path from 'path';
import { PROYECTOS_CONFIG } from './proyectos.config.js';
import { cargarProyecto } from './cargar-proyecto.service.js';

export async function listarProyectos(opciones = {}) {
  const baseDir = opciones.baseDir || process.cwd();
  const raiz = path.join(baseDir, PROYECTOS_CONFIG.carpetaRaiz);

  try {
    const entradas = await fs.readdir(raiz, { withFileTypes: true });
    const carpetas = entradas.filter((entrada) => entrada.isDirectory()).map((entrada) => entrada.name);
    const proyectos = [];

    for (const proyectoId of carpetas) {
      try {
        proyectos.push(await cargarProyecto(proyectoId, { baseDir }));
      } catch (error) {
        proyectos.push({ id: proyectoId, estado: PROYECTOS_CONFIG.estados.ERROR, error: error.message });
      }
    }

    return proyectos.sort((a, b) => String(b.actualizadoEn || '').localeCompare(String(a.actualizadoEn || '')));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

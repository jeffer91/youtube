/*
  Modulo: produccion
  Funcion: guardar y cargar el plan de Produccion del proyecto.
*/

import fs from 'fs/promises';
import path from 'path';
import { PRODUCCION_CONFIG } from './produccion.config.js';
import { crearPlanProduccionModelo, validarPlanProduccion } from './produccion.modelo.js';

export function obtenerRutaPlanProduccion(proyecto = {}, baseDir = process.cwd()) {
  const carpeta = proyecto.rutas?.produccion || path.join('salida', 'proyectos', proyecto.id || 'sin-id', 'produccion');
  return path.join(baseDir, carpeta, PRODUCCION_CONFIG.archivoPlan);
}

export async function guardarPlanProduccion(proyecto = {}, planEntrada = {}, opciones = {}) {
  const baseDir = opciones.baseDir || process.cwd();
  const plan = crearPlanProduccionModelo(planEntrada);
  const validacion = validarPlanProduccion(plan);
  if (!validacion.ok) throw new Error(validacion.errores.join(' | '));

  const ruta = obtenerRutaPlanProduccion(proyecto, baseDir);
  await fs.mkdir(path.dirname(ruta), { recursive: true });
  await fs.writeFile(ruta, JSON.stringify(plan, null, 2), 'utf-8');
  return plan;
}

export async function cargarPlanProduccion(proyecto = {}, opciones = {}) {
  const baseDir = opciones.baseDir || process.cwd();
  const ruta = obtenerRutaPlanProduccion(proyecto, baseDir);
  const datos = JSON.parse(await fs.readFile(ruta, 'utf-8'));
  return crearPlanProduccionModelo(datos);
}

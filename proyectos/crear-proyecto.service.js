/*
  Modulo: proyectos
  Funcion: crear un proyecto nuevo con estructura modular.
*/

import { crearProyectoModelo } from './proyecto.modelo.js';
import { asegurarEstructuraProyecto, convertirRutasRelativasProyecto } from './rutas-proyecto.service.js';
import { guardarProyecto } from './guardar-proyecto.service.js';

export async function crearProyecto(datos = {}, opciones = {}) {
  const baseDir = opciones.baseDir || process.cwd();
  const proyecto = crearProyectoModelo(datos);
  const rutas = await asegurarEstructuraProyecto(proyecto.id, baseDir);
  const proyectoConRutas = {
    ...proyecto,
    rutas: convertirRutasRelativasProyecto(rutas, baseDir)
  };
  return guardarProyecto(proyectoConRutas, { baseDir });
}

/*
  Modulo: proyectos
  Funcion: guardar metadata de proyecto en disco.
*/

import fs from 'fs/promises';
import { normalizarProyecto } from './proyecto.modelo.js';
import { asegurarEstructuraProyecto, convertirRutasRelativasProyecto } from './rutas-proyecto.service.js';

export async function guardarProyecto(proyectoEntrada, opciones = {}) {
  const baseDir = opciones.baseDir || process.cwd();
  const proyecto = normalizarProyecto(proyectoEntrada);
  const rutas = await asegurarEstructuraProyecto(proyecto.id, baseDir);

  const proyectoParaGuardar = {
    ...proyecto,
    rutas: convertirRutasRelativasProyecto(rutas, baseDir),
    actualizadoEn: new Date().toISOString()
  };

  await fs.writeFile(rutas.archivoProyecto, JSON.stringify(proyectoParaGuardar, null, 2), 'utf-8');
  return proyectoParaGuardar;
}

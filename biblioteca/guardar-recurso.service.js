/*
  Modulo: biblioteca
  Funcion: guardar o actualizar recursos en el indice general.
*/

import fs from 'fs/promises';
import path from 'path';
import { BIBLIOTECA_CONFIG } from './biblioteca.config.js';
import { crearRecursoModelo, validarRecursoModelo } from './recurso.modelo.js';
import { listarRecursosBiblioteca, obtenerRutaIndiceBiblioteca } from './listar-recursos.service.js';

export async function guardarRecursoBiblioteca(datos = {}, opciones = {}) {
  const baseDir = opciones.baseDir || process.cwd();
  const recurso = crearRecursoModelo(datos);
  const validacion = validarRecursoModelo(recurso);
  if (!validacion.ok) {
    const error = new Error(validacion.errores.join(' | '));
    error.errores = validacion.errores;
    throw error;
  }

  const recursos = await listarRecursosBiblioteca({ baseDir });
  const sinActual = recursos.filter((item) => item.id !== recurso.id);
  const actualizados = [...sinActual, recurso].sort((a, b) => String(b.actualizadoEn).localeCompare(String(a.actualizadoEn)));
  const rutaIndice = obtenerRutaIndiceBiblioteca(baseDir);

  await fs.mkdir(path.dirname(rutaIndice), { recursive: true });
  await fs.writeFile(rutaIndice, JSON.stringify({ version: BIBLIOTECA_CONFIG.version, recursos: actualizados }, null, 2), 'utf-8');
  return recurso;
}

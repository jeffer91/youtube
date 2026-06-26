/*
  Modulo: biblioteca-proyecto
  Funcion: listar recursos propios del proyecto actual.
*/

import fs from 'fs/promises';
import { rutaIndiceProyecto } from './guardar-recurso-proyecto.service.js';

export async function listarRecursosProyecto(proyecto = {}, opciones = {}) {
  const baseDir = opciones.baseDir || process.cwd();
  try {
    const indice = JSON.parse(await fs.readFile(rutaIndiceProyecto(proyecto, baseDir), 'utf-8'));
    const recursos = Array.isArray(indice.recursos) ? indice.recursos : [];
    return recursos.sort((a, b) => String(b.actualizadoEn || '').localeCompare(String(a.actualizadoEn || '')));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

export async function buscarRecursosProyecto(proyecto = {}, filtros = {}, opciones = {}) {
  const recursos = await listarRecursosProyecto(proyecto, opciones);
  return recursos.filter((recurso) => {
    if (filtros.tipo && recurso.tipo !== filtros.tipo) return false;
    if (filtros.estadoUso && recurso.estadoUso !== filtros.estadoUso) return false;
    if (!filtros.consulta) return true;
    const texto = [recurso.nombre, recurso.tema, recurso.fraseRelacionada, ...(recurso.etiquetas || [])].join(' ').toLowerCase();
    return texto.includes(String(filtros.consulta).toLowerCase());
  });
}

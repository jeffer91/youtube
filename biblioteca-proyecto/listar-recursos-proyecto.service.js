/*
  Modulo: biblioteca-proyecto
  Funcion: listar recursos temporales propios del proyecto actual.
*/

import fs from 'fs/promises';
import { rutaIndiceProyecto } from './guardar-recurso-proyecto.service.js';
import { crearRecursoModelo } from '../biblioteca/biblioteca.conexion.js';
import { normalizarCategoriaBiblioteca } from '../biblioteca/categorias.config.js';
import { normalizarEstiloVideo } from '../biblioteca/estilos-video.config.js';

export async function listarRecursosProyecto(proyecto = {}) {
  try {
    const indice = JSON.parse(await fs.readFile(rutaIndiceProyecto(proyecto), 'utf-8'));
    const recursos = Array.isArray(indice.recursos) ? indice.recursos : [];
    return recursos
      .map((recurso) => crearRecursoModelo(recurso))
      .sort((a, b) => String(b.actualizadoEn || '').localeCompare(String(a.actualizadoEn || '')));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

function contieneEstilo(recurso, estilo) {
  if (!estilo) return true;
  const estiloId = normalizarEstiloVideo(estilo);
  const estilos = recurso.estilos || recurso.perfiles || (recurso.perfil ? [recurso.perfil] : []);
  return estilos.map(normalizarEstiloVideo).includes(estiloId);
}

export async function buscarRecursosProyecto(proyecto = {}, filtros = {}) {
  const recursos = await listarRecursosProyecto(proyecto);
  const categoria = filtros.categoria ? normalizarCategoriaBiblioteca(filtros.categoria) : '';
  return recursos.filter((recurso) => {
    if (filtros.tipo && recurso.tipo !== filtros.tipo) return false;
    if (categoria && recurso.categoria !== categoria) return false;
    if ((filtros.estilo || filtros.perfil) && !contieneEstilo(recurso, filtros.estilo || filtros.perfil)) return false;
    if (filtros.estadoUso && recurso.estadoUso !== filtros.estadoUso) return false;
    if (filtros.estadoTecnico && recurso.estadoTecnico !== filtros.estadoTecnico) return false;
    if (!filtros.consulta && !filtros.q) return true;
    const texto = [recurso.nombre, recurso.descripcion, recurso.tema, recurso.fraseRelacionada, recurso.categoria, ...(recurso.estilos || []), ...(recurso.etiquetas || [])].join(' ').toLowerCase();
    return texto.includes(String(filtros.consulta || filtros.q || '').toLowerCase());
  });
}

/*
  Modulo: biblioteca
  Funcion: buscar recursos por texto, perfil, categoria o tipo.
*/

import { listarRecursosBiblioteca } from './listar-recursos.service.js';

function coincideTexto(recurso, consulta) {
  if (!consulta) return true;
  const texto = [
    recurso.nombre,
    recurso.descripcion,
    recurso.tema,
    recurso.fraseRelacionada,
    recurso.categoria,
    recurso.perfil,
    ...(recurso.etiquetas || [])
  ].join(' ').toLowerCase();
  return texto.includes(String(consulta).toLowerCase());
}

export async function buscarRecursosBiblioteca(filtros = {}, opciones = {}) {
  const recursos = await listarRecursosBiblioteca(opciones);
  return recursos.filter((recurso) => {
    if (filtros.tipo && recurso.tipo !== filtros.tipo) return false;
    if (filtros.categoria && recurso.categoria !== filtros.categoria) return false;
    if (filtros.perfil && recurso.perfil && recurso.perfil !== filtros.perfil) return false;
    if (filtros.estado && recurso.estado !== filtros.estado) return false;
    return coincideTexto(recurso, filtros.consulta || filtros.q || '');
  });
}

export async function buscarPrimerRecurso(filtros = {}, opciones = {}) {
  const resultados = await buscarRecursosBiblioteca(filtros, opciones);
  return resultados[0] || null;
}

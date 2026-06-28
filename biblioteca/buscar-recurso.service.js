/*
  Modulo: biblioteca
  Funcion: buscar recursos por texto, estilo, categoria, tipo o estado tecnico.
*/

import { listarRecursosBiblioteca } from './listar-recursos.service.js';
import { normalizarCategoriaBiblioteca } from './categorias.config.js';
import { normalizarEstiloVideo } from './estilos-video.config.js';

function coincideTexto(recurso, consulta) {
  if (!consulta) return true;
  const texto = [
    recurso.nombre,
    recurso.descripcion,
    recurso.tema,
    recurso.fraseRelacionada,
    recurso.categoria,
    recurso.categoriaNombre,
    recurso.perfil,
    ...(recurso.estilos || []),
    ...(recurso.perfiles || []),
    ...(recurso.etiquetas || [])
  ].join(' ').toLowerCase();
  return texto.includes(String(consulta).toLowerCase());
}

function contieneEstilo(recurso, estilo) {
  if (!estilo) return true;
  const estiloId = normalizarEstiloVideo(estilo);
  const estilos = recurso.estilos || recurso.perfiles || (recurso.perfil ? [recurso.perfil] : []);
  return estilos.map(normalizarEstiloVideo).includes(estiloId);
}

export async function buscarRecursosBiblioteca(filtros = {}) {
  const recursos = await listarRecursosBiblioteca();
  const categoria = filtros.categoria ? normalizarCategoriaBiblioteca(filtros.categoria) : '';
  const estilo = filtros.estilo || filtros.estiloVideo || filtros.perfil || '';

  return recursos.filter((recurso) => {
    if (filtros.tipo && recurso.tipo !== filtros.tipo) return false;
    if (categoria && recurso.categoria !== categoria) return false;
    if (estilo && !contieneEstilo(recurso, estilo)) return false;
    if (filtros.estadoTecnico && recurso.estadoTecnico !== filtros.estadoTecnico) return false;
    if (filtros.estado && recurso.estado !== filtros.estado) return false;
    return coincideTexto(recurso, filtros.consulta || filtros.q || '');
  });
}

export async function buscarPrimerRecurso(filtros = {}) {
  const resultados = await buscarRecursosBiblioteca(filtros);
  return resultados[0] || null;
}

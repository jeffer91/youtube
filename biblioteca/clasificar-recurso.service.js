/*
  Modulo: biblioteca
  Funcion: clasificar un recurso por estilo de video, categoria de recurso, tipo y etiquetas.
*/

import { obtenerCategoriaBiblioteca, normalizarCategoriaBiblioteca } from './categorias.config.js';
import { normalizarListaEstilosVideo } from './estilos-video.config.js';
import { crearRecursoModelo } from './recurso.modelo.js';

const MAPA_PERFIL_ESTILO = Object.freeze({
  futbol: '11-contra-11',
  '11-contra-11': '11-contra-11',
  'jeff-isekai': 'anime',
  anime: 'anime',
  creciaula: 'educacion',
  educacion: 'educacion',
  general: 'general',
  institucional: 'institucional',
  'el-don-historia': 'diversos',
  historia: 'diversos',
  'jeff-verso': 'cine',
  cine: 'cine'
});

export function clasificarRecurso(datos = {}) {
  const estiloBase = datos.estilo || datos.estiloVideo || MAPA_PERFIL_ESTILO[datos.perfil] || datos.perfil || 'general';
  const estilos = normalizarListaEstilosVideo(datos.estilos || datos.perfiles || [estiloBase]);
  const categoriaId = normalizarCategoriaBiblioteca(datos.categoria || datos.tipoEdicion || 'otro');
  const categoria = obtenerCategoriaBiblioteca(categoriaId);
  const etiquetas = new Set([...(datos.etiquetas || []), categoria.id, ...estilos]);
  if (datos.tipo) etiquetas.add(datos.tipo);

  return crearRecursoModelo({
    ...datos,
    categoria: categoria.id,
    estilos,
    perfil: estilos[0],
    etiquetas: [...etiquetas]
  });
}

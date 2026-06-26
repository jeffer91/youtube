/*
  Modulo: biblioteca
  Funcion: clasificar un recurso segun perfil, categoria, tipo y etiquetas.
*/

import { obtenerCategoriaBiblioteca } from './categorias.config.js';
import { crearRecursoModelo } from './recurso.modelo.js';

const MAPA_PERFIL_CATEGORIA = Object.freeze({
  '11-contra-11': 'futbol',
  'jeff-isekai': 'anime',
  creciaula: 'educacion',
  general: 'general',
  institucional: 'institucional',
  'el-don-historia': 'historia',
  'jeff-verso': 'cine'
});

export function clasificarRecurso(datos = {}) {
  const categoriaId = datos.categoria || MAPA_PERFIL_CATEGORIA[datos.perfil] || 'general';
  const categoria = obtenerCategoriaBiblioteca(categoriaId);
  const etiquetas = new Set([...(datos.etiquetas || []), categoria.id]);
  if (datos.perfil) etiquetas.add(datos.perfil);
  if (datos.tipo) etiquetas.add(datos.tipo);

  return crearRecursoModelo({
    ...datos,
    categoria: categoria.id,
    etiquetas: [...etiquetas]
  });
}

/*
  Modulo: biblioteca
  Funcion: categorias grandes de la biblioteca de AutoVideoJeff.
*/

export const CATEGORIAS_BIBLIOTECA = Object.freeze({
  futbol: Object.freeze({ id: 'futbol', nombre: 'Futbol', perfiles: ['11-contra-11'] }),
  anime: Object.freeze({ id: 'anime', nombre: 'Anime', perfiles: ['jeff-isekai'] }),
  educacion: Object.freeze({ id: 'educacion', nombre: 'Educacion', perfiles: ['creciaula'] }),
  general: Object.freeze({ id: 'general', nombre: 'General', perfiles: ['general'] }),
  institucional: Object.freeze({ id: 'institucional', nombre: 'Institucional', perfiles: ['institucional'] }),
  historia: Object.freeze({ id: 'historia', nombre: 'Historia', perfiles: ['el-don-historia'] }),
  cine: Object.freeze({ id: 'cine', nombre: 'Cine', perfiles: ['jeff-verso'] }),
  musica: Object.freeze({ id: 'musica', nombre: 'Musica', perfiles: ['todos'] }),
  efectos: Object.freeze({ id: 'efectos', nombre: 'Efectos', perfiles: ['todos'] }),
  fondos: Object.freeze({ id: 'fondos', nombre: 'Fondos', perfiles: ['todos'] })
});

export function obtenerCategoriaBiblioteca(categoriaId = 'general') {
  return CATEGORIAS_BIBLIOTECA[categoriaId] || CATEGORIAS_BIBLIOTECA.general;
}

export function listarCategoriasBiblioteca() {
  return Object.values(CATEGORIAS_BIBLIOTECA);
}

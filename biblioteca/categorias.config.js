/*
  Modulo: biblioteca
  Funcion: categorias base editables para recursos de video, imagen y audio.
*/

export const CATEGORIAS_BIBLIOTECA = Object.freeze({
  intro: Object.freeze({ id: 'intro', nombre: 'Intro', descripcion: 'Apertura reutilizable de un video.' }),
  ending: Object.freeze({ id: 'ending', nombre: 'Ending', descripcion: 'Cierre o pantalla final.' }),
  logo: Object.freeze({ id: 'logo', nombre: 'Logo', descripcion: 'Logotipo, marca, escudo o identificador visual.' }),
  'top-1': Object.freeze({ id: 'top-1', nombre: 'Top 1', descripcion: 'Recurso para primera posicion o parte principal de un top.' }),
  'top-2': Object.freeze({ id: 'top-2', nombre: 'Top 2', descripcion: 'Recurso para segunda posicion de un top.' }),
  'top-3': Object.freeze({ id: 'top-3', nombre: 'Top 3', descripcion: 'Recurso para tercera posicion de un top.' }),
  transicion: Object.freeze({ id: 'transicion', nombre: 'Transicion', descripcion: 'Cortes, wipes, separadores o movimientos entre escenas.' }),
  fondo: Object.freeze({ id: 'fondo', nombre: 'Fondo', descripcion: 'Fondo visual o ambiental.' }),
  musica: Object.freeze({ id: 'musica', nombre: 'Musica', descripcion: 'Pistas musicales reutilizables.' }),
  'efecto-sonoro': Object.freeze({ id: 'efecto-sonoro', nombre: 'Efecto sonoro', descripcion: 'Sonidos cortos para edicion.' }),
  'texto-plantilla': Object.freeze({ id: 'texto-plantilla', nombre: 'Texto / plantilla', descripcion: 'Plantillas visuales o graficas para textos.' }),
  overlay: Object.freeze({ id: 'overlay', nombre: 'Overlay', descripcion: 'Capas encima del video principal.' }),
  miniatura: Object.freeze({ id: 'miniatura', nombre: 'Miniatura', descripcion: 'Recursos para thumbnails o portada.' }),
  otro: Object.freeze({ id: 'otro', nombre: 'Otro', descripcion: 'Recurso que todavia no encaja en una categoria base.' })
});

const ALIASES_CATEGORIAS = Object.freeze({
  final: 'ending',
  cierre: 'ending',
  outro: 'ending',
  marca: 'logo',
  escudo: 'logo',
  top1: 'top-1',
  'top-uno': 'top-1',
  top2: 'top-2',
  'top-dos': 'top-2',
  top3: 'top-3',
  'top-tres': 'top-3',
  transicion: 'transicion',
  transiciones: 'transicion',
  background: 'fondo',
  music: 'musica',
  sfx: 'efecto-sonoro',
  sonido: 'efecto-sonoro',
  sonidos: 'efecto-sonoro',
  plantilla: 'texto-plantilla',
  texto: 'texto-plantilla',
  thumbnail: 'miniatura',
  miniaturas: 'miniatura',
  futbol: 'otro',
  anime: 'otro',
  cine: 'otro',
  educacion: 'otro',
  institucional: 'otro',
  general: 'otro'
});

function limpiarIdCategoria(valor = '') {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function normalizarCategoriaBiblioteca(categoriaId = 'otro') {
  const limpio = limpiarIdCategoria(categoriaId || 'otro');
  const alias = ALIASES_CATEGORIAS[limpio] || limpio;
  return CATEGORIAS_BIBLIOTECA[alias] ? alias : 'otro';
}

export function obtenerCategoriaBiblioteca(categoriaId = 'otro') {
  return CATEGORIAS_BIBLIOTECA[normalizarCategoriaBiblioteca(categoriaId)] || CATEGORIAS_BIBLIOTECA.otro;
}

export function listarCategoriasBiblioteca() {
  return Object.values(CATEGORIAS_BIBLIOTECA);
}

export function crearCategoriaEditable(datos = {}) {
  const id = normalizarCategoriaBiblioteca(datos.id || datos.nombre || 'otro');
  const base = obtenerCategoriaBiblioteca(id);
  return {
    id,
    nombre: datos.nombre || base.nombre,
    descripcion: datos.descripcion || base.descripcion || '',
    base: Boolean(CATEGORIAS_BIBLIOTECA[id]),
    creadoEn: datos.creadoEn || new Date().toISOString(),
    actualizadoEn: new Date().toISOString()
  };
}

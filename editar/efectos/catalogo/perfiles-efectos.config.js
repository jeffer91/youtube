/*
  Bloque 1: Catalogo de efectos
  Funcion: definir estilo visual recomendado por perfil de AutoVideoJeff.
*/

export const PERFILES_EFECTOS = Object.freeze({
  general: Object.freeze({
    id: 'general',
    nombre: 'General',
    intensidadSugerida: 'normal',
    categoriasPrioritarias: ['movimiento', 'texto', 'overlay', 'color'],
    maxEfectosPorVideo: 12,
    descripcion: 'Edicion equilibrada para videos hablados sin estilo especifico.'
  }),
  '11-contra-11': Object.freeze({
    id: '11-contra-11',
    nombre: '11 contra 11',
    intensidadSugerida: 'fuerte',
    categoriasPrioritarias: ['movimiento', 'ritmo', 'texto', 'overlay', 'color'],
    maxEfectosPorVideo: 18,
    descripcion: 'Estilo deportivo, energico, con golpes visuales y textos de impacto.'
  }),
  'jeff-isekai': Object.freeze({
    id: 'jeff-isekai',
    nombre: 'Jeff Isekai',
    intensidadSugerida: 'fuerte',
    categoriasPrioritarias: ['color', 'movimiento', 'texto', 'ritmo'],
    maxEfectosPorVideo: 18,
    descripcion: 'Estilo anime, vibrante, expresivo y de alto impacto visual.'
  }),
  creciaula: Object.freeze({
    id: 'creciaula',
    nombre: 'Creciaula',
    intensidadSugerida: 'normal',
    categoriasPrioritarias: ['texto', 'overlay', 'movimiento', 'color'],
    maxEfectosPorVideo: 14,
    descripcion: 'Estilo educativo con claridad, textos utiles y movimiento moderado.'
  }),
  institucional: Object.freeze({
    id: 'institucional',
    nombre: 'Institucional',
    intensidadSugerida: 'suave',
    categoriasPrioritarias: ['color', 'overlay', 'texto', 'marca'],
    maxEfectosPorVideo: 10,
    descripcion: 'Estilo sobrio, limpio, profesional y con baja distraccion.'
  }),
  'el-don-historia': Object.freeze({
    id: 'el-don-historia',
    nombre: 'El Don Historia',
    intensidadSugerida: 'normal',
    categoriasPrioritarias: ['color', 'transicion', 'texto', 'movimiento'],
    maxEfectosPorVideo: 14,
    descripcion: 'Estilo narrativo/cine con contraste, pausas y rotulos de contexto.'
  }),
  'jeff-verso': Object.freeze({
    id: 'jeff-verso',
    nombre: 'Jeff Verso',
    intensidadSugerida: 'normal',
    categoriasPrioritarias: ['texto', 'movimiento', 'ritmo', 'marca'],
    maxEfectosPorVideo: 16,
    descripcion: 'Estilo creativo, expresivo y de identidad personal.'
  }),
  diversos: Object.freeze({
    id: 'diversos',
    nombre: 'Diversos',
    intensidadSugerida: 'normal',
    categoriasPrioritarias: ['movimiento', 'color', 'overlay'],
    maxEfectosPorVideo: 12,
    descripcion: 'Perfil flexible para videos que no encajan en los perfiles principales.'
  })
});

export const PERFIL_EFECTOS_PREDETERMINADO = 'general';

export function obtenerPerfilEfectos(perfil = PERFIL_EFECTOS_PREDETERMINADO) {
  const id = String(perfil || PERFIL_EFECTOS_PREDETERMINADO).trim().toLowerCase();
  return PERFILES_EFECTOS[id] || PERFILES_EFECTOS[PERFIL_EFECTOS_PREDETERMINADO];
}

export function listarPerfilesEfectos() {
  return Object.values(PERFILES_EFECTOS);
}

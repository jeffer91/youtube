/*
  Modulo: biblioteca
  Funcion: estilos base de video usados para clasificar recursos permanentes y temporales.
*/

export const ESTILOS_VIDEO_BASE = Object.freeze({
  '11-contra-11': Object.freeze({ id: '11-contra-11', nombre: '11 contra 11', descripcion: 'Recursos para videos de futbol del canal 11 contra 11.' }),
  cine: Object.freeze({ id: 'cine', nombre: 'Cine', descripcion: 'Recursos para videos de cine, criticas, rankings o comentarios.' }),
  anime: Object.freeze({ id: 'anime', nombre: 'Anime', descripcion: 'Recursos para videos de anime o cultura japonesa.' }),
  institucional: Object.freeze({ id: 'institucional', nombre: 'Institucional', descripcion: 'Recursos sobrios para videos institucionales.' }),
  educacion: Object.freeze({ id: 'educacion', nombre: 'Educacion', descripcion: 'Recursos para clases, tutoriales y contenidos formativos.' }),
  general: Object.freeze({ id: 'general', nombre: 'General', descripcion: 'Recursos reutilizables para cualquier estilo.' }),
  diversos: Object.freeze({ id: 'diversos', nombre: 'Diversos', descripcion: 'Recursos que no pertenecen a un estilo fijo.' })
});

const ALIASES_ESTILOS = Object.freeze({
  futbol: '11-contra-11',
  '11': '11-contra-11',
  'once-contra-once': '11-contra-11',
  jeffverso: 'cine',
  'jeff-verso': 'cine',
  'jeff-isekai': 'anime',
  creciaula: 'educacion'
});

function limpiarId(valor = '') {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function normalizarEstiloVideo(valor = 'general') {
  const limpio = limpiarId(valor || 'general');
  const alias = ALIASES_ESTILOS[limpio] || limpio;
  return ESTILOS_VIDEO_BASE[alias] ? alias : 'general';
}

export function normalizarListaEstilosVideo(valor = []) {
  const lista = Array.isArray(valor)
    ? valor
    : typeof valor === 'string' && valor.trim()
      ? valor.split(',')
      : [];
  const normalizados = lista.map(normalizarEstiloVideo).filter(Boolean);
  return [...new Set(normalizados.length ? normalizados : ['general'])];
}

export function obtenerEstiloVideo(id = 'general') {
  return ESTILOS_VIDEO_BASE[normalizarEstiloVideo(id)] || ESTILOS_VIDEO_BASE.general;
}

export function listarEstilosVideo() {
  return Object.values(ESTILOS_VIDEO_BASE);
}

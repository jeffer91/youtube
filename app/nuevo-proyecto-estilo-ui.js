/*
  Módulo: Nuevo proyecto - estilo de video
  Función:
    - Mostrar y conservar el estilo elegido en la pantalla Nuevo proyecto.
    - Inyectar el estilo en las peticiones del flujo por etapas sin depender del archivo app.js.
    - Usar el estilo elegido para orientar las búsquedas de imágenes sugeridas.
*/

const STORAGE_ESTILO_ACTUAL = 'autovideojeff.estiloVideo';
const STORAGE_ESTILO_NOMBRE_ACTUAL = 'autovideojeff.estiloVideoNombre';
const STORAGE_PROYECTO_ACTUAL = 'autovideojeff.proyectoEtapasId';
const STORAGE_ESTILO_PROYECTO = 'autovideojeff.estiloVideo.proyecto';
const STORAGE_ESTILO_NOMBRE_PROYECTO = 'autovideojeff.estiloVideoNombre.proyecto';

const ESTILOS_VIDEO = Object.freeze({
  '11-contra-11': { id: '11-contra-11', nombre: '11 contra 11', busqueda: 'fútbol selección partido cancha estadio' },
  cine: { id: 'cine', nombre: 'Cine', busqueda: 'cine película escena cinematográfica' },
  anime: { id: 'anime', nombre: 'Anime', busqueda: 'anime ilustración manga japonés' },
  institucional: { id: 'institucional', nombre: 'Institucional', busqueda: 'institucional profesional oficina corporativo' },
  educacion: { id: 'educacion', nombre: 'Educación', busqueda: 'educación clase aula aprendizaje' },
  general: { id: 'general', nombre: 'General', busqueda: '' },
  diversos: { id: 'diversos', nombre: 'Diversos', busqueda: 'contexto visual general' }
});

let fetchInterceptado = false;
let windowOpenInterceptado = false;

function $(id) { return document.getElementById(id); }
function texto(valor = '', respaldo = '') { const limpio = String(valor ?? '').trim(); return limpio || respaldo; }

function normalizarEstilo(valor = 'general') {
  const limpio = texto(valor, 'general')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const alias = {
    futbol: '11-contra-11',
    '11': '11-contra-11',
    'once-contra-once': '11-contra-11',
    jeffverso: 'cine',
    'jeff-verso': 'cine',
    'jeff-isekai': 'anime',
    creciaula: 'educacion',
    educación: 'educacion'
  }[limpio] || limpio;

  return ESTILOS_VIDEO[alias] ? alias : 'general';
}

function obtenerEstiloDesdeSelect() {
  return normalizarEstilo($('styleVideoInput')?.value || localStorage.getItem(STORAGE_ESTILO_ACTUAL) || 'general');
}

function obtenerNombreEstilo(estilo = obtenerEstiloDesdeSelect()) {
  return ESTILOS_VIDEO[normalizarEstilo(estilo)]?.nombre || ESTILOS_VIDEO.general.nombre;
}

function obtenerTextoBusquedaEstilo(estilo = obtenerEstiloDesdeSelect()) {
  return ESTILOS_VIDEO[normalizarEstilo(estilo)]?.busqueda || '';
}

function guardarEstiloActual(estiloEntrada = obtenerEstiloDesdeSelect(), proyectoId = '') {
  const estilo = normalizarEstilo(estiloEntrada);
  const nombre = obtenerNombreEstilo(estilo);
  localStorage.setItem(STORAGE_ESTILO_ACTUAL, estilo);
  localStorage.setItem(STORAGE_ESTILO_NOMBRE_ACTUAL, nombre);

  const proyecto = texto(proyectoId || localStorage.getItem(STORAGE_PROYECTO_ACTUAL), '');
  if (proyecto) {
    localStorage.setItem(`${STORAGE_ESTILO_PROYECTO}.${proyecto}`, estilo);
    localStorage.setItem(`${STORAGE_ESTILO_NOMBRE_PROYECTO}.${proyecto}`, nombre);
  }

  return { estilo, nombre };
}

function obtenerEstiloProyectoActual() {
  const proyectoId = texto(localStorage.getItem(STORAGE_PROYECTO_ACTUAL), '');
  const porProyecto = proyectoId ? localStorage.getItem(`${STORAGE_ESTILO_PROYECTO}.${proyectoId}`) : '';
  return normalizarEstilo(porProyecto || localStorage.getItem(STORAGE_ESTILO_ACTUAL) || $('styleVideoInput')?.value || 'general');
}

function sincronizarSelectConStorage() {
  const select = $('styleVideoInput');
  if (!select) return;
  const guardado = obtenerEstiloProyectoActual();
  if ([...select.options].some((option) => option.value === guardado)) select.value = guardado;
  guardarEstiloActual(select.value);
}

function sincronizarPerfilOculto(estilo) {
  const profile = $('profileSelect');
  if (!profile) return;
  const mapa = {
    '11-contra-11': '11-contra-11',
    anime: 'jeff-isekai',
    educacion: 'creciaula',
    institucional: 'institucional',
    cine: 'jeff-verso'
  };
  const sugerido = mapa[normalizarEstilo(estilo)] || 'general';
  if ([...profile.options].some((option) => option.value === sugerido)) profile.value = sugerido;
}

function aplicarEstiloEnCuerpo(body = {}) {
  const { estilo, nombre } = guardarEstiloActual(obtenerEstiloDesdeSelect());
  return {
    ...body,
    estiloVideo: body.estiloVideo || estilo,
    estiloVideoNombre: body.estiloVideoNombre || nombre,
    estilosVideo: Array.isArray(body.estilosVideo) && body.estilosVideo.length ? body.estilosVideo : [estilo]
  };
}

function debeInterceptarJson(url = '', metodo = 'GET') {
  const limpio = String(url || '').split('?')[0];
  if (String(metodo || 'GET').toUpperCase() !== 'POST') return false;
  return /\/api\/proyectos$/.test(limpio) || /\/api\/proyectos\/[^/]+\/entendimiento\/procesar$/.test(limpio);
}

function prepararOpcionesFetch(recurso, opciones = {}) {
  const url = typeof recurso === 'string' ? recurso : recurso?.url || '';
  const metodo = opciones?.method || 'GET';
  if (!debeInterceptarJson(url, metodo) || typeof opciones.body !== 'string') return opciones;

  try {
    const cuerpo = JSON.parse(opciones.body || '{}');
    return { ...opciones, body: JSON.stringify(aplicarEstiloEnCuerpo(cuerpo)) };
  } catch (_error) {
    return opciones;
  }
}

function extraerProyectoIdDesdeRespuesta(datos = {}) {
  return datos?.proyecto?.proyectoId || datos?.proyecto?.id || datos?.proyectoId || datos?.id || '';
}

async function guardarEstiloDesdeRespuesta(url = '', respuesta) {
  if (!/\/api\/proyectos$/.test(String(url || '').split('?')[0]) || !respuesta?.ok) return;
  try {
    const datos = await respuesta.clone().json();
    const proyectoId = extraerProyectoIdDesdeRespuesta(datos);
    if (proyectoId) {
      localStorage.setItem(STORAGE_PROYECTO_ACTUAL, proyectoId);
      guardarEstiloActual(obtenerEstiloDesdeSelect(), proyectoId);
    }
  } catch (_error) {
    // No bloquea el flujo principal si la respuesta no se puede leer dos veces.
  }
}

function agregarEstiloAConsulta(consulta = '') {
  const estilo = obtenerEstiloProyectoActual();
  const textoEstilo = obtenerTextoBusquedaEstilo(estilo);
  if (!textoEstilo || estilo === 'general') return consulta;
  const base = texto(consulta, 'imagen apoyo');
  const baseNormalizada = base.toLowerCase();
  const repetido = textoEstilo.split(/\s+/).some((palabra) => palabra.length > 3 && baseNormalizada.includes(palabra.toLowerCase()));
  return repetido ? base : `${base} ${textoEstilo}`.trim();
}

function agregarEstiloAWikimediaUrl(urlOriginal = '') {
  try {
    const url = new URL(urlOriginal, window.location.href);
    if (!/commons\.wikimedia\.org$/i.test(url.hostname)) return urlOriginal;
    const actual = url.searchParams.get('gsrsearch') || '';
    url.searchParams.set('gsrsearch', agregarEstiloAConsulta(actual));
    return url.toString();
  } catch (_error) {
    return urlOriginal;
  }
}

function agregarEstiloAGoogleImagenes(urlOriginal = '') {
  try {
    const url = new URL(urlOriginal, window.location.href);
    if (!/google\./i.test(url.hostname) || url.searchParams.get('tbm') !== 'isch') return urlOriginal;
    const actual = url.searchParams.get('q') || '';
    url.searchParams.set('q', agregarEstiloAConsulta(actual));
    return url.toString();
  } catch (_error) {
    return urlOriginal;
  }
}

function interceptarFetch() {
  if (fetchInterceptado || typeof window.fetch !== 'function') return;
  fetchInterceptado = true;
  const fetchOriginal = window.fetch.bind(window);

  window.fetch = async (recurso, opciones = {}) => {
    const urlOriginal = typeof recurso === 'string' ? recurso : recurso?.url || '';
    const recursoFinal = typeof recurso === 'string' ? agregarEstiloAWikimediaUrl(recurso) : recurso;
    const opcionesFinales = prepararOpcionesFetch(recursoFinal, opciones || {});
    const respuesta = await fetchOriginal(recursoFinal, opcionesFinales);
    await guardarEstiloDesdeRespuesta(urlOriginal, respuesta);
    return respuesta;
  };
}

function interceptarWindowOpen() {
  if (windowOpenInterceptado || typeof window.open !== 'function') return;
  windowOpenInterceptado = true;
  const openOriginal = window.open.bind(window);
  window.open = (url, target, features) => openOriginal(agregarEstiloAGoogleImagenes(url), target, features);
}

function inicializarSelectorEstilo() {
  const select = $('styleVideoInput');
  if (!select || select.dataset.estiloInicializado === '1') return;
  select.dataset.estiloInicializado = '1';
  sincronizarSelectConStorage();
  sincronizarPerfilOculto(select.value);
  select.addEventListener('change', () => {
    const { estilo } = guardarEstiloActual(select.value);
    sincronizarPerfilOculto(estilo);
  });
}

export function inicializarNuevoProyectoEstiloUI() {
  if (typeof document === 'undefined') return;
  inicializarSelectorEstilo();
  interceptarFetch();
  interceptarWindowOpen();
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', inicializarNuevoProyectoEstiloUI);
  document.addEventListener('autovideo:navegacion', inicializarNuevoProyectoEstiloUI);
}

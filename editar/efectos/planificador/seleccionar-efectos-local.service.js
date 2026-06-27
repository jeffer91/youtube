/*
  Bloque 3: Planificador local de efectos
  Funcion: escoger efectos desde el catalogo sin depender de Gemini.
*/

import { buscarEfectoPorId, listarEfectosCatalogo } from '../catalogo/index.js';

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function contiene(lista = [], valor = '') {
  return Array.isArray(lista) && lista.includes(valor);
}

function obtenerNecesidades(contexto = {}) {
  return Array.isArray(contexto?.necesidades) ? contexto.necesidades : [];
}

function calcularPuntajeEfecto(efecto, contexto = {}) {
  const necesidades = obtenerNecesidades(contexto);
  const perfilId = contexto?.perfil?.id || 'general';
  const categoriasPrioritarias = contexto?.perfil?.categoriasPrioritarias || [];
  let puntaje = numero(efecto.pesoBase, 50);

  if (contiene(efecto.perfilesRecomendados, perfilId)) puntaje += 30;
  if (contiene(efecto.perfilesRecomendados, 'general')) puntaje += 8;
  if (contiene(categoriasPrioritarias, efecto.categoria)) puntaje += 16;
  if (contexto?.tieneTextosFlotantes && efecto.requiereTexto) puntaje += 12;
  if (contexto?.tieneTranscripcion && efecto.requiereTranscripcion) puntaje += 10;
  if (contexto?.momentos?.total > 0 && efecto.requiereMomentoClave) puntaje += 10;

  if (necesidades.includes('video_estatico') && ['movimiento', 'overlay', 'color'].includes(efecto.categoria)) puntaje += 18;
  if (necesidades.includes('sin_textos_visuales') && efecto.requiereTexto) puntaje -= 24;
  if (necesidades.includes('alta_energia') && ['movimiento', 'ritmo', 'texto'].includes(efecto.categoria)) puntaje += 20;
  if (necesidades.includes('claridad_visual') && ['texto', 'overlay', 'color'].includes(efecto.categoria)) puntaje += 16;
  if (necesidades.includes('narrativa_visual') && ['color', 'transicion', 'texto'].includes(efecto.categoria)) puntaje += 16;

  if (efecto.requiereTranscripcion && !contexto?.tieneTranscripcion) puntaje -= 35;
  if (efecto.requiereTexto && !contexto?.tieneTextosFlotantes && !contexto?.tieneTranscripcion) puntaje -= 35;
  if (efecto.requiereMomentoClave && !contexto?.momentos?.total) puntaje -= 25;

  return puntaje;
}

function elegirTexto({ efecto, momento, contexto }) {
  if (!efecto?.requiereTexto) return '';
  const base = momento?.texto || '';
  if (base && base.length <= 42) return base;
  if (base) return `${base.slice(0, 39).trim()}...`;
  const perfil = contexto?.perfil?.nombre || 'AutoVideoJeff';
  if (efecto.id === 'cta_final') return 'Guarda este video';
  if (efecto.id === 'titulo_inicial') return perfil;
  return 'Idea clave';
}

function distribuirEnMomentos(efectos = [], contexto = {}) {
  const momentos = Array.isArray(contexto?.momentos?.momentos) ? contexto.momentos.momentos : [];
  const duracion = numero(contexto?.duracionSegundos, 0);
  const baseMomentos = momentos.length > 0
    ? momentos
    : [{ inicio: 1.2, fin: Math.min(3.2, duracion || 3.2), texto: 'Inicio', prioridad: 50 }];

  return efectos.map((efecto, index) => {
    const momento = baseMomentos[index % baseMomentos.length];
    const inicio = numero(momento?.inicio, 1 + index * 3);
    const duracionEfecto = efecto.categoria === 'texto' ? numero(contexto?.intensidad?.duracionTextoSegundos, 1.8) : numero(contexto?.intensidad?.duracionMovimientoSegundos, 2.2);
    const fin = Math.min(numero(momento?.fin, inicio + duracionEfecto), duracion || inicio + duracionEfecto);

    return {
      idPlan: `efecto-${index + 1}`,
      efectoId: efecto.id,
      nombre: efecto.nombre,
      categoria: efecto.categoria,
      inicio,
      fin: Math.max(inicio + 0.6, fin),
      intensidad: contexto?.intensidad?.id || 'normal',
      texto: elegirTexto({ efecto, momento, contexto }),
      prioridad: numero(efecto.pesoBase, 50),
      origen: 'local',
      motivo: `Seleccionado por perfil ${contexto?.perfil?.nombre || 'General'}.`
    };
  });
}

function completarMinimos(efectos = [], contexto = {}) {
  const ids = new Set(efectos.map((efecto) => efecto.id));
  const minimos = ['micro_movimiento', 'barra_progreso', 'nitidez_rostro'];
  const catalogo = listarEfectosCatalogo();
  const agregados = [];

  for (const id of minimos) {
    if (!ids.has(id)) {
      const efecto = buscarEfectoPorId(id) || catalogo.find((item) => item.id === id);
      if (efecto) agregados.push(efecto);
    }
  }

  const perfilId = contexto?.perfil?.id || 'general';
  if (perfilId === '11-contra-11' && !ids.has('color_futbol_vibrante')) {
    const efecto = buscarEfectoPorId('color_futbol_vibrante');
    if (efecto) agregados.push(efecto);
  }

  return [...efectos, ...agregados];
}

export function seleccionarEfectosLocal(contexto = {}, { maxEfectos = null } = {}) {
  const idsCompatibles = new Set(contexto?.idsEfectosCompatibles || []);
  const catalogo = listarEfectosCatalogo().filter((efecto) => idsCompatibles.size === 0 || idsCompatibles.has(efecto.id));
  const maximo = Math.max(3, numero(maxEfectos || contexto?.perfil?.maxEfectosPorVideo || 12, 12));

  const seleccionados = catalogo
    .map((efecto) => ({ efecto, puntaje: calcularPuntajeEfecto(efecto, contexto) }))
    .filter((item) => item.puntaje > 35)
    .sort((a, b) => b.puntaje - a.puntaje)
    .slice(0, maximo)
    .map((item) => item.efecto);

  const conMinimos = completarMinimos(seleccionados, contexto).slice(0, maximo);
  const efectosPlan = distribuirEnMomentos(conMinimos, contexto);

  return {
    ok: true,
    origen: 'local',
    perfil: contexto?.perfil?.id || 'general',
    intensidad: contexto?.intensidad?.id || 'normal',
    total: efectosPlan.length,
    efectos: efectosPlan,
    mensaje: `Selector local eligio ${efectosPlan.length} efectos.`
  };
}

export default seleccionarEfectosLocal;

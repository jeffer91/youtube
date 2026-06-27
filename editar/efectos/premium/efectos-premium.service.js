/*
  Bloque 13: Efectos visuales premium
  Función: elevar el plan de efectos con una capa premium segura antes de compilar FFmpeg.
*/

import { buscarEfectoPorId } from '../catalogo/index.js';
import { tieneRecetaFfmpeg } from '../ffmpeg/index.js';

const PAQUETES_PREMIUM = Object.freeze({
  '11-contra-11': Object.freeze({
    id: 'premium-futbol',
    nombre: 'Premium fútbol dinámico',
    intensidadBase: 'fuerte',
    idsBase: ['color_futbol_vibrante', 'barra_progreso', 'marcador_futbol', 'texto_impacto', 'flash_suave', 'marca_esquina'],
    idsHook: ['zoom_deportivo', 'punch_in_fuerte', 'texto_impacto'],
    idsCierre: ['cta_final', 'cierre_visual_marca', 'fade_out']
  }),
  'jeff-isekai': Object.freeze({
    id: 'premium-anime',
    nombre: 'Premium anime vivo',
    intensidadBase: 'fuerte',
    idsBase: ['color_anime_vivo', 'barra_progreso', 'texto_impacto', 'flash_suave', 'marca_esquina'],
    idsHook: ['punch_in_fuerte', 'texto_impacto', 'pregunta_en_pantalla'],
    idsCierre: ['cta_final', 'cierre_visual_marca', 'fade_out']
  }),
  creciaula: Object.freeze({
    id: 'premium-educacion',
    nombre: 'Premium educativo claro',
    intensidadBase: 'normal',
    idsBase: ['color_educacion_claro', 'nitidez_rostro', 'sombra_inferior', 'barra_progreso', 'lower_third'],
    idsHook: ['titulo_inicial', 'pregunta_en_pantalla', 'punch_in_suave'],
    idsCierre: ['tarjeta_resumen', 'cta_final', 'fade_out']
  }),
  institucional: Object.freeze({
    id: 'premium-institucional',
    nombre: 'Premium institucional limpio',
    intensidadBase: 'suave',
    idsBase: ['color_institucional_limpio', 'nitidez_rostro', 'lower_third', 'borde_institucional', 'marca_esquina'],
    idsHook: ['titulo_inicial', 'bloque_contexto', 'punch_in_suave'],
    idsCierre: ['cierre_visual_marca', 'fade_out']
  }),
  'el-don-historia': Object.freeze({
    id: 'premium-historia',
    nombre: 'Premium historia narrativa',
    intensidadBase: 'normal',
    idsBase: ['color_cine_contraste', 'vineta_suave', 'bloque_contexto', 'sombra_inferior', 'marca_esquina'],
    idsHook: ['titulo_inicial', 'frase_destacada', 'punch_in_suave'],
    idsCierre: ['cierre_visual_marca', 'fade_out']
  }),
  'jeff-verso': Object.freeze({
    id: 'premium-cine',
    nombre: 'Premium cine emocional',
    intensidadBase: 'normal',
    idsBase: ['tono_calido', 'vineta_suave', 'frase_destacada', 'sombra_inferior', 'marca_esquina'],
    idsHook: ['texto_impacto', 'punch_in_suave', 'pregunta_en_pantalla'],
    idsCierre: ['cta_final', 'cierre_visual_marca', 'fade_out']
  }),
  general: Object.freeze({
    id: 'premium-general',
    nombre: 'Premium general limpio',
    intensidadBase: 'normal',
    idsBase: ['micro_movimiento', 'nitidez_rostro', 'barra_progreso', 'sombra_inferior', 'marca_esquina'],
    idsHook: ['titulo_inicial', 'pregunta_en_pantalla', 'punch_in_suave'],
    idsCierre: ['cta_final', 'cierre_visual_marca', 'fade_out']
  })
});

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function texto(valor, respaldo = '') {
  const limpio = String(valor ?? '').replace(/\s+/g, ' ').trim();
  return limpio || respaldo;
}

function obtenerPerfilId(plan = {}, opciones = {}) {
  return plan?.perfil?.id || plan?.perfil || opciones?.perfil || plan?.contexto?.perfil?.id || 'general';
}

function obtenerPaquetePremium(perfilId = 'general') {
  return PAQUETES_PREMIUM[perfilId] || PAQUETES_PREMIUM.general;
}

function obtenerDuracion(plan = {}, entendimiento = {}) {
  return numero(plan?.duracionSegundos || plan?.contexto?.duracionSegundos || entendimiento?.analisis?.duracionSegundos || entendimiento?.resumen?.duracionSegundos, 0);
}

function obtenerMomentos(plan = {}, edicionDinamica = {}) {
  const desdeContexto = plan?.contexto?.momentos?.momentos;
  const desdeEdicion = edicionDinamica?.mapaTiempo;
  const momentos = Array.isArray(desdeContexto) && desdeContexto.length ? desdeContexto : Array.isArray(desdeEdicion) ? desdeEdicion : [];
  return momentos.map((momento, index) => ({
    id: momento.id || `momento-${index + 1}`,
    inicio: numero(momento.inicio ?? momento.start, 1 + index * 3),
    fin: numero(momento.fin ?? momento.end, 3 + index * 3),
    texto: texto(momento.texto || momento.nombre || momento.motivo, ''),
    tipo: texto(momento.tipo, index === 0 ? 'hook' : 'idea'),
    prioridad: numero(momento.prioridad, index === 0 ? 95 : 60)
  }));
}

function crearMomentoSeguro({ momentos = [], duracion = 0, tipo = 'base' } = {}) {
  if (tipo === 'hook') return momentos[0] || { inicio: 0.4, fin: Math.min(3.2, duracion || 3.2), texto: 'Idea clave', tipo: 'hook', prioridad: 95 };
  if (tipo === 'cierre') return { inicio: Math.max(0, (duracion || 10) - 3.2), fin: Math.max(2.2, duracion || 10), texto: 'Cierre', tipo: 'cierre', prioridad: 85 };
  return momentos[1] || momentos[0] || { inicio: 1.2, fin: Math.min(4.2, duracion || 4.2), texto: 'Momento clave', tipo: 'idea', prioridad: 60 };
}

function elegirTextoPremium(efectoId, momento = {}, perfilId = 'general') {
  if (efectoId === 'cta_final') return perfilId === '11-contra-11' ? 'Sígueme para más fútbol' : 'Guarda este video';
  if (efectoId === 'titulo_inicial') return momento.texto || 'AutoVideoJeff';
  if (efectoId === 'pregunta_en_pantalla') return momento.texto ? `${momento.texto.slice(0, 42)}?` : '¿Qué opinas?';
  if (efectoId === 'marcador_futbol') return '11 CONTRA 11';
  if (efectoId === 'cierre_visual_marca' || efectoId === 'marca_esquina') return 'AutoVideoJeff';
  if (['texto_impacto', 'frase_destacada', 'tarjeta_resumen', 'bloque_contexto', 'lower_third'].includes(efectoId)) return momento.texto || 'Idea clave';
  return '';
}

function crearEfectoPremium({ efectoId, plan, momento, paquete, perfilId, duracion, index, tipoMomento = 'base' } = {}) {
  const efecto = buscarEfectoPorId(efectoId);
  if (!efecto || !tieneRecetaFfmpeg(efectoId)) return null;
  const intensidad = plan?.intensidad?.id || plan?.intensidad || paquete.intensidadBase || 'normal';
  const inicioBase = numero(momento?.inicio, 0.5 + index * 2);
  const duracionEfecto = efecto.categoria === 'texto' ? 1.8 : efecto.categoria === 'overlay' ? 2.4 : 2.0;
  const finBase = numero(momento?.fin, inicioBase + duracionEfecto);
  const inicio = Math.max(0, inicioBase);
  const fin = Math.min(duracion || finBase, Math.max(inicio + 0.7, finBase));
  return {
    idPlan: `premium-${paquete.id}-${efectoId}-${index + 1}`,
    efectoId,
    nombre: efecto.nombre,
    categoria: efecto.categoria,
    inicio,
    fin,
    intensidad,
    texto: elegirTextoPremium(efectoId, momento, perfilId),
    prioridad: numero(efecto.pesoBase, 70) + 18,
    origen: 'premium',
    tipoMomento,
    motivo: `Capa premium ${paquete.nombre}: ${efecto.descripcion}`
  };
}

function deduplicarEfectos(efectos = []) {
  const usados = new Set();
  const resultado = [];
  for (const efecto of efectos) {
    const clave = `${efecto.efectoId}-${Math.round(numero(efecto.inicio, 0) * 10)}`;
    if (usados.has(clave)) continue;
    usados.add(clave);
    resultado.push(efecto);
  }
  return resultado.sort((a, b) => numero(a.inicio, 0) - numero(b.inicio, 0) || numero(b.prioridad, 0) - numero(a.prioridad, 0));
}

function calcularCalidadPremium({ efectos = [], agregados = [], paquete, maxEfectos = 12 } = {}) {
  const categorias = new Set(efectos.map((efecto) => efecto.categoria).filter(Boolean));
  let score = 58;
  score += Math.min(20, categorias.size * 4);
  score += Math.min(15, agregados.length * 3);
  score += paquete?.id !== 'premium-general' ? 5 : 2;
  if (efectos.length > maxEfectos) score -= 10;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function listarPaquetesPremiumEfectos() {
  return Object.values(PAQUETES_PREMIUM).map((paquete) => ({
    id: paquete.id,
    nombre: paquete.nombre,
    intensidadBase: paquete.intensidadBase,
    idsBase: paquete.idsBase,
    idsHook: paquete.idsHook,
    idsCierre: paquete.idsCierre
  }));
}

export function mejorarPlanEfectosPremium({ plan = {}, entrada = null, entendimiento = null, transcripcion = null, edicionDinamica = null, opciones = {} } = {}) {
  if (!plan || typeof plan !== 'object') return plan;
  if (opciones?.usarEfectosPremium === false) return { ...plan, premium: { aplicado: false, motivo: 'Capa premium desactivada por configuración.' } };

  const perfilId = obtenerPerfilId(plan, opciones);
  const paquete = obtenerPaquetePremium(perfilId);
  const duracion = obtenerDuracion(plan, entendimiento);
  const momentos = obtenerMomentos(plan, edicionDinamica);
  const maxEfectos = Math.max(6, numero(opciones?.maxEfectosPremium || opciones?.maxEfectosVisuales || plan?.maxEfectos, 14));
  const existentes = Array.isArray(plan.efectos) ? plan.efectos : [];
  const idsExistentes = new Set(existentes.map((efecto) => efecto.efectoId));
  const agregados = [];

  const grupos = [
    { tipo: 'base', ids: paquete.idsBase, momento: crearMomentoSeguro({ momentos, duracion, tipo: 'base' }) },
    { tipo: 'hook', ids: paquete.idsHook, momento: crearMomentoSeguro({ momentos, duracion, tipo: 'hook' }) },
    { tipo: 'cierre', ids: paquete.idsCierre, momento: crearMomentoSeguro({ momentos, duracion, tipo: 'cierre' }) }
  ];

  for (const grupo of grupos) {
    for (const efectoId of grupo.ids) {
      if (agregados.length + existentes.length >= maxEfectos) break;
      if (idsExistentes.has(efectoId) && grupo.tipo === 'base') continue;
      const efectoPremium = crearEfectoPremium({ efectoId, plan, momento: grupo.momento, paquete, perfilId, duracion, index: agregados.length, tipoMomento: grupo.tipo });
      if (efectoPremium) agregados.push(efectoPremium);
    }
  }

  const efectos = deduplicarEfectos([...existentes, ...agregados]).slice(0, maxEfectos);
  const calidadPremium = calcularCalidadPremium({ efectos, agregados, paquete, maxEfectos });

  return {
    ...plan,
    ok: true,
    tipo: `${plan.tipo || 'plan-efectos'}-premium`,
    origen: plan.origen || 'local',
    efectos,
    total: efectos.length,
    maxEfectos,
    premium: {
      aplicado: agregados.length > 0,
      bloque: 13,
      paquete: { id: paquete.id, nombre: paquete.nombre, perfilId },
      efectosAgregados: agregados.length,
      idsAgregados: agregados.map((item) => item.efectoId),
      calidadPremium,
      seguridad: {
        usaSoloRecetasFfmpeg: true,
        respetaMaxEfectos: efectos.length <= maxEfectos,
        fallbackCompatible: true
      },
      señales: {
        momentosDetectados: momentos.length,
        tieneTranscripcion: Boolean(transcripcion?.textoCompleto || plan?.contexto?.tieneTranscripcion),
        proyectoId: entrada?.proyecto?.id || null
      }
    },
    mensaje: `${plan.mensaje || 'Plan de efectos creado.'} Capa premium ${paquete.nombre} aplicada con ${agregados.length} efecto(s).`
  };
}

export function previsualizarEfectosPremium(payload = {}) {
  const plan = payload.plan || { efectos: [], perfil: { id: payload.perfil || 'general' }, duracionSegundos: numero(payload.duracionSegundos, 30), maxEfectos: numero(payload.maxEfectos, 12) };
  return mejorarPlanEfectosPremium({ plan, entrada: payload.entrada || null, entendimiento: payload.entendimiento || null, transcripcion: payload.transcripcion || null, edicionDinamica: payload.edicionDinamica || null, opciones: payload.opciones || payload || {} });
}

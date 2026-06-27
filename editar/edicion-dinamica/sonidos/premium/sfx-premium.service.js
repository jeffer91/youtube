/*
  Bloque 14: SFX premium
  Función: mejorar los eventos de sonido con una capa premium segura por perfil.
*/

import { SONIDOS_EDICION, limitarNumero } from '../sonidos.config.js';

const PAQUETES_SFX_PREMIUM = Object.freeze({
  '11-contra-11': Object.freeze({
    id: 'sfx-premium-futbol',
    nombre: 'SFX premium fútbol',
    volumenFactor: 1.18,
    separacionMinimaSegundos: 1.05,
    maxEventosExtra: 5,
    mapa: {
      hook: SONIDOS_EDICION.HIT,
      texto: SONIDOS_EDICION.POP,
      zoom: SONIDOS_EDICION.WHOOSH,
      overlay: SONIDOS_EDICION.CLICK,
      cierre: SONIDOS_EDICION.OUTRO,
      intro: SONIDOS_EDICION.INTRO
    }
  }),
  'jeff-isekai': Object.freeze({
    id: 'sfx-premium-anime',
    nombre: 'SFX premium anime',
    volumenFactor: 1.15,
    separacionMinimaSegundos: 1.0,
    maxEventosExtra: 5,
    mapa: {
      hook: SONIDOS_EDICION.HIT,
      texto: SONIDOS_EDICION.POP,
      zoom: SONIDOS_EDICION.WHOOSH,
      overlay: SONIDOS_EDICION.CLICK,
      cierre: SONIDOS_EDICION.OUTRO,
      intro: SONIDOS_EDICION.INTRO
    }
  }),
  creciaula: Object.freeze({
    id: 'sfx-premium-educacion',
    nombre: 'SFX premium educativo',
    volumenFactor: 0.92,
    separacionMinimaSegundos: 1.65,
    maxEventosExtra: 3,
    mapa: {
      hook: SONIDOS_EDICION.INTRO,
      texto: SONIDOS_EDICION.CLICK,
      zoom: SONIDOS_EDICION.WHOOSH,
      overlay: SONIDOS_EDICION.POP,
      cierre: SONIDOS_EDICION.OUTRO,
      intro: SONIDOS_EDICION.INTRO
    }
  }),
  institucional: Object.freeze({
    id: 'sfx-premium-institucional',
    nombre: 'SFX premium institucional',
    volumenFactor: 0.82,
    separacionMinimaSegundos: 1.9,
    maxEventosExtra: 2,
    mapa: {
      hook: SONIDOS_EDICION.INTRO,
      texto: SONIDOS_EDICION.CLICK,
      zoom: SONIDOS_EDICION.WHOOSH,
      overlay: SONIDOS_EDICION.CLICK,
      cierre: SONIDOS_EDICION.OUTRO,
      intro: SONIDOS_EDICION.INTRO
    }
  }),
  'el-don-historia': Object.freeze({
    id: 'sfx-premium-historia',
    nombre: 'SFX premium historia',
    volumenFactor: 0.98,
    separacionMinimaSegundos: 1.45,
    maxEventosExtra: 4,
    mapa: {
      hook: SONIDOS_EDICION.INTRO,
      texto: SONIDOS_EDICION.POP,
      zoom: SONIDOS_EDICION.WHOOSH,
      overlay: SONIDOS_EDICION.CLICK,
      cierre: SONIDOS_EDICION.OUTRO,
      intro: SONIDOS_EDICION.INTRO
    }
  }),
  'jeff-verso': Object.freeze({
    id: 'sfx-premium-cine',
    nombre: 'SFX premium cine',
    volumenFactor: 1.0,
    separacionMinimaSegundos: 1.35,
    maxEventosExtra: 4,
    mapa: {
      hook: SONIDOS_EDICION.INTRO,
      texto: SONIDOS_EDICION.POP,
      zoom: SONIDOS_EDICION.WHOOSH,
      overlay: SONIDOS_EDICION.CLICK,
      cierre: SONIDOS_EDICION.OUTRO,
      intro: SONIDOS_EDICION.INTRO
    }
  }),
  general: Object.freeze({
    id: 'sfx-premium-general',
    nombre: 'SFX premium general',
    volumenFactor: 1.0,
    separacionMinimaSegundos: 1.4,
    maxEventosExtra: 3,
    mapa: {
      hook: SONIDOS_EDICION.INTRO,
      texto: SONIDOS_EDICION.POP,
      zoom: SONIDOS_EDICION.WHOOSH,
      overlay: SONIDOS_EDICION.CLICK,
      cierre: SONIDOS_EDICION.OUTRO,
      intro: SONIDOS_EDICION.INTRO
    }
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

function obtenerPerfilId({ opciones = {}, visualDinamico = {}, edicionDinamica = {} } = {}) {
  return opciones.perfil || opciones.perfilId || visualDinamico?.motorEfectos?.detalle?.perfil || visualDinamico?.perfil || edicionDinamica?.perfil || 'general';
}

function obtenerPaqueteSfx(perfilId = 'general') {
  return PAQUETES_SFX_PREMIUM[perfilId] || PAQUETES_SFX_PREMIUM.general;
}

function clasificarEvento(evento = {}) {
  const base = `${evento.origenVisual || ''} ${evento.tipo || ''} ${evento.texto || ''} ${evento.motivo || ''}`.toLowerCase();
  if (base.includes('hook') || base.includes('gancho')) return 'hook';
  if (base.includes('intro') || base.includes('titulo')) return 'intro';
  if (base.includes('cierre') || base.includes('outro') || base.includes('cta')) return 'cierre';
  if (base.includes('zoom') || base.includes('punch') || base.includes('movimiento')) return 'zoom';
  if (base.includes('overlay') || base.includes('barra') || base.includes('marca') || base.includes('etiqueta')) return 'overlay';
  return 'texto';
}

function ajustarEventoPremium({ evento, paquete, config, index } = {}) {
  const clase = clasificarEvento(evento);
  const sonido = paquete.mapa[clase] || evento.sonido || SONIDOS_EDICION.POP;
  const volumenSeguro = limitarNumero(numero(evento.volumen, config.volumen) * paquete.volumenFactor, 0.035, config.volumenMaximo, config.volumen);
  return {
    ...evento,
    id: index + 1,
    sonido,
    volumen: volumenSeguro,
    sfxPremium: true,
    claseSfx: clase,
    paqueteSfx: paquete.id,
    motivo: texto(evento.motivo, 'Sonido sincronizado con evento visual.') + ` Capa ${paquete.nombre}.`
  };
}

function obtenerEfectosPremiumDesdeVisual(visualDinamico = {}) {
  const efectos = visualDinamico?.motorEfectos?.plan?.efectos || visualDinamico?.motorEfectos?.compilado?.compilados || [];
  return Array.isArray(efectos) ? efectos.filter((item) => item?.origen === 'premium' || String(item?.idPlan || '').startsWith('premium-')) : [];
}

function eventoDesdeEfectoPremium({ efecto, paquete, config, index } = {}) {
  const clase = efecto.tipoMomento || (efecto.categoria === 'movimiento' ? 'zoom' : efecto.categoria === 'overlay' ? 'overlay' : efecto.categoria === 'texto' ? 'texto' : 'hook');
  const sonido = paquete.mapa[clase] || SONIDOS_EDICION.POP;
  const tiempo = Math.max(numero(config.inicioSeguroSegundos, 0.9), numero(efecto.inicio, 0));
  return {
    id: index + 1,
    tipo: 'sfx-premium',
    origenVisual: `efecto-premium:${efecto.efectoId || efecto.id || 'efecto'}`,
    tiempo,
    sonido,
    volumen: limitarNumero(config.volumen * paquete.volumenFactor, 0.035, config.volumenMaximo, config.volumen),
    texto: texto(efecto.texto || efecto.nombre, ''),
    motivo: `SFX premium generado desde ${efecto.nombre || efecto.efectoId || 'efecto visual premium'}.`,
    sfxPremium: true,
    claseSfx: clase,
    paqueteSfx: paquete.id
  };
}

function distanciaSegura(evento, salida, separacion) {
  return salida.every((previo) => Math.abs(numero(evento.tiempo, 0) - numero(previo.tiempo, 0)) >= separacion);
}

function ordenarYFiltrar(eventos = [], { paquete, config } = {}) {
  const separacion = numero(paquete.separacionMinimaSegundos || config.separacionMinimaSegundos, config.separacionMinimaSegundos);
  const maximo = numero(config.cantidadMaximaEventos, 10);
  const salida = [];
  for (const evento of [...eventos].sort((a, b) => numero(a.tiempo, 0) - numero(b.tiempo, 0))) {
    if (numero(evento.tiempo, 0) < numero(config.inicioSeguroSegundos, 0.9)) continue;
    if (!distanciaSegura(evento, salida, separacion)) continue;
    salida.push({ ...evento, id: salida.length + 1 });
    if (salida.length >= maximo) break;
  }
  return salida;
}

function calcularCalidadSfx({ eventos = [], agregados = [], paquete } = {}) {
  const sonidos = new Set(eventos.map((evento) => evento.sonido).filter(Boolean));
  let score = 55;
  score += Math.min(18, sonidos.size * 3);
  score += Math.min(15, agregados.length * 4);
  score += paquete?.id !== 'sfx-premium-general' ? 6 : 3;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function listarPaquetesSfxPremium() {
  return Object.values(PAQUETES_SFX_PREMIUM).map((paquete) => ({
    id: paquete.id,
    nombre: paquete.nombre,
    volumenFactor: paquete.volumenFactor,
    separacionMinimaSegundos: paquete.separacionMinimaSegundos,
    maxEventosExtra: paquete.maxEventosExtra,
    mapa: paquete.mapa
  }));
}

export function mejorarEventosSonidoPremium({ eventos = [], visualDinamico = null, edicionDinamica = null, opciones = {}, config = {} } = {}) {
  if (opciones?.usarSfxPremium === false) {
    return {
      ok: true,
      omitido: false,
      eventos,
      premium: { aplicado: false, motivo: 'SFX premium desactivado por configuración.' }
    };
  }

  const perfilId = obtenerPerfilId({ opciones, visualDinamico, edicionDinamica });
  const paquete = obtenerPaqueteSfx(perfilId);
  const base = (Array.isArray(eventos) ? eventos : []).map((evento, index) => ajustarEventoPremium({ evento, paquete, config, index }));
  const efectosPremium = obtenerEfectosPremiumDesdeVisual(visualDinamico);
  const extras = efectosPremium
    .slice(0, paquete.maxEventosExtra)
    .map((efecto, index) => eventoDesdeEfectoPremium({ efecto, paquete, config, index: base.length + index }));
  const eventosFinales = ordenarYFiltrar([...base, ...extras], { paquete, config });
  const calidadSfx = calcularCalidadSfx({ eventos: eventosFinales, agregados: extras, paquete });

  return {
    ok: true,
    omitido: eventosFinales.length === 0,
    eventos: eventosFinales,
    eventosOriginales: base.length,
    eventosExtraPremium: extras.length,
    eventosDescartadosPremium: Math.max(0, base.length + extras.length - eventosFinales.length),
    premium: {
      aplicado: true,
      bloque: 14,
      paquete: { id: paquete.id, nombre: paquete.nombre, perfilId },
      calidadSfx,
      usaSoloSonidosBase: true,
      respetaInicioSeguro: true,
      respetaSeparacion: true,
      maxEventos: config.cantidadMaximaEventos,
      sonidosUsados: [...new Set(eventosFinales.map((item) => item.sonido))]
    },
    mensaje: `SFX premium aplicado con ${eventosFinales.length} evento(s).`
  };
}

export function previsualizarSfxPremium(payload = {}) {
  const config = {
    activo: true,
    volumen: numero(payload.volumen, 0.11),
    volumenMaximo: numero(payload.volumenMaximo, 0.22),
    inicioSeguroSegundos: numero(payload.inicioSeguroSegundos, 0.9),
    separacionMinimaSegundos: numero(payload.separacionMinimaSegundos, 1.4),
    cantidadMaximaEventos: numero(payload.cantidadMaximaEventos, 10)
  };
  const eventos = Array.isArray(payload.eventos) && payload.eventos.length
    ? payload.eventos
    : [
      { id: 1, tipo: 'sonido-edicion', origenVisual: 'hook', tiempo: 1.2, sonido: SONIDOS_EDICION.POP, volumen: config.volumen, texto: 'Hook', motivo: 'Demo hook' },
      { id: 2, tipo: 'sonido-edicion', origenVisual: 'zoom', tiempo: 4.2, sonido: SONIDOS_EDICION.WHOOSH, volumen: config.volumen, texto: 'Zoom', motivo: 'Demo zoom' },
      { id: 3, tipo: 'sonido-edicion', origenVisual: 'cierre', tiempo: 9.0, sonido: SONIDOS_EDICION.OUTRO, volumen: config.volumen, texto: 'Cierre', motivo: 'Demo cierre' }
    ];
  return mejorarEventosSonidoPremium({ eventos, visualDinamico: payload.visualDinamico || null, edicionDinamica: payload.edicionDinamica || null, opciones: payload.opciones || payload || {}, config });
}

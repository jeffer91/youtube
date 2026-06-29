import { limitarNumero } from './sonidos.config.js';
import { seleccionarSonidoParaEvento, normalizarNombreSonido } from './seleccionar-sonido-evento.js';

function redondear(valor, decimales = 3) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return 0;
  const factor = 10 ** decimales;
  return Math.round(numero * factor) / factor;
}

function texto(valor = '', respaldo = '') {
  const limpio = String(valor ?? '').replace(/\s+/g, ' ').trim();
  return limpio || respaldo;
}

function arr(valor) {
  return Array.isArray(valor) ? valor : [];
}

function limpiar(valor = '') {
  return texto(valor, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function obtenerEventosVisuales(visualDinamico) {
  const eventos = [];
  if (Array.isArray(visualDinamico?.eventosVisuales)) eventos.push(...visualDinamico.eventosVisuales);
  if (Array.isArray(visualDinamico?.etiquetas?.filtros)) eventos.push(...visualDinamico.etiquetas.filtros.map((item) => ({ ...item, tipo: 'etiqueta-visual' })));
  return eventos;
}

function obtenerEventosSonidoPlan({ edicionDinamica = null, opciones = {} } = {}) {
  const desdePuente = arr(edicionDinamica?.puentePlanEdicion?.eventosSonidoPlan);
  const desdeEdicion = arr(edicionDinamica?.eventosSonidoPlan);
  const desdeOpciones = arr(opciones?.eventosSonidoPlan);
  const desdeInstrucciones = arr(opciones?.instruccionesEdicionPlan).filter((item) => item.tipo === 'audio-sfx');
  const desdeEdicionInstrucciones = arr(edicionDinamica?.instruccionesEdicion).filter((item) => item.tipo === 'audio-sfx');
  return [...desdePuente, ...desdeEdicion, ...desdeOpciones, ...desdeInstrucciones, ...desdeEdicionInstrucciones];
}

function esMusicaFondo(evento = {}) {
  const base = limpiar([evento.tipo, evento.audio, evento.sonido, evento.nombre, evento.texto, evento.motivo, evento.descripcion].filter(Boolean).join(' '));
  return base.includes('musica') || base.includes('music') || base.includes('background') || base.includes('fondo musical');
}

function eventoValido(evento) {
  const inicio = Number(evento?.inicio ?? evento?.tiempo);
  const fin = Number(evento?.fin ?? inicio + 0.2);
  return Number.isFinite(inicio) && inicio >= 0 && Number.isFinite(fin) && fin >= inicio;
}

function filtrarEventosMuyCercanos(eventos, separacionMinimaSegundos) {
  const salida = [];
  let ultimoTiempo = -Infinity;

  for (const evento of eventos) {
    if (evento.tiempo - ultimoTiempo < separacionMinimaSegundos) continue;
    salida.push(evento);
    ultimoTiempo = evento.tiempo;
  }

  return salida;
}

function filtrarInicioSeguro(eventos, inicioSeguroSegundos) {
  const limite = Number(inicioSeguroSegundos || 0);
  if (!Number.isFinite(limite) || limite <= 0) return eventos;
  return eventos.filter((evento) => evento.tiempo >= limite);
}

function convertirPlanASonido(evento = {}, index = 0, config = {}) {
  const inicio = Number(evento.inicio ?? evento.inicioGlobal ?? evento.tiempo ?? evento.start ?? index * 2);
  const sonidoSolicitado = normalizarNombreSonido(evento.sonido || evento.audio || evento.nombre || evento.tipo || evento.texto);
  const sonido = sonidoSolicitado || seleccionarSonidoParaEvento({ ...evento, tipo: evento.tipo || 'audio-sfx' });
  const volumen = limitarNumero(evento.volumenSonido || evento.volumen || config.volumen, 0.04, config.volumenMaximo, config.volumen);

  return {
    id: `plan-sfx-${index + 1}`,
    tipo: 'sonido-edicion',
    origenVisual: 'plan-audio-sfx',
    origenPlan: texto(evento.origen, 'plan-ejecutable-gemini'),
    tiempo: redondear(inicio),
    sonido,
    volumen,
    texto: texto(evento.texto || evento.textoPantalla || evento.nombre || evento.audio || evento.sonido, ''),
    motivo: texto(evento.motivo || evento.descripcion || evento.datos?.motivo, 'SFX sincronizado desde el plan aprobado.'),
    desdePlan: true,
    global: Boolean(evento.global),
    datos: evento
  };
}

function convertirVisualASonido(evento = {}, index = 0, config = {}) {
  const tipoSonido = seleccionarSonidoParaEvento(evento);
  const volumen = limitarNumero(evento.volumenSonido || config.volumen, 0.04, config.volumenMaximo, config.volumen);

  return {
    id: `visual-sfx-${index + 1}`,
    tipo: 'sonido-edicion',
    origenVisual: evento.tipo || 'visual',
    tiempo: redondear(Number(evento.inicio)),
    sonido: tipoSonido,
    volumen,
    texto: evento.texto || '',
    motivo: evento.motivo || 'Sonido sincronizado con evento visual.',
    desdePlan: String(evento.origen || '').includes('plan') || String(evento.tipo || '').includes('plan'),
    datos: evento
  };
}

function deduplicarEventosSonido(eventos = []) {
  const mapa = new Map();
  for (const evento of eventos) {
    const clave = [evento.sonido, Number(evento.tiempo).toFixed(2), limpiar(evento.texto)].join('|');
    const previo = mapa.get(clave);
    if (!previo) {
      mapa.set(clave, evento);
      continue;
    }
    mapa.set(clave, {
      ...previo,
      desdePlan: previo.desdePlan || evento.desdePlan,
      origenVisual: [...new Set([previo.origenVisual, evento.origenVisual].filter(Boolean))].join(' + '),
      motivo: previo.desdePlan ? previo.motivo : evento.motivo || previo.motivo
    });
  }
  return [...mapa.values()];
}

function contarPlanDescartado(eventosPlan = []) {
  const musica = eventosPlan.filter(esMusicaFondo).length;
  const invalidos = eventosPlan.filter((evento) => !eventoValido(evento)).length;
  return { musica, invalidos, total: musica + invalidos };
}

export function crearEventosSonido({ visualDinamico = null, edicionDinamica = null, config, opciones = {} } = {}) {
  if (!config?.activo || opciones?.agregarSonidosEdicion === false) {
    return { ok: true, omitido: true, eventos: [], eventosPlan: [], mensaje: 'Sonidos de edición desactivados.' };
  }

  const eventosPlanRaw = obtenerEventosSonidoPlan({ edicionDinamica, opciones });
  const descartadosPlan = contarPlanDescartado(eventosPlanRaw);
  const eventosPlan = eventosPlanRaw
    .filter((evento) => eventoValido(evento))
    .filter((evento) => !esMusicaFondo(evento))
    .map((evento, index) => convertirPlanASonido(evento, index, config));

  const eventosVisuales = obtenerEventosVisuales(visualDinamico)
    .filter(eventoValido)
    .sort((a, b) => Number(a.inicio) - Number(b.inicio));

  if (eventosVisuales.length === 0 && eventosPlan.length === 0) {
    return { ok: true, omitido: true, eventos: [], eventosPlan: [], descartadosPlan, mensaje: 'No hay eventos visuales ni eventos SFX del plan para sonorizar.' };
  }

  const eventosSonidoBase = deduplicarEventosSonido([
    ...eventosPlan,
    ...eventosVisuales.map((evento, index) => convertirVisualASonido(evento, index, config))
  ]).sort((a, b) => Number(a.tiempo) - Number(b.tiempo));

  const eventosConInicioSeguro = filtrarInicioSeguro(eventosSonidoBase, config.inicioSeguroSegundos);
  const filtrados = filtrarEventosMuyCercanos(eventosConInicioSeguro, config.separacionMinimaSegundos)
    .slice(0, config.cantidadMaximaEventos)
    .map((evento, index) => ({ ...evento, id: index + 1 }));

  const eventosPlanAplicados = filtrados.filter((evento) => evento.desdePlan).length;

  return {
    ok: true,
    omitido: filtrados.length === 0,
    eventos: filtrados,
    eventosPlan,
    eventosPlanAplicados,
    descartados: eventosSonidoBase.length - filtrados.length,
    descartadosPlan,
    inicioSeguroSegundos: config.inicioSeguroSegundos,
    fuentes: {
      plan: eventosPlan.length,
      visuales: eventosVisuales.length,
      totalBase: eventosSonidoBase.length
    },
    mensaje: filtrados.length > 0
      ? `Eventos de sonido creados correctamente. Plan: ${eventosPlanAplicados}/${eventosPlan.length}. Visuales: ${eventosVisuales.length}.`
      : 'No quedaron eventos de sonido luego de aplicar seguridad.'
  };
}

export default crearEventosSonido;

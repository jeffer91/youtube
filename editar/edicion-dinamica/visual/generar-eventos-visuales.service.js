import { generarZoomsDinamicos } from './generar-zooms.service.js';
import { generarPunchInDinamicos } from './generar-punch-in.service.js';
import { redondearTiempo } from '../edicion-dinamica.config.js';

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function texto(valor = '', respaldo = '') {
  const limpio = String(valor ?? '').replace(/\s+/g, ' ').trim();
  return limpio || respaldo;
}

function limpiar(valor = '') {
  return texto(valor, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function arr(valor) {
  return Array.isArray(valor) ? valor : [];
}

function obtenerTextos(transcripcion) {
  if (Array.isArray(transcripcion?.textosFlotantes?.textos)) return transcripcion.textosFlotantes.textos;
  return [];
}

function eventosDesdeTextos(textos = []) {
  return textos.slice(0, 10).map((textoItem, index) => ({
    id: `texto-auto-${index + 1}`,
    tipo: 'texto-flotante',
    inicio: redondearTiempo(textoItem.inicio || 0),
    fin: redondearTiempo(textoItem.fin || Number(textoItem.inicio || 0) + 1.5),
    texto: textoItem.texto || textoItem.titulo || 'CLAVE',
    prioridad: textoItem.prioridad || 20 + index,
    motivo: textoItem.motivo || 'Texto flotante sincronizado.',
    origen: 'transcripcion-textos-flotantes'
  }));
}

function obtenerEventosVisualesPlan({ edicionDinamica = null, opciones = {} } = {}) {
  return [
    ...arr(edicionDinamica?.eventosVisualesPlan),
    ...arr(edicionDinamica?.puentePlanEdicion?.eventosVisualesPlan),
    ...arr(opciones?.eventosVisualesPlan),
    ...arr(opciones?.instruccionesEdicionPlan).filter((item) => ['zoom', 'efecto', 'animacion', 'transicion', 'texto'].includes(item.tipo))
  ];
}

function clasificarTipoPlan(evento = {}) {
  const base = limpiar([evento.tipo, evento.accionOriginal, evento.accion, evento.efecto, evento.transicion, evento.texto, evento.nombre].filter(Boolean).join(' '));
  if (base.includes('zoom') || base.includes('punch') || base.includes('acercamiento')) return 'zoom-plan';
  if (base.includes('transicion') || base.includes('transition') || base.includes('flash') || base.includes('cambio')) return 'transicion-plan';
  if (base.includes('animacion') || base.includes('animation') || base.includes('lower') || base.includes('entrada') || base.includes('salida')) return 'animacion-plan';
  if (base.includes('efecto') || base.includes('fx') || base.includes('glitch') || base.includes('shake')) return 'efecto-plan';
  if (base.includes('texto') || base.includes('titulo') || base.includes('subtitulo')) return 'texto-plan';
  return 'evento-plan';
}

function eventosDesdePlan({ edicionDinamica = null, opciones = {} } = {}) {
  const eventosPlan = obtenerEventosVisualesPlan({ edicionDinamica, opciones });
  return eventosPlan
    .map((evento, index) => {
      const inicio = Math.max(0, numero(evento.inicio ?? evento.inicioGlobal ?? evento.start, index * 2));
      const fin = Math.max(inicio + 0.35, numero(evento.fin ?? evento.finGlobal ?? evento.end, inicio + numero(evento.duracion, 1.2)));
      const tipoPlan = clasificarTipoPlan(evento);
      return {
        id: `plan-visual-${index + 1}`,
        tipo: tipoPlan,
        tipoPlan: evento.tipo || tipoPlan,
        inicio: redondearTiempo(inicio),
        fin: redondearTiempo(fin),
        texto: texto(evento.texto || evento.textoPantalla || evento.subtitulo || evento.transicion || evento.efecto || evento.nombre, tipoPlan.includes('zoom') ? 'ZOOM' : 'CLAVE'),
        efecto: texto(evento.efecto || evento.nombre || evento.tipo, tipoPlan),
        transicion: texto(evento.transicion || evento.nombre, ''),
        intensidad: numero(evento.intensidad, tipoPlan === 'zoom-plan' ? 1.065 : 1),
        prioridad: numero(evento.prioridad, 5 + index),
        global: Boolean(evento.global),
        motivo: texto(evento.motivo || evento.descripcion || evento.datos?.motivo, 'Evento visual tomado del plan aprobado.'),
        origen: texto(evento.origen, 'plan-ejecutable-gemini'),
        datos: evento
      };
    })
    .filter((evento) => Number.isFinite(Number(evento.inicio)) && Number.isFinite(Number(evento.fin)) && Number(evento.fin) > Number(evento.inicio));
}

function deduplicarEventos(eventos = []) {
  const mapa = new Map();
  for (const evento of eventos) {
    const clave = [evento.tipo, Number(evento.inicio).toFixed(2), Number(evento.fin).toFixed(2), limpiar(evento.texto)].join('|');
    if (!mapa.has(clave)) {
      mapa.set(clave, evento);
      continue;
    }
    const previo = mapa.get(clave);
    mapa.set(clave, {
      ...previo,
      origen: [...new Set([previo.origen, evento.origen].filter(Boolean))].join(' + '),
      motivo: previo.motivo || evento.motivo
    });
  }
  return [...mapa.values()];
}

export function generarEventosVisualesDinamicos({ edicionDinamica = null, transcripcion = null, opciones = {} } = {}) {
  const plan = eventosDesdePlan({ edicionDinamica, opciones });
  const zooms = generarZoomsDinamicos({ edicionDinamica, opciones });
  const punchIn = generarPunchInDinamicos({ transcripcion, opciones });
  const textos = eventosDesdeTextos(obtenerTextos(transcripcion));

  const eventos = deduplicarEventos([
    ...plan,
    ...(zooms.eventos || []),
    ...(punchIn.eventos || []),
    ...textos
  ])
    .filter((evento) => Number.isFinite(Number(evento.inicio)) && Number.isFinite(Number(evento.fin)) && Number(evento.fin) > Number(evento.inicio))
    .sort((a, b) => Number(a.inicio) - Number(b.inicio) || Number(a.prioridad || 99) - Number(b.prioridad || 99))
    .map((evento, index) => ({ ...evento, id: evento.id || `visual-${index + 1}`, orden: index + 1 }));

  return {
    ok: true,
    omitido: eventos.length === 0,
    eventos,
    fuentes: {
      plan: plan.length,
      zooms: zooms.eventos?.length || 0,
      punchIn: punchIn.eventos?.length || 0,
      textos: textos.length
    },
    planVisual: {
      total: plan.length,
      zooms: plan.filter((item) => item.tipo === 'zoom-plan').length,
      efectos: plan.filter((item) => item.tipo === 'efecto-plan').length,
      animaciones: plan.filter((item) => item.tipo === 'animacion-plan').length,
      transiciones: plan.filter((item) => item.tipo === 'transicion-plan').length,
      textos: plan.filter((item) => item.tipo === 'texto-plan').length
    },
    mensaje: eventos.length > 0
      ? `Eventos visuales dinámicos generados. Plan: ${plan.length}. Automáticos: ${(zooms.eventos?.length || 0) + (punchIn.eventos?.length || 0) + textos.length}.`
      : 'No se generaron eventos visuales dinámicos.'
  };
}

export default generarEventosVisualesDinamicos;

/*
  Nueva etapa estructural - Bloque 5
  Función: convertir el plan de producción en una línea de tiempo editable por pistas.
*/

import { PRODUCCION_CONFIG } from './produccion.config.js';

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function texto(valor, respaldo = '') {
  const limpio = String(valor || '').replace(/\s+/g, ' ').trim();
  return limpio || respaldo;
}

export function obtenerPistaProduccion(tipo = '') {
  const pistas = PRODUCCION_CONFIG.pistasLineaTiempo || {};
  if (tipo === PRODUCCION_CONFIG.tiposElemento.subtitulo) return pistas.subtitulos || 'subtitulos';
  if (tipo === PRODUCCION_CONFIG.tiposElemento.texto) return pistas.textos || 'textos';
  if (tipo === PRODUCCION_CONFIG.tiposElemento.efecto || tipo === PRODUCCION_CONFIG.tiposElemento.zoom) return pistas.efectos || 'efectos';
  if (tipo === PRODUCCION_CONFIG.tiposElemento.animacion) return pistas.animaciones || 'animaciones';
  if (tipo === PRODUCCION_CONFIG.tiposElemento.imagen || tipo === PRODUCCION_CONFIG.tiposElemento.recurso || tipo === PRODUCCION_CONFIG.tiposElemento.grafico || tipo === PRODUCCION_CONFIG.tiposElemento.fondo) return pistas.imagenes || 'imagenes';
  if (tipo === PRODUCCION_CONFIG.tiposElemento.audio) return pistas.audio || 'audio';
  return pistas.otros || 'otros';
}

function calcularInicioFin(elemento = {}, duracionTotal = 0) {
  const inicio = numero(elemento.inicio ?? elemento.datos?.inicio ?? elemento.datos?.start, 0);
  const finBase = elemento.fin ?? elemento.datos?.fin ?? elemento.datos?.end ?? elemento.datos?.duracion;
  let fin = Number.isFinite(Number(finBase)) ? Number(finBase) : inicio + 2.5;
  if (fin <= inicio) fin = inicio + 2.5;
  if (duracionTotal > 0) fin = Math.min(fin, duracionTotal);
  return { inicio: Number(Math.max(0, inicio).toFixed(2)), fin: Number(Math.max(inicio + 0.2, fin).toFixed(2)) };
}

function crearItemLineaTiempo(elemento = {}, duracionTotal = 0) {
  const tiempos = calcularInicioFin(elemento, duracionTotal);
  const duracion = Math.max(0.2, tiempos.fin - tiempos.inicio);
  const pista = elemento.pista || obtenerPistaProduccion(elemento.tipo);
  const porcentajeInicio = duracionTotal > 0 ? Math.max(0, Math.min(96, (tiempos.inicio / duracionTotal) * 100)) : 0;
  const porcentajeAncho = duracionTotal > 0 ? Math.max(4, Math.min(100 - porcentajeInicio, (duracion / duracionTotal) * 100)) : 12;
  return {
    id: elemento.id,
    elementoId: elemento.id,
    tipo: elemento.tipo,
    pista,
    nombre: texto(elemento.nombre || elemento.datos?.texto || elemento.datos?.tipo, 'Elemento'),
    descripcion: texto(elemento.descripcion || elemento.datos?.motivo || elemento.datos?.texto, ''),
    inicio: tiempos.inicio,
    fin: tiempos.fin,
    duracion: Number(duracion.toFixed(2)),
    porcentajeInicio: Number(porcentajeInicio.toFixed(2)),
    porcentajeAncho: Number(porcentajeAncho.toFixed(2)),
    activo: elemento.rechazado !== true && elemento.estado !== 'no_usar',
    aprobado: Boolean(elemento.aprobado),
    reemplazado: Boolean(elemento.reemplazo || elemento.reemplazado),
    datos: elemento.datos || {}
  };
}

export function crearLineaTiempoProduccion({ elementos = [], duracionSegundos = 0 } = {}) {
  const duracion = numero(duracionSegundos, 0) || Math.max(30, ...elementos.map((item) => numero(item.fin ?? item.datos?.fin ?? item.datos?.end, 0)));
  const items = elementos.map((elemento) => crearItemLineaTiempo(elemento, duracion)).sort((a, b) => a.inicio - b.inicio || a.pista.localeCompare(b.pista));
  const ordenPistas = Object.values(PRODUCCION_CONFIG.pistasLineaTiempo || {});
  const pistas = ordenPistas.map((pista) => ({ pista, items: items.filter((item) => item.pista === pista), total: items.filter((item) => item.pista === pista).length })).filter((grupo) => grupo.total > 0);
  return {
    ok: true,
    tipo: 'linea-tiempo-produccion',
    duracionSegundos: Number(duracion.toFixed(2)),
    totalElementos: items.length,
    pistas,
    items,
    resumen: `${items.length} elemento(s) distribuidos en ${pistas.length} pista(s).`,
    creadoEn: new Date().toISOString()
  };
}

export function sincronizarLineaTiempoConElementos(plan = {}) {
  const elementos = Array.isArray(plan.elementos) ? plan.elementos : [];
  const duracionSegundos = plan.duracionSegundos || plan.lineaTiempo?.duracionSegundos || 0;
  return { ...plan, lineaTiempo: crearLineaTiempoProduccion({ elementos, duracionSegundos }), actualizadoEn: new Date().toISOString() };
}

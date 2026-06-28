/*
  Bloque 5 - Evaluador de opciones de Plan
  Funcion: puntuar cada opcion segun JSON, timeline, biblioteca, contexto y compatibilidad.
*/

import { CRITERIOS_COMPARACION_PLAN } from './comparar-plan.modelo.js';

function arr(valor) { return Array.isArray(valor) ? valor : []; }
function num(valor, respaldo = 0) { const n = Number(valor); return Number.isFinite(n) ? n : respaldo; }

function obtenerRespuesta(opcion = {}) {
  return opcion.respuesta || opcion.respuestaIA || opcion;
}

function obtenerJson(opcion = {}) {
  const respuesta = obtenerRespuesta(opcion);
  return respuesta.jsonTecnico || respuesta.planEjecutable || respuesta.plan || {};
}

function contarRecursos(opcion = {}) {
  const json = obtenerJson(opcion);
  const timeline = arr(json.timeline);
  const recursosTimeline = timeline.filter((item) => item.recursoBiblioteca).length;
  const recursos = arr(json.recursos).length;
  return Math.max(recursosTimeline, recursos);
}

export function evaluarOpcionPlan(opcion = {}, contexto = {}) {
  const respuesta = obtenerRespuesta(opcion);
  const json = obtenerJson(opcion);
  const timeline = arr(json.timeline);
  const validacion = respuesta.validacion || json.validacion || {};
  const recursos = contarRecursos(opcion);
  const errores = arr(validacion.errores);
  const advertencias = arr(validacion.advertencias);
  const contextoResumen = contexto.resumen || {};

  const puntos = {
    jsonValido: json && typeof json === 'object' && timeline.length > 0 ? 30 : 0,
    timelineCompleto: Math.min(timeline.length * 3, 25),
    usaBiblioteca: recursos > 0 ? Math.min(5 + recursos * 3, 15) : 0,
    coherenciaContexto: (contextoResumen.segmentosTranscripcion || contextoResumen.momentosClave || contextoResumen.framesClave) ? 15 : 8,
    proveedorReal: respuesta.real ? 10 : respuesta.fallback ? 2 : 5,
    compatibleProduccion: validacion.compatibleProduccion || validacion.ok ? 5 : 0
  };

  const penalizacion = errores.length * 10 + advertencias.length * 2;
  const puntajeBase = Object.values(puntos).reduce((total, valor) => total + num(valor), 0);
  const puntaje = Math.max(0, Math.min(100, puntajeBase - penalizacion));

  return {
    id: opcion.id || respuesta.proveedor || 'opcion-plan',
    proveedor: opcion.proveedor || respuesta.proveedor || 'desconocido',
    familia: opcion.familia || respuesta.familiaIA || 'sin-familia',
    puntaje,
    puntos,
    criterios: CRITERIOS_COMPARACION_PLAN,
    resumen: respuesta.resumenHumano || '',
    timelineItems: timeline.length,
    recursosReferenciados: recursos,
    real: Boolean(respuesta.real),
    fallback: Boolean(respuesta.fallback),
    errores,
    advertencias,
    compatibleProduccion: Boolean(validacion.compatibleProduccion || validacion.ok || timeline.length),
    evaluadoEn: new Date().toISOString()
  };
}

export function evaluarOpcionesPlan(opciones = [], contexto = {}) {
  return arr(opciones).map((opcion) => evaluarOpcionPlan(opcion, contexto)).sort((a, b) => b.puntaje - a.puntaje);
}

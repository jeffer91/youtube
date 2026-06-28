/*
  Bloque 4 - Validador de partes del Plan
  Función: asegurar que cada respuesta parcial sea utilizable antes de pasar a la siguiente.
*/

import { obtenerPartePlan } from './partes-plan.config.js';

function arr(valor) {
  return Array.isArray(valor) ? valor : [];
}

function texto(valor = '') {
  return String(valor ?? '').trim();
}

function validarTimeline(jsonTecnico = {}) {
  const timeline = arr(jsonTecnico.timeline);
  if (!timeline.length) return ['La parte no incluye timeline ejecutable.'];
  return timeline.flatMap((item, index) => {
    const errores = [];
    if (item.inicio === undefined || item.inicio === null) errores.push(`Timeline ${index + 1}: falta inicio.`);
    if (item.fin === undefined || item.fin === null) errores.push(`Timeline ${index + 1}: falta fin.`);
    if (!texto(item.accion)) errores.push(`Timeline ${index + 1}: falta accion.`);
    return errores;
  });
}

function validarRecursos(jsonTecnico = {}) {
  const timeline = arr(jsonTecnico.timeline);
  const recursos = arr(jsonTecnico.recursos);
  const usaRecurso = timeline.some((item) => item.recursoBiblioteca);
  if (!usaRecurso && !recursos.length) return ['La parte no referencia recursos de biblioteca.'];
  return [];
}

export function validarPartePlan(parteResultado = {}) {
  const parte = obtenerPartePlan(parteResultado.id || parteResultado.parteId);
  const errores = [];
  const advertencias = [];
  const jsonTecnico = parteResultado.jsonTecnico || parteResultado.respuestaIA?.jsonTecnico || {};
  const resumenHumano = texto(parteResultado.resumenHumano || parteResultado.respuestaIA?.resumenHumano);

  if (!parte) errores.push('La parte no existe en la configuración del Plan.');
  if (!resumenHumano) errores.push('Falta resumen humano de la parte.');
  if (!jsonTecnico || typeof jsonTecnico !== 'object') errores.push('Falta JSON técnico de la parte.');

  if (parte?.id === 'timelineSegundos') errores.push(...validarTimeline(jsonTecnico));
  if (parte?.id === 'recursosBiblioteca') advertencias.push(...validarRecursos(jsonTecnico));

  if (parteResultado.respuestaIA?.fallback) advertencias.push('Parte generada por fallback interno o proveedor alternativo.');
  if (arr(jsonTecnico.timeline).length === 0 && ['timelineSegundos', 'validacionFinal'].includes(parte?.id)) errores.push('La parte debe contener al menos una acción de timeline.');

  return {
    ok: errores.length === 0,
    parteId: parte?.id || parteResultado.id || 'desconocida',
    errores,
    advertencias,
    compatibleProduccion: errores.length === 0,
    validadoEn: new Date().toISOString()
  };
}

export default validarPartePlan;

/*
  Bloque 6 - Validador de plan ejecutable
  Funcion: verificar que el JSON tecnico pueda ser usado por Produccion.
*/

function arr(valor) { return Array.isArray(valor) ? valor : []; }
function texto(valor = '') { return String(valor ?? '').trim(); }
function esNumero(valor) { return Number.isFinite(Number(valor)); }

export function validarPlanEjecutable(planEjecutable = {}) {
  const errores = [];
  const advertencias = [];
  const timeline = arr(planEjecutable.timeline);

  if (!planEjecutable || typeof planEjecutable !== 'object') errores.push('El plan ejecutable debe ser un objeto.');
  if (planEjecutable.tipo !== 'plan-ejecutable-produccion') errores.push('Tipo de plan ejecutable incorrecto.');
  if (!planEjecutable.proyectoId) errores.push('Falta proyectoId en plan ejecutable.');
  if (!timeline.length) errores.push('El plan ejecutable debe tener timeline.');

  timeline.forEach((item, index) => {
    const prefijo = `Accion ${index + 1}`;
    if (!texto(item.id)) errores.push(`${prefijo}: falta id.`);
    if (!esNumero(item.inicio)) errores.push(`${prefijo}: inicio no es numerico.`);
    if (!esNumero(item.fin)) errores.push(`${prefijo}: fin no es numerico.`);
    if (esNumero(item.inicio) && Number(item.inicio) < 0) errores.push(`${prefijo}: inicio no puede ser negativo.`);
    if (esNumero(item.inicio) && esNumero(item.fin) && Number(item.fin) <= Number(item.inicio)) errores.push(`${prefijo}: fin debe ser mayor que inicio.`);
    if (!texto(item.accion)) errores.push(`${prefijo}: falta accion.`);
    if (!texto(item.textoPantalla) && !item.recursoBiblioteca && !texto(item.efecto) && !texto(item.audio) && !texto(item.subtitulo)) advertencias.push(`${prefijo}: no tiene texto, recurso, efecto, audio ni subtitulo.`);
  });

  const ordenado = timeline.every((item, index) => index === 0 || Number(item.inicio) >= Number(timeline[index - 1].inicio));
  if (!ordenado) advertencias.push('El timeline no esta ordenado por inicio.');

  return {
    ok: errores.length === 0,
    errores,
    advertencias,
    totalAcciones: timeline.length,
    totalRecursos: arr(planEjecutable.recursos).length,
    compatibleProduccion: errores.length === 0,
    validadoEn: new Date().toISOString()
  };
}

export default validarPlanEjecutable;

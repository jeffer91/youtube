/*
  Bloque 3: Planificador local de efectos
  Funcion: validar que el plan de efectos sea seguro, ordenado y usable por el compilador futuro.
*/

import { buscarEfectoPorId } from '../catalogo/index.js';

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function redondear(valor) {
  return Math.round(numero(valor, 0) * 1000) / 1000;
}

function normalizarEfectoPlan(item = {}, index = 0, duracionVideo = 0) {
  const efecto = buscarEfectoPorId(item.efectoId || item.id || item.efecto);
  const inicioBase = numero(item.inicio, index * 3);
  const inicio = Math.max(0, Math.min(inicioBase, Math.max(0, duracionVideo - 0.2)));
  const finBase = numero(item.fin, inicio + numero(item.duracion, 1.8));
  const fin = Math.max(inicio + 0.4, Math.min(finBase, duracionVideo || inicio + 2));

  return {
    id: item.idPlan || `plan-${index + 1}`,
    efectoId: efecto?.id || String(item.efectoId || item.id || item.efecto || '').trim(),
    nombre: efecto?.nombre || item.nombre || 'Efecto no identificado',
    categoria: efecto?.categoria || item.categoria || 'desconocida',
    inicio: redondear(inicio),
    fin: redondear(fin),
    duracion: redondear(fin - inicio),
    intensidad: item.intensidad || 'normal',
    texto: item.texto || '',
    prioridad: numero(item.prioridad, 50 + index),
    origen: item.origen || 'local',
    motivo: item.motivo || 'Seleccionado por planificador local.'
  };
}

export function validarPlanEfectos(plan = {}, { duracionVideo = 0, maxEfectos = 12 } = {}) {
  const errores = [];
  const advertencias = [];
  const efectos = Array.isArray(plan?.efectos) ? plan.efectos : [];
  const duracion = numero(duracionVideo || plan?.duracionSegundos, 0);
  const maximo = Math.max(1, numero(maxEfectos || plan?.maxEfectos, 12));

  if (!Array.isArray(plan?.efectos)) errores.push('El plan debe tener un arreglo de efectos.');
  if (efectos.length === 0) advertencias.push('El plan no tiene efectos seleccionados.');
  if (efectos.length > maximo) advertencias.push(`El plan supera el maximo sugerido: ${efectos.length}/${maximo}.`);

  const normalizados = efectos
    .slice(0, maximo)
    .map((item, index) => normalizarEfectoPlan(item, index, duracion))
    .filter((item) => {
      if (!buscarEfectoPorId(item.efectoId)) {
        advertencias.push(`Efecto no encontrado en catalogo: ${item.efectoId}`);
        return false;
      }
      if (item.fin <= item.inicio) {
        advertencias.push(`Efecto sin duracion valida: ${item.efectoId}`);
        return false;
      }
      return true;
    })
    .sort((a, b) => a.inicio - b.inicio || a.prioridad - b.prioridad);

  return {
    ok: errores.length === 0,
    errores,
    advertencias,
    totalEntrada: efectos.length,
    totalValido: normalizados.length,
    efectos: normalizados,
    mensaje: errores.length === 0 ? 'Plan de efectos validado.' : 'Plan de efectos con errores.'
  };
}

export default validarPlanEfectos;

/*
  Bloque 4 - Guardado/acumulación de partes del Plan
  Función: registrar cada parte validada para que el plan avance por secciones.
*/

import { PARTES_PLAN_EDICION } from './partes-plan.config.js';

export function crearEstadoPlanPorPartes({ proyectoId = '', contextoPlan = {} } = {}) {
  return {
    ok: true,
    tipo: 'plan-por-partes',
    version: '1.0.0',
    proyectoId,
    estado: 'iniciado',
    totalPartes: PARTES_PLAN_EDICION.length,
    partes: [],
    progreso: {
      completadas: 0,
      validadas: 0,
      conErrores: 0,
      porcentaje: 0
    },
    contextoResumen: contextoPlan.resumen || {},
    iniciadoEn: new Date().toISOString(),
    actualizadoEn: new Date().toISOString()
  };
}

function recalcularProgreso(estado = {}) {
  const partes = Array.isArray(estado.partes) ? estado.partes : [];
  const completadas = partes.length;
  const validadas = partes.filter((parte) => parte.validacion?.ok).length;
  const conErrores = partes.filter((parte) => parte.validacion && !parte.validacion.ok).length;
  return {
    completadas,
    validadas,
    conErrores,
    porcentaje: Math.round((completadas / Math.max(estado.totalPartes || PARTES_PLAN_EDICION.length, 1)) * 100)
  };
}

export function guardarPartePlan(estadoPlanPorPartes = {}, parteResultado = {}) {
  const estado = {
    ...estadoPlanPorPartes,
    partes: Array.isArray(estadoPlanPorPartes.partes) ? [...estadoPlanPorPartes.partes] : []
  };
  const indiceExistente = estado.partes.findIndex((parte) => parte.id === parteResultado.id);
  const parteFinal = {
    ...parteResultado,
    guardadaEn: new Date().toISOString()
  };

  if (indiceExistente >= 0) estado.partes[indiceExistente] = parteFinal;
  else estado.partes.push(parteFinal);

  estado.partes.sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0));
  estado.progreso = recalcularProgreso(estado);
  estado.estado = estado.progreso.completadas >= estado.totalPartes
    ? estado.progreso.conErrores > 0 ? 'completado_con_observaciones' : 'completado'
    : 'procesando';
  estado.actualizadoEn = new Date().toISOString();
  return estado;
}

export function cerrarPlanPorPartes(estadoPlanPorPartes = {}) {
  const progreso = recalcularProgreso(estadoPlanPorPartes);
  return {
    ...estadoPlanPorPartes,
    progreso,
    estado: progreso.completadas >= (estadoPlanPorPartes.totalPartes || PARTES_PLAN_EDICION.length)
      ? progreso.conErrores > 0 ? 'completado_con_observaciones' : 'completado'
      : 'incompleto',
    completadoEn: new Date().toISOString(),
    actualizadoEn: new Date().toISOString()
  };
}

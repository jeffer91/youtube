/*
  Modulo: produccion
  Funcion: aprobar el plan completo para pasar a exportacion.
*/

import { crearPlanProduccionModelo } from './produccion.modelo.js';
import { PRODUCCION_CONFIG } from './produccion.config.js';

export function calcularEstadoProduccion(planEntrada = {}) {
  const plan = crearPlanProduccionModelo(planEntrada);
  const total = plan.elementos.length;
  const aprobados = plan.elementos.filter((item) => item.aprobado).length;
  const pendientes = plan.elementos.filter((item) => !item.aprobado && !item.rechazado).length;
  const rechazados = plan.elementos.filter((item) => item.rechazado).length;

  return {
    total,
    aprobados,
    pendientes,
    rechazados,
    listoExportar: total > 0 && pendientes === 0 && rechazados === 0 && aprobados === total
  };
}

export function aprobarProduccionFinal(planEntrada = {}, comentario = '') {
  const plan = crearPlanProduccionModelo(planEntrada);
  const estado = calcularEstadoProduccion(plan);
  if (!estado.listoExportar) {
    throw new Error(`Produccion no lista: ${estado.pendientes} pendientes y ${estado.rechazados} con cambios.`);
  }

  return crearPlanProduccionModelo({
    ...plan,
    estado: PRODUCCION_CONFIG.estados.listoExportar,
    historial: [...plan.historial, { tipo: 'aprobacion_final', comentario, fecha: new Date().toISOString() }]
  });
}

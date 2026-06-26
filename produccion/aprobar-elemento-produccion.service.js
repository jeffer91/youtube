/*
  Modulo: produccion
  Funcion: aprobar un elemento revisado.
*/

import { crearPlanProduccionModelo } from './produccion.modelo.js';
import { PRODUCCION_CONFIG } from './produccion.config.js';

export function aprobarElementoProduccion(planEntrada = {}, elementoId, comentario = '') {
  const plan = crearPlanProduccionModelo(planEntrada);
  let encontrado = false;

  const elementos = plan.elementos.map((item) => {
    if (item.id !== elementoId) return item;
    encontrado = true;
    return {
      ...item,
      aprobado: true,
      rechazado: false,
      estado: PRODUCCION_CONFIG.estados.aprobado,
      comentario: comentario || item.comentario,
      actualizadoEn: new Date().toISOString()
    };
  });

  if (!encontrado) throw new Error('No se encontro el elemento para aprobar.');

  return crearPlanProduccionModelo({
    ...plan,
    elementos,
    historial: [...plan.historial, { tipo: 'aprobacion_elemento', elementoId, comentario, fecha: new Date().toISOString() }]
  });
}

export function aprobarElementosPorTipo(planEntrada = {}, tipo) {
  const plan = crearPlanProduccionModelo(planEntrada);
  const elementos = plan.elementos.map((item) => item.tipo === tipo
    ? { ...item, aprobado: true, rechazado: false, estado: PRODUCCION_CONFIG.estados.aprobado, actualizadoEn: new Date().toISOString() }
    : item);
  return crearPlanProduccionModelo({ ...plan, elementos });
}

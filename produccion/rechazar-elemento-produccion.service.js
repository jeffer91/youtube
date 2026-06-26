/*
  Modulo: produccion
  Funcion: marcar un elemento como no aceptado para corregirlo o reemplazarlo.
*/

import { crearPlanProduccionModelo } from './produccion.modelo.js';
import { PRODUCCION_CONFIG } from './produccion.config.js';

export function rechazarElementoProduccion(planEntrada = {}, elementoId, motivo = '') {
  const plan = crearPlanProduccionModelo(planEntrada);
  let encontrado = false;

  const elementos = plan.elementos.map((item) => {
    if (item.id !== elementoId) return item;
    encontrado = true;
    return {
      ...item,
      aprobado: false,
      rechazado: true,
      estado: PRODUCCION_CONFIG.estados.requiereCambios,
      comentario: motivo || item.comentario,
      actualizadoEn: new Date().toISOString()
    };
  });

  if (!encontrado) throw new Error('No se encontro el elemento para marcarlo.');

  return crearPlanProduccionModelo({
    ...plan,
    estado: PRODUCCION_CONFIG.estados.requiereCambios,
    elementos,
    historial: [...plan.historial, { tipo: 'observacion_elemento', elementoId, motivo, fecha: new Date().toISOString() }]
  });
}

/*
  Modulo: produccion
  Funcion: reemplazar un recurso dentro del plan y registrar la decision.
*/

import { crearPlanProduccionModelo, crearElementoProduccion } from './produccion.modelo.js';
import { PRODUCCION_CONFIG } from './produccion.config.js';

export function reemplazarRecursoProduccion(planEntrada = {}, datos = {}) {
  const plan = crearPlanProduccionModelo(planEntrada);
  const elementoAnterior = plan.elementos.find((item) => item.id === datos.elementoId);
  if (!elementoAnterior) throw new Error('No se encontro el elemento a reemplazar en Produccion.');

  const nuevoElemento = crearElementoProduccion({
    ...elementoAnterior,
    id: datos.nuevoElemento?.id || `${elementoAnterior.id}-reemplazo-${Date.now()}`,
    nombre: datos.nuevoElemento?.nombre || 'Recurso reemplazado',
    recurso: datos.nuevoElemento?.recurso || datos.nuevoRecurso || null,
    datos: datos.nuevoElemento?.datos || datos.nuevoRecurso || {},
    estado: PRODUCCION_CONFIG.estados.enRevision,
    aprobado: false,
    rechazado: false,
    comentario: datos.comentario || 'Reemplazo pendiente de revision.'
  });

  const elementos = plan.elementos.map((item) => item.id === elementoAnterior.id
    ? { ...item, rechazado: true, aprobado: false, estado: PRODUCCION_CONFIG.estados.requiereCambios, reemplazadoPor: nuevoElemento.id, comentario: datos.motivo || item.comentario }
    : item);

  elementos.push(nuevoElemento);

  return crearPlanProduccionModelo({
    ...plan,
    estado: PRODUCCION_CONFIG.estados.enRevision,
    elementos,
    historial: [
      ...plan.historial,
      { tipo: 'reemplazo', elementoAnteriorId: elementoAnterior.id, nuevoElementoId: nuevoElemento.id, motivo: datos.motivo || '', fecha: new Date().toISOString() }
    ]
  });
}

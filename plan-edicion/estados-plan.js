export const PLAN_EDICION_VERSION = '0.1.0';

export const ESTADOS_PLAN_EDICION = Object.freeze({
  BORRADOR: 'BORRADOR',
  EN_REVISION: 'EN_REVISION',
  APROBADO: 'APROBADO',
  RENDERIZADO: 'RENDERIZADO',
  CANCELADO: 'CANCELADO',
  ERROR: 'ERROR'
});

export const EVENTOS_PLAN_EDICION = Object.freeze({
  CREADO: 'PLAN_CREADO',
  ACTUALIZADO: 'PLAN_ACTUALIZADO',
  CORREGIDO: 'PLAN_CORREGIDO',
  APROBADO: 'PLAN_APROBADO',
  RENDERIZADO: 'PLAN_RENDERIZADO',
  CANCELADO: 'PLAN_CANCELADO',
  ERROR: 'PLAN_ERROR'
});

export function crearEventoPlan(tipo, mensaje, datos = {}) {
  return {
    tipo,
    mensaje,
    datos,
    fecha: new Date().toISOString()
  };
}

export function esEstadoPlanValido(estado) {
  return Object.values(ESTADOS_PLAN_EDICION).includes(estado);
}

export function puedeAprobarPlan(estado) {
  return [
    ESTADOS_PLAN_EDICION.BORRADOR,
    ESTADOS_PLAN_EDICION.EN_REVISION
  ].includes(estado);
}

export function puedeEditarPlan(estado) {
  return [
    ESTADOS_PLAN_EDICION.BORRADOR,
    ESTADOS_PLAN_EDICION.EN_REVISION,
    ESTADOS_PLAN_EDICION.ERROR
  ].includes(estado);
}

export function crearEstadoInicialPlan() {
  return ESTADOS_PLAN_EDICION.BORRADOR;
}

export default {
  PLAN_EDICION_VERSION,
  ESTADOS_PLAN_EDICION,
  EVENTOS_PLAN_EDICION,
  crearEventoPlan,
  esEstadoPlanValido,
  puedeAprobarPlan,
  puedeEditarPlan,
  crearEstadoInicialPlan
};

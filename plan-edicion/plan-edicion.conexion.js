import { crearPlanEdicion } from './crear-plan-edicion.service.js';
import { cargarPlanEdicion, existePlanEdicion } from './cargar-plan-edicion.js';
import { guardarPlanEdicion, obtenerRutaPlanEdicion } from './guardar-plan-edicion.js';
import { aplicarCambiosPlanEdicion } from './aplicar-cambios-plan.js';
import { aprobarPlanEdicion } from './aprobar-plan-edicion.js';
import { validarPlanEdicion, exigirPlanValido } from './validar-plan-edicion.js';
import { obtenerConfigPlanEdicion } from './plan-edicion.config.js';

export async function crearPlanEdicionDesdeMotor(solicitud = {}) {
  return await crearPlanEdicion(solicitud);
}

export async function cargarPlanEdicionDesdeMotor(solicitud = {}) {
  return await cargarPlanEdicion(solicitud);
}

export async function guardarPlanEdicionDesdeMotor(solicitud = {}) {
  return await guardarPlanEdicion(solicitud);
}

export async function aplicarCambiosPlanEdicionDesdeMotor(solicitud = {}) {
  return await aplicarCambiosPlanEdicion(solicitud);
}

export async function aprobarPlanEdicionDesdeMotor(solicitud = {}) {
  return await aprobarPlanEdicion(solicitud);
}

export {
  crearPlanEdicion,
  cargarPlanEdicion,
  guardarPlanEdicion,
  aplicarCambiosPlanEdicion,
  aprobarPlanEdicion,
  validarPlanEdicion,
  exigirPlanValido,
  existePlanEdicion,
  obtenerRutaPlanEdicion,
  obtenerConfigPlanEdicion
};

export default {
  crearPlanEdicionDesdeMotor,
  cargarPlanEdicionDesdeMotor,
  guardarPlanEdicionDesdeMotor,
  aplicarCambiosPlanEdicionDesdeMotor,
  aprobarPlanEdicionDesdeMotor,
  crearPlanEdicion,
  cargarPlanEdicion,
  guardarPlanEdicion,
  aplicarCambiosPlanEdicion,
  aprobarPlanEdicion,
  validarPlanEdicion,
  exigirPlanValido,
  existePlanEdicion,
  obtenerRutaPlanEdicion,
  obtenerConfigPlanEdicion
};

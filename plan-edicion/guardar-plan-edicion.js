import path from 'path';
import { escribirJson } from '../comun/archivos.js';
import { obtenerConfigPlanEdicion } from './plan-edicion.config.js';
import { validarPlanEdicion } from './validar-plan-edicion.js';

function obtenerCarpetaProyecto(entradaOPlan) {
  const carpeta = entradaOPlan?.rutas?.carpetaProyecto || entradaOPlan?.rutas?.proyecto || entradaOPlan?.proyecto?.carpetaProyecto || entradaOPlan?.carpetaProyecto || entradaOPlan?.rutas?.carpeta;
  if (!carpeta) throw new Error('No se puede guardar el plan porque falta la carpeta del proyecto.');
  return carpeta;
}

export function obtenerRutaPlanEdicion({ entrada = null, plan = null, opciones = {} } = {}) {
  const config = obtenerConfigPlanEdicion(opciones);
  const carpetaProyecto = obtenerCarpetaProyecto(entrada || plan);
  return path.join(carpetaProyecto, config.archivoPlan);
}

export async function guardarPlanEdicion({ entrada = null, plan, opciones = {}, validar = true } = {}) {
  if (!plan || typeof plan !== 'object') throw new Error('No se puede guardar un plan vacío.');

  const validacion = validarPlanEdicion(plan);
  if (validar && !validacion.ok) {
    throw new Error(`No se puede guardar el plan: ${validacion.errores.join(' ')}`);
  }

  const rutaPlan = obtenerRutaPlanEdicion({ entrada, plan, opciones });
  const payload = {
    ...plan,
    validacion,
    guardadoEn: new Date().toISOString()
  };

  await escribirJson(rutaPlan, payload);
  return {
    ok: true,
    rutaPlan,
    nombreArchivo: path.basename(rutaPlan),
    plan: payload,
    validacion
  };
}

export default guardarPlanEdicion;

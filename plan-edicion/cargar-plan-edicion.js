import fs from 'fs';
import { leerJsonSiExiste } from '../comun/archivos.js';
import { obtenerRutaPlanEdicion } from './guardar-plan-edicion.js';
import { validarPlanEdicion } from './validar-plan-edicion.js';

export async function cargarPlanEdicion({ entrada = null, rutaPlan = null, opciones = {}, requerido = false } = {}) {
  const ruta = rutaPlan || obtenerRutaPlanEdicion({ entrada, opciones });
  const plan = await leerJsonSiExiste(ruta, null);

  if (!plan) {
    if (requerido) throw new Error(`No se encontró el plan de edición: ${ruta}`);
    return {
      ok: false,
      existe: false,
      rutaPlan: ruta,
      plan: null,
      mensaje: 'No existe plan de edición guardado.'
    };
  }

  const validacion = validarPlanEdicion(plan);
  return {
    ok: validacion.ok,
    existe: true,
    rutaPlan: ruta,
    plan,
    validacion,
    mensaje: validacion.ok ? 'Plan de edición cargado correctamente.' : 'El plan existe, pero tiene problemas de validación.'
  };
}

export function existePlanEdicion({ entrada = null, rutaPlan = null, opciones = {} } = {}) {
  const ruta = rutaPlan || obtenerRutaPlanEdicion({ entrada, opciones });
  return fs.existsSync(ruta);
}

export default cargarPlanEdicion;

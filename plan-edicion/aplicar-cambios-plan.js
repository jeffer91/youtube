import { EVENTOS_PLAN_EDICION, crearEventoPlan, puedeEditarPlan } from './estados-plan.js';
import { guardarPlanEdicion } from './guardar-plan-edicion.js';
import { validarPlanEdicion } from './validar-plan-edicion.js';

function esObjeto(valor) {
  return Boolean(valor) && typeof valor === 'object' && !Array.isArray(valor);
}

function mezclarProfundo(base, cambios) {
  if (!esObjeto(cambios)) return base;
  const salida = Array.isArray(base) ? [...base] : { ...(base || {}) };
  for (const [clave, valor] of Object.entries(cambios)) {
    if (valor === undefined) continue;
    if (esObjeto(valor) && esObjeto(salida[clave])) salida[clave] = mezclarProfundo(salida[clave], valor);
    else salida[clave] = valor;
  }
  return salida;
}

function normalizarCambios(cambios = {}) {
  if (!esObjeto(cambios)) throw new Error('Los cambios del plan deben ser un objeto.');
  const prohibidos = ['id', 'version', 'creadoEn', 'rutas'];
  const salida = { ...cambios };
  for (const campo of prohibidos) delete salida[campo];
  return salida;
}

export async function aplicarCambiosPlanEdicion({ entrada = null, plan, cambios = {}, usuario = 'usuario', comentario = '', opciones = {}, guardar = true } = {}) {
  if (!plan || typeof plan !== 'object') throw new Error('No se puede aplicar cambios porque falta el plan.');
  if (!puedeEditarPlan(plan.estado)) throw new Error(`No se puede editar un plan en estado ${plan.estado}.`);

  const cambiosSeguros = normalizarCambios(cambios);
  const actualizado = mezclarProfundo(plan, cambiosSeguros);

  actualizado.actualizadoEn = new Date().toISOString();
  actualizado.historial = Array.isArray(actualizado.historial) ? actualizado.historial : [];
  actualizado.historial.push(crearEventoPlan(EVENTOS_PLAN_EDICION.CORREGIDO, comentario || 'Se aplicaron cambios al plan de edición.', { usuario, campos: Object.keys(cambiosSeguros) }));

  const validacion = validarPlanEdicion(actualizado);
  if (!validacion.ok) {
    throw new Error(`Los cambios dejaron el plan inválido: ${validacion.errores.join(' ')}`);
  }

  if (!guardar) return { ok: true, plan: actualizado, validacion, guardado: null };
  const guardado = await guardarPlanEdicion({ entrada, plan: actualizado, opciones });
  return { ok: true, plan: guardado.plan, validacion, guardado };
}

export default aplicarCambiosPlanEdicion;

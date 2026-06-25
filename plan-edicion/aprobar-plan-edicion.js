import { ESTADOS_PLAN_EDICION, EVENTOS_PLAN_EDICION, crearEventoPlan, puedeAprobarPlan } from './estados-plan.js';
import { guardarPlanEdicion } from './guardar-plan-edicion.js';
import { validarPlanEdicion } from './validar-plan-edicion.js';

export async function aprobarPlanEdicion({ entrada = null, plan, usuario = 'usuario', comentario = '', opciones = {}, guardar = true } = {}) {
  if (!plan || typeof plan !== 'object') throw new Error('No se puede aprobar porque falta el plan de edición.');
  if (!puedeAprobarPlan(plan.estado)) throw new Error(`No se puede aprobar un plan en estado ${plan.estado}.`);

  const validacion = validarPlanEdicion(plan);
  if (!validacion.ok) throw new Error(`No se puede aprobar un plan inválido: ${validacion.errores.join(' ')}`);

  const aprobado = {
    ...plan,
    estado: ESTADOS_PLAN_EDICION.APROBADO,
    aprobado: {
      por: usuario,
      comentario: comentario || 'Plan aprobado para render final.',
      fecha: new Date().toISOString()
    },
    exportacion: {
      ...(plan.exportacion || {}),
      pendienteRenderFinal: true
    },
    historial: [
      ...(Array.isArray(plan.historial) ? plan.historial : []),
      crearEventoPlan(EVENTOS_PLAN_EDICION.APROBADO, comentario || 'Plan aprobado para render final.', { usuario })
    ],
    actualizadoEn: new Date().toISOString()
  };

  if (!guardar) return { ok: true, plan: aprobado, validacion };
  const guardado = await guardarPlanEdicion({ entrada, plan: aprobado, opciones });
  return { ok: true, plan: guardado.plan, validacion, guardado };
}

export default aprobarPlanEdicion;

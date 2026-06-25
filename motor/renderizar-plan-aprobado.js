import { prepararSalida } from '../salida/salida.conexion.js';
import { guardarPlanEdicion } from '../plan-edicion/guardar-plan-edicion.js';
import { ESTADOS_PLAN_EDICION, EVENTOS_PLAN_EDICION, crearEventoPlan } from '../plan-edicion/estados-plan.js';

function validarPlanAprobado(plan) {
  if (!plan || typeof plan !== 'object') throw new Error('No se recibió un plan de edición válido.');
  if (plan.estado !== ESTADOS_PLAN_EDICION.APROBADO) throw new Error(`El plan debe estar aprobado antes de renderizar. Estado actual: ${plan.estado || 'sin estado'}.`);
  if (!plan.etapas?.entrada) throw new Error('El plan no contiene la etapa de entrada.');
  if (!plan.etapas?.entendimiento) throw new Error('El plan no contiene la etapa de entendimiento.');
  if (!plan.etapas?.edicion) throw new Error('El plan no contiene el plan técnico de edición.');
}

async function reportarProgreso(progreso, evento) {
  if (typeof progreso !== 'function') return null;
  try { return await progreso(evento); } catch (error) { console.warn('[renderizar-plan] No se pudo reportar progreso:', error.message); return null; }
}

function crearMensajeFinal(salida) {
  const nombre = salida?.nombreExportado || 'video exportado';
  return `Video renderizado correctamente desde plan aprobado: ${nombre}.`;
}

export async function renderizarPlanAprobado({ plan, opciones = {}, progreso = null, jobId = null } = {}) {
  validarPlanAprobado(plan);

  const entrada = plan.etapas.entrada;
  const entendimiento = plan.etapas.entendimiento;
  const audio = plan.etapas.audio || null;
  const edicion = plan.etapas.edicion;
  const opcionesRender = {
    ...(plan.config || {}),
    ...opciones,
    jobId,
    renderDesdePlan: true,
    planId: plan.id
  };

  await reportarProgreso(progreso, { etapa: 'render-plan', porcentaje: 84, titulo: 'Render desde plan aprobado', detalle: 'Validando plan y preparando exportación final.' });

  const salida = await prepararSalida({ entrada, entendimiento, audio, edicion, opciones: opcionesRender, progreso });

  const planRenderizado = {
    ...plan,
    estado: ESTADOS_PLAN_EDICION.RENDERIZADO,
    exportacion: {
      ...(plan.exportacion || {}),
      pendienteRenderFinal: false,
      resultado: salida,
      renderizadoEn: new Date().toISOString()
    },
    historial: [
      ...(Array.isArray(plan.historial) ? plan.historial : []),
      crearEventoPlan(EVENTOS_PLAN_EDICION.RENDERIZADO, 'Plan renderizado correctamente.', { jobId, nombreExportado: salida?.nombreExportado || null, urlPublica: salida?.urlPublica || null })
    ],
    actualizadoEn: new Date().toISOString()
  };

  const guardado = await guardarPlanEdicion({ entrada, plan: planRenderizado, opciones: opcionesRender });

  return {
    ok: true,
    estado: 'PLAN_RENDERIZADO',
    mensaje: crearMensajeFinal(salida),
    proyecto: plan.proyecto || entrada.proyecto || null,
    video: plan.video || entrada.video || null,
    plan: guardado.plan,
    resultado: salida,
    guardadoPlan: guardado,
    historial: planRenderizado.historial
  };
}

export default renderizarPlanAprobado;

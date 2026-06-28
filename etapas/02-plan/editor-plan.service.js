/*
  Bloque 7 - Editor del Plan antes de Produccion
  Funcion: editar, quitar, duplicar y aprobar acciones del JSON tecnico antes de producir.
*/

import {
  ETAPAS_AUTOVIDEO,
  cargarResultadoEtapa,
  guardarResultadoEtapa
} from '../../flujo-etapas/flujo-etapas.conexion.js';
import { repararPlanEjecutable } from './reparar-plan-ejecutable.service.js';
import { validarPlanEjecutable } from './validar-plan-ejecutable.service.js';

function arr(valor) { return Array.isArray(valor) ? valor : []; }
function texto(valor = '', respaldo = '') { const limpio = String(valor ?? '').trim(); return limpio || respaldo; }
function numero(valor, respaldo = null) { const n = Number(valor); return Number.isFinite(n) ? n : respaldo; }

function extraerResultadoEtapa(wrapper = {}) {
  if (wrapper?.resultado?.resultado) return wrapper.resultado.resultado;
  if (wrapper?.datos?.resultado?.resultado) return wrapper.datos.resultado.resultado;
  if (wrapper?.resultado) return wrapper.resultado;
  return wrapper;
}

async function cargarPlanEdicion(proyectoId) {
  const guardado = await cargarResultadoEtapa({ proyectoId, etapa: ETAPAS_AUTOVIDEO.PLAN_EDICION, valorPorDefecto: null });
  if (!guardado) throw new Error('No existe plan de edicion guardado.');
  const plan = extraerResultadoEtapa(guardado);
  if (!plan || typeof plan !== 'object') throw new Error('El plan de edicion no tiene formato valido.');
  if (!plan.planPorPartes?.planEjecutable && !plan.planEjecutable) throw new Error('El plan no contiene JSON tecnico ejecutable para editar.');
  return { guardado, plan };
}

function obtenerPlanEjecutable(plan = {}) {
  return plan.planEjecutable || plan.planPorPartes?.planEjecutable || plan.planProduccion?.planEjecutable || null;
}

function sincronizarPlanEjecutable(plan = {}, planEjecutable = {}, editorPlan = {}) {
  const planActualizado = {
    ...plan,
    planEjecutable,
    editorPlan,
    actualizadoEn: new Date().toISOString()
  };

  if (planActualizado.planPorPartes) {
    planActualizado.planPorPartes = {
      ...planActualizado.planPorPartes,
      planEjecutable,
      validacionPlanEjecutable: validarPlanEjecutable(planEjecutable),
      editorPlan
    };
  }

  if (planActualizado.planProduccion) {
    planActualizado.planProduccion = {
      ...planActualizado.planProduccion,
      planEjecutable,
      usaPlanEjecutable: true,
      editorPlan
    };
  }

  planActualizado.resumen = {
    ...(planActualizado.resumen || {}),
    planEditado: true,
    planAprobadoParaProduccion: Boolean(editorPlan.aprobado),
    planEjecutableAcciones: arr(planEjecutable.timeline).length,
    planEditorCambios: editorPlan.totalCambios || 0
  };

  return planActualizado;
}

function crearEditorBase(plan = {}) {
  const previo = plan.editorPlan || plan.planPorPartes?.editorPlan || {};
  return {
    tipo: 'editor-plan-produccion',
    estado: previo.estado || 'en_revision',
    aprobado: Boolean(previo.aprobado),
    totalCambios: Number(previo.totalCambios || 0),
    historial: arr(previo.historial),
    actualizadoEn: new Date().toISOString()
  };
}

function registrarCambio(editor = {}, cambio = {}) {
  const historial = arr(editor.historial);
  return {
    ...editor,
    aprobado: cambio.operacion === 'aprobar_plan' ? true : false,
    estado: cambio.operacion === 'aprobar_plan' ? 'aprobado_para_produccion' : 'editado_pendiente_aprobacion',
    totalCambios: Number(editor.totalCambios || 0) + 1,
    historial: [
      ...historial,
      {
        ...cambio,
        fecha: new Date().toISOString()
      }
    ].slice(-80),
    actualizadoEn: new Date().toISOString()
  };
}

function normalizarCambiosAccion(cambios = {}) {
  const limpio = {};
  if (cambios.inicio !== undefined) limpio.inicio = numero(cambios.inicio, 0);
  if (cambios.fin !== undefined) limpio.fin = numero(cambios.fin, null);
  if (cambios.duracion !== undefined) limpio.duracion = numero(cambios.duracion, null);
  if (cambios.accion !== undefined) limpio.accion = texto(cambios.accion, 'accion_edicion');
  if (cambios.textoPantalla !== undefined) limpio.textoPantalla = texto(cambios.textoPantalla, '');
  if (cambios.subtitulo !== undefined) limpio.subtitulo = texto(cambios.subtitulo, '');
  if (cambios.recursoBiblioteca !== undefined) limpio.recursoBiblioteca = texto(cambios.recursoBiblioteca, '') || null;
  if (cambios.efecto !== undefined) limpio.efecto = texto(cambios.efecto, '');
  if (cambios.audio !== undefined) limpio.audio = texto(cambios.audio, '');
  if (cambios.transicion !== undefined) limpio.transicion = texto(cambios.transicion, '');
  if (cambios.motivo !== undefined) limpio.motivo = texto(cambios.motivo, 'Editado manualmente.');
  return limpio;
}

function actualizarAccion(planEjecutable = {}, accionId = '', cambios = {}) {
  const timeline = arr(planEjecutable.timeline);
  const indice = timeline.findIndex((item) => item.id === accionId);
  if (indice < 0) throw new Error(`No existe accion ${accionId}.`);
  timeline[indice] = {
    ...timeline[indice],
    ...normalizarCambiosAccion(cambios),
    editadoManual: true,
    actualizadoEn: new Date().toISOString()
  };
  return { ...planEjecutable, timeline };
}

function eliminarAccion(planEjecutable = {}, accionId = '') {
  const timeline = arr(planEjecutable.timeline);
  if (!timeline.some((item) => item.id === accionId)) throw new Error(`No existe accion ${accionId}.`);
  return { ...planEjecutable, timeline: timeline.filter((item) => item.id !== accionId) };
}

function duplicarAccion(planEjecutable = {}, accionId = '') {
  const timeline = arr(planEjecutable.timeline);
  const original = timeline.find((item) => item.id === accionId);
  if (!original) throw new Error(`No existe accion ${accionId}.`);
  const copia = {
    ...original,
    id: `${original.id}-copia-${Date.now()}`,
    inicio: Number((Number(original.fin || original.inicio || 0) + 0.2).toFixed(2)),
    fin: Number((Number(original.fin || original.inicio || 0) + Number(original.duracion || 2.5) + 0.2).toFixed(2)),
    motivo: `${original.motivo || ''} Copia creada desde el editor.`.trim(),
    editadoManual: true,
    creadoEn: new Date().toISOString()
  };
  return { ...planEjecutable, timeline: [...timeline, copia] };
}

function aplicarOperacion({ planEjecutable = {}, operacion = '', accionId = '', cambios = {} } = {}) {
  if (operacion === 'actualizar_accion') return actualizarAccion(planEjecutable, accionId, cambios);
  if (operacion === 'eliminar_accion') return eliminarAccion(planEjecutable, accionId);
  if (operacion === 'duplicar_accion') return duplicarAccion(planEjecutable, accionId);
  if (operacion === 'aprobar_plan') return planEjecutable;
  throw new Error(`Operacion de editor no soportada: ${operacion}`);
}

export async function obtenerEditorPlanProyecto({ proyectoId } = {}) {
  const { plan } = await cargarPlanEdicion(proyectoId);
  const planEjecutable = obtenerPlanEjecutable(plan);
  const editorPlan = crearEditorBase(plan);
  const validacion = validarPlanEjecutable(planEjecutable);
  return {
    ok: true,
    proyectoId,
    editorPlan,
    planEjecutable,
    validacion,
    resumen: {
      totalAcciones: arr(planEjecutable.timeline).length,
      aprobado: Boolean(editorPlan.aprobado),
      estado: editorPlan.estado,
      totalCambios: editorPlan.totalCambios
    }
  };
}

export async function editarPlanProyecto({ proyectoId, operacion = '', accionId = '', cambios = {}, comentario = '' } = {}) {
  const { plan } = await cargarPlanEdicion(proyectoId);
  const editorBase = crearEditorBase(plan);
  const planEjecutableActual = obtenerPlanEjecutable(plan);
  const planEjecutableOperado = aplicarOperacion({ planEjecutable: planEjecutableActual, operacion, accionId, cambios });
  const { plan: planEjecutable, validacion } = repararPlanEjecutable(planEjecutableOperado);
  if (!validacion.ok) throw new Error(`El plan editado no es valido: ${validacion.errores.join(', ')}`);

  const editorPlan = registrarCambio(editorBase, {
    operacion,
    accionId: accionId || null,
    cambios: normalizarCambiosAccion(cambios),
    comentario: texto(comentario, '')
  });
  const planActualizado = sincronizarPlanEjecutable(plan, planEjecutable, editorPlan);

  const guardado = await guardarResultadoEtapa({
    proyectoId,
    etapa: ETAPAS_AUTOVIDEO.PLAN_EDICION,
    resultado: planActualizado,
    metadata: {
      bloqueEditorPlan: 7,
      operacion,
      accionId: accionId || null,
      editorPlan: {
        aprobado: editorPlan.aprobado,
        estado: editorPlan.estado,
        totalCambios: editorPlan.totalCambios
      }
    }
  });

  return {
    ok: true,
    proyectoId,
    operacion,
    editorPlan,
    planEjecutable,
    validacion,
    resumen: planActualizado.resumen,
    archivo: guardado,
    mensaje: editorPlan.aprobado ? 'Plan aprobado para Produccion.' : 'Plan editado. Revisa y aprueba antes de producir.'
  };
}

export default editarPlanProyecto;

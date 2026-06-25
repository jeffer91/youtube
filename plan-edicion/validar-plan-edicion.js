import { esEstadoPlanValido } from './estados-plan.js';

function agregarError(lista, condicion, mensaje) {
  if (!condicion) lista.push(mensaje);
}

function agregarAdvertencia(lista, condicion, mensaje) {
  if (!condicion) lista.push(mensaje);
}

function esObjeto(valor) {
  return Boolean(valor) && typeof valor === 'object' && !Array.isArray(valor);
}

function validarLista(lista, nombre, errores) {
  if (lista === undefined || lista === null) return;
  agregarError(errores, Array.isArray(lista), `${nombre} debe ser una lista.`);
}

export function validarPlanEdicion(plan = {}) {
  const errores = [];
  const advertencias = [];

  agregarError(errores, esObjeto(plan), 'El plan de edición debe ser un objeto.');
  if (!esObjeto(plan)) {
    return { ok: false, errores, advertencias };
  }

  agregarError(errores, typeof plan.id === 'string' && plan.id.trim().length > 0, 'El plan debe tener id.');
  agregarError(errores, esEstadoPlanValido(plan.estado), `Estado de plan no válido: ${plan.estado || 'vacío'}.`);
  agregarError(errores, typeof plan.version === 'string' && plan.version.trim().length > 0, 'El plan debe tener versión.');
  agregarError(errores, esObjeto(plan.proyecto), 'El plan debe incluir datos del proyecto.');
  agregarError(errores, esObjeto(plan.video), 'El plan debe incluir datos del video.');
  agregarError(errores, esObjeto(plan.config), 'El plan debe incluir configuración.');
  agregarError(errores, esObjeto(plan.etapas), 'El plan debe incluir etapas.');
  agregarError(errores, Array.isArray(plan.historial), 'El plan debe incluir historial como lista.');

  if (plan.config) {
    agregarError(errores, Number.isFinite(Number(plan.config.nivelEdicion)), 'La configuración debe incluir nivel de edición numérico.');
    agregarError(errores, typeof plan.config.perfil === 'string' && plan.config.perfil.trim().length > 0, 'La configuración debe incluir perfil visual.');
  }

  if (plan.etapas) {
    agregarAdvertencia(advertencias, Boolean(plan.etapas.entrada), 'El plan no tiene etapa entrada registrada.');
    agregarAdvertencia(advertencias, Boolean(plan.etapas.entendimiento), 'El plan no tiene análisis técnico registrado.');
    agregarAdvertencia(advertencias, Boolean(plan.etapas.audio), 'El plan no tiene etapa de audio registrada.');
    agregarAdvertencia(advertencias, Boolean(plan.etapas.transcripcion), 'El plan no tiene etapa de transcripción registrada.');
    agregarAdvertencia(advertencias, Boolean(plan.etapas.edicionDinamica), 'El plan no tiene etapa de edición dinámica registrada.');
    agregarAdvertencia(advertencias, Boolean(plan.etapas.edicion), 'El plan no tiene plan de edición final registrado.');
  }

  validarLista(plan.revision?.cortes, 'revision.cortes', errores);
  validarLista(plan.revision?.subtitulos, 'revision.subtitulos', errores);
  validarLista(plan.revision?.textosFlotantes, 'revision.textosFlotantes', errores);
  validarLista(plan.revision?.broll, 'revision.broll', errores);
  validarLista(plan.exportacion?.formatos, 'exportacion.formatos', errores);

  agregarAdvertencia(advertencias, Boolean(plan.exportacion?.formatos?.length), 'El plan no tiene formatos de exportación definidos.');
  agregarAdvertencia(advertencias, Boolean(plan.revision), 'El plan no tiene bloque de revisión.');

  return {
    ok: errores.length === 0,
    errores,
    advertencias
  };
}

export function exigirPlanValido(plan) {
  const validacion = validarPlanEdicion(plan);
  if (!validacion.ok) {
    throw new Error(`Plan de edición inválido: ${validacion.errores.join(' ')}`);
  }
  return validacion;
}

export default validarPlanEdicion;

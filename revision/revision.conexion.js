import { crearDraftRevision } from './crear-draft.service.js';
import { cargarDraftRevision, obtenerRutaDraftRevision } from './cargar-draft.service.js';
import { guardarCorreccionesDraft } from './guardar-correcciones-draft.js';
import { aplicarDraftAPlan } from './aplicar-draft-a-plan.js';
import { validarCambiosDraft, exigirCambiosDraftValidos } from './validar-cambios-draft.js';
import { obtenerConfigRevision } from './revision.config.js';

export async function crearDraftRevisionDesdePlan(solicitud = {}) {
  return await crearDraftRevision(solicitud);
}

export async function cargarDraftRevisionDesdePlan(solicitud = {}) {
  return await cargarDraftRevision(solicitud);
}

export async function guardarCorreccionesDraftDesdeRevision(solicitud = {}) {
  return await guardarCorreccionesDraft(solicitud);
}

export async function aplicarDraftAPlanDesdeRevision(solicitud = {}) {
  return await aplicarDraftAPlan(solicitud);
}

export {
  crearDraftRevision,
  cargarDraftRevision,
  guardarCorreccionesDraft,
  aplicarDraftAPlan,
  validarCambiosDraft,
  exigirCambiosDraftValidos,
  obtenerRutaDraftRevision,
  obtenerConfigRevision
};

export default {
  crearDraftRevisionDesdePlan,
  cargarDraftRevisionDesdePlan,
  guardarCorreccionesDraftDesdeRevision,
  aplicarDraftAPlanDesdeRevision,
  crearDraftRevision,
  cargarDraftRevision,
  guardarCorreccionesDraft,
  aplicarDraftAPlan,
  validarCambiosDraft,
  exigirCambiosDraftValidos,
  obtenerRutaDraftRevision,
  obtenerConfigRevision
};

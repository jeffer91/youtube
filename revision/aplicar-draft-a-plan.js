import { aplicarCambiosPlanEdicion } from '../plan-edicion/aplicar-cambios-plan.js';
import { obtenerConfigRevision } from './revision.config.js';
import { validarCambiosDraft } from './validar-cambios-draft.js';

function crearCambiosPlanDesdeDraft(cambios = {}) {
  const revision = {};

  if (Array.isArray(cambios.cortes)) revision.cortes = cambios.cortes;
  if (Array.isArray(cambios.subtitulos)) revision.subtitulos = cambios.subtitulos;
  if (Array.isArray(cambios.textosFlotantes)) revision.textosFlotantes = cambios.textosFlotantes;
  if (Array.isArray(cambios.broll)) revision.broll = cambios.broll;
  if (cambios.miniatura !== undefined) revision.miniatura = cambios.miniatura;
  if (Array.isArray(cambios.observaciones)) revision.observaciones = cambios.observaciones;

  const salida = { revision };
  if (cambios.exportacion && typeof cambios.exportacion === 'object') salida.exportacion = cambios.exportacion;
  if (cambios.decisiones && typeof cambios.decisiones === 'object') salida.decisiones = cambios.decisiones;

  return salida;
}

export async function aplicarDraftAPlan({ entrada = null, plan, cambios = {}, usuario = 'usuario', comentario = '', opciones = {}, guardar = true } = {}) {
  const config = obtenerConfigRevision(opciones);
  const validacion = validarCambiosDraft(cambios, config);
  if (!validacion.ok) throw new Error(`No se puede aplicar draft al plan: ${validacion.errores.join(' ')}`);

  const cambiosPlan = crearCambiosPlanDesdeDraft(cambios);
  return await aplicarCambiosPlanEdicion({
    entrada,
    plan,
    cambios: cambiosPlan,
    usuario,
    comentario: comentario || 'Correcciones del draft aplicadas al plan de edición.',
    opciones,
    guardar
  });
}

export default aplicarDraftAPlan;

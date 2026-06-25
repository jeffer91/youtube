import path from 'path';
import { escribirJson } from '../comun/archivos.js';
import { obtenerConfigRevision } from './revision.config.js';
import { validarCambiosDraft } from './validar-cambios-draft.js';

function obtenerCarpetaProyecto({ plan = null, draft = null, entrada = null, carpetaProyecto = null } = {}) {
  const carpeta = carpetaProyecto || plan?.rutas?.carpetaProyecto || plan?.etapas?.entrada?.rutas?.carpetaProyecto || draft?.rutas?.carpetaProyecto || entrada?.rutas?.carpetaProyecto || null;
  if (!carpeta) throw new Error('No se pueden guardar correcciones porque falta la carpeta del proyecto.');
  return carpeta;
}

export async function guardarCorreccionesDraft({ plan = null, draft = null, cambios = {}, usuario = 'usuario', comentario = '', entrada = null, carpetaProyecto = null, opciones = {} } = {}) {
  const config = obtenerConfigRevision(opciones);
  const validacion = validarCambiosDraft(cambios, config);
  if (!validacion.ok) throw new Error(`No se pueden guardar correcciones: ${validacion.errores.join(' ')}`);

  const correcciones = {
    ok: true,
    tipo: 'draft-correcciones',
    planId: plan?.id || draft?.planId || null,
    draftId: draft?.id || null,
    usuario,
    comentario,
    cambios,
    validacion,
    creadoEn: new Date().toISOString()
  };

  const carpeta = obtenerCarpetaProyecto({ plan, draft, entrada, carpetaProyecto });
  const rutaCorrecciones = path.join(carpeta, config.archivoCorrecciones);
  await escribirJson(rutaCorrecciones, correcciones);

  return {
    ok: true,
    correcciones,
    rutaCorrecciones,
    nombreArchivo: path.basename(rutaCorrecciones)
  };
}

export default guardarCorreccionesDraft;

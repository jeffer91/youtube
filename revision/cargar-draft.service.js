import path from 'path';
import { leerJsonSiExiste } from '../comun/archivos.js';
import { obtenerConfigRevision } from './revision.config.js';

function obtenerCarpetaProyecto({ plan = null, entrada = null, carpetaProyecto = null } = {}) {
  const carpeta = carpetaProyecto || plan?.rutas?.carpetaProyecto || plan?.etapas?.entrada?.rutas?.carpetaProyecto || entrada?.rutas?.carpetaProyecto || null;
  if (!carpeta) throw new Error('No se puede cargar draft porque falta la carpeta del proyecto.');
  return carpeta;
}

export function obtenerRutaDraftRevision({ plan = null, entrada = null, carpetaProyecto = null, opciones = {} } = {}) {
  const config = obtenerConfigRevision(opciones);
  return path.join(obtenerCarpetaProyecto({ plan, entrada, carpetaProyecto }), config.archivoDraft);
}

export async function cargarDraftRevision({ plan = null, entrada = null, carpetaProyecto = null, rutaDraft = null, opciones = {}, requerido = false } = {}) {
  const ruta = rutaDraft || obtenerRutaDraftRevision({ plan, entrada, carpetaProyecto, opciones });
  const draft = await leerJsonSiExiste(ruta, null);

  if (!draft) {
    if (requerido) throw new Error(`No se encontró el draft de revisión: ${ruta}`);
    return { ok: false, existe: false, rutaDraft: ruta, draft: null, mensaje: 'No existe draft de revisión.' };
  }

  return { ok: true, existe: true, rutaDraft: ruta, draft, mensaje: 'Draft de revisión cargado correctamente.' };
}

export default cargarDraftRevision;

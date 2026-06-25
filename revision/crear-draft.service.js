import path from 'path';
import { escribirJson } from '../comun/archivos.js';
import { obtenerConfigRevision } from './revision.config.js';

function obtenerCarpetaProyecto(plan) {
  const carpeta = plan?.rutas?.carpetaProyecto || plan?.etapas?.entrada?.rutas?.carpetaProyecto || null;
  if (!carpeta) throw new Error('No se puede crear draft porque falta la carpeta del proyecto.');
  return carpeta;
}

function crearResumenSeccion(nombre, items = []) {
  const lista = Array.isArray(items) ? items : [];
  return {
    nombre,
    total: lista.length,
    activos: lista.filter((item) => item?.activo !== false).length,
    inactivos: lista.filter((item) => item?.activo === false).length
  };
}

export async function crearDraftRevision({ plan, opciones = {}, guardar = true } = {}) {
  if (!plan || typeof plan !== 'object') throw new Error('No se puede crear draft sin plan de edición.');

  const config = obtenerConfigRevision(opciones);
  const revision = plan.revision || {};
  const draft = {
    ok: true,
    tipo: 'draft-revision',
    version: config.version,
    id: `draft-${plan.id || Date.now()}`,
    planId: plan.id || null,
    estadoPlan: plan.estado || null,
    proyecto: plan.proyecto || null,
    video: plan.video || null,
    config: {
      permiteCortes: config.permitirEditarCortes,
      permiteSubtitulos: config.permitirEditarSubtitulos,
      permiteTextosFlotantes: config.permitirEditarTextosFlotantes,
      permiteBroll: config.permitirEditarBroll,
      permiteMiniatura: config.permitirEditarMiniatura,
      requiereAprobacion: config.requiereAprobacion
    },
    secciones: {
      cortes: revision.cortes || [],
      subtitulos: revision.subtitulos || [],
      textosFlotantes: revision.textosFlotantes || [],
      broll: revision.broll || [],
      miniatura: revision.miniatura || null,
      exportacion: plan.exportacion || null,
      decisiones: plan.decisiones || null
    },
    resumen: [
      crearResumenSeccion('cortes', revision.cortes),
      crearResumenSeccion('subtitulos', revision.subtitulos),
      crearResumenSeccion('textosFlotantes', revision.textosFlotantes),
      crearResumenSeccion('broll', revision.broll)
    ],
    cambios: [],
    creadoEn: new Date().toISOString(),
    actualizadoEn: new Date().toISOString()
  };

  if (!guardar) return { ok: true, draft, guardado: null };

  const carpetaProyecto = obtenerCarpetaProyecto(plan);
  const rutaDraft = path.join(carpetaProyecto, config.archivoDraft);
  await escribirJson(rutaDraft, draft);

  return {
    ok: true,
    draft,
    guardado: {
      rutaDraft,
      nombreArchivo: path.basename(rutaDraft)
    }
  };
}

export default crearDraftRevision;

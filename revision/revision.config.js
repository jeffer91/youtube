export const REVISION_CONFIG = Object.freeze({
  nombre: 'Revisión de borrador',
  version: '0.1.0',
  archivoDraft: 'draft-edicion.json',
  archivoCorrecciones: 'draft-correcciones.json',
  permitirEditarCortes: true,
  permitirEditarSubtitulos: true,
  permitirEditarTextosFlotantes: true,
  permitirEditarBroll: true,
  permitirEditarMiniatura: true,
  requiereAprobacion: true,
  maxCambiosPorDraft: 500
});

function convertirBooleano(valor, respaldo = false) {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'string') {
    const limpio = valor.trim().toLowerCase();
    if (['true', '1', 'si', 'sí', 'yes', 'on', 'activo', 'activado'].includes(limpio)) return true;
    if (['false', '0', 'no', 'off', 'inactivo', 'desactivado'].includes(limpio)) return false;
  }
  return respaldo;
}

export function obtenerConfigRevision(opciones = {}) {
  return {
    ...REVISION_CONFIG,
    permitirEditarCortes: convertirBooleano(opciones.permitirEditarCortes, REVISION_CONFIG.permitirEditarCortes),
    permitirEditarSubtitulos: convertirBooleano(opciones.permitirEditarSubtitulos, REVISION_CONFIG.permitirEditarSubtitulos),
    permitirEditarTextosFlotantes: convertirBooleano(opciones.permitirEditarTextosFlotantes, REVISION_CONFIG.permitirEditarTextosFlotantes),
    permitirEditarBroll: convertirBooleano(opciones.permitirEditarBroll, REVISION_CONFIG.permitirEditarBroll),
    permitirEditarMiniatura: convertirBooleano(opciones.permitirEditarMiniatura, REVISION_CONFIG.permitirEditarMiniatura),
    requiereAprobacion: convertirBooleano(opciones.requiereAprobacion, REVISION_CONFIG.requiereAprobacion)
  };
}

export default REVISION_CONFIG;

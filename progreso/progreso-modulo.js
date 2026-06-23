export async function reportarModulo(progreso, evento = {}) {
  if (typeof progreso !== 'function') return null;
  try {
    return await progreso({
      estado: 'procesando',
      ...evento,
      detalle: evento.detalle || evento.mensaje || ''
    });
  } catch (error) {
    console.warn('[progreso-modulo] No se pudo reportar progreso:', error.message);
    return null;
  }
}

export function crearDetalleCantidad(cantidad, singular, plural = null) {
  const numero = Number(cantidad) || 0;
  const palabra = numero === 1 ? singular : (plural || `${singular}s`);
  return `${numero} ${palabra}`;
}

export function crearResumenCortes(cortes = null) {
  const resumen = cortes?.resumen || {};
  return `${resumen.cantidadCortesAplicados || 0} cortes · ${resumen.segundosEliminados || 0}s reducidos`;
}

export default { reportarModulo, crearDetalleCantidad, crearResumenCortes };

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function filtroZoomSuave({ width = 1080, height = 1920, activo = true } = {}) {
  if (!activo) return null;
  const ancho = Math.max(2, Math.round(numero(width, 1080) * 0.986 / 2) * 2);
  const alto = Math.max(2, Math.round(numero(height, 1920) * 0.986 / 2) * 2);
  return `crop=w=${ancho}:h=${alto}:x=(iw-ow)/2:y=(ih-oh)/2,scale=${Math.round(numero(width, 1080))}:${Math.round(numero(height, 1920))}`;
}

export function construirFiltroVisualFfmpeg({ filtroBase, barraProgreso = null, etiquetas = null, width = 1080, height = 1920, opciones = {} } = {}) {
  if (!filtroBase || typeof filtroBase !== 'string') {
    throw new Error('No se puede construir filtro visual dinámico sin filtro base.');
  }

  const filtros = [filtroBase];
  const zoom = filtroZoomSuave({ width, height, activo: opciones?.agregarZooms !== false });

  if (zoom) filtros.push(zoom);
  if (barraProgreso?.filtro) filtros.push(barraProgreso.filtro);

  for (const item of etiquetas?.filtros || []) {
    if (item?.filtro) filtros.push(item.filtro);
  }

  return {
    ok: true,
    filtroVideo: filtros.filter(Boolean).join(','),
    filtrosAplicados: filtros.length - 1,
    detalle: {
      revision: 'perfil-visual-pendiente',
      zoomSuave: Boolean(zoom),
      barraProgreso: Boolean(barraProgreso?.filtro),
      etiquetas: etiquetas?.filtros?.length || 0
    }
  };
}

export default construirFiltroVisualFfmpeg;

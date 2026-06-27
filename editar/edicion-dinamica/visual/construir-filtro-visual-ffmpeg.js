function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function obtenerPerfil(opciones = {}) {
  return String(opciones?.perfil || 'general').trim().toLowerCase();
}

function obtenerZoomPerfil(opciones = {}) {
  const perfil = obtenerPerfil(opciones);
  if (['11-contra-11', 'futbol'].includes(perfil)) return { perfil, nombre: 'Deportivo', factor: 0.970 };
  if (['jeff-isekai', 'anime'].includes(perfil)) return { perfil, nombre: 'Anime', factor: 0.966 };
  if (['el-don-historia', 'cine'].includes(perfil)) return { perfil, nombre: 'Cine', factor: 0.982 };
  if (['creciaula', 'educacion'].includes(perfil)) return { perfil, nombre: 'Educacion', factor: 0.978 };
  if (perfil === 'institucional') return { perfil, nombre: 'Institucional', factor: 0.984 };
  if (perfil === 'jeff-verso') return { perfil, nombre: 'Jeff Verso', factor: 0.972 };
  return { perfil: 'general', nombre: 'General', factor: 0.980 };
}

function filtroZoomSuave({ width = 1080, height = 1920, activo = true, factor = 0.986 } = {}) {
  if (!activo) return null;
  const f = Math.max(0.94, Math.min(0.995, numero(factor, 0.986)));
  const ancho = Math.max(2, Math.round(numero(width, 1080) * f / 2) * 2);
  const alto = Math.max(2, Math.round(numero(height, 1920) * f / 2) * 2);
  return `crop=w=${ancho}:h=${alto}:x=(iw-ow)/2:y=(ih-oh)/2,scale=${Math.round(numero(width, 1080))}:${Math.round(numero(height, 1920))}`;
}

export function construirFiltroVisualFfmpeg({ filtroBase, barraProgreso = null, etiquetas = null, width = 1080, height = 1920, opciones = {} } = {}) {
  if (!filtroBase || typeof filtroBase !== 'string') {
    throw new Error('No se puede construir filtro visual dinámico sin filtro base.');
  }

  const perfilVisual = obtenerZoomPerfil(opciones);
  const filtros = [filtroBase];
  const zoom = filtroZoomSuave({ width, height, activo: opciones?.agregarZooms !== false, factor: perfilVisual.factor });

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
      perfil: perfilVisual.perfil,
      perfilNombre: perfilVisual.nombre,
      zoomSuave: Boolean(zoom),
      barraProgreso: Boolean(barraProgreso?.filtro),
      etiquetas: etiquetas?.filtros?.length || 0
    }
  };
}

export default construirFiltroVisualFfmpeg;

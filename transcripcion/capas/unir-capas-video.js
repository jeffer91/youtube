function limpiarFiltro(filtro) {
  if (typeof filtro !== 'string') return '';
  return filtro.trim().replace(/,+$/g, '');
}

export function unirFiltrosVideo(filtros = []) {
  return filtros.map(limpiarFiltro).filter(Boolean).join(',');
}

export function unirCapasConFiltroBase({ filtroBase, capasVideo } = {}) {
  const filtros = [filtroBase];
  if (capasVideo?.filtroSubtitulos) filtros.push(capasVideo.filtroSubtitulos);
  if (Array.isArray(capasVideo?.filtrosTextosFlotantes)) filtros.push(...capasVideo.filtrosTextosFlotantes);
  return unirFiltrosVideo(filtros);
}

export default unirCapasConFiltroBase;

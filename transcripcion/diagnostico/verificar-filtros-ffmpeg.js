function revisarTextoFiltro(filtro) {
  const errores = [];
  const advertencias = [];
  if (!filtro || typeof filtro !== 'string') return { ok: true, advertencias: ['No se generó filtro de capas.'], errores };
  if (filtro.includes('undefined') || filtro.includes('null')) errores.push('El filtro contiene valores undefined o null.');
  if (filtro.includes('subtitles=') && !filtro.includes('.ass')) advertencias.push('El filtro de subtítulos no parece apuntar a un archivo .ass.');
  if (filtro.includes('drawtext') && !filtro.includes('enable=')) advertencias.push('Hay drawtext sin condición enable.');
  if ((filtro.match(/'/g) || []).length % 2 !== 0) advertencias.push('El filtro contiene comillas simples impares; podría fallar en FFmpeg.');
  return { ok: errores.length === 0, advertencias, errores };
}

export function verificarFiltrosFfmpeg(capasVideo = null) {
  const filtroFinal = capasVideo?.filtroCapasFinal || '';
  const filtroSubtitulos = capasVideo?.filtroSubtitulos || '';
  const filtrosTextos = Array.isArray(capasVideo?.filtrosTextosFlotantes) ? capasVideo.filtrosTextosFlotantes : [];
  const revisiones = [revisarTextoFiltro(filtroFinal), revisarTextoFiltro(filtroSubtitulos), ...filtrosTextos.map((filtro) => revisarTextoFiltro(filtro))];
  const errores = revisiones.flatMap((revision) => revision.errores);
  const advertencias = revisiones.flatMap((revision) => revision.advertencias);
  return { ok: errores.length === 0, errores, advertencias, resumen: { tieneFiltroFinal: Boolean(filtroFinal), tieneSubtitulos: Boolean(filtroSubtitulos), cantidadDrawtexts: filtrosTextos.length } };
}

export default verificarFiltrosFfmpeg;

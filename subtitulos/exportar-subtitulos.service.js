/*
  Modulo: subtitulos
  Funcion: exportar subtitulos a formatos de texto usados por edicion.
*/

function formatearTiempoSrt(segundos = 0) {
  const totalMs = Math.max(0, Math.round(Number(segundos || 0) * 1000));
  const ms = totalMs % 1000;
  const totalSeg = Math.floor(totalMs / 1000);
  const s = totalSeg % 60;
  const totalMin = Math.floor(totalSeg / 60);
  const m = totalMin % 60;
  const h = Math.floor(totalMin / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

export function convertirSubtitulosASrt(subtitulos = []) {
  return subtitulos.map((subtitulo, indice) => [
    String(indice + 1),
    `${formatearTiempoSrt(subtitulo.inicio)} --> ${formatearTiempoSrt(subtitulo.fin)}`,
    subtitulo.lineas?.length ? subtitulo.lineas.join('\n') : subtitulo.texto,
    ''
  ].join('\n')).join('\n');
}

export function convertirSubtitulosAJson(subtitulos = []) {
  return JSON.stringify({ total: subtitulos.length, subtitulos }, null, 2);
}

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function formatoSegundos(valor) {
  const segundos = numero(valor, 0);
  if (segundos <= 0) return '0 s';
  if (segundos < 60) return `${segundos.toFixed(1)} s`;
  const min = Math.floor(segundos / 60);
  const sec = Math.round(segundos % 60);
  return `${min} min ${sec} s`;
}

export function obtenerResumenEdicionDinamica(datos = {}) {
  const dinamica = datos.edicionDinamica || datos.edicion?.edicionDinamica || null;
  const edicion = datos.edicion || null;
  const resultado = datos.resultado || null;

  if (!dinamica || dinamica.omitido || dinamica.activo === false) {
    return 'Edición automática: activa por defecto, pero no se aplicaron cortes dinámicos en este video.';
  }

  const cortes = dinamica.cortes?.resumen || {};
  const visual = edicion?.visualDinamico || null;
  const sonidos = edicion?.sonidos || null;
  const audioTipo = resultado?.audio?.tipo || null;
  const partes = [];

  partes.push(`Silencios cortados: ${cortes.cantidadCortesAplicados || 0}`);
  partes.push(`Tiempo reducido: ${formatoSegundos(cortes.segundosEliminados || 0)}`);
  partes.push(visual && !visual.omitido ? 'Visuales: aplicados' : 'Visuales: automáticos');
  partes.push(sonidos && !sonidos.omitido ? `Sonidos: ${sonidos.eventosSonido?.length || 0}` : 'Sonidos: seguros');
  if (audioTipo) partes.push(`Audio final: ${audioTipo}`);

  return `Edición automática: ${partes.join(' · ')}.`;
}

export default obtenerResumenEdicionDinamica;

/*
  Bloque 4: Compilador FFmpeg de efectos
  Funcion: validar filtros antes de enviarlos al render.
*/

function texto(valor) {
  return String(valor || '').trim();
}

export function validarFiltroFinalFfmpeg({ filtroBase = '', filtros = [], filtroFinal = '' } = {}) {
  const errores = [];
  const advertencias = [];
  const base = texto(filtroBase);
  const final = texto(filtroFinal);
  const lista = Array.isArray(filtros) ? filtros.filter(Boolean).map(texto).filter(Boolean) : [];

  if (!base) errores.push('Falta filtro base.');
  if (!final) errores.push('Falta filtro final.');
  if (final.includes('undefined')) errores.push('El filtro final contiene undefined.');
  if (final.includes('null')) errores.push('El filtro final contiene null.');
  if (final.length > 18000) advertencias.push('El filtro final es muy largo y podria fallar en videos complejos.');
  if (lista.length === 0) advertencias.push('No se agregaron filtros de efectos al filtro base.');

  return {
    ok: errores.length === 0,
    errores,
    advertencias,
    filtrosAgregados: lista.length,
    longitud: final.length,
    mensaje: errores.length === 0 ? 'Filtro FFmpeg validado.' : 'Filtro FFmpeg con errores.'
  };
}

export default validarFiltroFinalFfmpeg;

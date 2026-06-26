/*
  Modulo: subtitulos
  Funcion: validar subtitulos antes de mandarlos a produccion o render.
*/

export function validarSubtitulo(subtitulo = {}) {
  const errores = [];
  if (!subtitulo.texto) errores.push('Subtitulo sin texto.');
  if (!Number.isFinite(Number(subtitulo.inicio))) errores.push('Subtitulo sin inicio valido.');
  if (!Number.isFinite(Number(subtitulo.fin))) errores.push('Subtitulo sin fin valido.');
  if (Number(subtitulo.fin) < Number(subtitulo.inicio)) errores.push('Subtitulo con fin menor que inicio.');
  return { ok: errores.length === 0, errores, subtitulo };
}

export function validarSubtitulos(subtitulos = []) {
  const resultados = subtitulos.map(validarSubtitulo);
  const errores = resultados.flatMap((resultado, indice) => resultado.errores.map((error) => `#${indice + 1}: ${error}`));
  return {
    ok: errores.length === 0,
    total: subtitulos.length,
    errores,
    resultados
  };
}

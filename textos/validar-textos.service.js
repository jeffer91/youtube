/*
  Modulo: textos
  Funcion: validar capas de texto antes de produccion.
*/

export function validarTextoPantalla(texto = {}) {
  const errores = [];
  if (!texto.texto) errores.push('Texto vacio.');
  if (!texto.tipo) errores.push('Texto sin tipo.');
  if (!Number.isFinite(Number(texto.inicio))) errores.push('Texto sin inicio valido.');
  if (!Number.isFinite(Number(texto.fin))) errores.push('Texto sin fin valido.');
  if (String(texto.texto || '').length > 90) errores.push('Texto demasiado largo para pantalla.');
  return { ok: errores.length === 0, errores, texto };
}

export function validarTextosPantalla(textos = []) {
  const resultados = textos.map(validarTextoPantalla);
  const errores = resultados.flatMap((resultado, indice) => resultado.errores.map((error) => `#${indice + 1}: ${error}`));
  return { ok: errores.length === 0, total: textos.length, errores, resultados };
}

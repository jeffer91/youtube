/*
  Nombre completo: metricas-comunes.js
  Ruta: /motor/metricas/metricas-comunes.js

  Función:
  - Centralizar cálculos de porcentajes, estados y promedios.
  - Evitar porcentajes inventados fuera de rango.
  - Separar ejecución del módulo e impacto real/estimado.
*/

export function numeroSeguro(valor, respaldo = 0) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : respaldo;
}

export function limitarPorcentaje(valor) {
  return Math.max(0, Math.min(100, Math.round(numeroSeguro(valor, 0))));
}

export function porcentajeBooleano(valor) {
  return valor ? 100 : 0;
}

export function porcentajeRelacion(parte, total) {
  const p = numeroSeguro(parte, 0);
  const t = numeroSeguro(total, 0);
  if (t <= 0) return 0;
  return limitarPorcentaje((p / t) * 100);
}

export function promedioPorcentajes(items = []) {
  const validos = items
    .map((item) => numeroSeguro(item, NaN))
    .filter((item) => Number.isFinite(item));

  if (!validos.length) return 0;
  return limitarPorcentaje(validos.reduce((a, b) => a + b, 0) / validos.length);
}

export function promedioPonderado(items = []) {
  const validos = items.filter((item) => Number.isFinite(Number(item?.valor)) && Number(item?.peso) > 0);
  const pesoTotal = validos.reduce((total, item) => total + Number(item.peso), 0);
  if (pesoTotal <= 0) return 0;
  const suma = validos.reduce((total, item) => total + (Number(item.valor) * Number(item.peso)), 0);
  return limitarPorcentaje(suma / pesoTotal);
}

export function estadoPorPorcentaje(porcentaje, { omitido = false, error = false } = {}) {
  if (error) return 'error';
  if (omitido) return 'omitido';
  const p = limitarPorcentaje(porcentaje);
  if (p <= 0) return 'sin-impacto';
  if (p <= 30) return 'bajo-impacto';
  if (p <= 70) return 'impacto-medio';
  return 'alto-impacto';
}

export function etiquetaEstado(estado) {
  const mapa = {
    error: 'Error',
    omitido: 'Omitido',
    'sin-impacto': 'Sin impacto',
    'bajo-impacto': 'Bajo impacto',
    'impacto-medio': 'Impacto medio',
    'alto-impacto': 'Alto impacto',
    completado: 'Completado'
  };
  return mapa[estado] || estado || 'Sin estado';
}

export function crearMetricaModulo({
  id,
  nombre,
  ejecutado = 0,
  impacto = 0,
  entrega = null,
  omitido = false,
  error = false,
  estado = null,
  conclusion = '',
  detalle = {},
  evidencias = []
} = {}) {
  const impactoFinal = limitarPorcentaje(impacto);
  return {
    id: id || 'modulo',
    nombre: nombre || id || 'Módulo',
    ejecutado: limitarPorcentaje(ejecutado),
    impacto: impactoFinal,
    entrega: entrega === null || entrega === undefined ? null : limitarPorcentaje(entrega),
    omitido: Boolean(omitido),
    error: Boolean(error),
    estado: estado || estadoPorPorcentaje(impactoFinal, { omitido, error }),
    conclusion: conclusion || '',
    detalle: detalle || {},
    evidencias: Array.isArray(evidencias) ? evidencias : [],
    creadoEn: new Date().toISOString()
  };
}

export function contarVerdaderos(valores = []) {
  return valores.reduce((total, valor) => total + (Boolean(valor) ? 1 : 0), 0);
}

export function porcentajeCondiciones(valores = []) {
  if (!valores.length) return 0;
  return porcentajeRelacion(contarVerdaderos(valores), valores.length);
}

export function textoImpacto(porcentaje) {
  const estado = estadoPorPorcentaje(porcentaje);
  if (estado === 'sin-impacto') return 'No hubo cambio real detectable.';
  if (estado === 'bajo-impacto') return 'Se ejecutó, pero el cambio real fue bajo.';
  if (estado === 'impacto-medio') return 'Se ejecutó y produjo un cambio moderado.';
  if (estado === 'alto-impacto') return 'Se ejecutó y produjo un cambio alto.';
  return 'Sin conclusión.';
}

export default {
  numeroSeguro,
  limitarPorcentaje,
  porcentajeBooleano,
  porcentajeRelacion,
  promedioPorcentajes,
  promedioPonderado,
  estadoPorPorcentaje,
  etiquetaEstado,
  crearMetricaModulo,
  contarVerdaderos,
  porcentajeCondiciones,
  textoImpacto
};

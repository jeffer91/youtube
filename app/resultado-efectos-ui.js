function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function obtenerMotorEfectos(datos = {}) {
  return datos?.edicion?.visualDinamico?.motorEfectos || datos?.edicion?.motorEfectos || datos?.resultado?.motorEfectos || null;
}

function obtenerPlan(motor = {}) {
  return motor?.plan || null;
}

function obtenerCompilado(motor = {}) {
  return motor?.compilado || null;
}

function nombrarSelector(origen, fallbackLocal) {
  if (origen === 'gemini') return 'Gemini';
  if (fallbackLocal) return 'Local seguro';
  return 'Local';
}

export function obtenerResumenEfectos(datos = {}) {
  const motor = obtenerMotorEfectos(datos);
  if (!motor) return 'Efectos: motor no reportado.';
  if (motor.omitido) return `Efectos: omitidos. ${motor.mensaje || ''}`.trim();

  const plan = obtenerPlan(motor);
  const compilado = obtenerCompilado(motor);
  const detalle = motor.detalle || {};
  const origen = plan?.origen || detalle.origen || 'local';
  const fallbackLocal = Boolean(plan?.fallbackLocal || detalle.fallbackLocal);
  const perfil = plan?.perfil?.nombre || plan?.perfil?.id || detalle.perfil || 'general';
  const intensidad = plan?.intensidad?.id || detalle.intensidad || 'normal';
  const totalPlan = numero(plan?.total || plan?.efectos?.length || detalle.totalPlan, 0);
  const filtros = numero(motor.filtrosAplicados || compilado?.filtrosAplicados || detalle.filtrosAplicados, 0);
  const omitidos = numero(compilado?.omitidos?.length || detalle.omitidos, 0);
  const selector = nombrarSelector(origen, fallbackLocal);

  const partes = [`${filtros} filtros aplicados`, `plan ${totalPlan}`, `perfil ${perfil}`, `intensidad ${intensidad}`, `selector ${selector}`];
  if (omitidos > 0) partes.push(`${omitidos} omitidos`);
  return `Efectos: ${partes.join(' · ')}.`;
}

export function mostrarResumenEfectosUI(datos = {}, elemento = null) {
  if (!elemento) return;
  const resumen = obtenerResumenEfectos(datos);
  elemento.hidden = false;
  elemento.textContent = resumen;
}

export default obtenerResumenEfectos;

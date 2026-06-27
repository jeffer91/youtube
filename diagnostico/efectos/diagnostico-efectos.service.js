/*
  Bloque 8: Diagnóstico y auditoría visual
  Función: resumir y revisar el motor de efectos aplicado a un video.
*/

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function obtenerPlan(resultado = {}) {
  return resultado?.plan || resultado?.visualDinamico?.motorEfectos?.plan || resultado?.edicion?.visualDinamico?.motorEfectos?.plan || null;
}

function obtenerCompilado(resultado = {}) {
  return resultado?.compilado || resultado?.visualDinamico?.motorEfectos?.compilado || resultado?.edicion?.visualDinamico?.motorEfectos?.compilado || null;
}

function obtenerDetalle(resultado = {}) {
  return resultado?.detalle || resultado?.visualDinamico?.motorEfectos?.detalle || resultado?.edicion?.visualDinamico?.motorEfectos?.detalle || {};
}

function agruparPorCategoria(efectos = []) {
  return efectos.reduce((acc, efecto) => {
    const categoria = efecto.categoria || 'sin_categoria';
    acc[categoria] = (acc[categoria] || 0) + 1;
    return acc;
  }, {});
}

function listarEfectosPrincipales(efectos = [], limite = 8) {
  return efectos.slice(0, limite).map((efecto) => ({
    efectoId: efecto.efectoId,
    nombre: efecto.nombre,
    categoria: efecto.categoria,
    inicio: numero(efecto.inicio, 0),
    fin: numero(efecto.fin, 0),
    intensidad: efecto.intensidad || 'normal',
    origen: efecto.origen || 'local',
    motivo: efecto.motivo || ''
  }));
}

export function crearDiagnosticoEfectos(resultado = {}) {
  const plan = obtenerPlan(resultado);
  const compilado = obtenerCompilado(resultado);
  const detalle = obtenerDetalle(resultado);
  const efectos = Array.isArray(plan?.efectos) ? plan.efectos : [];
  const filtrosAplicados = numero(resultado?.filtrosAplicados ?? compilado?.filtrosAplicados ?? detalle?.filtrosAplicados, 0);
  const omitidos = Array.isArray(compilado?.omitidos) ? compilado.omitidos.length : numero(detalle?.omitidos, 0);
  const origen = plan?.origen || detalle?.origen || 'local';
  const perfil = plan?.perfil?.id || detalle?.perfil || 'general';
  const intensidad = plan?.intensidad?.id || detalle?.intensidad || 'normal';
  const fallbackLocal = Boolean(plan?.fallbackLocal || detalle?.fallbackLocal);
  const ok = Boolean((resultado?.ok !== false) && filtrosAplicados > 0);
  const advertencias = [];

  if (!plan) advertencias.push('No se encontró plan de efectos en el resultado.');
  if (efectos.length === 0) advertencias.push('El plan no contiene efectos válidos.');
  if (filtrosAplicados === 0) advertencias.push('No se compilaron filtros de efectos.');
  if (omitidos > 0) advertencias.push(`${omitidos} efecto(s) fueron omitidos durante compilación.`);
  if (fallbackLocal) advertencias.push('Se usó fallback local porque Gemini no respondió o no estaba disponible.');

  return {
    ok,
    tipo: 'diagnostico-efectos',
    motor: resultado?.motor || 'efectos-v1',
    perfil,
    intensidad,
    origen,
    fallbackLocal,
    totalPlan: efectos.length,
    filtrosAplicados,
    omitidos,
    categorias: agruparPorCategoria(efectos),
    efectosPrincipales: listarEfectosPrincipales(efectos),
    advertencias,
    mensaje: ok ? `Motor de efectos activo: ${filtrosAplicados} filtro(s) aplicados.` : 'Motor de efectos sin filtros visibles aplicados.',
    creadoEn: new Date().toISOString()
  };
}

export function crearResumenEfectosTexto(diagnostico = {}) {
  if (!diagnostico || diagnostico.ok === false) return 'Efectos: no se aplicaron filtros visibles.';
  const origen = diagnostico.origen === 'gemini' ? 'Gemini' : 'local';
  const fallback = diagnostico.fallbackLocal ? ' · fallback local' : '';
  return `Efectos: ${diagnostico.filtrosAplicados} filtros · perfil ${diagnostico.perfil} · intensidad ${diagnostico.intensidad} · selector ${origen}${fallback}.`;
}

export default crearDiagnosticoEfectos;

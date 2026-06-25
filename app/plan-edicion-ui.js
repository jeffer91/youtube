const IDS = Object.freeze({
  perfilVisual: 'perfilVisual',
  nivelEdicion: 'nivelEdicion',
  formatoPrincipal: 'formatoPrincipal',
  exportVertical: 'exportVertical',
  exportHorizontal: 'exportHorizontal',
  exportSquare: 'exportSquare',
  draftMode: 'draftMode',
  renderAutomatico: 'renderAutomatico',
  planModeSummary: 'planModeSummary'
});

function obtenerElemento(id) {
  return document.getElementById(id);
}

function convertirBooleanoDesdeCheck(id, respaldo = false) {
  const elemento = obtenerElemento(id);
  if (!elemento) return respaldo;
  return Boolean(elemento.checked);
}

function obtenerValor(id, respaldo = '') {
  const elemento = obtenerElemento(id);
  const valor = elemento?.value;
  return typeof valor === 'string' && valor.trim() ? valor.trim() : respaldo;
}

function obtenerFormatosExportacion() {
  const formatos = [];
  if (convertirBooleanoDesdeCheck(IDS.exportVertical, true)) formatos.push('vertical-9-16');
  if (convertirBooleanoDesdeCheck(IDS.exportHorizontal, false)) formatos.push('horizontal-16-9');
  if (convertirBooleanoDesdeCheck(IDS.exportSquare, false)) formatos.push('cuadrado-1-1');
  return formatos.length > 0 ? formatos : ['vertical-9-16'];
}

function descripcionNivel(nivel) {
  const mapa = {
    1: 'Básico: cortes simples y subtítulos.',
    2: 'Avanzado: cortes, subtítulos, textos, visuales y sonidos.',
    3: 'Pro: preparado para zoom/encuadre avanzado.',
    4: 'Mejora máxima: preparado para B-Roll y música.'
  };
  return mapa[Number(nivel)] || mapa[2];
}

function actualizarResumenPlan() {
  const resumen = obtenerElemento(IDS.planModeSummary);
  if (!resumen) return;

  const perfil = obtenerValor(IDS.perfilVisual, 'educacion');
  const nivel = Number(obtenerValor(IDS.nivelEdicion, '2')) || 2;
  const formatos = obtenerFormatosExportacion();
  const draft = convertirBooleanoDesdeCheck(IDS.draftMode, true);

  resumen.textContent = `${draft ? 'Draft Mode activo' : 'Render directo'} · Perfil ${perfil} · Nivel ${nivel}: ${descripcionNivel(nivel)} · Exportación: ${formatos.join(', ')}`;
}

export function obtenerOpcionesPlanEdicion() {
  const formatos = obtenerFormatosExportacion();
  return {
    perfilVisual: obtenerValor(IDS.perfilVisual, 'educacion'),
    nivelEdicion: obtenerValor(IDS.nivelEdicion, '2'),
    formatoPrincipal: obtenerValor(IDS.formatoPrincipal, formatos[0] || 'vertical-9-16'),
    formatosExportacion: formatos.join(','),
    requiereRevision: convertirBooleanoDesdeCheck(IDS.draftMode, true) ? 'true' : 'false',
    draftMode: convertirBooleanoDesdeCheck(IDS.draftMode, true) ? 'true' : 'false',
    renderAutomatico: convertirBooleanoDesdeCheck(IDS.renderAutomatico, false) ? 'true' : 'false'
  };
}

export function bloquearControlesPlanEdicion(bloquear) {
  Object.values(IDS).forEach((id) => {
    const elemento = obtenerElemento(id);
    if (elemento && 'disabled' in elemento) elemento.disabled = bloquear;
  });
}

export function inicializarPlanEdicionUI() {
  Object.values(IDS).forEach((id) => {
    const elemento = obtenerElemento(id);
    if (!elemento) return;
    elemento.addEventListener('change', actualizarResumenPlan);
    elemento.addEventListener('input', actualizarResumenPlan);
  });
  actualizarResumenPlan();
}

export default {
  obtenerOpcionesPlanEdicion,
  bloquearControlesPlanEdicion,
  inicializarPlanEdicionUI
};

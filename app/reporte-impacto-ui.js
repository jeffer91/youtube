/*
  Nombre completo: reporte-impacto-ui.js
  Ruta: /app/reporte-impacto-ui.js

  Función:
  - Mostrar porcentajes de ejecución, impacto y entrega final.
  - Renderizar tarjetas claras para el usuario.
*/

const CLASES_ESTADO = Object.freeze({
  error: 'is-error',
  omitido: 'is-omitido',
  'sin-impacto': 'is-bajo',
  'bajo-impacto': 'is-bajo',
  'impacto-medio': 'is-medio',
  'alto-impacto': 'is-alto',
  completado: 'is-alto'
});

function escaparHtml(valor) {
  return String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function porcentaje(valor) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function estadoClase(estado) {
  return CLASES_ESTADO[estado] || 'is-medio';
}

function obtenerModulosOrdenados(reporteImpacto = {}) {
  const modulos = reporteImpacto?.modulos || {};
  const orden = ['audio', 'transcripcion', 'subtitulos', 'textosFlotantes', 'cortes', 'zooms', 'barraProgreso', 'etiquetasVisuales', 'sonidos', 'exportacion'];
  return orden.map((clave) => modulos[clave]).filter(Boolean);
}

function renderizarBarra(valor) {
  const p = porcentaje(valor);
  return `<div class="impact-bar"><span style="width:${p}%"></span></div>`;
}

function renderizarModulo(modulo) {
  const impacto = porcentaje(modulo?.impacto);
  const ejecutado = porcentaje(modulo?.ejecutado);
  const clase = estadoClase(modulo?.estado);

  return `
    <article class="impact-card ${clase}">
      <header>
        <strong>${escaparHtml(modulo?.nombre || 'Módulo')}</strong>
        <span>${impacto}%</span>
      </header>
      ${renderizarBarra(impacto)}
      <div class="impact-meta">
        <span>Ejecutado: ${ejecutado}%</span>
        <span>Impacto: ${impacto}%</span>
        ${modulo?.entrega !== null && modulo?.entrega !== undefined ? `<span>Entrega: ${porcentaje(modulo.entrega)}%</span>` : ''}
      </div>
      <p>${escaparHtml(modulo?.conclusion || '')}</p>
    </article>
  `;
}

export function renderizarReporteImpacto(reporteImpacto = {}) {
  if (!reporteImpacto || typeof reporteImpacto !== 'object') {
    return '';
  }

  const general = porcentaje(reporteImpacto.porcentajeGeneral);
  const modulos = obtenerModulosOrdenados(reporteImpacto);
  const errores = reporteImpacto?.validacionFinal?.errores || reporteImpacto?.entregaFinal?.errores || [];

  return `
    <div class="impact-report">
      <header class="impact-report-header">
        <div>
          <p class="eyebrow">Reporte de impacto</p>
          <h2>Resultado general: ${general}%</h2>
          <p>${escaparHtml(reporteImpacto.resumen || 'Reporte generado correctamente.')}</p>
        </div>
        <strong class="impact-general ${estadoClase(reporteImpacto.estadoGeneral)}">${general}%</strong>
      </header>
      ${renderizarBarra(general)}
      ${errores.length ? `<div class="impact-errors"><strong>Problemas detectados:</strong><ul>${errores.map((e) => `<li>${escaparHtml(e)}</li>`).join('')}</ul></div>` : ''}
      <div class="impact-grid">${modulos.map(renderizarModulo).join('')}</div>
    </div>
  `;
}

export function mostrarReporteImpacto(reporteImpacto = {}, contenedor = null) {
  const panel = contenedor || document.getElementById('impactReportPanel');
  if (!panel) return false;

  const html = renderizarReporteImpacto(reporteImpacto);
  if (!html) {
    panel.hidden = true;
    panel.innerHTML = '';
    return false;
  }

  panel.innerHTML = html;
  panel.hidden = false;
  return true;
}

export function limpiarReporteImpacto(contenedor = null) {
  const panel = contenedor || document.getElementById('impactReportPanel');
  if (!panel) return;
  panel.innerHTML = '';
  panel.hidden = true;
}

export default { renderizarReporteImpacto, mostrarReporteImpacto, limpiarReporteImpacto };

/*
  Nombre completo: reporte-impacto-ui.js
  Ruta: /app/reporte-impacto-ui.js

  Función:
  - Mostrar porcentajes de ejecución, impacto y entrega final.
  - Renderizar tarjetas claras para el usuario.
  - Inyectar estilos propios sin depender de modificar styles.css.
*/

const CLASES_ESTADO = Object.freeze({ error: 'is-error', omitido: 'is-omitido', 'sin-impacto': 'is-bajo', 'bajo-impacto': 'is-bajo', 'impacto-medio': 'is-medio', 'alto-impacto': 'is-alto', completado: 'is-alto' });
const STYLE_ID = 'avjImpactReportStyles';

function inyectarEstilosImpacto() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .impact-report-panel,.avj-comparativa-impact-report{margin-top:14px}.impact-report{border:1px solid #d9e2ef;border-radius:18px;background:#fff;padding:14px;box-shadow:0 12px 30px rgba(15,23,42,.06)}.impact-report-header{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:12px}.impact-report-header h2{margin:0;font-size:1.2rem}.impact-report-header p{margin:6px 0 0;color:#667085;line-height:1.4}.impact-general{display:inline-grid;place-items:center;min-width:74px;height:74px;border-radius:999px;border:1px solid #d9e2ef;background:#f8fafc;font-size:1.25rem}.impact-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px;margin-top:12px}.impact-card{border:1px solid #d9e2ef;border-radius:16px;background:#f8fafc;padding:12px}.impact-card header{display:flex;justify-content:space-between;gap:10px;align-items:center;font-weight:900}.impact-card header span{font-size:1.05rem}.impact-card p{margin:8px 0 0;color:#667085;line-height:1.35;font-size:.9rem}.impact-meta{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.impact-meta span{border:1px solid #d9e2ef;border-radius:999px;background:#fff;padding:4px 7px;color:#667085;font-size:.76rem;font-weight:800}.impact-bar{height:10px;background:#e2e8f0;border-radius:999px;overflow:hidden;margin-top:10px}.impact-bar span{display:block;height:100%;background:#2563eb;border-radius:inherit}.is-alto .impact-bar span,.impact-general.is-alto{background:#dcfce7;color:#15803d;border-color:#bbf7d0}.is-alto .impact-bar span{background:#15803d}.is-medio .impact-bar span,.impact-general.is-medio{background:#fef3c7;color:#a16207;border-color:#fde68a}.is-medio .impact-bar span{background:#a16207}.is-bajo .impact-bar span,.impact-general.is-bajo{background:#fee2e2;color:#b91c1c;border-color:#fecaca}.is-bajo .impact-bar span{background:#b91c1c}.is-error{border-color:#fecaca;background:#fff1f2}.is-omitido{opacity:.78}.impact-errors{border:1px solid #fecaca;border-radius:14px;background:#fff1f2;color:#991b1b;padding:10px 12px;margin:10px 0}.impact-errors ul{margin:6px 0 0;padding-left:18px}@media(max-width:720px){.impact-report-header{flex-direction:column}.impact-general{width:100%;height:auto;padding:12px;border-radius:14px}}`;
  document.head.appendChild(style);
}

function escaparHtml(valor) { return String(valor ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;'); }
function porcentaje(valor) { const n = Number(valor); if (!Number.isFinite(n)) return 0; return Math.max(0, Math.min(100, Math.round(n))); }
function estadoClase(estado) { return CLASES_ESTADO[estado] || 'is-medio'; }
function obtenerModulosOrdenados(reporteImpacto = {}) { const modulos = reporteImpacto?.modulos || {}; const orden = ['audio', 'transcripcion', 'subtitulos', 'textosFlotantes', 'cortes', 'zooms', 'barraProgreso', 'etiquetasVisuales', 'sonidos', 'exportacion']; return orden.map((clave) => modulos[clave]).filter(Boolean); }
function renderizarBarra(valor) { const p = porcentaje(valor); return `<div class="impact-bar"><span style="width:${p}%"></span></div>`; }

function renderizarModulo(modulo) {
  const impacto = porcentaje(modulo?.impacto);
  const ejecutado = porcentaje(modulo?.ejecutado);
  const clase = estadoClase(modulo?.estado);
  return `<article class="impact-card ${clase}"><header><strong>${escaparHtml(modulo?.nombre || 'Módulo')}</strong><span>${impacto}%</span></header>${renderizarBarra(impacto)}<div class="impact-meta"><span>Ejecutado: ${ejecutado}%</span><span>Impacto: ${impacto}%</span>${modulo?.entrega !== null && modulo?.entrega !== undefined ? `<span>Entrega: ${porcentaje(modulo.entrega)}%</span>` : ''}</div><p>${escaparHtml(modulo?.conclusion || '')}</p></article>`;
}

export function renderizarReporteImpacto(reporteImpacto = {}) {
  if (!reporteImpacto || typeof reporteImpacto !== 'object') return '';
  inyectarEstilosImpacto();
  const general = porcentaje(reporteImpacto.porcentajeGeneral);
  const modulos = obtenerModulosOrdenados(reporteImpacto);
  const errores = reporteImpacto?.validacionFinal?.errores || reporteImpacto?.entregaFinal?.errores || [];
  return `<div class="impact-report"><header class="impact-report-header"><div><p class="eyebrow">Reporte de impacto</p><h2>Resultado general: ${general}%</h2><p>${escaparHtml(reporteImpacto.resumen || 'Reporte generado correctamente.')}</p></div><strong class="impact-general ${estadoClase(reporteImpacto.estadoGeneral)}">${general}%</strong></header>${renderizarBarra(general)}${errores.length ? `<div class="impact-errors"><strong>Problemas detectados:</strong><ul>${errores.map((e) => `<li>${escaparHtml(e)}</li>`).join('')}</ul></div>` : ''}<div class="impact-grid">${modulos.map(renderizarModulo).join('')}</div></div>`;
}

export function mostrarReporteImpacto(reporteImpacto = {}, contenedor = null) {
  const panel = contenedor || document.getElementById('impactReportPanel');
  if (!panel) return false;
  const html = renderizarReporteImpacto(reporteImpacto);
  if (!html) { panel.hidden = true; panel.innerHTML = ''; return false; }
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

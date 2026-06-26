export function renderDiagnosticoView() {
  return `
    <section class="aj-view-card">
      <p class="eyebrow">Diagnostico</p>
      <h2>Diagnostico fuerte y auditoria integral</h2>
      <p>Revisa FFmpeg, carpetas, modulos criticos, variables, conexiones, botones, entradas, salidas y rutas.</p>
      <div class="aj-tags"><span>FFmpeg</span><span>Carpetas</span><span>Modulos</span><span>Variables</span><span>Botones</span><span>Entradas</span><span>Salidas</span><span>Reintento</span></div>
      <div class="strong-diagnostic-actions">
        <button class="strong-diagnostic-button" type="button" data-diagnostic-action="strong">Ejecutar diagnostico fuerte</button>
        <button class="strong-diagnostic-button" type="button" data-diagnostic-action="audit">Auditoria integral</button>
      </div>
      <p id="strongDiagnosticStatus" class="mini-summary">El diagnostico se ejecuta al abrir esta pantalla.</p>
      <div id="strongDiagnosticResult"></div>
      <p id="integralAuditStatus" class="mini-summary">La auditoria revisa variables, rutas, botones, inputs y outputs.</p>
      <div id="integralAuditResult"></div>
    </section>
  `;
}

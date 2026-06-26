export function renderDiagnosticoView() {
  return `
    <section class="aj-view-card">
      <p class="eyebrow">Diagnostico</p>
      <h2>Diagnostico fuerte</h2>
      <p>Revisa FFmpeg, carpetas, modulos criticos, package.json y recomendaciones antes de procesar.</p>
      <div class="aj-tags"><span>FFmpeg</span><span>Carpetas</span><span>Modulos</span><span>Package</span><span>Reintento</span></div>
      <div class="strong-diagnostic-actions">
        <button class="strong-diagnostic-button" type="button" data-diagnostic-action="strong">Ejecutar diagnostico fuerte</button>
      </div>
      <p id="strongDiagnosticStatus" class="mini-summary">El diagnostico se ejecuta al abrir esta pantalla.</p>
      <div id="strongDiagnosticResult"></div>
    </section>
  `;
}

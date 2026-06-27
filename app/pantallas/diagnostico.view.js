export function renderDiagnosticoView() {
  return `
    <section class="aj-view-card diagnostic-page">
      <p class="eyebrow">Diagnóstico</p>
      <h2>Diagnóstico fuerte y auditoría integral</h2>
      <p>Esta pantalla queda activa para revisar FFmpeg, carpetas, módulos críticos, Gemini, biblioteca, producción, resultado, audio, efectos y rutas.</p>
      <div class="aj-tags"><span>FFmpeg</span><span>Carpetas</span><span>Módulos</span><span>Gemini</span><span>Biblioteca</span><span>Producción</span><span>Resultado</span><span>Audio</span><span>Efectos</span><span>Reintento</span></div>
      <div class="strong-diagnostic-actions">
        <button class="strong-diagnostic-button" type="button" data-diagnostic-action="strong">Ejecutar diagnóstico fuerte</button>
        <button class="strong-diagnostic-button" type="button" data-diagnostic-action="audit">Auditoría integral</button>
      </div>
      <p id="strongDiagnosticStatus" class="mini-summary">Diagnóstico listo para ejecutar.</p>
      <div id="strongDiagnosticResult"></div>
      <p id="integralAuditStatus" class="mini-summary">La auditoría revisa variables, rutas, botones, inputs, outputs y módulos finales.</p>
      <div id="integralAuditResult"></div>
    </section>
  `;
}

export function renderDiagnosticoView() {
  return `
    <section class="aj-view-card diagnostic-page" data-diagnostico-root data-proceso-root="diagnostico" data-proceso-paso-activo="rapido">
      <section id="diagnosticoMessage" class="diagnostic-message" hidden></section>

      <section class="diagnostic-flow" aria-label="Navegación de diagnóstico">
        <button class="diagnostic-step is-active" type="button" data-diagnostico-wizard-go="rapido" data-proceso-step="rapido"><span><strong>Rápido</strong></span></button>
        <button class="diagnostic-step is-locked" type="button" data-diagnostico-wizard-go="fuerte" data-proceso-step="fuerte"><span><strong>Fuerte</strong></span></button>
        <button class="diagnostic-step is-locked" type="button" data-diagnostico-wizard-go="auditoria" data-proceso-step="auditoria"><span><strong>Auditoría</strong></span></button>
        <button class="diagnostic-step is-locked" type="button" data-diagnostico-wizard-go="final" data-proceso-step="final"><span><strong>Final</strong></span></button>
        <button class="diagnostic-step is-advanced" type="button" data-diagnostico-wizard-go="detalle" data-proceso-step="detalle-tecnico"><span><strong>Detalle</strong></span></button>
        <span class="aj-status-chip" id="diagnosticoStateChip">Listo para revisar</span>
      </section>

      <section class="diagnostic-wizard">
        <article class="diagnostic-wizard-panel is-active" data-diagnostico-wizard-panel="rapido">
          <div class="diagnostic-panel-heading"><h3>Resumen rápido</h3></div>
          <div class="diagnostic-tags"><span>FFmpeg</span><span>Carpetas</span><span>Módulos</span><span>Gemini</span><span>Biblioteca</span><span>Producción</span><span>Adaptación</span><span>Resultado</span><span>Audio</span><span>Efectos</span><span>Reintento</span><span>Bloque 18</span></div>
          <div class="diagnostic-start-grid">
            <article><strong>Diagnóstico fuerte</strong><span>Dependencias, rutas, package, FFmpeg y módulos.</span><button class="strong-diagnostic-button" type="button" data-diagnostico-wizard-go="fuerte">Ir al diagnóstico fuerte</button></article>
            <article><strong>Auditoría integral</strong><span>Variables, rutas, botones, inputs, outputs y conexión.</span><button class="strong-diagnostic-button" type="button" data-diagnostico-wizard-go="auditoria">Ir a auditoría</button></article>
            <article><strong>Cierre final</strong><span>Bloques del rediseño y flujo completo.</span><button class="strong-diagnostic-button is-final" type="button" data-diagnostico-wizard-go="final">Ir al cierre final</button></article>
          </div>
        </article>

        <article class="diagnostic-wizard-panel" data-diagnostico-wizard-panel="fuerte" hidden>
          <div class="diagnostic-panel-heading"><h3>Diagnóstico fuerte</h3></div>
          <div class="strong-diagnostic-actions">
            <button class="strong-diagnostic-button" type="button" data-diagnostic-action="strong">Ejecutar diagnóstico fuerte</button>
          </div>
          <p id="strongDiagnosticStatus" class="mini-summary">Diagnóstico listo para ejecutar.</p>
          <div id="strongDiagnosticResult"></div>
        </article>

        <article class="diagnostic-wizard-panel" data-diagnostico-wizard-panel="auditoria" hidden>
          <div class="diagnostic-panel-heading"><h3>Auditoría integral</h3></div>
          <div class="strong-diagnostic-actions">
            <button class="strong-diagnostic-button" type="button" data-diagnostic-action="audit">Auditoría integral</button>
          </div>
          <p id="integralAuditStatus" class="mini-summary">La auditoría revisa variables, rutas, botones, inputs, outputs y módulos finales.</p>
          <div id="integralAuditResult"></div>
        </article>

        <article class="diagnostic-wizard-panel" data-diagnostico-wizard-panel="final" hidden>
          <div class="diagnostic-panel-heading"><h3>Diagnóstico final del rediseño</h3></div>
          <div class="strong-diagnostic-actions">
            <button class="strong-diagnostic-button is-final" type="button" data-diagnostic-action="final-redisenio">Diagnóstico final rediseño</button>
          </div>
          <p id="finalRedesignDiagnosticStatus" class="mini-summary">El diagnóstico final revisa los bloques del rediseño por etapas.</p>
          <div id="finalRedesignDiagnosticResult"></div>
        </article>

        <article class="diagnostic-wizard-panel" data-diagnostico-wizard-panel="detalle" data-proceso-avanzado hidden>
          <div class="diagnostic-panel-heading"><h3>Detalle técnico</h3></div>
          <div class="diagnostic-detail-grid">
            <article><strong>Infraestructura</strong><span>FFmpeg, carpetas, rutas base, servidor local y package.</span></article>
            <article><strong>Flujo por etapas</strong><span>Entendimiento, biblioteca, plan, producción, adaptación y resultado.</span></article>
            <article><strong>UI conectada</strong><span>Botones, inputs, outputs, navegación y pantallas.</span></article>
            <article><strong>IA y fallback</strong><span>Gemini, fallback local, contexto editorial y pruebas.</span></article>
          </div>
        </article>
      </section>
    </section>
  `;
}

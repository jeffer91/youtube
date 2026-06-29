export function renderDiagnosticoView() {
  return `
    <section class="aj-view-card diagnostic-page" data-diagnostico-root data-proceso-root="diagnostico" data-proceso-paso-activo="rapido">
      <div class="diagnostic-hero">
        <div>
          <p class="eyebrow">Diagnóstico</p>
          <h2>Diagnóstico fuerte, auditoría integral y cierre por etapas</h2>
          <p>Revisa la salud de AutoVideoJeff por pasos: primero resumen rápido, luego diagnóstico fuerte, auditoría integral, diagnóstico final y detalle técnico.</p>
        </div>
        <span class="aj-status-chip" id="diagnosticoStateChip">Listo para revisar</span>
      </div>

      <div data-proceso-resumen="diagnostico"></div>

      <section class="diagnostic-flow" aria-label="Flujo guiado de diagnóstico">
        <button class="diagnostic-step is-active" type="button" data-diagnostico-wizard-go="rapido" data-proceso-step="rapido"><b>1</b><span><strong>Rápido</strong><small>Qué revisar</small></span></button>
        <button class="diagnostic-step is-locked" type="button" data-diagnostico-wizard-go="fuerte" data-proceso-step="fuerte"><b>2</b><span><strong>Fuerte</strong><small>FFmpeg / módulos</small></span></button>
        <button class="diagnostic-step is-locked" type="button" data-diagnostico-wizard-go="auditoria" data-proceso-step="auditoria"><b>3</b><span><strong>Auditoría</strong><small>Rutas / variables</small></span></button>
        <button class="diagnostic-step is-locked" type="button" data-diagnostico-wizard-go="final" data-proceso-step="final"><b>4</b><span><strong>Final</strong><small>Rediseño</small></span></button>
        <button class="diagnostic-step is-advanced" type="button" data-diagnostico-wizard-go="detalle" data-proceso-step="detalle-tecnico"><b>+</b><span><strong>Detalle</strong><small>Técnico</small></span></button>
      </section>

      <section id="diagnosticoMessage" class="diagnostic-message" hidden></section>

      <section class="diagnostic-wizard">
        <article class="diagnostic-wizard-panel is-active" data-diagnostico-wizard-panel="rapido">
          <div class="diagnostic-panel-heading">
            <p class="eyebrow">Paso 1</p>
            <h3>Resumen rápido de revisión</h3>
            <p>Esta pantalla revisa si la app está lista para trabajar sin romper rutas, módulos, botones, inputs, outputs ni etapas del rediseño.</p>
          </div>
          <div class="diagnostic-tags"><span>FFmpeg</span><span>Carpetas</span><span>Módulos</span><span>Gemini</span><span>Biblioteca</span><span>Producción</span><span>Adaptación</span><span>Resultado</span><span>Audio</span><span>Efectos</span><span>Reintento</span><span>Bloque 18</span></div>
          <div class="diagnostic-start-grid">
            <article><strong>Diagnóstico fuerte</strong><span>Revisa dependencias críticas, rutas, package, FFmpeg y módulos.</span><button class="strong-diagnostic-button" type="button" data-diagnostico-wizard-go="fuerte">Ir al diagnóstico fuerte</button></article>
            <article><strong>Auditoría integral</strong><span>Revisa variables, rutas, botones, inputs, outputs y conexión UI/backend.</span><button class="strong-diagnostic-button" type="button" data-diagnostico-wizard-go="auditoria">Ir a auditoría</button></article>
            <article><strong>Cierre final</strong><span>Revisa los bloques del rediseño y el flujo completo por etapas.</span><button class="strong-diagnostic-button is-final" type="button" data-diagnostico-wizard-go="final">Ir al cierre final</button></article>
          </div>
        </article>

        <article class="diagnostic-wizard-panel" data-diagnostico-wizard-panel="fuerte" hidden>
          <div class="diagnostic-panel-heading">
            <p class="eyebrow">Paso 2</p>
            <h3>Diagnóstico fuerte</h3>
            <p>Ejecuta una revisión fuerte del sistema antes de seguir editando o exportando.</p>
          </div>
          <div class="strong-diagnostic-actions">
            <button class="strong-diagnostic-button" type="button" data-diagnostic-action="strong">Ejecutar diagnóstico fuerte</button>
          </div>
          <p id="strongDiagnosticStatus" class="mini-summary">Diagnóstico listo para ejecutar.</p>
          <div id="strongDiagnosticResult"></div>
        </article>

        <article class="diagnostic-wizard-panel" data-diagnostico-wizard-panel="auditoria" hidden>
          <div class="diagnostic-panel-heading">
            <p class="eyebrow">Paso 3</p>
            <h3>Auditoría integral</h3>
            <p>Revisa la app como sistema: variables, rutas, botones, inputs, outputs y módulos finales.</p>
          </div>
          <div class="strong-diagnostic-actions">
            <button class="strong-diagnostic-button" type="button" data-diagnostic-action="audit">Auditoría integral</button>
          </div>
          <p id="integralAuditStatus" class="mini-summary">La auditoría revisa variables, rutas, botones, inputs, outputs y módulos finales.</p>
          <div id="integralAuditResult"></div>
        </article>

        <article class="diagnostic-wizard-panel" data-diagnostico-wizard-panel="final" hidden>
          <div class="diagnostic-panel-heading">
            <p class="eyebrow">Paso 4</p>
            <h3>Diagnóstico final del rediseño</h3>
            <p>Valida el cierre de bloques y el flujo por etapas antes de considerar estable la app.</p>
          </div>
          <div class="strong-diagnostic-actions">
            <button class="strong-diagnostic-button is-final" type="button" data-diagnostic-action="final-redisenio">Diagnóstico final rediseño</button>
          </div>
          <p id="finalRedesignDiagnosticStatus" class="mini-summary">El diagnóstico final revisa los 18 bloques del rediseño por etapas.</p>
          <div id="finalRedesignDiagnosticResult"></div>
        </article>

        <article class="diagnostic-wizard-panel" data-diagnostico-wizard-panel="detalle" data-proceso-avanzado hidden>
          <div class="diagnostic-panel-heading">
            <p class="eyebrow">Avanzado</p>
            <h3>Detalle técnico que revisa esta pantalla</h3>
            <p>Este paso solo organiza visualmente el alcance técnico. Los botones reales siguen en sus pasos correspondientes.</p>
          </div>
          <div class="diagnostic-detail-grid">
            <article><strong>Infraestructura</strong><span>FFmpeg, carpetas, rutas base, servidor local y package.</span></article>
            <article><strong>Flujo por etapas</strong><span>Entendimiento, biblioteca, plan, producción, adaptación y resultado.</span></article>
            <article><strong>UI conectada</strong><span>Botones, inputs, outputs, navegación, pantallas y paneles dinámicos.</span></article>
            <article><strong>IA y fallback</strong><span>Gemini, fallback local, contexto editorial y pruebas de conexión.</span></article>
          </div>
        </article>
      </section>
    </section>
  `;
}

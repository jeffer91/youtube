export function renderPlanEdicionView() {
  return `
    <section class="aj-view-card plan-view" data-plan-root data-proceso-root="plan-edicion" data-proceso-paso-activo="cargar-crear">
      <section id="planMensaje" class="plan-message" hidden></section>

      <section class="plan-flow" aria-label="Navegación de plan de edición">
        <button class="plan-step is-active" type="button" data-plan-wizard-go="cargar" data-proceso-step="cargar-crear"><span><strong>Cargar</strong></span></button>
        <button class="plan-step is-locked" type="button" data-plan-wizard-go="resumen" data-proceso-step="resumen"><span><strong>Resumen</strong></span></button>
        <button class="plan-step is-locked" type="button" data-plan-wizard-go="elementos" data-proceso-step="elementos"><span><strong>Elementos</strong></span></button>
        <button class="plan-step is-locked" type="button" data-plan-wizard-go="timeline" data-proceso-step="timeline"><span><strong>Timeline</strong></span></button>
        <button class="plan-step is-locked" type="button" data-plan-wizard-go="aprobar" data-proceso-step="aprobar"><span><strong>Aprobar</strong></span></button>
        <button class="plan-step is-locked" type="button" data-plan-wizard-go="producir" data-proceso-step="producir"><span><strong>Producir</strong></span></button>
        <button class="plan-step is-advanced" type="button" data-plan-wizard-go="avanzado" data-proceso-step="detalles-tecnicos"><span><strong>Avanzado</strong></span></button>
        <span class="aj-status-chip" id="planEstadoChip">Esperando proyecto</span>
      </section>

      <section class="plan-wizard">
        <article class="plan-wizard-panel is-active" data-plan-wizard-panel="cargar">
          <div class="plan-panel-heading">
            <h3>Cargar o crear plan</h3>
          </div>
          <div class="plan-toolbar">
            <label for="planProyectoId"><span>ID del proyecto</span><input id="planProyectoId" type="text" placeholder="Pega aquí el proyectoId" autocomplete="off" /></label>
            <button id="planCargarBtn" class="secondary-button" type="button">Cargar plan</button>
            <button id="planProcesarBtn" class="primary-button" type="button">Crear plan</button>
          </div>
        </article>

        <article class="plan-wizard-panel" data-plan-wizard-panel="resumen" hidden>
          <div class="plan-panel-heading">
            <h3>Resumen ejecutivo</h3>
          </div>
          <section class="plan-kpis" aria-label="Resumen del plan de edición">
            <article><span>Elementos</span><strong id="planTotalElementos">-</strong></article>
            <article><span>Subtítulos</span><strong id="planSubtitulos">-</strong></article>
            <article><span>Textos</span><strong id="planTextos">-</strong></article>
            <article><span>Recursos</span><strong id="planRecursos">-</strong></article>
            <article><span>Biblioteca</span><strong id="planBiblioteca">-</strong></article>
            <article><span>Contexto IA</span><strong id="planContexto">-</strong></article>
            <article><span>Partes IA</span><strong id="planPartes">-</strong></article>
            <article><span>Efectos visuales</span><strong id="planEfectosVisuales">-</strong></article>
            <article><span>Animaciones</span><strong id="planAnimaciones">-</strong></article>
            <article><span>Tipo subtítulos</span><strong id="planTipoSubtitulos">-</strong></article>
            <article><span>Efectos audio</span><strong id="planEfectosAudio">-</strong></article>
            <article><span>Música fondo</span><strong id="planMusicaFondo">-</strong></article>
            <article><span>Editor</span><strong id="planEditor">-</strong></article>
            <article><span>Listo</span><strong id="planListo">-</strong></article>
          </section>
          <article class="plan-panel plan-panel--lectura"><header><div><h3>Resumen ejecutivo</h3></div><span id="planLecturaEstado">0</span></header><div id="planLectura" class="plan-reading"><div class="plan-empty">Carga o crea el plan.</div></div></article>
        </article>

        <article class="plan-wizard-panel" data-plan-wizard-panel="elementos" hidden>
          <header class="plan-panel-header"><div><h3>Elementos importantes</h3></div><span id="planElementosEstado">0</span></header>
          <div id="planElementos" class="plan-elements"><div class="plan-empty">Sin elementos cargados.</div></div>
        </article>

        <article class="plan-wizard-panel" data-plan-wizard-panel="timeline" hidden>
          <header class="plan-panel-header"><div><h3>Timeline</h3></div><span id="planTimelineEstado">0</span></header>
          <div id="planTimeline" class="plan-timeline"><div class="plan-empty">Sin línea de tiempo.</div></div>
        </article>

        <article class="plan-wizard-panel" data-plan-wizard-panel="aprobar" hidden>
          <header class="plan-panel-header"><div><h3>Aprobar plan</h3></div><span id="planEditorEstado">Pendiente</span></header>
          <div id="planEditorDetalle" class="plan-source"><div class="plan-empty">Sin JSON técnico para editar.</div></div>
          <div class="plan-actions plan-approval-actions">
            <button id="planAprobarBtn" class="secondary-button" type="button" disabled>Aprobar plan</button>
          </div>
        </article>

        <article class="plan-wizard-panel" data-plan-wizard-panel="producir" hidden>
          <section id="planProduccionProgreso" class="plan-production-progress" hidden>
            <div class="plan-production-progress__top">
              <div>
                <h3 id="planProduccionTitulo">Preparando producción</h3>
                <p id="planProduccionTexto">El motor está preparando la edición real.</p>
              </div>
              <strong id="planProduccionPorcentaje">0%</strong>
            </div>
            <div class="plan-production-bar" aria-label="Progreso de producción"><div id="planProduccionBarra" style="width:0%"></div></div>
            <ol id="planProduccionHistorial" class="plan-production-history"></ol>
          </section>
          <footer class="plan-footer" id="planFooterProduccion">
            <div><strong>Producción real</strong><span id="planProduccionEstadoTexto">Disponible cuando el plan esté aprobado.</span></div>
            <button id="planProducirBtn" class="primary-button plan-produce-button" type="button" disabled>Producir video maestro</button>
          </footer>
        </article>

        <article class="plan-wizard-panel" data-plan-wizard-panel="avanzado" data-proceso-avanzado hidden>
          <div class="plan-panel-heading">
            <h3>Fuente, contexto IA y plan por partes</h3>
          </div>
          <div class="plan-advanced-grid">
            <article class="plan-panel plan-panel--fuente"><header><div><h3>Desde entendimiento y biblioteca</h3></div><span id="planFuenteEstado">Sin datos</span></header><div id="planFuente" class="plan-source"><div class="plan-empty">Sin fuente cargada.</div></div></article>
            <article class="plan-panel plan-panel--contexto"><header><div><h3>Información absorbida</h3></div><span id="planContextoEstado">Sin datos</span></header><div id="planContextoDetalle" class="plan-source"><div class="plan-empty">Sin contexto construido.</div></div></article>
            <article class="plan-panel plan-panel--partes"><header><div><h3>Secciones generadas y validadas</h3></div><span id="planPartesEstado">0/0</span></header><div id="planPartesDetalle" class="plan-source"><div class="plan-empty">Sin partes generadas.</div></div></article>
          </div>
        </article>
      </section>
    </section>
  `;
}

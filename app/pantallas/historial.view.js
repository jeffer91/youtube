export function renderHistorialView() {
  return `
    <section class="aj-view-card history-page" data-history-root data-proceso-root="historial" data-proceso-paso-activo="cargar">
      <section id="historyProjectsMessage" class="history-message" hidden></section>

      <section class="history-flow" aria-label="Navegación de historial">
        <button class="history-step is-active" type="button" data-history-wizard-go="cargar" data-proceso-step="cargar"><span><strong>Cargar</strong></span></button>
        <button class="history-step is-locked" type="button" data-history-wizard-go="revisar" data-proceso-step="revisar"><span><strong>Revisar</strong></span></button>
        <button class="history-step is-locked" type="button" data-history-wizard-go="buscar" data-proceso-step="buscar"><span><strong>Buscar</strong></span></button>
        <button class="history-step is-locked" type="button" data-history-wizard-go="reabrir" data-proceso-step="reabrir"><span><strong>Reabrir</strong></span></button>
        <button class="history-step is-advanced" type="button" data-history-wizard-go="metadata" data-proceso-step="metadata"><span><strong>Avanzado</strong></span></button>
        <span class="aj-status-chip" id="historyStateChip">Pendiente</span>
      </section>

      <section class="history-wizard">
        <article class="history-wizard-panel is-active" data-history-wizard-panel="cargar">
          <div class="history-panel-heading"><h3>Cargar historial local</h3></div>
          <div class="history-toolbar">
            <p id="historyProjectsSummary">Historial pendiente de carga.</p>
            <button class="history-reload" type="button" data-history-action="reload">Actualizar historial</button>
          </div>
          <p id="historyProjectsStatus" class="mini-summary">Abre esta pantalla o presiona actualizar para cargar datos.</p>
        </article>

        <article class="history-wizard-panel" data-history-wizard-panel="revisar" hidden>
          <div class="history-panel-heading"><h3>Proyectos recientes</h3></div>
          <div id="historyProjectsList" class="history-projects-list"></div>
        </article>

        <article class="history-wizard-panel" data-history-wizard-panel="buscar" hidden>
          <div class="history-panel-heading"><h3>Buscar o filtrar</h3></div>
          <div class="history-filter-panel">
            <label for="historySearchInput"><span>Buscar</span><input id="historySearchInput" type="search" placeholder="Nombre, ID, perfil o plataforma" autocomplete="off" /></label>
            <label for="historyStateFilter"><span>Estado</span><select id="historyStateFilter"><option value="">Todos</option><option value="activo">Activo</option><option value="FINALIZADO">Finalizado</option><option value="error">Error</option></select></label>
            <label for="historyProfileFilter"><span>Perfil</span><select id="historyProfileFilter"><option value="">Todos los perfiles</option></select></label>
            <button class="history-reload is-muted" type="button" data-history-action="clear-filters">Limpiar filtros</button>
          </div>
          <p id="historyFilterSummary" class="mini-summary">Sin filtros aplicados.</p>
          <div id="historyFilteredList" class="history-projects-list"></div>
        </article>

        <article class="history-wizard-panel" data-history-wizard-panel="reabrir" hidden>
          <div class="history-panel-heading"><h3>Reabrir proyecto</h3></div>
          <div id="historySelectedProject" class="history-selected-project"><div class="history-empty">Selecciona un proyecto desde Revisar o Buscar.</div></div>
          <div class="history-actions">
            <button id="historyReopenBtn" class="history-reload" type="button" data-history-action="reopen" disabled>Reabrir en Entendimiento</button>
            <button class="history-reload is-muted" type="button" data-history-wizard-go="revisar">Volver a revisar</button>
          </div>
        </article>

        <article class="history-wizard-panel" data-history-wizard-panel="metadata" data-proceso-avanzado hidden>
          <div class="history-panel-heading"><h3>Metadata técnica</h3></div>
          <div id="historyMetadataPanel" class="history-metadata"><div class="history-empty">Carga el historial para ver metadata.</div></div>
        </article>
      </section>
    </section>
  `;
}

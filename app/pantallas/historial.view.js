export function renderHistorialView() {
  return `
    <section class="aj-view-card history-page" data-history-root data-proceso-root="historial" data-proceso-paso-activo="cargar">
      <div class="history-hero">
        <div>
          <p class="eyebrow">Historial</p>
          <h2>Proyectos recientes</h2>
          <p>Consulta, filtra y reabre proyectos guardados localmente sin mostrar toda la información al mismo tiempo.</p>
        </div>
        <span class="aj-status-chip" id="historyStateChip">Pendiente</span>
      </div>

      <div data-proceso-resumen="historial"></div>

      <section class="history-flow" aria-label="Flujo guiado de historial">
        <button class="history-step is-active" type="button" data-history-wizard-go="cargar" data-proceso-step="cargar"><b>1</b><span><strong>Cargar</strong><small>Leer historial</small></span></button>
        <button class="history-step is-locked" type="button" data-history-wizard-go="revisar" data-proceso-step="revisar"><b>2</b><span><strong>Revisar</strong><small>Proyectos recientes</small></span></button>
        <button class="history-step is-locked" type="button" data-history-wizard-go="buscar" data-proceso-step="buscar"><b>3</b><span><strong>Buscar</strong><small>Filtrar historial</small></span></button>
        <button class="history-step is-locked" type="button" data-history-wizard-go="reabrir" data-proceso-step="reabrir"><b>4</b><span><strong>Reabrir</strong><small>Continuar flujo</small></span></button>
        <button class="history-step is-advanced" type="button" data-history-wizard-go="metadata" data-proceso-step="metadata"><b>+</b><span><strong>Avanzado</strong><small>Metadata técnica</small></span></button>
      </section>

      <section id="historyProjectsMessage" class="history-message" hidden></section>

      <section class="history-wizard">
        <article class="history-wizard-panel is-active" data-history-wizard-panel="cargar">
          <div class="history-panel-heading">
            <p class="eyebrow">Paso 1</p>
            <h3>Cargar historial local</h3>
            <p>Primero lee los proyectos guardados. Después podrás revisarlos, filtrarlos o reabrir uno.</p>
          </div>
          <div class="history-toolbar">
            <p id="historyProjectsSummary">Historial pendiente de carga.</p>
            <button class="history-reload" type="button" data-history-action="reload">Actualizar historial</button>
          </div>
          <p id="historyProjectsStatus" class="mini-summary">Abre esta pantalla o presiona actualizar para cargar datos.</p>
        </article>

        <article class="history-wizard-panel" data-history-wizard-panel="revisar" hidden>
          <div class="history-panel-heading">
            <p class="eyebrow">Paso 2</p>
            <h3>Revisar proyectos recientes</h3>
            <p>Selecciona un proyecto para ver el paso de reapertura.</p>
          </div>
          <div id="historyProjectsList" class="history-projects-list"></div>
        </article>

        <article class="history-wizard-panel" data-history-wizard-panel="buscar" hidden>
          <div class="history-panel-heading">
            <p class="eyebrow">Paso 3</p>
            <h3>Buscar o filtrar historial</h3>
            <p>Usa filtros solo cuando el historial sea grande. La lista se actualiza sin cambiar los datos guardados.</p>
          </div>
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
          <div class="history-panel-heading">
            <p class="eyebrow">Paso 4</p>
            <h3>Reabrir proyecto</h3>
            <p>Confirma el proyecto seleccionado y vuelve al flujo por etapas.</p>
          </div>
          <div id="historySelectedProject" class="history-selected-project"><div class="history-empty">Selecciona un proyecto desde Revisar o Buscar.</div></div>
          <div class="history-actions">
            <button id="historyReopenBtn" class="history-reload" type="button" data-history-action="reopen" disabled>Reabrir en Entendimiento</button>
            <button class="history-reload is-muted" type="button" data-history-wizard-go="revisar">Volver a revisar</button>
          </div>
        </article>

        <article class="history-wizard-panel" data-history-wizard-panel="metadata" data-proceso-avanzado hidden>
          <div class="history-panel-heading">
            <p class="eyebrow">Avanzado</p>
            <h3>Metadata técnica del historial</h3>
            <p>Resumen técnico para verificar estados, perfiles, plataformas y errores sin saturar la vista principal.</p>
          </div>
          <div id="historyMetadataPanel" class="history-metadata"><div class="history-empty">Carga el historial para ver metadata.</div></div>
        </article>
      </section>
    </section>
  `;
}

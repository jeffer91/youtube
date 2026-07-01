export function renderProduccionView() {
  return `
    <section class="aj-view-card produccion-maestro-view" data-produccion-maestro-root data-proceso-root="produccion-maestro" data-proceso-paso-activo="cargar-producir">
      <section id="produccionMaestroMensaje" class="produccion-maestro-message" hidden></section>

      <section class="produccion-maestro-flow" aria-label="Navegación de producción maestro">
        <button class="produccion-maestro-step is-active" type="button" data-produccion-wizard-go="cargar" data-proceso-step="cargar-producir"><span><strong>Cargar</strong></span></button>
        <button class="produccion-maestro-step is-locked" type="button" data-produccion-wizard-go="preview" data-proceso-step="preview"><span><strong>Preview</strong></span></button>
        <button class="produccion-maestro-step is-locked" type="button" data-produccion-wizard-go="comparacion" data-proceso-step="comparacion"><span><strong>Antes/después</strong></span></button>
        <button class="produccion-maestro-step is-locked" type="button" data-produccion-wizard-go="problemas" data-proceso-step="problemas"><span><strong>Problemas</strong></span></button>
        <button class="produccion-maestro-step is-locked" type="button" data-produccion-wizard-go="adaptacion" data-proceso-step="adaptacion"><span><strong>Adaptación</strong></span></button>
        <button class="produccion-maestro-step is-advanced" type="button" data-produccion-wizard-go="avanzado" data-proceso-step="timeline-auditoria"><span><strong>Avanzado</strong></span></button>
        <span class="aj-status-chip" id="produccionMaestroEstadoChip">Esperando proyecto</span>
      </section>

      <section class="produccion-maestro-wizard">
        <article class="produccion-maestro-wizard-panel is-active" data-produccion-wizard-panel="cargar">
          <div class="produccion-maestro-panel-heading">
            <h3>Cargar o producir video maestro</h3>
          </div>
          <div class="produccion-maestro-toolbar">
            <label for="produccionMaestroProyectoId">
              <span>ID del proyecto</span>
              <input id="produccionMaestroProyectoId" type="text" placeholder="Pega aquí el proyectoId" autocomplete="off" />
            </label>
            <button id="produccionMaestroCargarBtn" class="secondary-button" type="button">Cargar producción</button>
            <button id="produccionMaestroProcesarBtn" class="primary-button" type="button">Producir video maestro</button>
          </div>

          <section class="produccion-maestro-kpis" aria-label="Resumen de producción maestro">
            <article><span>Video maestro</span><strong id="produccionMaestroNombre">—</strong></article>
            <article><span>Peso</span><strong id="produccionMaestroPeso">—</strong></article>
            <article><span>Modo</span><strong id="produccionMaestroModo">—</strong></article>
            <article><span>Plataforma base</span><strong id="produccionMaestroPlataforma">—</strong></article>
            <article><span>Elementos plan</span><strong id="produccionMaestroElementos">—</strong></article>
            <article><span>Marcadores</span><strong id="produccionMaestroMarcadores">—</strong></article>
            <article><span>Globales</span><strong id="produccionMaestroGlobales">—</strong></article>
            <article><span>Cortes</span><strong id="produccionMaestroCortes">—</strong></article>
            <article><span>Zooms</span><strong id="produccionMaestroZooms">—</strong></article>
            <article><span>Efectos</span><strong id="produccionMaestroEfectos">—</strong></article>
            <article><span>Animaciones</span><strong id="produccionMaestroAnimaciones">—</strong></article>
            <article><span>Transiciones</span><strong id="produccionMaestroTransiciones">—</strong></article>
            <article><span>Audio / SFX</span><strong id="produccionMaestroAudioSfx">—</strong></article>
            <article><span>Listo adaptación</span><strong id="produccionMaestroListo">—</strong></article>
          </section>
        </article>

        <article class="produccion-maestro-wizard-panel" data-produccion-wizard-panel="preview" hidden>
          <article class="produccion-maestro-panel produccion-maestro-panel--preview">
            <header><div><h3>Preview del video maestro</h3></div><span id="produccionMaestroPreviewEstado">Sin video</span></header>
            <video id="produccionMaestroVideo" class="produccion-maestro-video" controls playsinline></video>
            <div class="produccion-maestro-actions-row">
              <a id="produccionMaestroDescarga" class="secondary-button" href="#" hidden>Descargar maestro</a>
            </div>
          </article>
        </article>

        <article class="produccion-maestro-wizard-panel" data-produccion-wizard-panel="comparacion" hidden>
          <article class="produccion-maestro-panel produccion-maestro-panel--compare">
            <header><div><h3>Antes / después</h3></div><span id="produccionMaestroComparacionEstado">Pendiente</span></header>
            <div class="produccion-maestro-compare">
              <article><strong>Antes</strong><video id="produccionMaestroAntes" controls playsinline></video></article>
              <article><strong>Después</strong><video id="produccionMaestroDespues" controls playsinline></video></article>
            </div>
          </article>
        </article>

        <article class="produccion-maestro-wizard-panel" data-produccion-wizard-panel="problemas" hidden>
          <article class="produccion-maestro-panel produccion-maestro-panel--audit">
            <header><div><h3>Auditoría rápida</h3></div><span id="produccionMaestroAuditoriaEstado">Sin datos</span></header>
            <div id="produccionMaestroAuditoria" class="produccion-maestro-audit"><div class="produccion-maestro-empty">Sin auditoría cargada.</div></div>
          </article>
        </article>

        <article class="produccion-maestro-wizard-panel" data-produccion-wizard-panel="adaptacion" hidden>
          <footer class="produccion-maestro-footer">
            <div>
              <strong>Pasar a Adaptación</strong>
              <span>Genera versiones para plataformas.</span>
            </div>
            <button id="produccionMaestroAdaptarBtn" class="primary-button" type="button" disabled>Adaptar a plataformas</button>
          </footer>
        </article>

        <article class="produccion-maestro-wizard-panel" data-produccion-wizard-panel="avanzado" data-proceso-avanzado hidden>
          <div class="produccion-maestro-panel-heading">
            <h3>Timeline editorial, filtros y detalle profesional</h3>
          </div>

          <article class="produccion-maestro-panel produccion-maestro-panel--timeline">
            <header><div><h3>Marcadores aplicados y planificados</h3></div><span id="produccionMaestroTimelineEstado">0</span></header>
            <div id="produccionMaestroTimelineResumen" class="produccion-maestro-timeline-summary"><div class="produccion-maestro-empty">Sin resumen de timeline.</div></div>
            <div class="produccion-maestro-timeline-controls" aria-label="Filtros de timeline editorial">
              <label for="produccionMaestroFiltroPista"><span>Pista</span><select id="produccionMaestroFiltroPista"><option value="todas">Todas</option><option value="global">Global</option><option value="cortes">Cortes</option><option value="subtitulos">Subtítulos</option><option value="textos">Textos</option><option value="zooms">Zooms</option><option value="efectos">Efectos</option><option value="animaciones">Animaciones</option><option value="transiciones">Transiciones</option><option value="audio-sfx">Audio / SFX</option><option value="recursos">Recursos</option><option value="diagnostico">Diagnóstico</option></select></label>
              <label for="produccionMaestroFiltroEstado"><span>Estado</span><select id="produccionMaestroFiltroEstado"><option value="todos">Todos</option><option value="aplicado">Aplicados</option><option value="planificado">Planificados</option><option value="omitido">Omitidos</option><option value="fallback">Fallback</option><option value="revision">Revisión</option></select></label>
              <label for="produccionMaestroBuscarMarcador"><span>Buscar</span><input id="produccionMaestroBuscarMarcador" type="search" placeholder="zoom, hit, global..." autocomplete="off" /></label>
              <button id="produccionMaestroLimpiarFiltrosBtn" class="secondary-button" type="button">Limpiar filtros</button>
            </div>
            <p id="produccionMaestroFiltroResumen" class="produccion-maestro-filter-summary">Sin filtros aplicados.</p>
            <div id="produccionMaestroTimelineLeyenda" class="produccion-maestro-timeline-legend"></div>
            <div id="produccionMaestroTimeline" class="produccion-maestro-timeline"><div class="produccion-maestro-empty">Sin timeline cargado.</div></div>
            <div id="produccionMaestroMarcadorSeleccionado" class="produccion-maestro-marker-detail"><div class="produccion-maestro-empty">Selecciona un marcador para ver su detalle.</div></div>
          </article>

          <section class="produccion-maestro-panel produccion-maestro-panel--details">
            <header><div><h3>Plan usado, edición, marcadores y salida</h3></div><span id="produccionMaestroDetalleEstado">0</span></header>
            <div id="produccionMaestroDetalle" class="produccion-maestro-detail"><div class="produccion-maestro-empty">Carga una producción para ver el detalle.</div></div>
          </section>
        </article>
      </section>

      <section class="production-legacy-hooks" aria-hidden="true" hidden>
        <input id="productionProjectIdInput" type="text" tabindex="-1" />
        <button data-production-action="reload" type="button" tabindex="-1">Cargar plan</button>
        <button data-production-action="save" type="button" tabindex="-1">Guardar cambios</button>
        <section id="productionPreviewPanel" hidden><video id="productionBeforeVideo"></video><video id="productionAfterVideo"></video></section>
        <p id="productionReviewSummary"></p>
        <p id="productionReviewStatus"></p>
        <small id="productionTimelineDuration"></small>
        <div id="productionTimeline"></div>
        <div id="productionReviewList"></div>
      </section>
    </section>
  `;
}

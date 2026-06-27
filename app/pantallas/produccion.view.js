export function renderProduccionView() {
  return `
    <section class="aj-view-card produccion-maestro-view" data-produccion-maestro-root>
      <div class="produccion-maestro-hero">
        <div>
          <p class="eyebrow">Etapa 3</p>
          <h2>Producción maestro</h2>
          <p>Genera y revisa el video maestro antes de adaptar a plataformas. Esta pantalla lee la producción real creada desde el entendimiento y el plan de edición.</p>
        </div>
        <span class="aj-status-chip" id="produccionMaestroEstadoChip">Esperando proyecto</span>
      </div>

      <div class="produccion-maestro-toolbar">
        <label for="produccionMaestroProyectoId">
          <span>ID del proyecto</span>
          <input id="produccionMaestroProyectoId" type="text" placeholder="Pega aquí el proyectoId" autocomplete="off" />
        </label>
        <button id="produccionMaestroCargarBtn" class="secondary-button" type="button">Cargar producción</button>
        <button id="produccionMaestroProcesarBtn" class="primary-button" type="button">Producir video maestro</button>
      </div>

      <section id="produccionMaestroMensaje" class="produccion-maestro-message" hidden></section>

      <section class="produccion-maestro-kpis" aria-label="Resumen de producción maestro">
        <article><span>Video maestro</span><strong id="produccionMaestroNombre">—</strong></article>
        <article><span>Peso</span><strong id="produccionMaestroPeso">—</strong></article>
        <article><span>Modo</span><strong id="produccionMaestroModo">—</strong></article>
        <article><span>Plataforma base</span><strong id="produccionMaestroPlataforma">—</strong></article>
        <article><span>Elementos plan</span><strong id="produccionMaestroElementos">—</strong></article>
        <article><span>Listo adaptación</span><strong id="produccionMaestroListo">—</strong></article>
      </section>

      <section class="produccion-maestro-grid">
        <article class="produccion-maestro-panel produccion-maestro-panel--preview">
          <header><div><p class="eyebrow">Preview</p><h3>Video maestro exportado</h3></div><span id="produccionMaestroPreviewEstado">Sin video</span></header>
          <video id="produccionMaestroVideo" class="produccion-maestro-video" controls playsinline></video>
          <div class="produccion-maestro-actions-row">
            <a id="produccionMaestroDescarga" class="secondary-button" href="#" hidden>Descargar maestro</a>
            <button id="produccionMaestroAdaptarBtn" class="primary-button" type="button" disabled>Adaptar a plataformas</button>
          </div>
        </article>

        <article class="produccion-maestro-panel produccion-maestro-panel--compare">
          <header><div><p class="eyebrow">Antes / después</p><h3>Control visual rápido</h3></div><span id="produccionMaestroComparacionEstado">Pendiente</span></header>
          <div class="produccion-maestro-compare">
            <article><strong>Antes</strong><video id="produccionMaestroAntes" controls playsinline></video></article>
            <article><strong>Después</strong><video id="produccionMaestroDespues" controls playsinline></video></article>
          </div>
        </article>

        <article class="produccion-maestro-panel produccion-maestro-panel--timeline">
          <header><div><p class="eyebrow">Timeline</p><h3>Elementos usados del plan</h3></div><span id="produccionMaestroTimelineEstado">0</span></header>
          <div id="produccionMaestroTimeline" class="produccion-maestro-timeline"><div class="produccion-maestro-empty">Sin timeline cargado.</div></div>
        </article>

        <article class="produccion-maestro-panel produccion-maestro-panel--audit">
          <header><div><p class="eyebrow">Auditoría</p><h3>Qué se aplicó</h3></div><span id="produccionMaestroAuditoriaEstado">Sin datos</span></header>
          <div id="produccionMaestroAuditoria" class="produccion-maestro-audit"><div class="produccion-maestro-empty">Sin auditoría cargada.</div></div>
        </article>
      </section>

      <section class="produccion-maestro-panel produccion-maestro-panel--details">
        <header><div><p class="eyebrow">Detalle profesional</p><h3>Plan usado, edición y salida</h3></div><span id="produccionMaestroDetalleEstado">0</span></header>
        <div id="produccionMaestroDetalle" class="produccion-maestro-detail"><div class="produccion-maestro-empty">Carga una producción para ver el detalle.</div></div>
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

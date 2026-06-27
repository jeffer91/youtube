export function renderProduccionView() {
  return `
    <section class="aj-view-card production-page">
      <p class="eyebrow">Producción</p>
      <h2>Línea de tiempo de edición</h2>
      <p>Revisa el antes/después, textos, títulos, imágenes, animaciones, efectos y audio antes del resultado final.</p>

      <div class="production-toolbar">
        <label for="productionProjectIdInput">
          <span>ID de proyecto opcional</span>
          <input id="productionProjectIdInput" type="text" placeholder="Pega el id del proyecto" />
        </label>
        <div class="production-toolbar-actions">
          <button class="production-reload" type="button" data-production-action="reload">Cargar plan</button>
          <button class="production-save" type="button" data-production-action="save">Guardar cambios</button>
        </div>
      </div>

      <section id="productionPreviewPanel" class="production-preview-panel" hidden>
        <div>
          <p class="eyebrow">Antes y después</p>
          <h3>Comparación del último render</h3>
        </div>
        <div class="production-preview-grid">
          <article><strong>Antes</strong><video id="productionBeforeVideo" controls playsinline></video></article>
          <article><strong>Después</strong><video id="productionAfterVideo" controls playsinline></video></article>
        </div>
      </section>

      <p id="productionReviewSummary" class="mini-summary">Plan pendiente de carga.</p>
      <p id="productionReviewStatus" class="mini-summary">Abre esta pantalla o presiona cargar para revisar el último plan.</p>

      <section class="production-timeline-shell">
        <div class="production-timeline-header">
          <div>
            <p class="eyebrow">Timeline</p>
            <h3>Elementos editables</h3>
          </div>
          <small id="productionTimelineDuration">Duración: pendiente</small>
        </div>
        <div id="productionTimeline" class="production-timeline"></div>
      </section>

      <section class="production-review-shell">
        <div class="production-review-header">
          <div>
            <p class="eyebrow">Detalle</p>
            <h3>Activar, eliminar, cambiar o reemplazar</h3>
          </div>
        </div>
        <div id="productionReviewList" class="production-review-list"></div>
      </section>
    </section>
  `;
}

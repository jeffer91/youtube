export function renderProduccionView() {
  return `
    <section class="aj-view-card">
      <p class="eyebrow">Produccion</p>
      <h2>Revision del plan</h2>
      <p>Consulta y marca los elementos generados antes del resultado final.</p>
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
      <p id="productionReviewSummary" class="mini-summary">Plan pendiente de carga.</p>
      <p id="productionReviewStatus" class="mini-summary">Abre esta pantalla o presiona cargar para revisar el ultimo plan.</p>
      <div id="productionReviewList" class="production-review-list"></div>
    </section>
  `;
}

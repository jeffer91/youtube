export function renderProduccionView() {
  return `
    <section class="aj-view-card">
      <p class="eyebrow">Produccion</p>
      <h2>Revision del plan</h2>
      <p>Consulta los elementos generados para el video antes del resultado final.</p>
      <div class="production-toolbar">
        <label for="productionProjectIdInput">
          <span>ID de proyecto opcional</span>
          <input id="productionProjectIdInput" type="text" placeholder="Pega el id del proyecto" />
        </label>
        <button class="production-reload" type="button" data-production-action="reload">Cargar plan</button>
      </div>
      <p id="productionReviewSummary" class="mini-summary">Plan pendiente de carga.</p>
      <p id="productionReviewStatus" class="mini-summary">Abre esta pantalla o presiona cargar para revisar el ultimo plan.</p>
      <div id="productionReviewList" class="production-review-list"></div>
    </section>
  `;
}

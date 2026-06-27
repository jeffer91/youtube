export function renderResultadoView() {
  return `
    <section class="aj-view-card result-final-page" data-resultado-final-root>
      <div class="result-final-hero">
        <div>
          <p class="eyebrow">Etapa 5</p>
          <h2>Resultado final y paquete de publicación</h2>
          <p>Consolida video maestro, versiones por plataforma, checklist, recomendaciones y entregables finales del proyecto.</p>
        </div>
        <span class="aj-status-chip" id="resultadoFinalEstadoChip">Esperando proyecto</span>
      </div>

      <div class="result-final-toolbar">
        <label for="resultadoFinalProyectoId">
          <span>ID del proyecto</span>
          <input id="resultadoFinalProyectoId" type="text" placeholder="Pega aquí el proyectoId" autocomplete="off" />
        </label>
        <button id="resultadoFinalCargarBtn" class="secondary-button" type="button" data-result-action="reload">Cargar resultado</button>
        <button id="resultadoFinalGenerarBtn" class="primary-button" type="button" data-result-action="generate">Generar resultado final</button>
      </div>

      <section id="resultadoFinalMensaje" class="result-final-message" hidden></section>
      <p id="resultadoFinalStatus" class="mini-summary">Resultado pendiente de carga.</p>

      <section class="result-final-kpis" aria-label="Resumen del resultado final">
        <article><span>Plataformas</span><strong id="resultadoFinalPlataformas">—</strong></article>
        <article><span>Elementos plan</span><strong id="resultadoFinalElementos">—</strong></article>
        <article><span>Efectos</span><strong id="resultadoFinalEfectos">—</strong></article>
        <article><span>Textos</span><strong id="resultadoFinalTextos">—</strong></article>
        <article><span>Peso total</span><strong id="resultadoFinalPeso">—</strong></article>
        <article><span>Listo publicar</span><strong id="resultadoFinalListo">—</strong></article>
      </section>

      <section class="result-final-layout">
        <article class="result-final-panel result-final-panel--video">
          <header><div><p class="eyebrow">Maestro</p><h3>Video maestro</h3></div><span id="resultadoFinalVideoEstado">Sin video</span></header>
          <video id="resultadoFinalVideo" class="result-final-video" controls playsinline hidden></video>
          <div id="resultadoFinalVideoInfo" class="result-final-info"><div class="result-final-empty">Carga o genera el resultado final.</div></div>
        </article>

        <article class="result-final-panel result-final-panel--checklist">
          <header><div><p class="eyebrow">Checklist</p><h3>Control final</h3></div><span id="resultadoFinalChecklistEstado">0</span></header>
          <div id="resultadoFinalChecklist" class="result-final-checklist"><div class="result-final-empty">Sin checklist.</div></div>
        </article>

        <article class="result-final-panel result-final-panel--platforms">
          <header><div><p class="eyebrow">Publicación</p><h3>Versiones por plataforma</h3></div><span id="resultadoFinalVersionesEstado">0</span></header>
          <div id="resultadoFinalVersiones" class="result-final-platforms"><div class="result-final-empty">Sin versiones por plataforma.</div></div>
        </article>

        <article class="result-final-panel result-final-panel--report">
          <header><div><p class="eyebrow">Reporte</p><h3>Recomendaciones y entregables</h3></div><span id="resultadoFinalReporteEstado">0</span></header>
          <div id="resultadoFinalContent" class="result-final-content"><div class="result-final-empty">No hay reporte final todavía.</div></div>
        </article>
      </section>
    </section>
  `;
}

export function renderResultadoView() {
  return `
    <section class="aj-view-card result-final-page" data-resultado-final-root data-proceso-root="resultado-final" data-proceso-paso-activo="cargar-generar">
      <div class="result-final-hero">
        <div>
          <p class="eyebrow">Etapa 5</p>
          <h2>Resultado final y paquete de publicación</h2>
          <p>Consolida video maestro, versiones por plataforma, checklist, recomendaciones y entregables finales por pasos para cerrar sin saturación.</p>
        </div>
        <span class="aj-status-chip" id="resultadoFinalEstadoChip">Esperando proyecto</span>
      </div>

      <div data-proceso-resumen="resultado-final"></div>

      <section class="result-final-flow" aria-label="Flujo guiado de resultado final">
        <button class="result-final-step is-active" type="button" data-resultado-wizard-go="cargar" data-proceso-step="cargar-generar"><b>1</b><span><strong>Cargar</strong><small>Generar resultado</small></span></button>
        <button class="result-final-step is-locked" type="button" data-resultado-wizard-go="maestro" data-proceso-step="maestro"><b>2</b><span><strong>Maestro</strong><small>Video base</small></span></button>
        <button class="result-final-step is-locked" type="button" data-resultado-wizard-go="versiones" data-proceso-step="versiones"><b>3</b><span><strong>Versiones</strong><small>Plataformas</small></span></button>
        <button class="result-final-step is-locked" type="button" data-resultado-wizard-go="checklist" data-proceso-step="checklist"><b>4</b><span><strong>Checklist</strong><small>Control final</small></span></button>
        <button class="result-final-step is-locked" type="button" data-resultado-wizard-go="reporte" data-proceso-step="reporte"><b>5</b><span><strong>Reporte</strong><small>Entregables</small></span></button>
      </section>

      <section id="resultadoFinalMensaje" class="result-final-message" hidden></section>

      <section class="result-final-wizard">
        <article class="result-final-wizard-panel is-active" data-resultado-wizard-panel="cargar">
          <div class="result-final-panel-heading">
            <p class="eyebrow">Paso 1</p>
            <h3>Cargar o generar resultado final</h3>
            <p>Confirma el proyecto. Puedes cargar un paquete existente o generar el cierre final desde las adaptaciones.</p>
          </div>
          <div class="result-final-toolbar">
            <label for="resultadoFinalProyectoId">
              <span>ID del proyecto</span>
              <input id="resultadoFinalProyectoId" type="text" placeholder="Pega aquí el proyectoId" autocomplete="off" />
            </label>
            <button id="resultadoFinalCargarBtn" class="secondary-button" type="button" data-result-action="reload">Cargar resultado</button>
            <button id="resultadoFinalGenerarBtn" class="primary-button" type="button" data-result-action="generate">Generar resultado final</button>
          </div>
          <p id="resultadoFinalStatus" class="mini-summary">Resultado pendiente de carga.</p>
          <section class="result-final-kpis" aria-label="Resumen del resultado final">
            <article><span>Plataformas</span><strong id="resultadoFinalPlataformas">—</strong></article>
            <article><span>Elementos plan</span><strong id="resultadoFinalElementos">—</strong></article>
            <article><span>Efectos</span><strong id="resultadoFinalEfectos">—</strong></article>
            <article><span>Textos</span><strong id="resultadoFinalTextos">—</strong></article>
            <article><span>Peso total</span><strong id="resultadoFinalPeso">—</strong></article>
            <article><span>Listo publicar</span><strong id="resultadoFinalListo">—</strong></article>
          </section>
        </article>

        <article class="result-final-wizard-panel" data-resultado-wizard-panel="maestro" hidden>
          <article class="result-final-panel result-final-panel--video">
            <header><div><p class="eyebrow">Paso 2</p><h3>Video maestro</h3></div><span id="resultadoFinalVideoEstado">Sin video</span></header>
            <video id="resultadoFinalVideo" class="result-final-video" controls playsinline hidden></video>
            <div id="resultadoFinalVideoInfo" class="result-final-info"><div class="result-final-empty">Carga o genera el resultado final.</div></div>
          </article>
        </article>

        <article class="result-final-wizard-panel" data-resultado-wizard-panel="versiones" hidden>
          <article class="result-final-panel result-final-panel--platforms">
            <header><div><p class="eyebrow">Paso 3</p><h3>Versiones por plataforma</h3></div><span id="resultadoFinalVersionesEstado">0</span></header>
            <div id="resultadoFinalVersiones" class="result-final-platforms"><div class="result-final-empty">Sin versiones por plataforma.</div></div>
          </article>
        </article>

        <article class="result-final-wizard-panel" data-resultado-wizard-panel="checklist" hidden>
          <article class="result-final-panel result-final-panel--checklist">
            <header><div><p class="eyebrow">Paso 4</p><h3>Control final</h3></div><span id="resultadoFinalChecklistEstado">0</span></header>
            <div id="resultadoFinalChecklist" class="result-final-checklist"><div class="result-final-empty">Sin checklist.</div></div>
          </article>
        </article>

        <article class="result-final-wizard-panel" data-resultado-wizard-panel="reporte" hidden>
          <article class="result-final-panel result-final-panel--report">
            <header><div><p class="eyebrow">Paso 5</p><h3>Recomendaciones y entregables</h3></div><span id="resultadoFinalReporteEstado">0</span></header>
            <div id="resultadoFinalContent" class="result-final-content"><div class="result-final-empty">No hay reporte final todavía.</div></div>
          </article>
        </article>
      </section>
    </section>
  `;
}

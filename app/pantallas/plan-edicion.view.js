export function renderPlanEdicionView() {
  return `
    <section class="aj-view-card plan-view" data-plan-root>
      <div class="plan-hero">
        <div>
          <p class="eyebrow">Etapa 2</p>
          <h2>Plan de edición</h2>
          <p>Revisa el plan antes de producir el video maestro. Aquí puedes ver subtítulos, textos, recursos de biblioteca, zooms, efectos, animaciones y línea de tiempo propuesta.</p>
        </div>
        <span class="aj-status-chip" id="planEstadoChip">Esperando proyecto</span>
      </div>

      <div class="plan-toolbar">
        <label for="planProyectoId">
          <span>ID del proyecto</span>
          <input id="planProyectoId" type="text" placeholder="Pega aquí el proyectoId" autocomplete="off" />
        </label>
        <button id="planCargarBtn" class="secondary-button" type="button">Cargar plan</button>
        <button id="planProcesarBtn" class="primary-button" type="button">Crear plan</button>
      </div>

      <section id="planMensaje" class="plan-message" hidden></section>

      <section class="plan-kpis" aria-label="Resumen del plan de edición">
        <article><span>Elementos</span><strong id="planTotalElementos">—</strong></article>
        <article><span>Subtítulos</span><strong id="planSubtitulos">—</strong></article>
        <article><span>Textos</span><strong id="planTextos">—</strong></article>
        <article><span>Recursos</span><strong id="planRecursos">—</strong></article>
        <article><span>Biblioteca</span><strong id="planBiblioteca">—</strong></article>
        <article><span>Efectos</span><strong id="planEfectos">—</strong></article>
        <article><span>Listo producción</span><strong id="planListo">—</strong></article>
      </section>

      <section class="plan-layout">
        <article class="plan-panel plan-panel--lectura">
          <header><div><p class="eyebrow">Lectura</p><h3>Resumen ejecutivo</h3></div><span id="planLecturaEstado">0</span></header>
          <div id="planLectura" class="plan-reading"><div class="plan-empty">Carga o crea el plan para ver la lectura editorial.</div></div>
        </article>

        <article class="plan-panel plan-panel--fuente">
          <header><div><p class="eyebrow">Fuente</p><h3>Desde entendimiento y biblioteca</h3></div><span id="planFuenteEstado">Sin datos</span></header>
          <div id="planFuente" class="plan-source"><div class="plan-empty">Sin fuente cargada.</div></div>
        </article>

        <article class="plan-panel plan-panel--timeline">
          <header><div><p class="eyebrow">Timeline</p><h3>Línea de tiempo propuesta</h3></div><span id="planTimelineEstado">0</span></header>
          <div id="planTimeline" class="plan-timeline"><div class="plan-empty">Sin línea de tiempo.</div></div>
        </article>

        <article class="plan-panel plan-panel--elementos">
          <header><div><p class="eyebrow">Elementos</p><h3>Lista revisable</h3></div><span id="planElementosEstado">0</span></header>
          <div id="planElementos" class="plan-elements"><div class="plan-empty">Sin elementos cargados.</div></div>
        </article>
      </section>

      <footer class="plan-footer">
        <div>
          <strong>Siguiente paso</strong>
          <span>Cuando el plan esté listo, se podrá producir el video maestro usando los recursos referenciados de biblioteca general y biblioteca proyecto.</span>
        </div>
        <button id="planProducirBtn" class="primary-button" type="button" disabled>Producir video maestro</button>
      </footer>
    </section>
  `;
}

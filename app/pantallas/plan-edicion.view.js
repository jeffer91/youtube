export function renderPlanEdicionView() {
  return `
    <section class="aj-view-card plan-view" data-plan-root>
      <div class="plan-hero">
        <div>
          <p class="eyebrow">Etapa 2</p>
          <h2>Plan de edicion</h2>
          <p>Revisa, edita y aprueba el plan antes de pasar a Produccion.</p>
        </div>
        <span class="aj-status-chip" id="planEstadoChip">Esperando proyecto</span>
      </div>
      <div class="plan-toolbar">
        <label for="planProyectoId"><span>ID del proyecto</span><input id="planProyectoId" type="text" placeholder="Pega aqui el proyectoId" autocomplete="off" /></label>
        <button id="planCargarBtn" class="secondary-button" type="button">Cargar plan</button>
        <button id="planProcesarBtn" class="primary-button" type="button">Crear plan</button>
        <button id="planAprobarBtn" class="secondary-button" type="button" disabled>Aprobar plan</button>
      </div>
      <section id="planMensaje" class="plan-message" hidden></section>
      <section class="plan-kpis" aria-label="Resumen del plan de edicion">
        <article><span>Elementos</span><strong id="planTotalElementos">-</strong></article>
        <article><span>Subtitulos</span><strong id="planSubtitulos">-</strong></article>
        <article><span>Textos</span><strong id="planTextos">-</strong></article>
        <article><span>Recursos</span><strong id="planRecursos">-</strong></article>
        <article><span>Biblioteca</span><strong id="planBiblioteca">-</strong></article>
        <article><span>Contexto IA</span><strong id="planContexto">-</strong></article>
        <article><span>Partes IA</span><strong id="planPartes">-</strong></article>
        <article><span>Editor</span><strong id="planEditor">-</strong></article>
        <article><span>Listo</span><strong id="planListo">-</strong></article>
      </section>
      <section class="plan-layout">
        <article class="plan-panel plan-panel--lectura"><header><div><p class="eyebrow">Lectura</p><h3>Resumen ejecutivo</h3></div><span id="planLecturaEstado">0</span></header><div id="planLectura" class="plan-reading"><div class="plan-empty">Carga o crea el plan.</div></div></article>
        <article class="plan-panel plan-panel--fuente"><header><div><p class="eyebrow">Fuente</p><h3>Desde entendimiento y biblioteca</h3></div><span id="planFuenteEstado">Sin datos</span></header><div id="planFuente" class="plan-source"><div class="plan-empty">Sin fuente cargada.</div></div></article>
        <article class="plan-panel plan-panel--contexto"><header><div><p class="eyebrow">Contexto IA</p><h3>Informacion absorbida</h3></div><span id="planContextoEstado">Sin datos</span></header><div id="planContextoDetalle" class="plan-source"><div class="plan-empty">Sin contexto construido.</div></div></article>
        <article class="plan-panel plan-panel--partes"><header><div><p class="eyebrow">Plan por partes</p><h3>Secciones generadas y validadas</h3></div><span id="planPartesEstado">0/0</span></header><div id="planPartesDetalle" class="plan-source"><div class="plan-empty">Sin partes generadas.</div></div></article>
        <article class="plan-panel plan-panel--editor"><header><div><p class="eyebrow">Editor del plan</p><h3>Acciones ejecutables antes de Produccion</h3></div><span id="planEditorEstado">Pendiente</span></header><div id="planEditorDetalle" class="plan-source"><div class="plan-empty">Sin JSON tecnico para editar.</div></div></article>
        <article class="plan-panel plan-panel--timeline"><header><div><p class="eyebrow">Timeline</p><h3>Linea de tiempo propuesta</h3></div><span id="planTimelineEstado">0</span></header><div id="planTimeline" class="plan-timeline"><div class="plan-empty">Sin linea de tiempo.</div></div></article>
        <article class="plan-panel plan-panel--elementos"><header><div><p class="eyebrow">Elementos</p><h3>Lista revisable</h3></div><span id="planElementosEstado">0</span></header><div id="planElementos" class="plan-elements"><div class="plan-empty">Sin elementos cargados.</div></div></article>
      </section>
      <footer class="plan-footer"><div><strong>Siguiente paso</strong><span>Produccion se habilita solo cuando el plan este aprobado.</span></div><button id="planProducirBtn" class="primary-button" type="button" disabled>Producir</button></footer>
    </section>
  `;
}

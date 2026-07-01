export function renderEntendimientoView() {
  return `
    <section class="aj-view-card entendimiento-view" data-entendimiento-root data-proceso-root="entendimiento" data-proceso-paso-activo="cargar-proyecto">
      <section id="entendimientoMensaje" class="entendimiento-message" hidden></section>

      <section class="entendimiento-wizard">
        <article class="entendimiento-wizard-panel is-active" data-entendimiento-wizard-panel="cargar">
          <div class="entendimiento-panel-heading">
            <p class="eyebrow">Paso 1</p>
            <h3>Cargar proyecto</h3>
            <p>Pega o confirma el ID del proyecto. Luego carga el entendimiento existente o pasa al procesamiento.</p>
          </div>
          <div class="entendimiento-toolbar">
            <label for="entendimientoProyectoId">
              <span>ID del proyecto</span>
              <input id="entendimientoProyectoId" type="text" placeholder="Pega aquí el proyectoId" autocomplete="off" />
            </label>
            <button id="entendimientoCargarBtn" class="secondary-button" type="button">Cargar entendimiento</button>
            <button id="entendimientoProcesarBtn" class="primary-button" type="button">Procesar entendimiento</button>
          </div>
        </article>

        <article class="entendimiento-wizard-panel" data-entendimiento-wizard-panel="procesar" hidden>
          <div class="entendimiento-panel-heading">
            <p class="eyebrow">Paso 2</p>
            <h3>Procesar entendimiento</h3>
            <p>Usa este paso cuando todavía no exista resultado. La app generará transcripción, fotogramas y análisis global.</p>
          </div>
          <div class="entendimiento-action-box">
            <strong>Procesamiento de entendimiento</strong>
            <span>Se conserva el mismo botón y la misma API de procesamiento; solo se muestra en su paso correspondiente.</span>
            <button class="primary-button" type="button" data-entendimiento-action="procesar">Procesar entendimiento ahora</button>
          </div>
        </article>

        <article class="entendimiento-wizard-panel" data-entendimiento-wizard-panel="transcripcion" hidden>
          <header class="entendimiento-panel-header"><div><p class="eyebrow">Paso 3</p><h3>Revisar transcripción</h3></div><span id="entendimientoTranscripcionEstado">Pendiente</span></header>
          <div id="entendimientoTranscripcionTabs" class="entendimiento-transcripcion-tabs" aria-label="Transcripciones por motor"></div>
          <div id="entendimientoTranscripcionMeta" class="entendimiento-transcripcion-meta">Sin motor seleccionado.</div>
          <div id="entendimientoTranscripcionAcciones" class="entendimiento-transcripcion-acciones"></div>
          <div id="entendimientoTranscripcion" class="entendimiento-text-box">Carga un proyecto para ver la transcripción o la estructura preparada.</div>
        </article>

        <article class="entendimiento-wizard-panel" data-entendimiento-wizard-panel="fotogramas" hidden>
          <header class="entendimiento-panel-header"><div><p class="eyebrow">Paso 4</p><h3>Revisar fotogramas clave</h3></div><span id="entendimientoFramesEstado">0</span></header>
          <div id="entendimientoFrames" class="entendimiento-frames"><div class="entendimiento-empty">Sin fotogramas cargados.</div></div>
        </article>

        <article class="entendimiento-wizard-panel" data-entendimiento-wizard-panel="analisis" hidden>
          <div class="entendimiento-split-panels">
            <section>
              <header class="entendimiento-panel-header"><div><p class="eyebrow">Paso 5</p><h3>Análisis global</h3></div><span id="entendimientoGlobalEstado">Sin datos</span></header>
              <div id="entendimientoGlobal" class="entendimiento-analysis-list"><div class="entendimiento-empty">Sin análisis global cargado.</div></div>
            </section>
            <section>
              <header class="entendimiento-panel-header"><div><p class="eyebrow">Necesidades</p><h3>Qué revisar antes del plan</h3></div><span id="entendimientoNecesidadesEstado">0</span></header>
              <div id="entendimientoNecesidades" class="entendimiento-tags"><span>Esperando entendimiento</span></div>
            </section>
          </div>
        </article>

        <article class="entendimiento-wizard-panel" data-entendimiento-wizard-panel="biblioteca" hidden>
          <div class="entendimiento-footer">
            <div>
              <strong>Paso 6 · Siguiente paso</strong>
              <span>Cuando el entendimiento esté completo, entra a Biblioteca y usa la pestaña Proyecto para cargar recursos temporales.</span>
            </div>
            <button id="entendimientoCrearPlanBtn" class="primary-button" type="button" disabled>Abrir Biblioteca > Proyecto</button>
          </div>
        </article>

        <article class="entendimiento-wizard-panel" data-entendimiento-wizard-panel="avanzado" data-proceso-avanzado hidden>
          <div class="entendimiento-panel-heading">
            <p class="eyebrow">Avanzado</p>
            <h3>Motores gratuitos/locales</h3>
            <p>Diagnóstico e instalación quedan ocultos aquí para no saturar el flujo principal.</p>
          </div>
          <div class="entendimiento-advanced-actions">
            <button id="entendimientoDiagnosticarMotoresBtn" class="secondary-button" type="button">Diagnosticar motores</button>
            <button id="entendimientoInstalarMotoresBtn" class="secondary-button" type="button">Guía instalación</button>
          </div>
          <section id="entendimientoInstalacionMotores" class="entendimiento-instalacion-motores" hidden>
            <header><div><p class="eyebrow">Instalación guiada</p><h3>Modelos gratuitos/locales</h3></div><span id="entendimientoInstalacionMotoresEstado">Pendiente</span></header>
            <div id="entendimientoInstalacionMotoresResumen" class="entendimiento-instalacion-resumen">Abre la guía para ver los pasos de instalación gratuitos.</div>
            <div id="entendimientoInstalacionMotoresLista" class="entendimiento-instalacion-lista"></div>
          </section>
          <section id="entendimientoDiagnosticoMotores" class="entendimiento-diagnostico-motores" hidden>
            <header><div><p class="eyebrow">Diagnóstico</p><h3>Motores gratuitos/locales</h3></div><span id="entendimientoDiagnosticoMotoresEstado">Pendiente</span></header>
            <div id="entendimientoDiagnosticoMotoresResumen" class="entendimiento-diagnostico-resumen">Ejecuta el diagnóstico para revisar Python, faster-whisper, whisper.cpp y Vosk.</div>
            <div id="entendimientoDiagnosticoMotoresLista" class="entendimiento-diagnostico-lista"></div>
          </section>
        </article>
      </section>

      <section class="entendimiento-kpis" aria-label="Resumen de entendimiento">
        <article><span>Orientación</span><strong id="entendimientoOrientacion">—</strong></article>
        <article><span>Duración</span><strong id="entendimientoDuracion">—</strong></article>
        <article><span>Audio</span><strong id="entendimientoAudio">—</strong></article>
        <article><span>Fotogramas</span><strong id="entendimientoFotogramas">—</strong></article>
        <article><span>Momentos clave</span><strong id="entendimientoMomentos">—</strong></article>
        <article><span>Motores</span><strong id="entendimientoMotores">—</strong></article>
        <article><span>Listo para biblioteca</span><strong id="entendimientoListo">—</strong></article>
      </section>
    </section>
  `;
}

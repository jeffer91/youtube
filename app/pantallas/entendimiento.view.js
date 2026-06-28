export function renderEntendimientoView() {
  return `
    <section class="aj-view-card entendimiento-view" data-entendimiento-root>
      <div class="entendimiento-hero">
        <div>
          <p class="eyebrow">Etapa 1</p>
          <h2>Entendimiento del video</h2>
          <p>Revisa qué entendió AutoVideoJeff antes de cargar recursos temporales y crear el plan de edición. Esta pantalla lee el resultado real del backend de entendimiento.</p>
        </div>
        <span class="aj-status-chip" id="entendimientoEstadoChip">Esperando proyecto</span>
      </div>

      <div class="entendimiento-toolbar">
        <label for="entendimientoProyectoId">
          <span>ID del proyecto</span>
          <input id="entendimientoProyectoId" type="text" placeholder="Pega aquí el proyectoId" autocomplete="off" />
        </label>
        <button id="entendimientoCargarBtn" class="secondary-button" type="button">Cargar entendimiento</button>
        <button id="entendimientoProcesarBtn" class="primary-button" type="button">Procesar entendimiento</button>
        <button id="entendimientoDiagnosticarMotoresBtn" class="secondary-button" type="button">Diagnosticar motores</button>
        <button id="entendimientoInstalarMotoresBtn" class="secondary-button" type="button">Guía instalación</button>
      </div>

      <section id="entendimientoMensaje" class="entendimiento-message" hidden></section>

      <section id="entendimientoInstalacionMotores" class="entendimiento-instalacion-motores" hidden>
        <header>
          <div>
            <p class="eyebrow">Instalación guiada</p>
            <h3>Modelos gratuitos/locales</h3>
          </div>
          <span id="entendimientoInstalacionMotoresEstado">Pendiente</span>
        </header>
        <div id="entendimientoInstalacionMotoresResumen" class="entendimiento-instalacion-resumen">Abre la guía para ver los pasos de instalación gratuitos.</div>
        <div id="entendimientoInstalacionMotoresLista" class="entendimiento-instalacion-lista"></div>
      </section>

      <section id="entendimientoDiagnosticoMotores" class="entendimiento-diagnostico-motores" hidden>
        <header>
          <div>
            <p class="eyebrow">Diagnóstico</p>
            <h3>Motores gratuitos/locales</h3>
          </div>
          <span id="entendimientoDiagnosticoMotoresEstado">Pendiente</span>
        </header>
        <div id="entendimientoDiagnosticoMotoresResumen" class="entendimiento-diagnostico-resumen">Ejecuta el diagnóstico para revisar Python, faster-whisper, whisper.cpp y Vosk.</div>
        <div id="entendimientoDiagnosticoMotoresLista" class="entendimiento-diagnostico-lista"></div>
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

      <section class="entendimiento-layout">
        <article class="entendimiento-panel entendimiento-panel--transcripcion">
          <header><div><p class="eyebrow">Transcripción</p><h3>Texto detectado por motor</h3></div><span id="entendimientoTranscripcionEstado">Pendiente</span></header>
          <div id="entendimientoTranscripcionTabs" class="entendimiento-transcripcion-tabs" aria-label="Transcripciones por motor"></div>
          <div id="entendimientoTranscripcionMeta" class="entendimiento-transcripcion-meta">Sin motor seleccionado.</div>
          <div id="entendimientoTranscripcionAcciones" class="entendimiento-transcripcion-acciones"></div>
          <div id="entendimientoTranscripcion" class="entendimiento-text-box">Carga un proyecto para ver la transcripción o la estructura preparada.</div>
        </article>

        <article class="entendimiento-panel entendimiento-panel--fotogramas">
          <header><div><p class="eyebrow">Fotogramas</p><h3>Frames clave</h3></div><span id="entendimientoFramesEstado">0</span></header>
          <div id="entendimientoFrames" class="entendimiento-frames"><div class="entendimiento-empty">Sin fotogramas cargados.</div></div>
        </article>

        <article class="entendimiento-panel entendimiento-panel--global">
          <header><div><p class="eyebrow">Análisis global</p><h3>Lectura editorial</h3></div><span id="entendimientoGlobalEstado">Sin datos</span></header>
          <div id="entendimientoGlobal" class="entendimiento-analysis-list"><div class="entendimiento-empty">Sin análisis global cargado.</div></div>
        </article>

        <article class="entendimiento-panel entendimiento-panel--necesidades">
          <header><div><p class="eyebrow">Necesidades</p><h3>Qué revisar antes del plan</h3></div><span id="entendimientoNecesidadesEstado">0</span></header>
          <div id="entendimientoNecesidades" class="entendimiento-tags"><span>Esperando entendimiento</span></div>
        </article>
      </section>

      <footer class="entendimiento-footer">
        <div>
          <strong>Siguiente paso</strong>
          <span>Cuando el entendimiento esté completo, carga recursos temporales en Biblioteca proyecto antes de crear el plan.</span>
        </div>
        <button id="entendimientoCrearPlanBtn" class="primary-button" type="button" disabled>Abrir biblioteca proyecto</button>
      </footer>
    </section>
  `;
}

export function renderAdaptacionView() {
  return `
    <section class="aj-view-card adaptacion-view" data-adaptacion-root data-proceso-root="adaptacion" data-proceso-paso-activo="cargar-proyecto">
      <div class="adaptacion-hero">
        <div>
          <p class="eyebrow">Etapa 4</p>
          <h2>Adaptación a plataformas</h2>
          <p>Genera versiones finales por pasos. Primero carga el proyecto, luego elige plataformas, adapta, revisa versiones y prepara el resultado final.</p>
        </div>
        <span class="aj-status-chip" id="adaptacionEstadoChip">Esperando proyecto</span>
      </div>

      <div data-proceso-resumen="adaptacion"></div>

      <section class="adaptacion-flow" aria-label="Flujo guiado de adaptación">
        <button class="adaptacion-step is-active" type="button" data-adaptacion-wizard-go="cargar" data-proceso-step="cargar-proyecto"><b>1</b><span><strong>Cargar</strong><small>Proyecto</small></span></button>
        <button class="adaptacion-step is-locked" type="button" data-adaptacion-wizard-go="plataformas" data-proceso-step="plataformas"><b>2</b><span><strong>Plataformas</strong><small>Elegir formatos</small></span></button>
        <button class="adaptacion-step is-locked" type="button" data-adaptacion-wizard-go="adaptar" data-proceso-step="adaptar"><b>3</b><span><strong>Adaptar</strong><small>Generar versiones</small></span></button>
        <button class="adaptacion-step is-locked" type="button" data-adaptacion-wizard-go="versiones" data-proceso-step="revisar-versiones"><b>4</b><span><strong>Versiones</strong><small>Revisar salidas</small></span></button>
        <button class="adaptacion-step is-locked" type="button" data-adaptacion-wizard-go="resultado" data-proceso-step="resultado-final"><b>5</b><span><strong>Resultado</strong><small>Cierre final</small></span></button>
        <button class="adaptacion-step is-advanced" type="button" data-adaptacion-wizard-go="avanzado" data-proceso-step="opciones-avanzadas"><b>+</b><span><strong>Avanzado</strong><small>Base / exportaciones</small></span></button>
      </section>

      <section id="adaptacionMensaje" class="adaptacion-message" hidden></section>

      <section class="adaptacion-wizard">
        <article class="adaptacion-wizard-panel is-active" data-adaptacion-wizard-panel="cargar">
          <div class="adaptacion-panel-heading">
            <p class="eyebrow">Paso 1</p>
            <h3>Cargar proyecto</h3>
            <p>Confirma el proyecto y carga una adaptación existente o continúa a elegir plataformas.</p>
          </div>
          <div class="adaptacion-toolbar">
            <label for="adaptacionProyectoId">
              <span>ID del proyecto</span>
              <input id="adaptacionProyectoId" type="text" placeholder="Pega aquí el proyectoId" autocomplete="off" />
            </label>
            <button id="adaptacionCargarBtn" class="secondary-button" type="button">Cargar adaptación</button>
            <button class="primary-button" type="button" data-adaptacion-wizard-go="plataformas">Elegir plataformas</button>
          </div>

          <section class="adaptacion-kpis" aria-label="Resumen de adaptación">
            <article><span>Total</span><strong id="adaptacionTotal">—</strong></article>
            <article><span>Exportadas</span><strong id="adaptacionExportadas">—</strong></article>
            <article><span>Pendientes</span><strong id="adaptacionPendientes">—</strong></article>
            <article><span>Errores</span><strong id="adaptacionErrores">—</strong></article>
            <article><span>Peso total</span><strong id="adaptacionPeso">—</strong></article>
            <article><span>Listo resultado</span><strong id="adaptacionListo">—</strong></article>
          </section>
        </article>

        <article class="adaptacion-wizard-panel" data-adaptacion-wizard-panel="plataformas" hidden>
          <div class="adaptacion-panel-heading">
            <p class="eyebrow">Paso 2</p>
            <h3>Elegir plataformas</h3>
            <p>Selecciona solo los formatos que necesitas. La opción técnica de render base queda aquí para no saturar otras pantallas.</p>
          </div>
          <section class="adaptacion-options" aria-label="Plataformas de salida">
            <label><input type="checkbox" name="adaptacionPlataforma" value="tiktok" checked /> <span>TikTok</span></label>
            <label><input type="checkbox" name="adaptacionPlataforma" value="reels" checked /> <span>Reels</span></label>
            <label><input type="checkbox" name="adaptacionPlataforma" value="shorts" checked /> <span>Shorts</span></label>
            <label><input type="checkbox" name="adaptacionPlataforma" value="youtube" checked /> <span>YouTube</span></label>
            <label><input type="checkbox" name="adaptacionPlataforma" value="facebook" /> <span>Facebook</span></label>
            <label><input type="checkbox" name="adaptacionPlataforma" value="instagram" /> <span>Instagram 1:1</span></label>
            <label class="adaptacion-option-inline"><input id="adaptacionRenderBaseOtraVez" type="checkbox" /> <span>Renderizar también la base</span></label>
          </section>
          <div class="adaptacion-actions-row">
            <button class="secondary-button" type="button" data-adaptacion-wizard-go="cargar">Volver</button>
            <button class="primary-button" type="button" data-adaptacion-wizard-go="adaptar">Continuar a adaptar</button>
          </div>
        </article>

        <article class="adaptacion-wizard-panel" data-adaptacion-wizard-panel="adaptar" hidden>
          <div class="adaptacion-action-box">
            <p class="eyebrow">Paso 3</p>
            <h3>Adaptar plataformas</h3>
            <p>La app usará el video maestro producido y generará las versiones seleccionadas.</p>
            <button id="adaptacionProcesarBtn" class="primary-button" type="button">Adaptar plataformas</button>
          </div>
        </article>

        <article class="adaptacion-wizard-panel" data-adaptacion-wizard-panel="versiones" hidden>
          <article class="adaptacion-panel adaptacion-panel--plataformas">
            <header><div><p class="eyebrow">Paso 4</p><h3>Resultados por formato</h3></div><span id="adaptacionPlataformasEstado">0</span></header>
            <div id="adaptacionPlataformas" class="adaptacion-platforms"><div class="adaptacion-empty">Sin plataformas generadas.</div></div>
          </article>
        </article>

        <article class="adaptacion-wizard-panel" data-adaptacion-wizard-panel="resultado" hidden>
          <footer class="adaptacion-footer">
            <div>
              <strong>Paso 5 · Resultado final</strong>
              <span>Cuando las plataformas estén listas, genera el reporte final del proyecto.</span>
            </div>
            <button id="adaptacionResultadoBtn" class="primary-button" type="button" disabled>Preparar resultado final</button>
          </footer>
        </article>

        <article class="adaptacion-wizard-panel" data-adaptacion-wizard-panel="avanzado" data-proceso-avanzado hidden>
          <div class="adaptacion-panel-heading">
            <p class="eyebrow">Avanzado</p>
            <h3>Video base, lectura y exportaciones técnicas</h3>
            <p>Información útil para revisión técnica, pero separada del flujo principal.</p>
          </div>
          <section class="adaptacion-layout">
            <article class="adaptacion-panel adaptacion-panel--base">
              <header><div><p class="eyebrow">Base</p><h3>Video maestro usado</h3></div><span id="adaptacionBaseEstado">Sin video</span></header>
              <video id="adaptacionBaseVideo" class="adaptacion-base-video" controls playsinline></video>
              <div id="adaptacionBaseInfo" class="adaptacion-base-info"><div class="adaptacion-empty">Carga una adaptación para ver el video maestro base.</div></div>
            </article>

            <article class="adaptacion-panel adaptacion-panel--lectura">
              <header><div><p class="eyebrow">Lectura</p><h3>Resumen de adaptación</h3></div><span id="adaptacionLecturaEstado">0</span></header>
              <div id="adaptacionLectura" class="adaptacion-reading"><div class="adaptacion-empty">Sin lectura cargada.</div></div>
            </article>

            <article class="adaptacion-panel adaptacion-panel--exportaciones">
              <header><div><p class="eyebrow">Plan</p><h3>Exportaciones preparadas</h3></div><span id="adaptacionExportacionesEstado">0</span></header>
              <div id="adaptacionExportaciones" class="adaptacion-exports"><div class="adaptacion-empty">Sin exportaciones preparadas.</div></div>
            </article>
          </section>
        </article>
      </section>
    </section>
  `;
}
export function renderAdaptacionView() {
  return `
    <section class="aj-view-card adaptacion-view" data-adaptacion-root data-proceso-root="adaptacion" data-proceso-paso-activo="cargar-proyecto">
      <section id="adaptacionMensaje" class="adaptacion-message" hidden></section>

      <section class="adaptacion-flow" aria-label="Navegación de adaptación">
        <button class="adaptacion-step is-active" type="button" data-adaptacion-wizard-go="cargar" data-proceso-step="cargar-proyecto"><span><strong>Cargar</strong></span></button>
        <button class="adaptacion-step is-locked" type="button" data-adaptacion-wizard-go="plataformas" data-proceso-step="plataformas"><span><strong>Plataformas</strong></span></button>
        <button class="adaptacion-step is-locked" type="button" data-adaptacion-wizard-go="adaptar" data-proceso-step="adaptar"><span><strong>Adaptar</strong></span></button>
        <button class="adaptacion-step is-locked" type="button" data-adaptacion-wizard-go="versiones" data-proceso-step="revisar-versiones"><span><strong>Versiones</strong></span></button>
        <button class="adaptacion-step is-locked" type="button" data-adaptacion-wizard-go="resultado" data-proceso-step="resultado-final"><span><strong>Resultado</strong></span></button>
        <button class="adaptacion-step is-advanced" type="button" data-adaptacion-wizard-go="avanzado" data-proceso-step="opciones-avanzadas"><span><strong>Avanzado</strong></span></button>
        <span class="aj-status-chip" id="adaptacionEstadoChip">Esperando proyecto</span>
      </section>

      <section class="adaptacion-wizard">
        <article class="adaptacion-wizard-panel is-active" data-adaptacion-wizard-panel="cargar">
          <div class="adaptacion-panel-heading">
            <h3>Cargar proyecto</h3>
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
            <h3>Elegir plataformas</h3>
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
            <h3>Adaptar plataformas</h3>
            <button id="adaptacionProcesarBtn" class="primary-button" type="button">Adaptar plataformas</button>
          </div>
        </article>

        <article class="adaptacion-wizard-panel" data-adaptacion-wizard-panel="versiones" hidden>
          <article class="adaptacion-panel adaptacion-panel--plataformas">
            <header><div><h3>Resultados por formato</h3></div><span id="adaptacionPlataformasEstado">0</span></header>
            <div id="adaptacionPlataformas" class="adaptacion-platforms"><div class="adaptacion-empty">Sin plataformas generadas.</div></div>
          </article>
        </article>

        <article class="adaptacion-wizard-panel" data-adaptacion-wizard-panel="resultado" hidden>
          <footer class="adaptacion-footer">
            <div>
              <strong>Resultado final</strong>
              <span>Genera el reporte final del proyecto.</span>
            </div>
            <button id="adaptacionResultadoBtn" class="primary-button" type="button" disabled>Preparar resultado final</button>
          </footer>
        </article>

        <article class="adaptacion-wizard-panel" data-adaptacion-wizard-panel="avanzado" data-proceso-avanzado hidden>
          <div class="adaptacion-panel-heading">
            <h3>Video base, lectura y exportaciones técnicas</h3>
          </div>
          <section class="adaptacion-layout">
            <article class="adaptacion-panel adaptacion-panel--base">
              <header><div><h3>Video maestro usado</h3></div><span id="adaptacionBaseEstado">Sin video</span></header>
              <video id="adaptacionBaseVideo" class="adaptacion-base-video" controls playsinline></video>
              <div id="adaptacionBaseInfo" class="adaptacion-base-info"><div class="adaptacion-empty">Carga una adaptación para ver el video maestro base.</div></div>
            </article>

            <article class="adaptacion-panel adaptacion-panel--lectura">
              <header><div><h3>Resumen de adaptación</h3></div><span id="adaptacionLecturaEstado">0</span></header>
              <div id="adaptacionLectura" class="adaptacion-reading"><div class="adaptacion-empty">Sin lectura cargada.</div></div>
            </article>

            <article class="adaptacion-panel adaptacion-panel--exportaciones">
              <header><div><h3>Exportaciones preparadas</h3></div><span id="adaptacionExportacionesEstado">0</span></header>
              <div id="adaptacionExportaciones" class="adaptacion-exports"><div class="adaptacion-empty">Sin exportaciones preparadas.</div></div>
            </article>
          </section>
        </article>
      </section>
    </section>
  `;
}

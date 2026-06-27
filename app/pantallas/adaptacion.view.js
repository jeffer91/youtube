export function renderAdaptacionView() {
  return `
    <section class="aj-view-card adaptacion-view" data-adaptacion-root>
      <div class="adaptacion-hero">
        <div>
          <p class="eyebrow">Etapa 4</p>
          <h2>Adaptación a plataformas</h2>
          <p>Genera versiones finales para TikTok, Reels, Shorts, YouTube, Facebook e Instagram cuadrado desde el video maestro producido.</p>
        </div>
        <span class="aj-status-chip" id="adaptacionEstadoChip">Esperando proyecto</span>
      </div>

      <div class="adaptacion-toolbar">
        <label for="adaptacionProyectoId">
          <span>ID del proyecto</span>
          <input id="adaptacionProyectoId" type="text" placeholder="Pega aquí el proyectoId" autocomplete="off" />
        </label>
        <button id="adaptacionCargarBtn" class="secondary-button" type="button">Cargar adaptación</button>
        <button id="adaptacionProcesarBtn" class="primary-button" type="button">Adaptar plataformas</button>
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

      <section id="adaptacionMensaje" class="adaptacion-message" hidden></section>

      <section class="adaptacion-kpis" aria-label="Resumen de adaptación">
        <article><span>Total</span><strong id="adaptacionTotal">—</strong></article>
        <article><span>Exportadas</span><strong id="adaptacionExportadas">—</strong></article>
        <article><span>Pendientes</span><strong id="adaptacionPendientes">—</strong></article>
        <article><span>Errores</span><strong id="adaptacionErrores">—</strong></article>
        <article><span>Peso total</span><strong id="adaptacionPeso">—</strong></article>
        <article><span>Listo resultado</span><strong id="adaptacionListo">—</strong></article>
      </section>

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

        <article class="adaptacion-panel adaptacion-panel--plataformas">
          <header><div><p class="eyebrow">Plataformas</p><h3>Resultados por formato</h3></div><span id="adaptacionPlataformasEstado">0</span></header>
          <div id="adaptacionPlataformas" class="adaptacion-platforms"><div class="adaptacion-empty">Sin plataformas generadas.</div></div>
        </article>

        <article class="adaptacion-panel adaptacion-panel--exportaciones">
          <header><div><p class="eyebrow">Plan</p><h3>Exportaciones preparadas</h3></div><span id="adaptacionExportacionesEstado">0</span></header>
          <div id="adaptacionExportaciones" class="adaptacion-exports"><div class="adaptacion-empty">Sin exportaciones preparadas.</div></div>
        </article>
      </section>

      <footer class="adaptacion-footer">
        <div>
          <strong>Siguiente paso</strong>
          <span>Cuando las plataformas estén listas, genera el reporte final del proyecto.</span>
        </div>
        <button id="adaptacionResultadoBtn" class="primary-button" type="button" disabled>Preparar resultado final</button>
      </footer>
    </section>
  `;
}

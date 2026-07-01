/*
  Laboratorio de efectos
  Función: pantalla simple para subir video corto, elegir un efecto, previsualizar antes/después y producir una prueba individual.
*/

export function renderLaboratorioEfectosView() {
  return `
    <section class="lab-effects-screen aj-screen-panel" data-screen-panel="laboratorio-efectos" data-lab-efectos-root data-proceso-root="laboratorio-efectos" data-proceso-paso-activo="video-corto">
      <section class="lab-effects-flow" aria-label="Navegación del laboratorio de efectos">
        <button class="lab-effects-flow-step is-active" type="button" data-lab-wizard-go="video" data-proceso-step="video-corto"><span><strong>Video</strong></span></button>
        <button class="lab-effects-flow-step is-locked" type="button" data-lab-wizard-go="catalogo" data-proceso-step="categoria-efecto"><span><strong>Catálogo</strong></span></button>
        <button class="lab-effects-flow-step is-locked" type="button" data-lab-wizard-go="efecto" data-proceso-step="efecto"><span><strong>Efecto</strong></span></button>
        <button class="lab-effects-flow-step is-locked" type="button" data-lab-wizard-go="esperado" data-proceso-step="esperado"><span><strong>Esperado</strong></span></button>
        <button class="lab-effects-flow-step is-locked" type="button" data-lab-wizard-go="probar" data-proceso-step="probar"><span><strong>Probar</strong></span></button>
        <button class="lab-effects-flow-step is-locked" type="button" data-lab-wizard-go="comparar" data-proceso-step="comparar"><span><strong>Comparar</strong></span></button>
        <div class="lab-effects-status" id="labEfectosEstado">Catálogo pendiente</div>
      </section>

      <form id="labEfectosForm" class="lab-effects-layout lab-effects-wizard-form">
        <article class="lab-effects-wizard-panel is-active" data-lab-wizard-panel="video">
          <section class="lab-effects-card lab-effects-upload">
            <div class="lab-effects-card-header">
              <div>
                <h2>Video corto</h2>
              </div>
            </div>

            <label class="lab-effects-drop" for="labEfectosVideoInput">
              <strong>Subir video de prueba</strong>
              <span>MP4, MOV, WEBM, MKV o AVI.</span>
            </label>
            <input id="labEfectosVideoInput" name="video" type="file" accept="video/*,.mp4,.mov,.m4v,.avi,.mkv,.webm" required />
            <p id="labEfectosFileName" class="lab-effects-file">Ningún video seleccionado.</p>

            <section id="labEfectosPreviewEntradaPanel" class="lab-effects-mini-preview" hidden>
              <div class="lab-effects-mini-preview-head">
                <strong>Preview original</strong>
                <span id="labEfectosDuracionEntrada">Duración pendiente</span>
              </div>
              <video id="labEfectosPreviewEntradaVideo" class="lab-effects-video lab-effects-video--mini" controls muted playsinline></video>
              <p id="labEfectosAvisoDuracion" class="lab-effects-duration-hint">El clip ideal para esta prueba es de 10 a 12 segundos.</p>
            </section>
          </section>
        </article>

        <article class="lab-effects-wizard-panel" data-lab-wizard-panel="catalogo" hidden>
          <section class="lab-effects-card lab-effects-catalog">
            <div class="lab-effects-card-header">
              <div>
                <h2>Elegir efecto</h2>
              </div>
              <button id="labEfectosRecargarBtn" class="secondary-button" type="button">Recargar catálogo</button>
            </div>

            <label class="lab-effects-field lab-effects-search" for="labEfectosBuscar">
              <span>Buscar efecto</span>
              <input id="labEfectosBuscar" type="search" placeholder="zoom, shake, texto, flash..." />
            </label>

            <div id="labEfectosAcordeones" class="lab-effects-accordion-list">
              <div class="lab-effects-empty">Cargando catálogo de efectos...</div>
            </div>
          </section>
        </article>

        <article class="lab-effects-wizard-panel" data-lab-wizard-panel="efecto" hidden>
          <section class="lab-effects-card lab-effects-selected">
            <div class="lab-effects-card-header"><div><h2>Efecto seleccionado</h2></div></div>
            <div id="labEfectosResumenSeleccion" class="lab-effects-selected-box">
              <strong>Sin efecto seleccionado</strong>
              <span>Elige un efecto del catálogo.</span>
            </div>
            <label class="lab-effects-field" for="labEfectosTextoPersonalizado">
              <span>Texto opcional</span>
              <input id="labEfectosTextoPersonalizado" name="textoPersonalizado" type="text" maxlength="42" placeholder="Ejemplo: MIRA ESTO" />
            </label>
            <label class="lab-effects-field" for="labEfectosIntensidad">
              <span>Intensidad</span>
              <select id="labEfectosIntensidad" name="intensidad">
                <option value="">Usar intensidad del efecto</option>
                <option value="suave">Suave</option>
                <option value="normal">Normal</option>
                <option value="fuerte">Fuerte</option>
              </select>
            </label>
            <input id="labEfectosSeleccionado" name="efectoId" type="hidden" />
            <div class="lab-effects-actions-row"><button class="primary-button" type="button" data-lab-wizard-go="esperado">Ver esperado</button></div>
          </section>
        </article>

        <article class="lab-effects-wizard-panel" data-lab-wizard-panel="esperado" hidden>
          <section class="lab-effects-card lab-effects-selected">
            <div class="lab-effects-card-header"><div><h2>Qué debe salir</h2></div></div>
            <div class="lab-effects-expected">
              <span>Qué debe salir</span>
              <p id="labEfectosQueDebeSalir">Selecciona un efecto para ver la explicación esperada.</p>
            </div>
            <ul id="labEfectosChecklist" class="lab-effects-checklist">
              <li>Selecciona un efecto.</li>
              <li>Sube un clip corto.</li>
              <li>Compara original contra resultado.</li>
            </ul>
            <div class="lab-effects-actions-row"><button class="secondary-button" type="button" data-lab-wizard-go="efecto">Volver</button><button class="primary-button" type="button" data-lab-wizard-go="probar">Continuar a prueba</button></div>
          </section>
        </article>

        <article class="lab-effects-wizard-panel" data-lab-wizard-panel="probar" hidden>
          <section class="lab-effects-card lab-effects-test">
            <div class="lab-effects-card-header"><div><h2>Probar efecto</h2></div></div>
            <button id="labEfectosProbarBtn" class="primary-button lab-effects-main-button" type="submit" disabled>Probar efecto</button>
            <section id="labEfectosMensaje" class="lab-effects-message" hidden></section>
          </section>
        </article>

        <article class="lab-effects-wizard-panel" data-lab-wizard-panel="comparar" hidden>
          <section id="labEfectosResultadoPanel" class="lab-effects-card lab-effects-result" hidden>
            <div class="lab-effects-card-header">
              <div><h2>Comparación antes/después</h2></div>
              <a id="labEfectosDescarga" class="download-link" href="#" download hidden>Descargar</a>
            </div>
            <div class="lab-effects-compare">
              <div class="lab-effects-compare-item">
                <strong>Antes</strong>
                <video id="labEfectosComparacionOriginal" class="lab-effects-video" controls muted playsinline></video>
              </div>
              <div class="lab-effects-compare-item">
                <strong>Después</strong>
                <video id="labEfectosResultadoVideo" class="lab-effects-video" controls playsinline></video>
              </div>
            </div>
            <p id="labEfectosResultadoResumen" class="lab-effects-result-summary"></p>
          </section>
          <div id="labEfectosResultadoPendiente" class="lab-effects-empty">Todavía no hay resultado. Ejecuta la prueba para comparar.</div>
        </article>
      </form>
    </section>
  `;
}

export default renderLaboratorioEfectosView;

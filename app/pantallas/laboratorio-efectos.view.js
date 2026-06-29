/*
  Laboratorio de efectos - Bloque 4
  Función: pantalla simple para subir video corto, elegir un efecto y producir una prueba individual.
*/

export function renderLaboratorioEfectosView() {
  return `
    <section class="lab-effects-screen aj-screen-panel" data-screen-panel="laboratorio-efectos" data-lab-efectos-root>
      <div class="lab-effects-hero">
        <div>
          <p class="eyebrow">Laboratorio de efectos</p>
          <h1>Probar un efecto en un video corto</h1>
          <p class="hero-description">Sube un video de 10 a 12 segundos, elige un solo efecto y revisa si realmente se ve como esperamos. Esta pantalla no usa plan, Gemini ni Producción maestro.</p>
        </div>
        <div class="lab-effects-status" id="labEfectosEstado">Catálogo pendiente</div>
      </div>

      <form id="labEfectosForm" class="lab-effects-layout">
        <section class="lab-effects-card lab-effects-upload">
          <div class="lab-effects-card-header">
            <div>
              <span class="lab-effects-step">1</span>
              <h2>Video corto</h2>
              <p>Usa un clip pequeño para detectar rápido si el efecto funciona.</p>
            </div>
          </div>

          <label class="lab-effects-drop" for="labEfectosVideoInput">
            <strong>Subir video de prueba</strong>
            <span>MP4, MOV, WEBM, MKV o AVI. Recomendado: 10 a 12 segundos.</span>
          </label>
          <input id="labEfectosVideoInput" name="video" type="file" accept="video/*,.mp4,.mov,.m4v,.avi,.mkv,.webm" required />
          <p id="labEfectosFileName" class="lab-effects-file">Ningún video seleccionado.</p>

          <label class="lab-effects-field" for="labEfectosTextoPersonalizado">
            <span>Texto opcional para efectos de texto</span>
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
          <button id="labEfectosProbarBtn" class="primary-button lab-effects-main-button" type="submit" disabled>Probar efecto</button>
          <section id="labEfectosMensaje" class="lab-effects-message" hidden></section>
        </section>

        <section class="lab-effects-card lab-effects-catalog">
          <div class="lab-effects-card-header">
            <div>
              <span class="lab-effects-step">2</span>
              <h2>Elegir efecto</h2>
              <p>Los efectos están organizados por acordeones. Elige uno y revisa qué debería salir.</p>
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

        <aside class="lab-effects-side">
          <section class="lab-effects-card lab-effects-selected">
            <div class="lab-effects-card-header">
              <div>
                <span class="lab-effects-step">3</span>
                <h2>Efecto seleccionado</h2>
                <p>Antes de producir, confirma qué debe verse.</p>
              </div>
            </div>
            <div id="labEfectosResumenSeleccion" class="lab-effects-selected-box">
              <strong>Sin efecto seleccionado</strong>
              <span>Elige un efecto del catálogo.</span>
            </div>
            <div class="lab-effects-expected">
              <span>Qué debe salir</span>
              <p id="labEfectosQueDebeSalir">Selecciona un efecto para ver la explicación esperada.</p>
            </div>
          </section>

          <section id="labEfectosResultadoPanel" class="lab-effects-card lab-effects-result" hidden>
            <div class="lab-effects-card-header">
              <div>
                <span class="lab-effects-step">4</span>
                <h2>Resultado</h2>
                <p>Video generado únicamente con el efecto seleccionado.</p>
              </div>
              <a id="labEfectosDescarga" class="download-link" href="#" download hidden>Descargar</a>
            </div>
            <video id="labEfectosResultadoVideo" class="lab-effects-video" controls playsinline></video>
            <p id="labEfectosResultadoResumen" class="lab-effects-result-summary"></p>
          </section>
        </aside>
      </form>
    </section>
  `;
}

export default renderLaboratorioEfectosView;

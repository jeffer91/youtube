export function renderAjustesView() {
  return `
    <section class="aj-view-card ajustes-gemini-page" data-ajustes-root data-proceso-root="ajustes" data-proceso-paso-activo="activar">
      <section id="ajustesMessage" class="ajustes-message" hidden></section>

      <section class="ajustes-flow" aria-label="Navegación de ajustes">
        <button class="ajustes-step is-active" type="button" data-ajustes-wizard-go="activar" data-proceso-step="activar"><span><strong>Activar</strong></span></button>
        <button class="ajustes-step is-locked" type="button" data-ajustes-wizard-go="clave" data-proceso-step="clave"><span><strong>Clave</strong></span></button>
        <button class="ajustes-step is-locked" type="button" data-ajustes-wizard-go="modelo" data-proceso-step="modelo"><span><strong>Modelo</strong></span></button>
        <button class="ajustes-step is-locked" type="button" data-ajustes-wizard-go="parametros" data-proceso-step="parametros"><span><strong>Parámetros</strong></span></button>
        <button class="ajustes-step is-locked" type="button" data-ajustes-wizard-go="probar" data-proceso-step="probar"><span><strong>Probar</strong></span></button>
        <button class="ajustes-step is-locked" type="button" data-ajustes-wizard-go="guardar" data-proceso-step="guardar"><span><strong>Guardar</strong></span></button>
        <button class="ajustes-step is-advanced" type="button" data-ajustes-wizard-go="avanzado" data-proceso-step="guia-fallback"><span><strong>Avanzado</strong></span></button>
        <span class="aj-status-chip" id="ajustesStateChip">Gemini pendiente</span>
      </section>

      <section id="ajustesGeminiCard" class="settings-card gemini-settings-card ajustes-wizard">
        <article class="ajustes-wizard-panel is-active" data-ajustes-wizard-panel="activar">
          <div class="ajustes-panel-heading"><h3>Activar Gemini</h3></div>
          <label class="toggle-row" for="ajustesUseGemini">
            <input id="ajustesUseGemini" type="checkbox" />
            <span><strong>Usar Gemini</strong><small>Activar análisis inteligente cuando haya clave API.</small></span>
          </label>
          <label class="toggle-row" for="ajustesUseFallbackGemini">
            <input id="ajustesUseFallbackGemini" type="checkbox" checked />
            <span><strong>Usar fallback local si Gemini falla</strong><small>El video no se detiene si falla la conexión.</small></span>
          </label>
          <div class="ajustes-actions-row"><button class="primary-button" type="button" data-ajustes-wizard-go="clave">Continuar a clave API</button></div>
        </article>

        <article class="ajustes-wizard-panel" data-ajustes-wizard-panel="clave" hidden>
          <div class="ajustes-panel-heading"><h3>Clave API Gemini</h3></div>
          <label class="textarea-row" for="ajustesGeminiCredencial"><span>Clave API Gemini</span><input id="ajustesGeminiCredencial" type="password" autocomplete="off" placeholder="Pega aquí tu clave API" /></label>
          <div class="ajustes-actions-row"><button class="secondary-button" type="button" data-ajustes-wizard-go="activar">Volver</button><button class="primary-button" type="button" data-ajustes-wizard-go="modelo">Continuar a modelo</button></div>
        </article>

        <article class="ajustes-wizard-panel" data-ajustes-wizard-panel="modelo" hidden>
          <div class="ajustes-panel-heading"><h3>Modelo Gemini</h3></div>
          <label class="select-row" for="ajustesGeminiModelo"><span>Modelo</span><input id="ajustesGeminiModelo" type="text" value="gemini-1.5-flash" /></label>
          <div class="ajustes-actions-row"><button class="secondary-button" type="button" data-ajustes-wizard-go="clave">Volver</button><button class="primary-button" type="button" data-ajustes-wizard-go="parametros">Continuar a parámetros</button></div>
        </article>

        <article class="ajustes-wizard-panel" data-ajustes-wizard-panel="parametros" hidden>
          <div class="ajustes-panel-heading"><h3>Parámetros</h3></div>
          <div class="settings-grid ajustes-settings-grid">
            <label class="select-row" for="ajustesGeminiTemperatura"><span>Temperatura</span><input id="ajustesGeminiTemperatura" type="number" min="0" max="1" step="0.05" value="0.35" /></label>
            <label class="select-row" for="ajustesGeminiTimeoutMs"><span>Tiempo espera ms</span><input id="ajustesGeminiTimeoutMs" type="number" min="10000" max="180000" step="1000" value="60000" /></label>
          </div>
          <div class="ajustes-actions-row"><button class="secondary-button" type="button" data-ajustes-wizard-go="modelo">Volver</button><button class="primary-button" type="button" data-ajustes-wizard-go="probar">Continuar a prueba</button></div>
        </article>

        <article class="ajustes-wizard-panel" data-ajustes-wizard-panel="probar" hidden>
          <div class="ajustes-panel-heading"><h3>Probar conexión</h3></div>
          <div class="ajustes-test-box">
            <strong>Prueba de Gemini</strong>
            <button id="ajustesTestGemini" class="secondary-button" type="button">Probar conexión</button>
          </div>
          <div class="ajustes-actions-row"><button class="secondary-button" type="button" data-ajustes-wizard-go="parametros">Volver</button><button class="primary-button" type="button" data-ajustes-wizard-go="guardar">Continuar a guardar</button></div>
        </article>

        <article class="ajustes-wizard-panel" data-ajustes-wizard-panel="guardar" hidden>
          <div class="ajustes-panel-heading"><h3>Guardar configuración</h3></div>
          <div class="aj-actions settings-actions ajustes-save-actions">
            <button id="ajustesSaveGemini" class="primary-button" type="button">Guardar Gemini</button>
            <button id="ajustesClearGemini" class="secondary-button" type="button">Quitar clave</button>
          </div>
          <p id="ajustesGeminiEstado" class="mini-summary">Gemini desactivado · fallback local activo</p>
        </article>

        <article class="ajustes-wizard-panel" data-ajustes-wizard-panel="avanzado" data-proceso-avanzado hidden>
          <div class="ajustes-panel-heading"><h3>Guía fija para Gemini</h3></div>
          <label class="textarea-row" for="ajustesGeminiGuia"><span>Guía fija para Gemini</span><textarea id="ajustesGeminiGuia" rows="6" placeholder="Ejemplo: eres un editor profesional, crea ganchos visuales y textos claros."></textarea></label>
          <div class="ajustes-actions-row"><button class="primary-button" type="button" data-ajustes-wizard-go="guardar">Ir a guardar</button></div>
        </article>
      </section>
    </section>
  `;
}

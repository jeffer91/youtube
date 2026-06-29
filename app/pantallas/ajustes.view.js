export function renderAjustesView() {
  return `
    <section class="aj-view-card ajustes-gemini-page" data-ajustes-root data-proceso-root="ajustes" data-proceso-paso-activo="activar">
      <div class="ajustes-hero">
        <div>
          <p class="eyebrow">Ajustes</p>
          <h2>Configuración general</h2>
          <p>Configura Gemini, fallback local, modelo y parámetros por pasos. La clave se guarda solo en esta computadora.</p>
        </div>
        <span class="aj-status-chip" id="ajustesStateChip">Gemini pendiente</span>
      </div>

      <div data-proceso-resumen="ajustes"></div>

      <section class="ajustes-flow" aria-label="Flujo guiado de ajustes">
        <button class="ajustes-step is-active" type="button" data-ajustes-wizard-go="activar" data-proceso-step="activar"><b>1</b><span><strong>Activar</strong><small>Gemini / fallback</small></span></button>
        <button class="ajustes-step is-locked" type="button" data-ajustes-wizard-go="clave" data-proceso-step="clave"><b>2</b><span><strong>Clave</strong><small>API local</small></span></button>
        <button class="ajustes-step is-locked" type="button" data-ajustes-wizard-go="modelo" data-proceso-step="modelo"><b>3</b><span><strong>Modelo</strong><small>Motor Gemini</small></span></button>
        <button class="ajustes-step is-locked" type="button" data-ajustes-wizard-go="parametros" data-proceso-step="parametros"><b>4</b><span><strong>Parámetros</strong><small>Temperatura / espera</small></span></button>
        <button class="ajustes-step is-locked" type="button" data-ajustes-wizard-go="probar" data-proceso-step="probar"><b>5</b><span><strong>Probar</strong><small>Conexión</small></span></button>
        <button class="ajustes-step is-locked" type="button" data-ajustes-wizard-go="guardar" data-proceso-step="guardar"><b>6</b><span><strong>Guardar</strong><small>Aplicar cambios</small></span></button>
        <button class="ajustes-step is-advanced" type="button" data-ajustes-wizard-go="avanzado" data-proceso-step="guia-fallback"><b>+</b><span><strong>Avanzado</strong><small>Guía y fallback</small></span></button>
      </section>

      <section id="ajustesMessage" class="ajustes-message" hidden></section>

      <section id="ajustesGeminiCard" class="settings-card gemini-settings-card ajustes-wizard">
        <article class="ajustes-wizard-panel is-active" data-ajustes-wizard-panel="activar">
          <div class="ajustes-panel-heading">
            <p class="eyebrow">Paso 1</p>
            <h3>Activar Gemini o mantener fallback local</h3>
            <p>Primero decide si la app usará Gemini. El fallback local evita que el video se detenga si Gemini falla.</p>
          </div>
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
          <div class="ajustes-panel-heading">
            <p class="eyebrow">Paso 2</p>
            <h3>Clave API Gemini</h3>
            <p>Pega la clave solo si usarás Gemini. Si no hay clave, el sistema puede trabajar con fallback local.</p>
          </div>
          <label class="textarea-row" for="ajustesGeminiCredencial"><span>Clave API Gemini</span><input id="ajustesGeminiCredencial" type="password" autocomplete="off" placeholder="Pega aquí tu clave API" /></label>
          <div class="ajustes-actions-row"><button class="secondary-button" type="button" data-ajustes-wizard-go="activar">Volver</button><button class="primary-button" type="button" data-ajustes-wizard-go="modelo">Continuar a modelo</button></div>
        </article>

        <article class="ajustes-wizard-panel" data-ajustes-wizard-panel="modelo" hidden>
          <div class="ajustes-panel-heading">
            <p class="eyebrow">Paso 3</p>
            <h3>Modelo Gemini</h3>
            <p>Define el modelo que usará el plan asistido, títulos, contexto editorial y análisis inteligente.</p>
          </div>
          <label class="select-row" for="ajustesGeminiModelo"><span>Modelo</span><input id="ajustesGeminiModelo" type="text" value="gemini-1.5-flash" /></label>
          <div class="ajustes-actions-row"><button class="secondary-button" type="button" data-ajustes-wizard-go="clave">Volver</button><button class="primary-button" type="button" data-ajustes-wizard-go="parametros">Continuar a parámetros</button></div>
        </article>

        <article class="ajustes-wizard-panel" data-ajustes-wizard-panel="parametros" hidden>
          <div class="ajustes-panel-heading">
            <p class="eyebrow">Paso 4</p>
            <h3>Parámetros de respuesta</h3>
            <p>Ajusta temperatura y tiempo de espera sin tocar la guía avanzada.</p>
          </div>
          <div class="settings-grid ajustes-settings-grid">
            <label class="select-row" for="ajustesGeminiTemperatura"><span>Temperatura</span><input id="ajustesGeminiTemperatura" type="number" min="0" max="1" step="0.05" value="0.35" /></label>
            <label class="select-row" for="ajustesGeminiTimeoutMs"><span>Tiempo espera ms</span><input id="ajustesGeminiTimeoutMs" type="number" min="10000" max="180000" step="1000" value="60000" /></label>
          </div>
          <div class="ajustes-actions-row"><button class="secondary-button" type="button" data-ajustes-wizard-go="modelo">Volver</button><button class="primary-button" type="button" data-ajustes-wizard-go="probar">Continuar a prueba</button></div>
        </article>

        <article class="ajustes-wizard-panel" data-ajustes-wizard-panel="probar" hidden>
          <div class="ajustes-panel-heading">
            <p class="eyebrow">Paso 5</p>
            <h3>Probar conexión</h3>
            <p>Ejecuta una prueba real con Gemini antes de guardar, especialmente si acabas de cambiar la clave o el modelo.</p>
          </div>
          <div class="ajustes-test-box">
            <strong>Prueba de Gemini</strong>
            <span>Usa el mismo botón y la misma API de prueba existentes.</span>
            <button id="ajustesTestGemini" class="secondary-button" type="button">Probar conexión</button>
          </div>
          <div class="ajustes-actions-row"><button class="secondary-button" type="button" data-ajustes-wizard-go="parametros">Volver</button><button class="primary-button" type="button" data-ajustes-wizard-go="guardar">Continuar a guardar</button></div>
        </article>

        <article class="ajustes-wizard-panel" data-ajustes-wizard-panel="guardar" hidden>
          <div class="ajustes-panel-heading">
            <p class="eyebrow">Paso 6</p>
            <h3>Guardar configuración</h3>
            <p>Guarda la configuración local. También puedes quitar la clave de esta computadora.</p>
          </div>
          <div class="aj-actions settings-actions ajustes-save-actions">
            <button id="ajustesSaveGemini" class="primary-button" type="button">Guardar Gemini</button>
            <button id="ajustesClearGemini" class="secondary-button" type="button">Quitar clave</button>
          </div>
          <p id="ajustesGeminiEstado" class="mini-summary">Gemini desactivado · fallback local activo</p>
        </article>

        <article class="ajustes-wizard-panel" data-ajustes-wizard-panel="avanzado" data-proceso-avanzado hidden>
          <div class="ajustes-panel-heading">
            <p class="eyebrow">Avanzado</p>
            <h3>Guía fija para Gemini</h3>
            <p>Esta guía da contexto editorial permanente a Gemini. Déjala aquí para no saturar los pasos principales.</p>
          </div>
          <label class="textarea-row" for="ajustesGeminiGuia"><span>Guía fija para Gemini</span><textarea id="ajustesGeminiGuia" rows="6" placeholder="Ejemplo: eres un editor profesional, crea ganchos visuales y textos claros."></textarea></label>
          <div class="ajustes-actions-row"><button class="primary-button" type="button" data-ajustes-wizard-go="guardar">Ir a guardar</button></div>
        </article>
      </section>
    </section>
  `;
}

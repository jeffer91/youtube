export function renderAjustesView() {
  return `
    <section class="aj-view-card ajustes-gemini-page">
      <p class="eyebrow">Ajustes</p>
      <h2>Configuración general</h2>
      <p>Configura Gemini, preferencias de edición, biblioteca y exportación. La clave se guarda solo en esta computadora.</p>

      <section id="ajustesGeminiCard" class="settings-card gemini-settings-card">
        <div class="settings-card__header">
          <div>
            <p class="eyebrow">Gemini</p>
            <h3>Clave API y contexto editorial</h3>
            <p>Gemini recibirá contexto de editor profesional, perfil, plataforma, transcripción, fotogramas, recursos y efectos permitidos.</p>
          </div>
        </div>

        <label class="toggle-row" for="ajustesUseGemini">
          <input id="ajustesUseGemini" type="checkbox" />
          <span><strong>Usar Gemini</strong><small>Activar análisis inteligente cuando haya clave API.</small></span>
        </label>

        <label class="toggle-row" for="ajustesUseFallbackGemini">
          <input id="ajustesUseFallbackGemini" type="checkbox" checked />
          <span><strong>Usar fallback local si Gemini falla</strong><small>El video no se detiene si falla la conexión.</small></span>
        </label>

        <div class="settings-grid">
          <label class="textarea-row" for="ajustesGeminiCredencial"><span>Clave API Gemini</span><input id="ajustesGeminiCredencial" type="password" autocomplete="off" placeholder="Pega aquí tu clave API" /></label>
          <label class="select-row" for="ajustesGeminiModelo"><span>Modelo</span><input id="ajustesGeminiModelo" type="text" value="gemini-1.5-flash" /></label>
          <label class="select-row" for="ajustesGeminiTemperatura"><span>Temperatura</span><input id="ajustesGeminiTemperatura" type="number" min="0" max="1" step="0.05" value="0.35" /></label>
          <label class="select-row" for="ajustesGeminiTimeoutMs"><span>Tiempo espera ms</span><input id="ajustesGeminiTimeoutMs" type="number" min="10000" max="180000" step="1000" value="60000" /></label>
        </div>

        <label class="textarea-row" for="ajustesGeminiGuia"><span>Guía fija para Gemini</span><textarea id="ajustesGeminiGuia" rows="5" placeholder="Ejemplo: eres un editor profesional, crea ganchos visuales y textos claros."></textarea></label>

        <div class="aj-actions settings-actions">
          <button id="ajustesSaveGemini" class="primary-button" type="button">Guardar Gemini</button>
          <button id="ajustesTestGemini" class="secondary-button" type="button">Probar conexión</button>
          <button id="ajustesClearGemini" class="secondary-button" type="button">Quitar clave</button>
        </div>

        <p id="ajustesGeminiEstado" class="mini-summary">Gemini desactivado · fallback local activo</p>
      </section>
    </section>
  `;
}

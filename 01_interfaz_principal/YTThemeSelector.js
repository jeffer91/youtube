/*
Nombre completo: YTThemeSelector.js
Ruta: 01_interfaz_principal/YTThemeSelector.js
Función o funciones:
  - Mostrar las temáticas de edición antes de procesar.
  - Evitar que la app intente adivinar todo desde cero.
  - Preparar opciones para Gemini y para la biblioteca de recursos.
Se conecta con:
  - 01_interfaz_principal/YTState.js
  - 01_interfaz_principal/YTScreenRouter.js
  - 01_interfaz_principal/YTScreenActions.js
*/

(function () {
  const THEMES = Object.freeze({
    "11_contra_11": {
      id: "11_contra_11",
      label: "11 contra 11",
      shortLabel: "Fútbol",
      description: "Edición dinámica para fútbol, jugadas, emoción, frases fuertes y ritmo rápido.",
      priority: "visual_energy",
      defaultMode: "standard"
    },
    crece_aula: {
      id: "crece_aula",
      label: "Crece Aula",
      shortLabel: "Educación",
      description: "Edición educativa con estructura clara, subtítulos limpios y explicación ordenada.",
      priority: "transcription_structure",
      defaultMode: "standard"
    },
    generico: {
      id: "generico",
      label: "Genérico",
      shortLabel: "General",
      description: "Edición limpia y adaptable cuando el proyecto no pertenece a una temática específica.",
      priority: "balanced",
      defaultMode: "standard"
    },
    institucional: {
      id: "institucional",
      label: "Institucional",
      shortLabel: "Formal",
      description: "Edición seria, sobria, elegante, profesional y con pocos efectos.",
      priority: "formal_message",
      defaultMode: "standard"
    },
    boca_rosa: {
      id: "boca_rosa",
      label: "Boca Rosa",
      shortLabel: "Tecnocumbia",
      description: "Edición para grupo de tecnocumbia. Puede ser musical o hablado.",
      priority: "music_or_speech",
      defaultMode: "musica",
      modes: [
        { id: "musica", label: "Boca Rosa música", description: "Prioriza imagen, ritmo, baile, energía y cambios de plano." },
        { id: "hablado", label: "Boca Rosa hablado", description: "Prioriza transcripción, mensaje, cortes claros y presencia del grupo." }
      ]
    }
  });

  function escapeText(value) {
    return window.YTLayout && window.YTLayout.escapeText ? window.YTLayout.escapeText(value) : String(value ?? "");
  }

  function normalizeTheme(theme) {
    const value = String(theme || "").trim().toLowerCase();
    return THEMES[value] ? value : "generico";
  }

  function normalizeMode(theme, mode) {
    const themeId = normalizeTheme(theme);
    const currentTheme = THEMES[themeId];
    if (!currentTheme.modes || !currentTheme.modes.length) return currentTheme.defaultMode || "standard";
    const value = String(mode || currentTheme.defaultMode || "").trim().toLowerCase();
    return currentTheme.modes.some((item) => item.id === value) ? value : currentTheme.defaultMode;
  }

  function getTheme(theme) {
    return THEMES[normalizeTheme(theme)];
  }

  function getThemeLabel(theme, mode) {
    const themeData = getTheme(theme);
    const modeId = normalizeMode(themeData.id, mode);
    if (themeData.id === "boca_rosa") {
      const found = themeData.modes.find((item) => item.id === modeId);
      return found ? found.label : themeData.label;
    }
    return themeData.label;
  }

  function renderModeSelector(state) {
    const selectedTheme = normalizeTheme(state.selectedTheme);
    const selectedMode = normalizeMode(selectedTheme, state.selectedThemeMode);
    const themeData = THEMES[selectedTheme];
    if (!themeData.modes || !themeData.modes.length) return "";

    return `
      <div class="yt-theme-mode-box">
        <p class="yt-theme-mode-title">Tipo de contenido Boca Rosa</p>
        <div class="yt-theme-mode-options">
          ${themeData.modes.map((mode) => `
            <label class="yt-theme-mode-option ${selectedMode === mode.id ? "is-selected" : ""}">
              <input type="radio" name="yt-theme-mode" value="${escapeText(mode.id)}" ${selectedMode === mode.id ? "checked" : ""} />
              <span><strong>${escapeText(mode.label)}</strong><small>${escapeText(mode.description)}</small></span>
            </label>
          `).join("")}
        </div>
      </div>`;
  }

  function render(state = {}) {
    const selectedTheme = normalizeTheme(state.selectedTheme);
    return `
      <section class="yt-theme-selector" aria-label="Selector de temática">
        <div class="yt-section-title-row">
          <div>
            <p class="yt-kicker">Temática del proyecto</p>
            <h3>Elige cómo debe pensar la edición</h3>
          </div>
          <span class="yt-pill">Por defecto: Genérico</span>
        </div>
        <p class="yt-muted">Primero cargas los videos. Después eliges la temática. La app transcribe, describe imágenes y organiza el video según este enfoque.</p>
        <div class="yt-theme-grid">
          ${Object.values(THEMES).map((theme) => `
            <label class="yt-theme-card ${selectedTheme === theme.id ? "is-selected" : ""}">
              <input type="radio" name="yt-theme" value="${escapeText(theme.id)}" ${selectedTheme === theme.id ? "checked" : ""} />
              <span class="yt-theme-card-body">
                <strong>${escapeText(theme.label)}</strong>
                <em>${escapeText(theme.shortLabel)}</em>
                <small>${escapeText(theme.description)}</small>
              </span>
            </label>
          `).join("")}
        </div>
        ${renderModeSelector(state)}
      </section>`;
  }

  function readFromDom() {
    const themeInput = document.querySelector('input[name="yt-theme"]:checked');
    const theme = normalizeTheme(themeInput ? themeInput.value : "generico");
    const modeInput = document.querySelector('input[name="yt-theme-mode"]:checked');
    const mode = normalizeMode(theme, modeInput ? modeInput.value : undefined);
    const themeData = getTheme(theme);
    return {
      theme,
      themeMode: mode,
      themeLabel: getThemeLabel(theme, mode),
      themePriority: themeData.priority,
      themeDescription: themeData.description
    };
  }

  window.YTThemeSelector = {
    THEMES,
    render,
    readFromDom,
    getTheme,
    getThemeLabel,
    normalizeTheme,
    normalizeMode
  };
})();
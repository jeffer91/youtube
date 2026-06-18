/*
Nombre completo: YTLayout.js
Ruta: 01_interfaz_principal/YTLayout.js
Función o funciones:
  - Renderizar solo el shell base de la app.
  - Mantener header, resumen del proyecto, pasos y contenedor principal.
  - Dejar las pantallas específicas al router.
  - Modernizar la estructura visual sin cambiar el flujo funcional.
Se conecta con:
  - 01_interfaz_principal/YTState.js
  - 01_interfaz_principal/YTScreenRouter.js
  - 01_interfaz_principal/YTMessages.js
  - 01_interfaz_principal/YTRenderer.js
*/

(function () {
  const STEP_LABELS = [
    ["CREATE_PROJECT", "Proyecto"],
    ["LOAD_MATERIAL", "Videos"],
    ["AUTO_PROCESSING", "Procesar"],
    ["REVIEW_LONG_VIDEO", "Revisar"],
    ["SELECT_CLIPS", "Clips"],
    ["AUTO_EDITING", "Editar"],
    ["REVIEW_RESULTS", "Resultados"],
    ["EXPORT_ALL", "Exportar"],
    ["FINAL_PACKAGE", "Paquete"]
  ];

  const STATUS_LABELS = {
    EMPTY: "Sin iniciar",
    READY: "Listo",
    OK: "Correcto",
    ERROR: "Error",
    WARNING: "Advertencia",
    WAITING_USER: "Esperando revisión",
    PROCESSING: "Procesando",
    COMPLETED: "Completado"
  };

  function escapeText(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function getStepIndex(step) {
    const index = STEP_LABELS.findIndex((item) => item[0] === step);
    return index >= 0 ? index : 0;
  }

  function getStatusLabel(status) {
    const key = String(status || "EMPTY").toUpperCase();
    return STATUS_LABELS[key] || key;
  }

  function getProgressPercent(state) {
    const currentIndex = getStepIndex(state && state.currentStep);
    const maxIndex = Math.max(1, STEP_LABELS.length - 1);
    return Math.round((currentIndex / maxIndex) * 100);
  }

  function renderStepNav(state) {
    const safeState = state || {};
    const currentIndex = getStepIndex(safeState.currentStep);

    return STEP_LABELS.map(([key, label], index) => {
      const isActive = key === safeState.currentStep;
      const isDone = index < currentIndex;
      const className = [
        "yt-step-pill",
        isActive ? "yt-step-pill-active" : "",
        isDone ? "yt-step-pill-done" : ""
      ].filter(Boolean).join(" ");

      return `
        <button
          class="${className}"
          type="button"
          data-step-target="${escapeText(key)}"
          aria-current="${isActive ? "step" : "false"}"
          title="${escapeText(label)}"
        >
          <span class="yt-step-number">${index + 1}</span>
          <span class="yt-step-label">${escapeText(label)}</span>
        </button>
      `;
    }).join("");
  }

  function renderProjectSummary(state) {
    const safeState = state || {};
    const projectName = safeState.currentProject && safeState.currentProject.name
      ? safeState.currentProject.name
      : "Sin proyecto";

    const mediaCount = Array.isArray(safeState.mediaItems) ? safeState.mediaItems.length : 0;
    const mediaText = mediaCount === 0 ? "Sin videos" : mediaCount === 1 ? "1 video" : mediaCount + " videos";
    const statusLabel = getStatusLabel(safeState.workflowStatus || "EMPTY");
    const currentIndex = getStepIndex(safeState.currentStep);
    const currentStep = STEP_LABELS[currentIndex] ? STEP_LABELS[currentIndex][1] : "Proyecto";
    const progress = getProgressPercent(safeState);

    return `
      <section class="yt-summary-card" aria-label="Resumen del flujo">
        <div>
          <label>Proyecto</label>
          <strong title="${escapeText(projectName)}">${escapeText(projectName)}</strong>
        </div>
        <div>
          <label>Material</label>
          <strong>${escapeText(mediaText)}</strong>
        </div>
        <div>
          <label>Estado</label>
          <strong class="yt-status-pill">
            <span class="yt-status-dot" aria-hidden="true"></span>
            ${escapeText(statusLabel)}
          </strong>
        </div>
        <div class="yt-summary-progress">
          <label>Etapa actual</label>
          <strong>${escapeText(currentStep)} · ${progress}%</strong>
          <div class="yt-progress-track" aria-hidden="true">
            <div class="yt-progress-bar" style="width:${progress}%"></div>
          </div>
        </div>
      </section>
    `;
  }

  function renderAppShell(root, state) {
    if (!root) return;

    root.innerHTML = `
      <section class="yt-app-shell">
        <header class="yt-header">
          <div class="yt-header-main">
            <div class="yt-brand-mark" aria-hidden="true">AE</div>
            <div>
              <p class="yt-kicker">AutoEdit Studio</p>
              <h1>Editor automático por etapas</h1>
              <p class="yt-subtitle">
                Un flujo sobrio para convertir material bruto en clips, edición, exportación y paquete final.
              </p>
            </div>
          </div>

          <div class="yt-header-actions">
            <button type="button" class="yt-secondary-button" data-action="refresh-workflow">
              Actualizar
            </button>
            <button type="button" class="yt-secondary-button" data-action="reset-workflow">
              Nuevo flujo
            </button>
          </div>
        </header>

        ${renderProjectSummary(state || {})}

        <nav class="yt-step-nav" id="yt-step-nav" aria-label="Etapas del proyecto">
          ${renderStepNav(state || {})}
        </nav>

        <section id="yt-message-box" class="yt-message-box" aria-live="polite"></section>

        <section id="yt-screen-root" class="yt-screen-root"></section>

        <details class="yt-technical-details">
          <summary>Detalles técnicos</summary>
          <pre id="yt-result-box" class="yt-result-box"></pre>
        </details>
      </section>
    `;
  }

  function updateShellFromState(state) {
    const safeState = state || {};

    const nav = document.getElementById("yt-step-nav");
    if (nav) nav.innerHTML = renderStepNav(safeState);

    const oldSummary = document.querySelector(".yt-summary-card");
    if (oldSummary) oldSummary.outerHTML = renderProjectSummary(safeState);
  }

  function setMainContent(html) {
    const container = document.getElementById("yt-screen-root");
    if (container) container.innerHTML = html || "";
  }

  function refreshFromState() {
    const state = window.YTState && typeof window.YTState.getState === "function"
      ? window.YTState.getState()
      : {};

    updateShellFromState(state);

    if (
      window.YTScreenRouter &&
      typeof window.YTScreenRouter.resolveScreen === "function"
    ) {
      setMainContent(window.YTScreenRouter.resolveScreen(state));
    }
  }

  window.YTLayout = {
    escapeText,
    renderAppShell,
    updateShellFromState,
    setMainContent,
    refreshFromState
  };
})();
/*
Nombre completo: YTScreenActions.js
Ruta: 01_interfaz_principal/YTScreenActions.js
Función o funciones:
  - Centralizar acciones de la interfaz.
  - Enviar temática y opciones al flujo maestro.
Se conecta con:
  - YTState.js
  - YTThemeSelector.js
  - YTScreenRouter.js
  - YTMessages.js
  - YTWorkflow expuesto por preload
*/

(function () {
  function hasApi(name, method) {
    return Boolean(window[name] && typeof window[name][method] === "function");
  }

  function showMessage(message, type = "info") {
    if (window.YTMessages) window.YTMessages.showMessage(message, type);
  }

  function showResult(result) {
    if (window.YTMessages) window.YTMessages.showResult(result);
  }

  function rerender() {
    if (window.YTScreenRouter) window.YTScreenRouter.render();
  }

  function setWorkflowFromResult(result) {
    if (result && result.workflow && window.YTState) window.YTState.setWorkflow(result.workflow);
    if (result && result.project && window.YTState) window.YTState.setCurrentProject(result.project);
    if (result && Array.isArray(result.mediaItems) && window.YTState) window.YTState.setMaterial(result.mediaItems, result.mediaMode);
    if (result && result.smartProposal && window.YTState) window.YTState.setSmartProposal(result.smartProposal);
    if (result && result.proposal && window.YTState) window.YTState.setSmartProposal(result.proposal);
  }

  async function runAction(action, fn) {
    try {
      window.YTState.setBusy(true);
      showMessage("Ejecutando: " + action, "info");
      const result = await fn();
      setWorkflowFromResult(result);
      showResult(result);
      if (result && result.ok === false) showMessage(result.message || "No se pudo completar la acción.", "error");
      else showMessage(result && result.message ? result.message : "Acción completada.", "success");
      rerender();
      return result;
    } catch (error) {
      window.YTState.setError(error);
      showMessage(error.message || String(error), "error");
      showResult({ ok: false, status: "ERROR", message: error.message || String(error) });
      rerender();
      return { ok: false, status: "ERROR", message: error.message || String(error) };
    } finally {
      window.YTState.setBusy(false);
    }
  }

  async function createProjectFromForm(event) {
    event.preventDefault();
    const form = event.target;
    const projectName = form && form.elements && form.elements.projectName ? form.elements.projectName.value.trim() : "";
    const notes = form && form.elements && form.elements.notes ? form.elements.notes.value.trim() : "";
    if (!projectName) {
      showMessage("Escribe el nombre del proyecto.", "warning");
      return { ok: false, status: "WARNING", message: "Escribe el nombre del proyecto." };
    }
    return runAction("Crear proyecto", async () => window.YTWorkflow.startProject({ name: projectName, notes }));
  }

  async function selectMaterial() {
    return runAction("Cargar material", async () => {
      const selected = await window.YTVideo.selectMaterial();
      if (!selected || selected.ok === false) return selected;
      window.YTState.setMaterial(selected.mediaItems || [], selected.mediaMode);
      return window.YTWorkflow.attachMaterial({ mediaItems: selected.mediaItems || [], mediaMode: selected.mediaMode, sourceType: "ui" });
    });
  }

  function readThemeOptions() {
    const state = window.YTState ? window.YTState.getState() : {};
    const themeData = window.YTThemeSelector && typeof window.YTThemeSelector.readFromDom === "function"
      ? window.YTThemeSelector.readFromDom()
      : { theme: state.selectedTheme || "generico", themeMode: state.selectedThemeMode || "standard", themeLabel: state.selectedThemeLabel || "Genérico" };

    if (window.YTState) window.YTState.setTheme(themeData.theme, themeData.themeMode);

    return {
      selectedTheme: themeData.theme,
      selectedThemeMode: themeData.themeMode,
      selectedThemeLabel: themeData.themeLabel,
      themePriority: themeData.themePriority || "balanced",
      themeDescription: themeData.themeDescription || "",
      frameCaptureSeconds: 5,
      processVideosMode: "one_by_one",
      exportTargets: window.YTState ? window.YTState.DEFAULT_EXPORT_TARGETS : [],
      useGemini: true,
      sendFullVideoToGemini: false,
      sendTranscriptionToGemini: true,
      sendVisualDescriptionsToGemini: true,
      fallbackMode: "basic_local"
    };
  }

  async function processAutomatically() {
    if (!hasApi("YTWorkflow", "processAutomatically")) {
      showMessage("El flujo maestro no está disponible para procesar.", "error");
      return { ok: false, status: "ERROR", message: "El flujo maestro no está disponible para procesar." };
    }

    const state = window.YTState ? window.YTState.getState() : {};
    const mediaItems = Array.isArray(state.mediaItems) ? state.mediaItems : [];
    if (!mediaItems.length) {
      showMessage("Primero carga uno o varios videos.", "warning");
      return { ok: false, status: "WARNING", message: "Primero carga uno o varios videos." };
    }

    const options = readThemeOptions();
    window.YTState.setSmartProcessing({ status: "RUNNING", currentVideoIndex: 0, totalVideos: mediaItems.length, percent: 0, message: "Procesando videos uno por uno." });

    return runAction("Organización inteligente", async () => window.YTWorkflow.processAutomatically({
      ...options,
      mediaItems,
      mediaMode: state.mediaMode,
      projectId: state.currentProject ? state.currentProject.id : "",
      projectName: state.currentProject ? state.currentProject.name : ""
    }));
  }

  async function approveReview() {
    const state = window.YTState ? window.YTState.getState() : {};
    const approvedOrder = Array.isArray(state.approvedOrder) && state.approvedOrder.length
      ? state.approvedOrder
      : Array.isArray(state.mediaItems) ? state.mediaItems.map((item, index) => ({ id: item.id || item.path || `video_${index + 1}`, order: index + 1, name: item.name || `Video ${index + 1}` })) : [];

    return runAction("Aprobar revisión", async () => window.YTWorkflow.approveReview({
      nextStep: "SELECT_CLIPS",
      approvedOrder,
      selectedTheme: state.selectedTheme,
      selectedThemeMode: state.selectedThemeMode,
      selectedThemeLabel: state.selectedThemeLabel
    }));
  }

  async function advanceStep(step, status = "READY") {
    return runAction("Avanzar flujo", async () => window.YTWorkflow.advanceStep(step, { status }));
  }

  async function selectClips() {
    const selected = Array.from(document.querySelectorAll('input[name="selectedClip"]:checked')).map((input) => ({ id: input.value, status: "SELECTED" }));
    return runAction("Confirmar clips", async () => window.YTWorkflow.selectClips({ selectedClips: selected }));
  }

  async function resetWorkflow() {
    return runAction("Reiniciar flujo", async () => {
      const result = await window.YTWorkflow.reset();
      window.YTState.reset();
      return result;
    });
  }

  function handleThemeChange() {
    if (!window.YTState || !window.YTThemeSelector) return;
    const selected = window.YTThemeSelector.readFromDom();
    window.YTState.setTheme(selected.theme, selected.themeMode);
    rerender();
  }

  function handleClick(event) {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    const action = target.getAttribute("data-action");
    const actions = {
      "refresh-workflow": () => runAction("Actualizar flujo", async () => window.YTWorkflow.getCurrent()),
      "reset-workflow": resetWorkflow,
      "select-material": selectMaterial,
      "go-processing": () => advanceStep("PROCESSING", "READY"),
      "process-automatically": processAutomatically,
      "approve-review": approveReview,
      "go-review": () => advanceStep("REVIEW_LONG_VIDEO", "WAITING_USER"),
      "select-clips": selectClips,
      "advance-results": () => advanceStep("REVIEW_RESULTS", "WAITING_USER"),
      "approve-results": () => advanceStep("EXPORT_ALL", "READY"),
      "prepare-export": () => advanceStep("FINAL_PACKAGE", "READY"),
      "go-package": () => advanceStep("FINAL_PACKAGE", "READY"),
      "create-package": () => advanceStep("COMPLETED", "COMPLETED")
    };
    if (actions[action]) actions[action]();
  }

  function bind() {
    document.addEventListener("click", handleClick);
    document.addEventListener("change", (event) => {
      if (event.target && (event.target.name === "yt-theme" || event.target.name === "yt-theme-mode")) handleThemeChange();
    });
    document.addEventListener("submit", (event) => {
      if (event.target && event.target.id === "yt-create-project-form") createProjectFromForm(event);
    });
  }

  window.YTScreenActions = { bind, selectMaterial, processAutomatically, approveReview, selectClips, resetWorkflow };
})();

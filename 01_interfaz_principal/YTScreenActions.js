/*
Nombre completo: YTScreenActions.js
Ruta: 01_interfaz_principal/YTScreenActions.js
Función o funciones:
  - Centralizar las acciones visibles del usuario.
  - Reemplazar botones técnicos globales por acciones del flujo maestro.
  - Conectar crear proyecto, cargar material, procesar, aprobar, seleccionar clips, exportar y paquete.
Se conecta con:
  - 01_interfaz_principal/YTState.js
  - 01_interfaz_principal/YTScreenRouter.js
  - 01_interfaz_principal/YTMessages.js
  - 00_base_app/YTPreload.js
  - 12_flujo_maestro/YTWorkflowIpc.js
*/

(function () {
  function hasApi(name, method) {
    return Boolean(window[name] && typeof window[name][method] === "function");
  }

  function showResult(result) {
    if (window.YTMessages) window.YTMessages.showResult(result);
  }

  function showMessage(message, type = "info") {
    if (window.YTMessages) window.YTMessages.showMessage(message, type);
  }

  function rerender() {
    if (window.YTScreenRouter) window.YTScreenRouter.render();
  }

  function setWorkflowFromResult(result) {
    if (result && result.workflow && window.YTState) window.YTState.setWorkflow(result.workflow);
    if (result && result.project && window.YTState) window.YTState.setCurrentProject(result.project);
    if (result && Array.isArray(result.mediaItems) && window.YTState) window.YTState.setMaterial(result.mediaItems, result.mediaMode);
  }

  async function runAction(action, fn) {
    try {
      window.YTState.setBusy(true);
      showMessage("Ejecutando: " + action, "info");
      const result = await fn();
      setWorkflowFromResult(result);
      showResult(result);
      if (result && result.ok === false) showMessage(result.message || "No se pudo completar la acción.", "error");
      else showMessage(result.message || "Acción completada.", "success");
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

  async function refreshWorkflow() {
    if (!hasApi("YTWorkflow", "getCurrent")) {
      showMessage("YTWorkflow no está disponible en preload.", "error");
      return;
    }
    return runAction("Actualizar flujo", async () => {
      const result = await window.YTWorkflow.getCurrent();
      setWorkflowFromResult(result);
      return result;
    });
  }

async function createProjectFromForm(event) {
  event.preventDefault();

  const form = event.target;
  const projectNameInput = form && form.elements ? form.elements.projectName : null;
  const notesInput = form && form.elements ? form.elements.notes : null;

  const projectName = projectNameInput ? projectNameInput.value.trim() : "";
  const notes = notesInput ? notesInput.value.trim() : "";

  if (!projectName) {
    showMessage("Escribe el nombre del proyecto.", "warning");
    return;
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

  async function processAutomatically() {
    return runAction("Procesar automáticamente", async () => window.YTWorkflow.processAutomatically({}));
  }

  async function approveReview() {
    return runAction("Aprobar revisión", async () => window.YTWorkflow.approveReview({ nextStep: "SELECT_CLIPS" }));
  }

  async function goReview() {
    return runAction("Ir a revisión", async () => window.YTWorkflow.advanceStep("REVIEW_LONG_VIDEO", { status: "WAITING_USER" }));
  }

  async function selectClips() {
    const selected = Array.from(document.querySelectorAll('input[name="selectedClip"]:checked')).map((input) => ({ id: input.value, status: "SELECTED" }));
    return runAction("Confirmar clips", async () => window.YTWorkflow.selectClips({ selectedClips: selected }));
  }

  async function advanceResults() {
    return runAction("Ir a resultados", async () => window.YTWorkflow.advanceStep("REVIEW_RESULTS", { status: "WAITING_USER" }));
  }

  async function approveResults() {
    return runAction("Aprobar resultados", async () => window.YTWorkflow.advanceStep("EXPORT_ALL", { status: "READY" }));
  }

  async function prepareExport() {
    return runAction("Preparar exportación", async () => {
      let exportPlan = null;
      if (window.YTExport && typeof window.YTExport.createPlan === "function") {
        exportPlan = await window.YTExport.createPlan({});
        window.YTState.setCurrentExportPlan(exportPlan);
      }
      const workflow = await window.YTWorkflow.advanceStep("FINAL_PACKAGE", { status: "READY" });
      return { ok: true, status: "OK", message: "Exportación preparada. La exportación total se completará en el bloque de exportación.", exportPlan, workflow: workflow.workflow || null };
    });
  }

  async function goPackage() {
    return runAction("Ir a paquete final", async () => window.YTWorkflow.advanceStep("FINAL_PACKAGE", { status: "READY" }));
  }

  async function createPackage() {
    return runAction("Crear paquete final", async () => {
      let packageResult = null;
      if (window.YTExport && typeof window.YTExport.createPackage === "function") {
        packageResult = await window.YTExport.createPackage({});
        window.YTState.setCurrentExportPackage(packageResult);
      }
      const workflow = await window.YTWorkflow.advanceStep("COMPLETED", { status: "COMPLETED" });
      return { ok: true, status: "OK", message: "Paquete final preparado. La estructura completa se ajustará en el bloque de exportación.", packageResult, workflow: workflow.workflow || null };
    });
  }

  async function resetWorkflow() {
    return runAction("Reiniciar flujo", async () => {
      const result = await window.YTWorkflow.reset();
      window.YTState.reset();
      return result;
    });
  }

  function handleClick(event) {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    const action = target.getAttribute("data-action");
    const actions = {
      "refresh-workflow": refreshWorkflow,
      "reset-workflow": resetWorkflow,
      "select-material": selectMaterial,
      "process-automatically": processAutomatically,
      "approve-review": approveReview,
      "go-review": goReview,
      "select-clips": selectClips,
      "advance-results": advanceResults,
      "approve-results": approveResults,
      "prepare-export": prepareExport,
      "go-package": goPackage,
      "create-package": createPackage
    };
    if (actions[action]) actions[action]();
  }

  function bind() {
    document.addEventListener("click", handleClick);
    document.addEventListener("submit", (event) => {
      if (event.target && event.target.id === "yt-create-project-form") createProjectFromForm(event);
    });
  }

  window.YTScreenActions = { bind, refreshWorkflow, selectMaterial, processAutomatically, approveReview, selectClips, resetWorkflow };
})();

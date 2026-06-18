/*
Nombre completo: YTRenderer.js
Ruta: 01_interfaz_principal/YTRenderer.js
Función o funciones:
  - Iniciar la interfaz principal.
  - Cargar la sesión actual del workflow.
  - Renderizar el shell y la pantalla correcta según la etapa.
  - Enlazar acciones visibles del usuario.
Se conecta con:
  - 01_interfaz_principal/YTState.js
  - 01_interfaz_principal/YTLayout.js
  - 01_interfaz_principal/YTScreenRouter.js
  - 01_interfaz_principal/YTScreenActions.js
  - 01_interfaz_principal/YTMessages.js
  - 00_base_app/YTPreload.js
*/

(function () {
  async function loadInitialWorkflow() {
    if (!window.YTWorkflow || typeof window.YTWorkflow.getCurrent !== "function") {
      return { ok: false, status: "ERROR", message: "YTWorkflow no está disponible. Revisa YTPreload.js y YTIpc.js." };
    }

    const result = await window.YTWorkflow.getCurrent();

    if (result && result.workflow && window.YTState) window.YTState.setWorkflow(result.workflow);
    if (result && result.project && window.YTState) window.YTState.setCurrentProject(result.project);

    return result;
  }

  async function init() {
    const root = document.getElementById("yt-app-root");
    if (!root) {
      console.error("[YTRenderer] No existe #yt-app-root.");
      return;
    }

    if (!window.YTState || !window.YTLayout || !window.YTScreenRouter || !window.YTScreenActions) {
      root.innerHTML = `<section style="padding:20px;font-family:Arial,sans-serif"><h1>AutoEdit Studio</h1><p>No se cargaron todos los módulos de interfaz.</p></section>`;
      return;
    }

    window.YTLayout.renderAppShell(root, window.YTState.getState());

    try {
      const workflowResult = await loadInitialWorkflow();
      if (workflowResult && workflowResult.ok === false) {
        window.YTMessages.showMessage(workflowResult.message || "No se pudo cargar el flujo.", "warning");
        window.YTMessages.showResult(workflowResult);
      } else {
        const state = window.YTState.getState();
        window.YTMessages.showStageMessage(state.currentStep, state.workflowStatus);
        window.YTMessages.showResult(workflowResult);
      }
    } catch (error) {
      window.YTState.setError(error);
      window.YTMessages.showMessage(error.message || String(error), "error");
      window.YTMessages.showResult({ ok: false, status: "ERROR", message: error.message || String(error) });
    }

    window.YTScreenRouter.render();
    window.YTScreenActions.bind();
  }

  window.addEventListener("DOMContentLoaded", init);
})();

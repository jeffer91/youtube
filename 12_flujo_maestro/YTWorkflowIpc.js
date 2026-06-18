/*
  Nombre completo: YTWorkflowIpc.js
  Ruta: 12_flujo_maestro/YTWorkflowIpc.js
  Función o funciones:
    - Registrar canales IPC seguros para el flujo maestro.
    - Conectar frontend con YTWorkflowService.
    - Mantener compatibilidad con nombres anteriores y nuevos.
  Se conecta con:
    - 12_flujo_maestro/YTWorkflowService.js
    - 00_base_app/YTIpc.js
    - 00_base_app/YTPreload.js
*/

function getService() {
  return require("./YTWorkflowService");
}

function registerWorkflowIpc({ safeHandle }) {
  if (typeof safeHandle !== "function") {
    throw new Error("registerWorkflowIpc necesita safeHandle.");
  }

  safeHandle("YT_WORKFLOW_GET_CURRENT", async () => getService().getCurrentWorkflow());

  safeHandle("YT_WORKFLOW_START_PROJECT", async (_event, payload = {}) => getService().createWorkflowProject(payload || {}));
  safeHandle("YT_WORKFLOW_CREATE_PROJECT", async (_event, payload = {}) => getService().createWorkflowProject(payload || {}));

  safeHandle("YT_WORKFLOW_ATTACH_MATERIAL", async (_event, payload = {}) => getService().attachMaterialToWorkflow(payload || {}));

  safeHandle("YT_WORKFLOW_SET_THEME", async (_event, payload = {}) => getService().setThemeForWorkflow(payload || {}));

  safeHandle("YT_WORKFLOW_START_PROCESSING", async (_event, payload = {}) => getService().startAutomaticProcessing(payload || {}));
  safeHandle("YT_WORKFLOW_PROCESS_AUTO", async (_event, payload = {}) => getService().startAutomaticProcessing(payload || {}));
  safeHandle("YT_WORKFLOW_PROCESS_AUTOMATICALLY", async (_event, payload = {}) => getService().startAutomaticProcessing(payload || {}));
  safeHandle("YT_WORKFLOW_PROCESS_SMART", async (_event, payload = {}) => getService().startAutomaticProcessing(payload || {}));

  safeHandle("YT_WORKFLOW_APPROVE_STEP", async (_event, payload = {}) => getService().approveCurrentStep(payload || {}));
  safeHandle("YT_WORKFLOW_APPROVE_REVIEW", async (_event, payload = {}) => getService().approveWorkflowReview(payload || {}));
  safeHandle("YT_WORKFLOW_APPROVE_PROPOSAL", async (_event, payload = {}) => getService().approveWorkflowReview(payload || {}));

  safeHandle("YT_WORKFLOW_SELECT_CLIPS", async (_event, payload = {}) => getService().saveClipSelections(payload || {}));

  safeHandle("YT_WORKFLOW_ADVANCE_STEP", async (_event, payload = {}) => getService().advanceWorkflowStep(payload.step || payload.currentStep, payload || {}));

  safeHandle("YT_WORKFLOW_REORDER_VIDEOS", async (_event, payload = {}) => getService().reorderWorkflowVideos(payload || {}));

  safeHandle("YT_WORKFLOW_EXPORT_ALL", async (_event, payload = {}) => getService().exportAll(payload || {}));
  safeHandle("YT_WORKFLOW_CREATE_PACKAGE", async (_event, payload = {}) => getService().createFinalPackage(payload || {}));

  safeHandle("YT_WORKFLOW_RESET", async () => getService().resetWorkflow());

  safeHandle("YT_WORKFLOW_CHECK", async () => require("./YTWorkflowCheck").runWorkflowCheck());
}

module.exports = { registerWorkflowIpc };

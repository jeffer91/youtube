/*
  Nombre completo: YTWorkflowIpc.js
  Ruta: 12_flujo_maestro/YTWorkflowIpc.js
  Función o funciones:
    - Exponer canales IPC seguros para el flujo maestro.
    - Permitir que la interfaz avance por etapas sin llamar a servicios técnicos separados.
    - Centralizar acciones visibles: crear proyecto, cargar material, procesar, aprobar, seleccionar clips, exportar y paquete.
  Se conecta con:
    - 12_flujo_maestro/YTWorkflowService.js
    - 12_flujo_maestro/YTWorkflowCheck.js
    - 00_base_app/YTIpc.js
    - 00_base_app/YTPreload.js
*/

function registerWorkflowIpc({ safeHandle }) {
  if (typeof safeHandle !== "function") throw new Error("registerWorkflowIpc necesita safeHandle.");

  const service = require("./YTWorkflowService");
  const check = require("./YTWorkflowCheck");

  safeHandle("YT_WORKFLOW_GET_CURRENT", async () => service.getCurrentWorkflow());

  /*
    Canal nuevo usado por YTPreload.js:
    window.YTWorkflow.startProject() -> YT_WORKFLOW_START_PROJECT
  */
  safeHandle("YT_WORKFLOW_START_PROJECT", async (_event, payload = {}) => {
    return service.createWorkflowProject(payload || {});
  });

  /*
    Canal anterior. Se conserva para no romper compatibilidad.
  */
  safeHandle("YT_WORKFLOW_CREATE_PROJECT", async (_event, payload = {}) => {
    return service.createWorkflowProject(payload || {});
  });

  safeHandle("YT_WORKFLOW_ATTACH_MATERIAL", async (_event, payload = {}) => {
    return service.attachMaterialToWorkflow(payload || {});
  });

  safeHandle("YT_WORKFLOW_START_PROCESSING", async (_event, payload = {}) => {
    return service.startAutomaticProcessing(payload || {});
  });

  safeHandle("YT_WORKFLOW_PROCESS_AUTO", async (_event, payload = {}) => {
    return service.startAutomaticProcessing(payload || {});
  });

  safeHandle("YT_WORKFLOW_APPROVE_STEP", async (_event, payload = {}) => {
    return service.approveCurrentStep(payload || {});
  });

  safeHandle("YT_WORKFLOW_APPROVE_REVIEW", async (_event, payload = {}) => {
    return service.approveCurrentStep(payload || {});
  });

  safeHandle("YT_WORKFLOW_SELECT_CLIPS", async (_event, payload = {}) => {
    return service.saveClipSelections(payload || {});
  });

  safeHandle("YT_WORKFLOW_EXPORT_ALL", async (_event, payload = {}) => {
    return service.exportAll(payload || {});
  });

  safeHandle("YT_WORKFLOW_CREATE_PACKAGE", async (_event, payload = {}) => {
    return service.createFinalPackage(payload || {});
  });

  safeHandle("YT_WORKFLOW_RESET", async () => service.resetWorkflow());

  safeHandle("YT_WORKFLOW_CHECK", async () => check.runWorkflowCheck());
}

module.exports = { registerWorkflowIpc };
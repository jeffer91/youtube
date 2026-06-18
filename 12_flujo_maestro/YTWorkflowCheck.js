/*
  Nombre completo: YTWorkflowCheck.js
  Ruta: 12_flujo_maestro/YTWorkflowCheck.js
  Función o funciones:
    - Diagnosticar que exista el flujo maestro y sus dependencias mínimas.
    - Validar que el proceso ya no dependa únicamente de botones técnicos visibles.
    - Comprobar modelo, store, service e IPC del flujo.
  Se conecta con:
    - 12_flujo_maestro/YTWorkflowModel.js
    - 12_flujo_maestro/YTWorkflowStore.js
    - 12_flujo_maestro/YTWorkflowService.js
    - 12_flujo_maestro/YTWorkflowIpc.js
    - 05_diagnostico/YTDiagnosticRegistry.js
*/

const fs = require("fs");
const path = require("path");

function fileStatus(filePath, label) {
  const exists = fs.existsSync(filePath);
  return {
    label,
    path: filePath,
    ok: exists,
    status: exists ? "OK" : "ERROR",
    message: exists ? "Archivo encontrado." : "Archivo faltante."
  };
}

function functionStatus(moduleObject, functionName, label) {
  const ok = !!moduleObject && typeof moduleObject[functionName] === "function";
  return {
    label,
    functionName,
    ok,
    status: ok ? "OK" : "ERROR",
    message: ok ? "Función disponible." : "Función faltante."
  };
}

function runWorkflowCheck() {
  const root = __dirname;
  const files = [
    fileStatus(path.join(root, "YTWorkflowModel.js"), "Modelo del flujo"),
    fileStatus(path.join(root, "YTWorkflowStore.js"), "Persistencia del flujo"),
    fileStatus(path.join(root, "YTWorkflowService.js"), "Servicio orquestador"),
    fileStatus(path.join(root, "YTWorkflowIpc.js"), "IPC del flujo"),
    fileStatus(path.join(root, "YTWorkflowCheck.js"), "Diagnóstico del flujo")
  ];

  let model = null;
  let store = null;
  let service = null;
  let ipc = null;
  try { model = require("./YTWorkflowModel"); } catch (_error) {}
  try { store = require("./YTWorkflowStore"); } catch (_error) {}
  try { service = require("./YTWorkflowService"); } catch (_error) {}
  try { ipc = require("./YTWorkflowIpc"); } catch (_error) {}

  const functions = [
    functionStatus(model, "createWorkflowSession", "Crear sesión de flujo"),
    functionStatus(model, "updateTask", "Actualizar tareas"),
    functionStatus(store, "loadWorkflowSession", "Cargar sesión"),
    functionStatus(store, "saveWorkflowEverywhere", "Guardar sesión global/proyecto"),
    functionStatus(service, "createWorkflowProject", "Crear proyecto desde workflow"),
    functionStatus(service, "attachMaterialToWorkflow", "Cargar material desde workflow"),
    functionStatus(service, "startAutomaticProcessing", "Procesamiento automático"),
    functionStatus(service, "exportAll", "Exportar todo"),
    functionStatus(ipc, "registerWorkflowIpc", "Registrar IPC del workflow")
  ];

  const checks = [...files, ...functions];
  const okCount = checks.filter((item) => item.ok).length;
  const errorCount = checks.length - okCount;
  return {
    ok: errorCount === 0,
    status: errorCount === 0 ? "OK" : "ERROR",
    block: "12_flujo_maestro",
    message: errorCount === 0 ? "Flujo maestro listo." : "El flujo maestro tiene archivos o funciones faltantes.",
    count: checks.length,
    okCount,
    errorCount,
    checks,
    updatedAt: new Date().toISOString()
  };
}

module.exports = { runWorkflowCheck };

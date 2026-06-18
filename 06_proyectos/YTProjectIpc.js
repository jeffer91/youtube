/*
  Nombre completo: YTProjectIpc.js
  Ruta: 06_proyectos/YTProjectIpc.js
  Función o funciones:
    - Registrar canales IPC para proyectos.
    - Agregar creación de proyecto por nombre sin exigir video inicial.
    - Mantener compatibilidad con el canal antiguo de crear desde video.
  Se conecta con:
    - 06_proyectos/YTProjectService.js
    - 06_proyectos/YTProjectCheck.js
    - 00_base_app/YTIpc.js
    - 00_base_app/YTPreload.js
    - 12_flujo_maestro/YTWorkflowService.js
*/

function registerProjectIpc({ safeHandle }) {
  if (typeof safeHandle !== "function") throw new Error("registerProjectIpc necesita safeHandle.");

  safeHandle("YT_PROJECT_CREATE_BY_NAME", async (_event, payload = {}) => require("./YTProjectService").createProjectByName(payload || {}));
  safeHandle("YT_PROJECT_CREATE_FROM_VIDEO", async (_event, payload = {}) => require("./YTProjectService").createProjectFromCurrentVideo(payload || {}));
  safeHandle("YT_PROJECT_LIST", async () => require("./YTProjectService").getProjects());
  safeHandle("YT_PROJECT_GET_CURRENT", async () => require("./YTProjectService").getCurrentProject());
  safeHandle("YT_PROJECT_OPEN", async (_event, payload = {}) => require("./YTProjectService").openProject(payload.projectId));
  safeHandle("YT_PROJECT_SAVE_CURRENT", async (_event, payload = {}) => require("./YTProjectService").saveCurrentProjectChanges(payload.changes || {}));
  safeHandle("YT_PROJECT_CHECK", async () => require("./YTProjectCheck").runProjectCheck());
}

module.exports = { registerProjectIpc };

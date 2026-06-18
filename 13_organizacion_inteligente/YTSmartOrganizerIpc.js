/*
Nombre completo: YTSmartOrganizerIpc.js
Ruta: 13_organizacion_inteligente/YTSmartOrganizerIpc.js
Función o funciones:
  - Registrar canales IPC de organización inteligente.
  - Permitir guardar configuración Gemini, organizar con Gemini y consultar propuestas.
Se conecta con:
  - YTSmartOrganizerService.js
  - YTGeminiConfigStore.js
  - YTIpc.js
*/

function registerSmartOrganizerIpc({ safeHandle }) {
  if (typeof safeHandle !== "function") {
    throw new Error("registerSmartOrganizerIpc necesita safeHandle.");
  }

  const service = require("./YTSmartOrganizerService");
  const geminiConfig = require("./YTGeminiConfigStore");
  const themeService = require("./YTThemeService");

  safeHandle("YT_SMART_ORGANIZE", async (_event, payload = {}) => {
    return service.organizeWithGemini(payload || {});
  });

  safeHandle("YT_SMART_ORGANIZE_LOCAL", async (_event, payload = {}) => {
    return service.organizeLocal(payload || {});
  });

  safeHandle("YT_SMART_GET_CURRENT", async () => {
    return service.getCurrentOrganization();
  });

  safeHandle("YT_SMART_GET_PROJECT", async (_event, payload = {}) => {
    return service.getProjectOrganization(payload.projectId || "");
  });

  safeHandle("YT_GEMINI_GET_CONFIG", async () => {
    return geminiConfig.loadGeminiConfig();
  });

  safeHandle("YT_GEMINI_SAVE_CONFIG", async (_event, payload = {}) => {
    return geminiConfig.saveGeminiConfig(payload || {});
  });

  safeHandle("YT_GEMINI_CLEAR_KEY", async () => {
    return geminiConfig.clearGeminiKey();
  });

  safeHandle("YT_THEME_LIST", async () => {
    return themeService.getAvailableThemes();
  });

  safeHandle("YT_THEME_SAVE_SELECTED", async (_event, payload = {}) => {
    return themeService.saveSelectedTheme(payload || {});
  });

  safeHandle("YT_THEME_LOAD_SELECTED", async () => {
    return themeService.loadSelectedTheme();
  });
}

module.exports = { registerSmartOrganizerIpc };

/*
Nombre completo: YTThemeService.js
Ruta: 13_organizacion_inteligente/YTThemeService.js
Función o funciones:
  - Guardar y cargar la temática seleccionada.
  - Crear carpetas de biblioteca por temática.
  - Entregar plan de recursos para edición automática.
Se conecta con:
  - YTThemeConfig.js
  - YTWorkflowService.js
  - YTLibraryService.js
*/

const fs = require("fs");
const path = require("path");
const { normalizeTheme, normalizeMode, getThemeConfig, listThemes } = require("./YTThemeConfig");

const ROOT_DIR = path.resolve(__dirname, "..");
const USER_DATA_DIR = path.join(ROOT_DIR, "user_data");
const DATABASE_DIR = path.join(USER_DATA_DIR, "database");
const THEME_SESSION_PATH = path.join(DATABASE_DIR, "YTThemeSession.json");
const LIBRARY_THEMES_DIR = path.join(USER_DATA_DIR, "media", "library", "themes");

const RESOURCE_FOLDERS = ["intro", "outro", "logos", "musica", "efectos", "overlays", "fondos", "subtitulos"];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    return fallback;
  }
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  return data;
}

function ensureThemeFolders(theme = "generico", mode = "standard") {
  const config = getThemeConfig(theme, mode);
  const baseThemePath = path.join(LIBRARY_THEMES_DIR, config.resourceFolder);
  const fallbackPath = path.join(LIBRARY_THEMES_DIR, "fallback");
  RESOURCE_FOLDERS.forEach((folder) => ensureDir(path.join(baseThemePath, folder)));
  RESOURCE_FOLDERS.forEach((folder) => ensureDir(path.join(fallbackPath, folder)));
  return {
    themePath: baseThemePath,
    fallbackPath,
    folders: RESOURCE_FOLDERS.map((folder) => ({ role: folder, path: path.join(baseThemePath, folder), fallbackPath: path.join(fallbackPath, folder) }))
  };
}

function buildResourcePlan(theme = "generico", mode = "standard") {
  const config = getThemeConfig(theme, mode);
  const folders = ensureThemeFolders(theme, mode);
  return {
    theme: config.id,
    themeMode: config.selectedMode,
    themeLabel: config.selectedLabel,
    resourceFolder: config.resourceFolder,
    strategy: "automatic_with_fallback",
    rule: "La app usa recursos de la temática. Si faltan, usa fallback genérico.",
    items: folders.folders.map((folder) => ({ role: folder.role, preferredPath: folder.path, fallbackPath: folder.fallbackPath, required: ["logos", "subtitulos"].includes(folder.role), status: "PENDING_SCAN" })),
    updatedAt: new Date().toISOString()
  };
}

function saveSelectedTheme(payload = {}) {
  const theme = normalizeTheme(payload.theme || payload.selectedTheme);
  const themeMode = normalizeMode(theme, payload.themeMode || payload.selectedThemeMode);
  const config = getThemeConfig(theme, themeMode);
  const session = {
    app: "AutoEdit Studio",
    block: "13_organizacion_inteligente",
    selectedTheme: theme,
    selectedThemeMode: themeMode,
    selectedThemeLabel: payload.themeLabel || payload.selectedThemeLabel || config.selectedLabel,
    config,
    resourcePlan: buildResourcePlan(theme, themeMode),
    folders: ensureThemeFolders(theme, themeMode),
    updatedAt: new Date().toISOString()
  };
  writeJson(THEME_SESSION_PATH, session);
  return { ok: true, status: "OK", message: "Temática guardada correctamente.", session };
}

function loadSelectedTheme() {
  const session = readJson(THEME_SESSION_PATH, null);
  if (session) return { ok: true, status: "OK", message: "Temática cargada.", session };
  return saveSelectedTheme({ theme: "generico", themeMode: "standard", themeLabel: "Genérico" });
}

function getThemeResourcePlan(theme = "generico", mode = "standard") {
  return buildResourcePlan(theme, mode);
}

function getAvailableThemes() {
  return { ok: true, status: "OK", themes: listThemes() };
}

module.exports = { RESOURCE_FOLDERS, ensureThemeFolders, saveSelectedTheme, loadSelectedTheme, buildResourcePlan, getThemeResourcePlan, getAvailableThemes };

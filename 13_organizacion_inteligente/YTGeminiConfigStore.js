/*
Nombre completo: YTGeminiConfigStore.js
Ruta: 13_organizacion_inteligente/YTGeminiConfigStore.js
Función o funciones:
  - Guardar y cargar configuración local de Gemini.
  - Evitar claves quemadas en el código.
  - Permitir modo gratuito con fallback local si no hay API key.
Se conecta con:
  - YTGeminiClient.js
  - YTSmartOrganizerService.js
*/

const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const USER_DATA_DIR = path.join(ROOT_DIR, "user_data");
const DATABASE_DIR = path.join(USER_DATA_DIR, "database");
const CONFIG_PATH = path.join(DATABASE_DIR, "YTGeminiConfig.json");

const DEFAULT_CONFIG = Object.freeze({
  enabled: true,
  provider: "gemini",
  model: "gemini-1.5-flash",
  apiKey: "",
  apiKeySource: "local_file_or_env",
  sendFullVideo: false,
  sendTranscription: true,
  sendVisualDescriptions: true,
  maxInputCharacters: 28000,
  temperature: 0.35,
  topP: 0.9,
  timeoutMs: 45000,
  fallbackMode: "basic_local",
  updatedAt: null
});

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function safeReadJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    return fallback;
  }
}

function safeWriteJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  return data;
}

function sanitizeConfig(config = {}) {
  const merged = { ...DEFAULT_CONFIG, ...(config || {}) };
  merged.enabled = Boolean(merged.enabled);
  merged.model = String(merged.model || DEFAULT_CONFIG.model).trim() || DEFAULT_CONFIG.model;
  merged.apiKey = String(merged.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "").trim();
  merged.sendFullVideo = false;
  merged.sendTranscription = merged.sendTranscription !== false;
  merged.sendVisualDescriptions = merged.sendVisualDescriptions !== false;
  merged.maxInputCharacters = Math.max(4000, Number(merged.maxInputCharacters || DEFAULT_CONFIG.maxInputCharacters));
  merged.temperature = Number.isFinite(Number(merged.temperature)) ? Number(merged.temperature) : DEFAULT_CONFIG.temperature;
  merged.topP = Number.isFinite(Number(merged.topP)) ? Number(merged.topP) : DEFAULT_CONFIG.topP;
  merged.timeoutMs = Math.max(10000, Number(merged.timeoutMs || DEFAULT_CONFIG.timeoutMs));
  merged.fallbackMode = String(merged.fallbackMode || "basic_local");
  merged.updatedAt = merged.updatedAt || new Date().toISOString();
  return merged;
}

function loadGeminiConfig() {
  const fileConfig = safeReadJson(CONFIG_PATH, {});
  const config = sanitizeConfig(fileConfig);
  return {
    ok: true,
    status: "OK",
    message: config.apiKey ? "Configuración Gemini cargada." : "Configuración Gemini cargada sin API key. Se usará fallback local.",
    config: { ...config, apiKey: config.apiKey ? "********" : "" },
    hasApiKey: Boolean(config.apiKey),
    internalConfig: config
  };
}

function saveGeminiConfig(payload = {}) {
  const current = safeReadJson(CONFIG_PATH, {});
  const next = sanitizeConfig({ ...current, ...(payload || {}), updatedAt: new Date().toISOString() });
  safeWriteJson(CONFIG_PATH, next);
  return {
    ok: true,
    status: "OK",
    message: "Configuración Gemini guardada.",
    config: { ...next, apiKey: next.apiKey ? "********" : "" },
    hasApiKey: Boolean(next.apiKey)
  };
}

function getGeminiInternalConfig() {
  return loadGeminiConfig().internalConfig;
}

function clearGeminiKey() {
  const current = safeReadJson(CONFIG_PATH, {});
  const next = sanitizeConfig({ ...current, apiKey: "", updatedAt: new Date().toISOString() });
  safeWriteJson(CONFIG_PATH, next);
  return {
    ok: true,
    status: "OK",
    message: "API key de Gemini eliminada.",
    config: { ...next, apiKey: "" },
    hasApiKey: false
  };
}

module.exports = {
  DEFAULT_CONFIG,
  CONFIG_PATH,
  loadGeminiConfig,
  saveGeminiConfig,
  getGeminiInternalConfig,
  clearGeminiKey
};

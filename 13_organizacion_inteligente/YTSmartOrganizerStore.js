/*
Nombre completo: YTSmartOrganizerStore.js
Ruta: 13_organizacion_inteligente/YTSmartOrganizerStore.js
Función o funciones:
  - Guardar y cargar propuestas inteligentes por proyecto.
  - Mantener historial simple de organizaciones generadas.
  - Persistir propuesta principal, alternativa y respuesta Gemini/local.
Se conecta con:
  - YTSmartOrganizerService.js
  - YTWorkflowService.js
*/

const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const USER_DATA_DIR = path.join(ROOT_DIR, "user_data");
const DATABASE_DIR = path.join(USER_DATA_DIR, "database");
const SMART_DIR = path.join(USER_DATA_DIR, "cache", "smart");
const CURRENT_PATH = path.join(DATABASE_DIR, "YTSmartOrganizationCurrent.json");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
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

function safeProjectId(projectId = "") {
  return String(projectId || "global").replace(/[^a-zA-Z0-9_-]/g, "_");
}

function getProjectSmartPath(projectId = "") {
  return path.join(SMART_DIR, safeProjectId(projectId), "YTSmartOrganization.json");
}

function saveSmartOrganization(payload = {}) {
  const projectId = payload.projectId || payload.workflow && payload.workflow.projectId || "global";
  const data = {
    app: "AutoEdit Studio",
    block: "13_organizacion_inteligente",
    projectId,
    projectName: payload.projectName || "",
    organization: payload.organization || payload.proposal || null,
    source: payload.source || "unknown",
    prompt: payload.prompt || "",
    gemini: payload.gemini || null,
    workflow: payload.workflow || null,
    savedAt: new Date().toISOString()
  };

  writeJson(CURRENT_PATH, data);
  writeJson(getProjectSmartPath(projectId), data);

  return {
    ok: true,
    status: "OK",
    message: "Organización inteligente guardada.",
    data,
    path: getProjectSmartPath(projectId)
  };
}

function loadCurrentSmartOrganization() {
  const data = readJson(CURRENT_PATH, null);
  return {
    ok: Boolean(data),
    status: data ? "OK" : "EMPTY",
    message: data ? "Organización inteligente actual cargada." : "No hay organización inteligente guardada.",
    data
  };
}

function loadSmartOrganizationByProject(projectId = "") {
  const filePath = getProjectSmartPath(projectId);
  const data = readJson(filePath, null);
  return {
    ok: Boolean(data),
    status: data ? "OK" : "EMPTY",
    message: data ? "Organización inteligente del proyecto cargada." : "No hay organización inteligente para este proyecto.",
    data,
    path: filePath
  };
}

function clearCurrentSmartOrganization() {
  try {
    if (fs.existsSync(CURRENT_PATH)) fs.unlinkSync(CURRENT_PATH);
  } catch (_error) {}
  return {
    ok: true,
    status: "OK",
    message: "Organización inteligente actual limpiada."
  };
}

module.exports = {
  SMART_DIR,
  CURRENT_PATH,
  getProjectSmartPath,
  saveSmartOrganization,
  loadCurrentSmartOrganization,
  loadSmartOrganizationByProject,
  clearCurrentSmartOrganization
};

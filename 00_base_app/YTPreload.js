/*
Nombre completo: YTPreload.js
Ruta: 00_base_app/YTPreload.js
Función o funciones:
  - Exponer APIs seguras del backend al frontend mediante contextBridge.
  - Agregar API central YTWorkflow para trabajar por flujo maestro.
  - Mantener compatibilidad con módulos existentes durante la migración.
Se conecta con:
  - 00_base_app/YTIpc.js
  - 01_interfaz_principal/YTScreenActions.js
  - 01_interfaz_principal/YTRenderer.js
  - 12_flujo_maestro/YTWorkflowIpc.js
*/

const { contextBridge, ipcRenderer } = require("electron");

function invoke(channel, payload = {}) {
  return ipcRenderer.invoke(channel, payload || {});
}

contextBridge.exposeInMainWorld("YTBase", {
  ping: () => invoke("YT_BASE_PING"),
  getAppInfo: () => invoke("YT_BASE_APP_INFO"),
  runBaseCheck: () => invoke("YT_BASE_CHECK"),
  openDevTools: () => invoke("YT_BASE_OPEN_DEVTOOLS"),
  openPath: (targetPath) => invoke("YT_BASE_OPEN_PATH", { path: targetPath })
});

contextBridge.exposeInMainWorld("YTVideo", {
  selectVideo: () => invoke("YT_VIDEO_SELECT"),
  selectVideos: () => invoke("YT_VIDEO_SELECT_MULTIPLE"),
  selectMaterial: () => invoke("YT_VIDEO_SELECT_MATERIAL"),
  getCurrent: () => invoke("YT_VIDEO_GET_CURRENT"),
  getCurrentVideo: () => invoke("YT_VIDEO_GET_CURRENT"),
  getMaterial: () => invoke("YT_VIDEO_GET_MATERIAL"),
  clear: () => invoke("YT_VIDEO_CLEAR"),
  clearCurrentVideo: () => invoke("YT_VIDEO_CLEAR")
});

contextBridge.exposeInMainWorld("YTProjects", {
  createByName: (payload) => invoke("YT_PROJECT_CREATE_BY_NAME", payload),
  createFromVideo: (payload) => invoke("YT_PROJECT_CREATE_FROM_VIDEO", payload),
  createFromCurrentVideo: (payload) => invoke("YT_PROJECT_CREATE_FROM_VIDEO", payload),
  setMaterial: (payload) => invoke("YT_PROJECT_SET_MATERIAL", payload),
  list: () => invoke("YT_PROJECT_LIST"),
  getCurrent: () => invoke("YT_PROJECT_GET_CURRENT"),
  open: (projectId) => invoke("YT_PROJECT_OPEN", { projectId }),
  saveCurrent: (changes) => invoke("YT_PROJECT_SAVE_CURRENT", { changes })
});

contextBridge.exposeInMainWorld("YTWorkflow", {
  getCurrent: () => invoke("YT_WORKFLOW_GET_CURRENT"),
  startProject: (payload) => invoke("YT_WORKFLOW_START_PROJECT", payload),
  attachMaterial: (payload) => invoke("YT_WORKFLOW_ATTACH_MATERIAL", payload),
  processAutomatically: (payload) => invoke("YT_WORKFLOW_PROCESS_AUTO", payload),
  advanceStep: (step, payload = {}) => invoke("YT_WORKFLOW_ADVANCE_STEP", { ...payload, step }),
  approveReview: (payload) => invoke("YT_WORKFLOW_APPROVE_REVIEW", payload),
  selectClips: (payload) => invoke("YT_WORKFLOW_SELECT_CLIPS", payload),
  cancel: (payload) => invoke("YT_WORKFLOW_CANCEL", payload),
  reset: () => invoke("YT_WORKFLOW_RESET"),
  check: () => invoke("YT_WORKFLOW_CHECK")
});

contextBridge.exposeInMainWorld("YTFiles", {
  ensureFolders: () => invoke("YT_FILES_ENSURE_FOLDERS"),
  getPaths: () => invoke("YT_FILES_GET_PATHS"),
  runFilesCheck: () => invoke("YT_FILES_CHECK"),
  loadData: () => invoke("YT_DATA_LOAD"),
  saveData: (data) => invoke("YT_DATA_SAVE", { data }),
  createBackup: (label) => invoke("YT_DATA_BACKUP", { label }),
  cleanTemp: () => invoke("YT_TEMP_CLEAN")
});

contextBridge.exposeInMainWorld("YTRender", {
  renderTest: (payload) => invoke("YT_RENDER_FIVE_SECONDS", payload),
  renderFiveSeconds: (payload) => invoke("YT_RENDER_FIVE_SECONDS", payload),
  getLast: () => invoke("YT_RENDER_GET_LAST"),
  getLastRender: () => invoke("YT_RENDER_GET_LAST"),
  runRenderCheck: () => invoke("YT_RENDER_CHECK")
});

contextBridge.exposeInMainWorld("YTDiagnostics", {
  runAll: () => invoke("YT_DIAGNOSTIC_RUN_ALL"),
  runRegistry: () => invoke("YT_DIAGNOSTIC_REGISTRY"),
  getLastReport: () => invoke("YT_DIAGNOSTIC_GET_LAST")
});

contextBridge.exposeInMainWorld("YTTranscript", {
  saveCurrent: (payload) => invoke("YT_TRANSCRIPT_SAVE_CURRENT", payload),
  getCurrent: () => invoke("YT_TRANSCRIPT_GET_CURRENT"),
  analyzeCurrent: () => invoke("YT_TRANSCRIPT_ANALYZE_CURRENT"),
  runCheck: () => invoke("YT_TRANSCRIPT_CHECK")
});

contextBridge.exposeInMainWorld("YTClips", {
  generate: (payload) => invoke("YT_CLIPS_GENERATE", payload),
  createTimeline: (payload) => invoke("YT_TIMELINE_CREATE", payload),
  getCurrent: () => invoke("YT_CLIPS_GET_CURRENT"),
  runCheck: () => invoke("YT_CLIPS_CHECK")
});

contextBridge.exposeInMainWorld("YTStyles", {
  generateSubtitles: (payload) => invoke("YT_SUBTITLES_GENERATE", payload),
  generateLayers: (payload) => invoke("YT_LAYERS_GENERATE", payload),
  applyDefaultStyle: (payload) => invoke("YT_STYLE_APPLY_DEFAULT", payload),
  getCurrent: () => invoke("YT_STYLE_GET_CURRENT"),
  runCheck: () => invoke("YT_STYLE_CHECK")
});

contextBridge.exposeInMainWorld("YTLibrary", {
  scan: (payload) => invoke("YT_LIBRARY_SCAN", payload),
  list: () => invoke("YT_LIBRARY_LIST"),
  attachToProject: (payload) => invoke("YT_LIBRARY_ATTACH_PROJECT", payload),
  runCheck: () => invoke("YT_LIBRARY_CHECK")
});

contextBridge.exposeInMainWorld("YTExport", {
  getCurrent: () => invoke("YT_EXPORT_GET_CURRENT"),
  createPlan: (payload) => invoke("YT_EXPORT_CREATE_PLAN", payload),
  renderFinal: (payload) => invoke("YT_EXPORT_RENDER_FINAL", payload),
  createPackage: (payload) => invoke("YT_EXPORT_CREATE_PACKAGE", payload),
  runCheck: () => invoke("YT_EXPORT_CHECK")
});

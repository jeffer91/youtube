/*
Nombre completo: YTState.js
Ruta: 01_interfaz_principal/YTState.js
Función o funciones:
  - Guardar el estado visible de la interfaz.
  - Mantener la etapa actual del flujo maestro.
  - Centralizar proyecto, material, clips, exportación y mensajes.
Se conecta con:
  - 01_interfaz_principal/YTRenderer.js
  - 01_interfaz_principal/YTScreenRouter.js
  - 01_interfaz_principal/YTScreenActions.js
  - 01_interfaz_principal/YTLayout.js
  - 12_flujo_maestro/YTWorkflowService.js por medio de window.YTWorkflow
*/

(function () {
  const WORKFLOW_STEPS = {
    CREATE_PROJECT: "CREATE_PROJECT",
    LOAD_MATERIAL: "LOAD_MATERIAL",
    PROCESSING: "PROCESSING",
    REVIEW_LONG_VIDEO: "REVIEW_LONG_VIDEO",
    SELECT_CLIPS: "SELECT_CLIPS",
    AUTO_EDIT: "AUTO_EDIT",
    REVIEW_RESULTS: "REVIEW_RESULTS",
    EXPORT_ALL: "EXPORT_ALL",
    FINAL_PACKAGE: "FINAL_PACKAGE",
    COMPLETED: "COMPLETED"
  };

  const STEP_ALIASES = {
    AUTO_PROCESSING: WORKFLOW_STEPS.PROCESSING,
    AUTO_EDITING: WORKFLOW_STEPS.AUTO_EDIT
  };

  const initialData = {
    appName: "AutoEdit Studio",
    currentStep: WORKFLOW_STEPS.CREATE_PROJECT,
    workflowStatus: "EMPTY",
    workflow: null,
    selectedVideo: null,
    mediaMode: "EMPTY",
    mediaItems: [],
    currentProject: null,
    currentTranscript: null,
    currentAnalysis: null,
    currentClips: null,
    selectedClips: [],
    currentTimeline: null,
    currentSubtitles: null,
    currentLayers: null,
    currentStylePreset: null,
    currentLibrary: null,
    currentProjectResources: null,
    currentExportPlan: null,
    currentExportPackage: null,
    exportStatus: "EMPTY",
    packageStatus: "EMPTY",
    lastExport: null,
    lastFinalExport: null,
    lastDiagnostic: null,
    lastMessage: null,
    lastError: null,
    isBusy: false
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeStep(step) {
    const value = String(step || "").trim().toUpperCase();
    const normalized = STEP_ALIASES[value] || value;
    return Object.values(WORKFLOW_STEPS).includes(normalized) ? normalized : WORKFLOW_STEPS.CREATE_PROJECT;
  }

  function mergeWorkflow(workflow) {
    if (!workflow) return;

    window.YTState.data.workflow = workflow;
    window.YTState.data.currentStep = normalizeStep(workflow.currentStep);
    window.YTState.data.workflowStatus = workflow.workflowStatus || workflow.status || "READY";

    if (workflow.currentProject) {
      window.YTState.data.currentProject = workflow.currentProject;
    } else if (workflow.projectId || workflow.projectName) {
      window.YTState.data.currentProject = {
        ...(window.YTState.data.currentProject || {}),
        id: workflow.projectId || (window.YTState.data.currentProject ? window.YTState.data.currentProject.id : ""),
        name: workflow.projectName || (window.YTState.data.currentProject ? window.YTState.data.currentProject.name : "")
      };
    }

    window.YTState.data.mediaMode = workflow.mediaMode || "EMPTY";
    window.YTState.data.mediaItems = Array.isArray(workflow.mediaItems) ? workflow.mediaItems : [];
    window.YTState.data.selectedVideo = workflow.primaryVideo || window.YTState.data.mediaItems[0] || null;
    window.YTState.data.selectedClips = Array.isArray(workflow.clipSelections) ? workflow.clipSelections : Array.isArray(workflow.selectedClips) ? workflow.selectedClips : [];
    window.YTState.data.exportStatus = workflow.exportStatus || "EMPTY";
    window.YTState.data.packageStatus = workflow.packageStatus || "EMPTY";
  }

  window.YTState = {
    WORKFLOW_STEPS,
    data: clone(initialData),

    getState() {
      return clone(this.data);
    },

    reset() {
      this.data = clone(initialData);
      return this.getState();
    },

    patch(patch = {}) {
      this.data = { ...this.data, ...(patch || {}) };
      if (patch.currentStep) this.data.currentStep = normalizeStep(patch.currentStep);
      return this.getState();
    },

    setBusy(isBusy) {
      this.data.isBusy = Boolean(isBusy);
      return this.getState();
    },

    setWorkflow(workflow) {
      mergeWorkflow(workflow);
      return this.getState();
    },

    setCurrentStep(step) {
      this.data.currentStep = normalizeStep(step);
      return this.getState();
    },

    setWorkflowStatus(status) {
      this.data.workflowStatus = status || "READY";
      return this.getState();
    },

    setSelectedVideo(video) {
      this.data.selectedVideo = video || null;
      return this.getState();
    },

    setMaterial(mediaItems = [], mediaMode = "") {
      this.data.mediaItems = Array.isArray(mediaItems) ? mediaItems : [];
      this.data.mediaMode = mediaMode || (this.data.mediaItems.length > 1 ? "MULTI_SHORT_VIDEOS" : this.data.mediaItems.length === 1 ? "SINGLE_LONG_VIDEO" : "EMPTY");
      this.data.selectedVideo = this.data.mediaItems[0] || null;
      return this.getState();
    },

    setCurrentProject(project) {
      this.data.currentProject = project || null;
      return this.getState();
    },

    setCurrentTranscript(transcript) {
      this.data.currentTranscript = transcript || null;
      return this.getState();
    },

    setCurrentAnalysis(analysis) {
      this.data.currentAnalysis = analysis || null;
      return this.getState();
    },

    setCurrentClips(clips) {
      this.data.currentClips = clips || null;
      return this.getState();
    },

    setSelectedClips(clips) {
      this.data.selectedClips = Array.isArray(clips) ? clips : [];
      return this.getState();
    },

    setCurrentTimeline(timeline) {
      this.data.currentTimeline = timeline || null;
      return this.getState();
    },

    setCurrentSubtitles(subtitles) {
      this.data.currentSubtitles = subtitles || null;
      return this.getState();
    },

    setCurrentLayers(layers) {
      this.data.currentLayers = layers || null;
      return this.getState();
    },

    setCurrentStylePreset(preset) {
      this.data.currentStylePreset = preset || null;
      return this.getState();
    },

    setCurrentLibrary(library) {
      this.data.currentLibrary = library || null;
      return this.getState();
    },

    setCurrentProjectResources(resources) {
      this.data.currentProjectResources = resources || null;
      return this.getState();
    },

    setCurrentExportPlan(plan) {
      this.data.currentExportPlan = plan || null;
      return this.getState();
    },

    setCurrentExportPackage(pkg) {
      this.data.currentExportPackage = pkg || null;
      return this.getState();
    },

    setLastExport(data) {
      this.data.lastExport = data || null;
      return this.getState();
    },

    setLastFinalExport(data) {
      this.data.lastFinalExport = data || null;
      return this.getState();
    },

    setLastDiagnostic(data) {
      this.data.lastDiagnostic = data || null;
      return this.getState();
    },

    setMessage(message, type = "info") {
      this.data.lastMessage = { type, message, createdAt: new Date().toISOString() };
      return this.getState();
    },

    setError(error) {
      this.data.lastError = { message: error && error.message ? error.message : String(error || "Error desconocido"), createdAt: new Date().toISOString() };
      return this.getState();
    }
  };
})();
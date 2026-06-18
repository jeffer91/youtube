/*
Nombre completo: YTState.js
Ruta: 01_interfaz_principal/YTState.js
Función o funciones:
  - Guardar el estado visible de la interfaz.
  - Mantener proyecto, material, temática, propuesta inteligente, clips y exportación.
Se conecta con:
  - YTScreenRouter.js
  - YTScreenActions.js
  - YTLayout.js
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
    SMART_PROCESSING: WORKFLOW_STEPS.PROCESSING,
    ORGANIZATION_REVIEW: WORKFLOW_STEPS.REVIEW_LONG_VIDEO,
    AUTO_EDITING: WORKFLOW_STEPS.AUTO_EDIT
  };

  const DEFAULT_EXPORT_TARGETS = [
    "youtube_horizontal",
    "youtube_shorts",
    "tiktok",
    "instagram_reels",
    "facebook_reels",
    "instagram_facebook_square"
  ];

  const initialData = {
    appName: "AutoEdit Studio",
    currentStep: WORKFLOW_STEPS.CREATE_PROJECT,
    workflowStatus: "EMPTY",
    workflow: null,
    currentProject: null,
    selectedVideo: null,
    mediaMode: "EMPTY",
    mediaItems: [],
    selectedTheme: "generico",
    selectedThemeMode: "standard",
    selectedThemeLabel: "Genérico",
    themeResources: null,
    smartProcessing: { enabled: true, status: "EMPTY", currentVideoIndex: 0, totalVideos: 0, percent: 0, message: "" },
    videoProgress: [],
    visualDescriptions: [],
    transcriptsByVideo: [],
    organizedTranscript: null,
    mainProposal: null,
    alternativeProposal: null,
    approvedOrder: [],
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
    exportTargets: DEFAULT_EXPORT_TARGETS,
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

  function normalizeTheme(theme) {
    if (window.YTThemeSelector && typeof window.YTThemeSelector.normalizeTheme === "function") return window.YTThemeSelector.normalizeTheme(theme);
    const value = String(theme || "generico").trim().toLowerCase();
    return ["11_contra_11", "crece_aula", "generico", "institucional", "boca_rosa"].includes(value) ? value : "generico";
  }

  function normalizeThemeMode(theme, mode) {
    if (window.YTThemeSelector && typeof window.YTThemeSelector.normalizeMode === "function") return window.YTThemeSelector.normalizeMode(theme, mode);
    if (normalizeTheme(theme) !== "boca_rosa") return "standard";
    const value = String(mode || "musica").toLowerCase();
    return ["musica", "hablado"].includes(value) ? value : "musica";
  }

  function getThemeLabel(theme, mode) {
    if (window.YTThemeSelector && typeof window.YTThemeSelector.getThemeLabel === "function") return window.YTThemeSelector.getThemeLabel(theme, mode);
    const themeId = normalizeTheme(theme);
    const labels = {
      "11_contra_11": "11 contra 11",
      crece_aula: "Crece Aula",
      generico: "Genérico",
      institucional: "Institucional",
      boca_rosa: mode === "hablado" ? "Boca Rosa hablado" : "Boca Rosa música"
    };
    return labels[themeId] || "Genérico";
  }

  function normalizeVideoProgress(mediaItems, incoming) {
    const list = Array.isArray(mediaItems) ? mediaItems : [];
    const progress = Array.isArray(incoming) ? incoming : [];
    return list.map((item, index) => {
      const found = progress.find((row) => row && (row.id === item.id || row.path === item.path || row.name === item.name));
      return {
        id: item.id || item.path || `video_${index + 1}`,
        name: item.name || `Video ${index + 1}`,
        index,
        status: found ? found.status || "PENDING" : "PENDING",
        percent: found ? Number(found.percent || 0) : 0,
        message: found ? found.message || "Pendiente" : "Pendiente"
      };
    });
  }

  function mergeWorkflow(workflow) {
    if (!workflow) return;
    const data = window.YTState.data;
    data.workflow = workflow;
    data.currentStep = normalizeStep(workflow.currentStep);
    data.workflowStatus = workflow.workflowStatus || workflow.status || "READY";
    data.mediaMode = workflow.mediaMode || data.mediaMode || "EMPTY";
    data.mediaItems = Array.isArray(workflow.mediaItems) ? workflow.mediaItems : data.mediaItems;
    data.selectedVideo = workflow.primaryVideo || data.mediaItems[0] || null;
    data.currentProject = workflow.currentProject || data.currentProject || (workflow.projectId || workflow.projectName ? { id: workflow.projectId || "", name: workflow.projectName || "" } : null);

    const theme = normalizeTheme(workflow.selectedTheme || workflow.theme || data.selectedTheme);
    const mode = normalizeThemeMode(theme, workflow.selectedThemeMode || workflow.themeMode || data.selectedThemeMode);
    data.selectedTheme = theme;
    data.selectedThemeMode = mode;
    data.selectedThemeLabel = workflow.selectedThemeLabel || workflow.themeLabel || getThemeLabel(theme, mode);

    data.smartProcessing = workflow.smartProcessing || data.smartProcessing;
    data.videoProgress = normalizeVideoProgress(data.mediaItems, workflow.videoProgress || data.videoProgress);
    data.transcriptsByVideo = Array.isArray(workflow.transcriptsByVideo) ? workflow.transcriptsByVideo : data.transcriptsByVideo;
    data.visualDescriptions = Array.isArray(workflow.visualDescriptions) ? workflow.visualDescriptions : data.visualDescriptions;
    data.organizedTranscript = workflow.organizedTranscript || data.organizedTranscript;
    data.mainProposal = workflow.mainProposal || (workflow.smartProposal && workflow.smartProposal.mainProposal) || data.mainProposal;
    data.alternativeProposal = workflow.alternativeProposal || (workflow.smartProposal && workflow.smartProposal.alternativeProposal) || data.alternativeProposal;
    data.approvedOrder = Array.isArray(workflow.approvedOrder) ? workflow.approvedOrder : data.approvedOrder;
    data.themeResources = workflow.themeResources || data.themeResources;
    data.selectedClips = Array.isArray(workflow.clipSelections) ? workflow.clipSelections : Array.isArray(workflow.selectedClips) ? workflow.selectedClips : data.selectedClips;
    data.exportTargets = Array.isArray(workflow.exportTargets) && workflow.exportTargets.length ? workflow.exportTargets : DEFAULT_EXPORT_TARGETS;
    data.exportStatus = workflow.exportStatus || data.exportStatus;
    data.packageStatus = workflow.packageStatus || data.packageStatus;
  }

  window.YTState = {
    WORKFLOW_STEPS,
    DEFAULT_EXPORT_TARGETS,
    data: clone(initialData),
    getState() { return clone(this.data); },
    reset() { this.data = clone(initialData); return this.getState(); },
    patch(patch = {}) { this.data = { ...this.data, ...patch }; if (patch.currentStep) this.data.currentStep = normalizeStep(patch.currentStep); return this.getState(); },
    setBusy(value) { this.data.isBusy = Boolean(value); return this.getState(); },
    setWorkflow(workflow) { mergeWorkflow(workflow); return this.getState(); },
    setCurrentStep(step) { this.data.currentStep = normalizeStep(step); return this.getState(); },
    setWorkflowStatus(status) { this.data.workflowStatus = status || "READY"; return this.getState(); },
    setSelectedVideo(video) { this.data.selectedVideo = video || null; return this.getState(); },
    setMaterial(mediaItems = [], mediaMode = "") { this.data.mediaItems = Array.isArray(mediaItems) ? mediaItems : []; this.data.mediaMode = mediaMode || (this.data.mediaItems.length > 1 ? "MULTI_SHORT_VIDEOS" : this.data.mediaItems.length === 1 ? "SINGLE_LONG_VIDEO" : "EMPTY"); this.data.selectedVideo = this.data.mediaItems[0] || null; this.data.videoProgress = normalizeVideoProgress(this.data.mediaItems, this.data.videoProgress); this.data.smartProcessing.totalVideos = this.data.mediaItems.length; return this.getState(); },
    setTheme(theme = "generico", mode = "standard") { const themeId = normalizeTheme(theme); const themeMode = normalizeThemeMode(themeId, mode); this.data.selectedTheme = themeId; this.data.selectedThemeMode = themeMode; this.data.selectedThemeLabel = getThemeLabel(themeId, themeMode); return this.getState(); },
    setSmartProcessing(progress = {}) { this.data.smartProcessing = { ...this.data.smartProcessing, ...progress }; return this.getState(); },
    setVideoProgress(progress = []) { this.data.videoProgress = normalizeVideoProgress(this.data.mediaItems, progress); return this.getState(); },
    setSmartProposal(proposal = {}) { this.data.mainProposal = proposal.mainProposal || proposal.main || this.data.mainProposal; this.data.alternativeProposal = proposal.alternativeProposal || proposal.alternative || this.data.alternativeProposal; this.data.approvedOrder = Array.isArray(proposal.approvedOrder) ? proposal.approvedOrder : this.data.approvedOrder; this.data.organizedTranscript = proposal.organizedTranscript || this.data.organizedTranscript; return this.getState(); },
    setCurrentProject(project) { this.data.currentProject = project || null; return this.getState(); },
    setCurrentTranscript(transcript) { this.data.currentTranscript = transcript || null; return this.getState(); },
    setCurrentAnalysis(analysis) { this.data.currentAnalysis = analysis || null; return this.getState(); },
    setCurrentClips(clips) { this.data.currentClips = clips || null; return this.getState(); },
    setSelectedClips(clips) { this.data.selectedClips = Array.isArray(clips) ? clips : []; return this.getState(); },
    setCurrentTimeline(timeline) { this.data.currentTimeline = timeline || null; return this.getState(); },
    setCurrentSubtitles(subtitles) { this.data.currentSubtitles = subtitles || null; return this.getState(); },
    setCurrentLayers(layers) { this.data.currentLayers = layers || null; return this.getState(); },
    setCurrentStylePreset(preset) { this.data.currentStylePreset = preset || null; return this.getState(); },
    setCurrentLibrary(library) { this.data.currentLibrary = library || null; return this.getState(); },
    setCurrentProjectResources(resources) { this.data.currentProjectResources = resources || null; return this.getState(); },
    setCurrentExportPlan(plan) { this.data.currentExportPlan = plan || null; return this.getState(); },
    setCurrentExportPackage(pkg) { this.data.currentExportPackage = pkg || null; return this.getState(); },
    setLastExport(data) { this.data.lastExport = data || null; return this.getState(); },
    setLastFinalExport(data) { this.data.lastFinalExport = data || null; return this.getState(); },
    setLastDiagnostic(data) { this.data.lastDiagnostic = data || null; return this.getState(); },
    setMessage(message, type = "info") { this.data.lastMessage = { type, message, createdAt: new Date().toISOString() }; return this.getState(); },
    setError(error) { this.data.lastError = { message: error && error.message ? error.message : String(error || "Error desconocido"), createdAt: new Date().toISOString() }; return this.getState(); }
  };
})();

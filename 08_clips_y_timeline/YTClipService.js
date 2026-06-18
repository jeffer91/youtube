/*
  Nombre completo: YTClipService.js
  Ruta: 08_clips_y_timeline/YTClipService.js
  Función o funciones:
    - Generar clips desde el análisis guardado del proyecto actual.
    - Crear clips manuales.
    - Crear timeline desde los clips actuales.
    - Cargar la sesión actual de clips y timeline.
    - Entregar clips y timeline del proyecto actual al IPC y al flujo maestro.
  Se conecta con:
    - 08_clips_y_timeline/YTClipModel.js
    - 08_clips_y_timeline/YTClipStore.js
    - 07_transcripcion_y_analisis/YTTranscriptStore.js
    - 06_proyectos/YTProjectService.js
*/

const {
  createClipFromSegment,
  createManualClip,
  createClipsCollection,
  createTimelineFromClips
} = require("./YTClipModel");

const {
  getCurrentProjectRequired,
  loadClipSession,
  saveClipsToProject,
  saveTimelineToProject,
  loadProjectClips,
  loadProjectTimeline
} = require("./YTClipStore");

const {
  loadProjectAnalysis,
  loadProjectTranscript
} = require("../07_transcripcion_y_analisis/YTTranscriptStore");

const {
  saveCurrentProjectChanges
} = require("../06_proyectos/YTProjectService");

function ok(message, patch = {}) {
  return {
    ok: true,
    status: patch.status || "OK",
    message,
    ...patch
  };
}

function fail(message, patch = {}) {
  return {
    ok: false,
    status: patch.status || "ERROR",
    message,
    ...patch
  };
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function toPositiveInt(value, fallback = 8) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return fallback;
  return Math.max(1, Math.floor(number));
}

function uniqueStrings(list = []) {
  return Array.from(
    new Set(
      list
        .map((item) => String(item || "").trim())
        .filter(Boolean)
    )
  );
}

function safeSaveCurrentProjectChanges(patch = {}) {
  try {
    if (typeof saveCurrentProjectChanges === "function") {
      saveCurrentProjectChanges(patch);
    }
  } catch (_error) {
    // No se detiene el flujo de clips si el resumen del proyecto no pudo actualizarse.
  }
}

function getProjectContext(project) {
  return {
    projectId: project && project.id ? project.id : "",
    projectName: project && project.name ? project.name : ""
  };
}

function normalizeSegment(segment = {}, index = 0) {
  const startSecond =
    segment.startSecond ??
    segment.start ??
    segment.startTime ??
    segment.fromSecond ??
    index * 10;

  const endSecond =
    segment.endSecond ??
    segment.end ??
    segment.endTime ??
    segment.toSecond ??
    Number(startSecond || 0) + 8;

  return {
    ...segment,
    startSecond,
    endSecond,
    title: segment.title || segment.name || `Clip ${index + 1}`,
    text: segment.text || segment.phrase || segment.description || segment.summary || "",
    reason: segment.reason || segment.hook || segment.explanation || "Segmento sugerido desde el análisis textual.",
    score: Number(segment.score || segment.relevance || segment.priority || 0)
  };
}

function extractSegmentsFromAnalysis(analysis = {}, options = {}) {
  if (Array.isArray(options.segments)) return options.segments;
  if (Array.isArray(options.suggestedSegments)) return options.suggestedSegments;
  if (options.analysis && Array.isArray(options.analysis.suggestedSegments)) {
    return options.analysis.suggestedSegments;
  }
  if (analysis && Array.isArray(analysis.suggestedSegments)) {
    return analysis.suggestedSegments;
  }
  return [];
}

function loadCurrentProjectAnalysis(project, options = {}) {
  if (options.analysis && typeof options.analysis === "object") {
    return {
      ok: true,
      status: "OK",
      analysis: options.analysis,
      source: "payload"
    };
  }

  const loaded = loadProjectAnalysis(project.id);

  if (!loaded.ok || !loaded.analysis) {
    return {
      ok: false,
      status: "WARNING",
      analysis: null,
      source: "project",
      message: loaded.message || "El proyecto todavía no tiene análisis guardado."
    };
  }

  return {
    ok: true,
    status: "OK",
    analysis: loaded.analysis,
    source: "project",
    analysisPath: loaded.analysisPath
  };
}

function getBestProjectClips(project) {
  const loadedProjectClips = loadProjectClips(project.id);

  if (loadedProjectClips.ok && loadedProjectClips.clips && Array.isArray(loadedProjectClips.clips.clips)) {
    return {
      ok: true,
      status: "OK",
      source: "project",
      clipsCollection: loadedProjectClips.clips,
      clips: loadedProjectClips.clips.clips,
      clipsPath: loadedProjectClips.clipsPath
    };
  }

  const session = loadClipSession();

  if (
    session.ok &&
    session.currentClips &&
    Array.isArray(session.currentClips.clips) &&
    (!session.currentClips.projectId || session.currentClips.projectId === project.id)
  ) {
    return {
      ok: true,
      status: "OK",
      source: "session",
      clipsCollection: session.currentClips,
      clips: session.currentClips.clips,
      clipsPath: ""
    };
  }

  return {
    ok: false,
    status: "EMPTY",
    source: "none",
    clipsCollection: null,
    clips: [],
    clipsPath: "",
    message: "El proyecto todavía no tiene clips."
  };
}

function generateClipsFromAnalysis(options = {}) {
  const current = getCurrentProjectRequired();
  if (!current.ok) return current;

  const project = current.currentProject;
  const context = getProjectContext(project);

  const loadedAnalysis = loadCurrentProjectAnalysis(project, options);

  if (!loadedAnalysis.ok || !loadedAnalysis.analysis) {
    return fail("No hay análisis guardado para generar clips.", {
      status: "WARNING",
      project,
      analysis: null,
      clips: createClipsCollection([], context),
      clipCount: 0,
      warnings: [
        "Primero guarda una transcripción real y genera el análisis antes de crear clips."
      ]
    });
  }

  const maxClips = toPositiveInt(options.maxClips, 8);
  const rawSegments = extractSegmentsFromAnalysis(loadedAnalysis.analysis, options);

  if (!rawSegments.length) {
    const warnings = uniqueStrings([
      "El análisis no tiene segmentos sugeridos para convertir en clips.",
      ...(loadedAnalysis.analysis.warnings || [])
    ]);

    return fail("No se generaron clips porque el análisis no contiene segmentos sugeridos.", {
      status: "WARNING",
      project,
      analysis: loadedAnalysis.analysis,
      clips: createClipsCollection([], context),
      clipCount: 0,
      warnings
    });
  }

  const sortedSegments = rawSegments
    .map((segment, index) => normalizeSegment(segment, index))
    .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
    .slice(0, maxClips);

  const clips = sortedSegments.map((segment, index) =>
    createClipFromSegment(segment, index + 1, context)
  );

  const clipsCollection = {
    ...createClipsCollection(clips, context),
    source: "analysis",
    analysisSource: loadedAnalysis.source,
    analysisPath: loadedAnalysis.analysisPath || "",
    warnings: uniqueStrings(loadedAnalysis.analysis.warnings || [])
  };

  const saved = saveClipsToProject(clipsCollection);

  if (!saved.ok) {
    return fail(saved.message || "No se pudieron guardar los clips del proyecto.", {
      status: saved.status || "ERROR",
      project,
      error: saved.error || null
    });
  }

  safeSaveCurrentProjectChanges({
    clips: {
      status: saved.clips.status,
      count: saved.clips.count,
      clipCount: saved.clips.count,
      clipsPath: saved.clipsPath,
      updatedAt: saved.clips.updatedAt
    },
    suggestedClips: saved.clips.clips
  });

  return ok("Clips generados correctamente desde el análisis.", {
    project,
    clips: saved.clips,
    clipsPath: saved.clipsPath,
    clipCount: saved.clips.count,
    analysis: loadedAnalysis.analysis,
    warnings: clipsCollection.warnings,
    session: loadClipSession()
  });
}

function addManualClip(options = {}) {
  const current = getCurrentProjectRequired();
  if (!current.ok) return current;

  const project = current.currentProject;
  const context = getProjectContext(project);

  const loadedClips = getBestProjectClips(project);
  const existingClips = loadedClips.ok ? loadedClips.clips : [];

  const manualClip = createManualClip(options, context);
  const nextClips = [...existingClips, manualClip];

  const clipsCollection = {
    ...createClipsCollection(nextClips, context),
    source: "manual_and_analysis",
    warnings: []
  };

  const saved = saveClipsToProject(clipsCollection);

  if (!saved.ok) {
    return fail(saved.message || "No se pudo guardar el clip manual.", {
      status: saved.status || "ERROR",
      project,
      error: saved.error || null
    });
  }

  safeSaveCurrentProjectChanges({
    clips: {
      status: saved.clips.status,
      count: saved.clips.count,
      clipCount: saved.clips.count,
      clipsPath: saved.clipsPath,
      updatedAt: saved.clips.updatedAt
    },
    suggestedClips: saved.clips.clips
  });

  return ok("Clip manual agregado correctamente.", {
    project,
    clip: manualClip,
    clips: saved.clips,
    clipsPath: saved.clipsPath,
    clipCount: saved.clips.count,
    session: loadClipSession()
  });
}

function createTimelineFromCurrentClips() {
  const current = getCurrentProjectRequired();
  if (!current.ok) return current;

  const project = current.currentProject;
  const context = getProjectContext(project);
  const loadedClips = getBestProjectClips(project);

  if (!loadedClips.ok || !loadedClips.clips.length) {
    return fail("No hay clips para crear el timeline.", {
      status: "WARNING",
      project,
      clips: loadedClips.clipsCollection,
      timeline: null,
      clipCount: 0,
      warnings: [
        "Primero genera clips desde el análisis o agrega clips manuales."
      ]
    });
  }

  const timeline = createTimelineFromClips(loadedClips.clips, context);
  const saved = saveTimelineToProject(timeline);

  if (!saved.ok) {
    return fail(saved.message || "No se pudo guardar el timeline del proyecto.", {
      status: saved.status || "ERROR",
      project,
      error: saved.error || null
    });
  }

  safeSaveCurrentProjectChanges({
    timeline: {
      status: saved.timeline.status,
      clipCount: saved.timeline.clipCount,
      totalDurationSeconds: saved.timeline.totalDurationSeconds,
      timelinePath: saved.timelinePath,
      updatedAt: saved.timeline.updatedAt
    }
  });

  return ok("Timeline creado correctamente desde los clips actuales.", {
    project,
    clips: loadedClips.clipsCollection,
    timeline: saved.timeline,
    timelinePath: saved.timelinePath,
    clipCount: saved.timeline.clipCount,
    session: loadClipSession()
  });
}

function getCurrentClipSession() {
  return loadClipSession();
}

function getClipsAndTimelineForCurrentProject() {
  const current = getCurrentProjectRequired();
  if (!current.ok) return current;

  const project = current.currentProject;
  const clips = loadProjectClips(project.id);
  const timeline = loadProjectTimeline(project.id);
  const transcript = loadProjectTranscript(project.id);
  const analysis = loadProjectAnalysis(project.id);

  return ok("Datos de clips y timeline cargados.", {
    project,
    clips,
    timeline,
    transcript,
    analysis,
    session: loadClipSession()
  });
}

module.exports = {
  generateClipsFromAnalysis,
  addManualClip,
  createTimelineFromCurrentClips,
  getCurrentClipSession,
  getClipsAndTimelineForCurrentProject,

  // Utilidades exportadas para diagnóstico/pruebas.
  extractSegmentsFromAnalysis,
  getBestProjectClips
};
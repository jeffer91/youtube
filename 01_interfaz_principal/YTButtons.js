window.YTButtons = {
  bindButtons() {
    const bind = (id, handler) => { const el = document.getElementById(id); if (el) el.addEventListener("click", handler); };

    bind("yt-btn-select-video", async () => {
      if (!window.YTVideo) { window.YTMessages.message("error", "YTVideo no disponible."); return; }
      const result = await window.YTVideo.selectVideo();
      if (!result.ok) { window.YTMessages.message(result.status === "CANCELLED" ? "warning" : "error", result.message || "No se seleccionó video."); window.YTMessages.result("Seleccionar video", result); return; }
      const video = { name: result.name, path: result.path, fileUrl: result.fileUrl, extension: result.extension, size: result.size, sizeBytes: result.sizeBytes, status: result.canPreview ? "Video cargado y listo para preview." : "Video cargado, pero puede no reproducirse en preview.", canPreview: result.canPreview, ok: result.ok };
      window.YTState.setSelectedVideo(video); window.YTLayout.refreshFromState(); window.YTMessages.message("success", "Video cargado correctamente."); window.YTMessages.result("Video seleccionado", result);
    });

    bind("yt-btn-create-project", async () => {
      if (!window.YTProjects) { window.YTMessages.message("error", "YTProjects no disponible."); return; }
      const state = window.YTState.getState();
      if (!state.selectedVideo || !state.selectedVideo.path) { window.YTMessages.message("warning", "Primero selecciona un video."); return; }
      const result = await window.YTProjects.createFromCurrentVideo({ name: state.selectedVideo.name });
      if (!result.ok) { window.YTMessages.message("error", result.message || "No se pudo crear el proyecto."); window.YTMessages.result("Proyecto con error", result); return; }
      window.YTState.setCurrentProject({ ...result.project, projectFolder: result.projectFolder, projectFile: result.projectFile }); window.YTLayout.refreshFromState(); window.YTMessages.message("success", "Proyecto creado correctamente."); window.YTMessages.result("Proyecto creado", result);
    });

    bind("yt-btn-save-transcript", async () => {
      if (!window.YTTranscript) { window.YTMessages.message("error", "YTTranscript no disponible."); return; }
      const text = document.getElementById("yt-transcript-text")?.value || "";
      const result = await window.YTTranscript.save(text, { source: "manual", language: "es" });
      if (!result.ok) { window.YTMessages.message("error", result.message || "No se pudo guardar la transcripción."); window.YTMessages.result("Transcripción con error", result); return; }
      window.YTState.setCurrentTranscript(result.transcript); window.YTLayout.refreshFromState(); window.YTMessages.message("success", "Transcripción guardada correctamente."); window.YTMessages.result("Transcripción guardada", result);
    });

    bind("yt-btn-analyze-transcript", async () => {
      if (!window.YTTranscript) { window.YTMessages.message("error", "YTTranscript no disponible."); return; }
      const result = await window.YTTranscript.analyze();
      if (!result.ok) { window.YTMessages.message("error", result.message || "No se pudo analizar la transcripción."); window.YTMessages.result("Análisis con error", result); return; }
      window.YTState.setCurrentTranscript(result.transcript); window.YTState.setCurrentAnalysis(result.analysis); window.YTLayout.refreshFromState(); window.YTMessages.message("success", "Análisis generado correctamente."); window.YTMessages.result("Análisis generado", result);
    });

    bind("yt-btn-generate-clips", async () => {
      if (!window.YTClips) { window.YTMessages.message("error", "YTClips no disponible."); return; }
      const result = await window.YTClips.generateFromAnalysis({ maxClips: 5 });
      if (!result.ok) { window.YTMessages.message("error", result.message || "No se pudieron generar clips."); window.YTMessages.result("Clips con error", result); return; }
      window.YTState.setCurrentClips(result.clips); window.YTLayout.refreshFromState(); window.YTMessages.message("success", "Clips generados correctamente."); window.YTMessages.result("Clips generados", result);
    });

    bind("yt-btn-create-timeline", async () => {
      if (!window.YTClips) { window.YTMessages.message("error", "YTClips no disponible."); return; }
      const result = await window.YTClips.createTimeline();
      if (!result.ok) { window.YTMessages.message("error", result.message || "No se pudo crear el timeline."); window.YTMessages.result("Timeline con error", result); return; }
      window.YTState.setCurrentTimeline(result.timeline); window.YTLayout.refreshFromState(); window.YTMessages.message("success", "Timeline creado correctamente."); window.YTMessages.result("Timeline creado", result);
    });

    bind("yt-btn-generate-subtitles", async () => {
      if (!window.YTStyles) { window.YTMessages.message("error", "YTStyles no disponible."); return; }
      const result = await window.YTStyles.generateSubtitles({ maxLines: 80 });
      if (!result.ok) { window.YTMessages.message("error", result.message || "No se pudieron generar subtítulos."); window.YTMessages.result("Subtítulos con error", result); return; }
      window.YTState.setCurrentSubtitles(result.subtitles); window.YTLayout.refreshFromState(); window.YTMessages.message("success", "Subtítulos generados correctamente."); window.YTMessages.result("Subtítulos generados", result);
    });

    bind("yt-btn-generate-layers", async () => {
      if (!window.YTStyles) { window.YTMessages.message("error", "YTStyles no disponible."); return; }
      const result = await window.YTStyles.generateLayers();
      if (!result.ok) { window.YTMessages.message("error", result.message || "No se pudieron crear capas."); window.YTMessages.result("Capas con error", result); return; }
      window.YTState.setCurrentLayers(result.layers); window.YTLayout.refreshFromState(); window.YTMessages.message("success", "Capas creadas correctamente."); window.YTMessages.result("Capas creadas", result);
    });

    bind("yt-btn-apply-style", async () => {
      if (!window.YTStyles) { window.YTMessages.message("error", "YTStyles no disponible."); return; }
      const result = await window.YTStyles.applyPreset({ name: "Preset vertical profesional", format: "vertical_9_16" });
      if (!result.ok) { window.YTMessages.message("error", result.message || "No se pudo aplicar el estilo."); window.YTMessages.result("Estilo con error", result); return; }
      window.YTState.setCurrentStylePreset(result.stylePreset); window.YTLayout.refreshFromState(); window.YTMessages.message("success", "Estilo aplicado correctamente."); window.YTMessages.result("Estilo aplicado", result);
    });

    bind("yt-btn-import-resources", async () => {
      if (!window.YTLibrary) { window.YTMessages.message("error", "YTLibrary no disponible."); return; }
      const result = await window.YTLibrary.selectResources({ copyToLibrary: true, tags: ["manual"] });
      if (!result.ok) { window.YTMessages.message(result.status === "CANCELLED" ? "warning" : "error", result.message || "No se importaron recursos."); window.YTMessages.result("Importar recursos", result); return; }
      window.YTState.setCurrentLibrary(result.library); window.YTLayout.refreshFromState(); window.YTMessages.message("success", "Recursos importados correctamente."); window.YTMessages.result("Recursos importados", result);
    });

    bind("yt-btn-scan-library", async () => {
      if (!window.YTLibrary) { window.YTMessages.message("error", "YTLibrary no disponible."); return; }
      const result = await window.YTLibrary.scanDefault({ supportedOnly: true });
      window.YTState.setCurrentLibrary(result.library); window.YTLayout.refreshFromState(); window.YTMessages.message(result.status === "OK" ? "success" : "warning", result.message || "Biblioteca escaneada."); window.YTMessages.result("Biblioteca escaneada", result);
    });

    bind("yt-btn-attach-resources", async () => {
      if (!window.YTLibrary) { window.YTMessages.message("error", "YTLibrary no disponible."); return; }
      const result = await window.YTLibrary.attachToProject();
      if (!result.ok) { window.YTMessages.message("error", result.message || "No se pudieron vincular recursos al proyecto."); window.YTMessages.result("Vincular recursos con error", result); return; }
      window.YTState.setCurrentProjectResources(result.projectResources); window.YTLayout.refreshFromState(); window.YTMessages.message("success", "Recursos vinculados al proyecto."); window.YTMessages.result("Recursos vinculados", result);
    });

    bind("yt-btn-create-export-plan", async () => {
      if (!window.YTExport) { window.YTMessages.message("error", "YTExport no disponible."); return; }
      const result = await window.YTExport.createPlan({ platforms: ["youtube", "shorts", "reels", "square"] });
      if (!result.ok) { window.YTMessages.message("error", result.message || "No se pudo crear el plan final."); window.YTMessages.result("Plan final con error", result); return; }
      window.YTState.setCurrentExportPlan(result.plan); window.YTLayout.refreshFromState(); window.YTMessages.message("success", "Plan final creado correctamente."); window.YTMessages.result("Plan final creado", result);
    });

    bind("yt-btn-render-final", async () => {
      if (!window.YTExport) { window.YTMessages.message("error", "YTExport no disponible."); return; }
      window.YTMessages.message("info", "Creando MP4 final. Espera a que termine.");
      const result = await window.YTExport.renderFinal({ platformKey: "youtube", durationSeconds: 0 });
      if (!result.ok) { window.YTMessages.message("error", result.message || "No se pudo crear el MP4 final."); window.YTMessages.result("MP4 final con error", result); return; }
      window.YTState.setLastFinalExport(result); window.YTLayout.refreshFromState(); window.YTMessages.message("success", "MP4 final creado correctamente."); window.YTMessages.result("MP4 final creado", result);
    });

    bind("yt-btn-create-package", async () => {
      window.YTMessages.message("info", "El paquete final queda preparado desde el plan y el archivo final.");
      const state = window.YTState.getState();
      window.YTState.setCurrentExportPackage({ status: state.lastFinalExport ? "READY" : "DRAFT", title: state.currentProject ? state.currentProject.name : "Video AutoEdit" });
      window.YTLayout.refreshFromState();
    });

    bind("yt-btn-play-video", async () => {
      const player = document.getElementById("yt-video-player");
      if (!player || !player.src) { window.YTMessages.message("warning", "No hay video cargado para reproducir."); return; }
      try { if (player.paused) { await player.play(); window.YTMessages.message("success", "Video reproduciéndose."); } else { player.pause(); window.YTMessages.message("info", "Video pausado."); } } catch (error) { window.YTMessages.message("error", "No se pudo reproducir. Prueba con MP4."); window.YTMessages.result("Error reproduciendo video", { status: "ERROR", error: error instanceof Error ? error.message : String(error) }); }
    });

    bind("yt-btn-render-test", async () => {
      if (!window.YTRender) { window.YTMessages.message("error", "YTRender no disponible."); return; }
      const result = await window.YTRender.renderFiveSeconds({ durationSeconds: 5 });
      if (!result.ok) { window.YTMessages.message("error", result.message || "No se pudo crear el render."); window.YTMessages.result("Render con error", result); return; }
      window.YTState.setLastExport({ file: result.outputPath || "user_data/exports/render_prueba.mp4", status: "Render creado correctamente." }); window.YTLayout.refreshFromState(); window.YTMessages.message("success", "Render creado."); window.YTMessages.result("Render finalizado", result);
    });

    bind("yt-btn-diagnostic", async () => {
      if (!window.YTDiagnostic) { window.YTMessages.message("error", "YTDiagnostic no disponible."); return; }
      const result = await window.YTDiagnostic.runAll({ saveReport: true });
      window.YTState.setLastDiagnostic(result); window.YTMessages.diagnostic(result); window.YTMessages.result("Diagnóstico completo", result); window.YTMessages.message(result.status === "OK" ? "success" : result.status === "WARNING" ? "warning" : "error", result.summary);
    });
  }
};

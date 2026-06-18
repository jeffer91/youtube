/*
Nombre completo: YTScreenRouter.js
Ruta: 01_interfaz_principal/YTScreenRouter.js
Función o funciones:
  - Decidir qué pantalla se muestra según YTState.currentStep.
  - Evitar que YTLayout.js vuelva a crecer como pantalla gigante.
  - Mostrar pantallas iniciales del flujo maestro mientras se crean pantallas especializadas.
Se conecta con:
  - 01_interfaz_principal/YTState.js
  - 01_interfaz_principal/YTLayout.js
  - 01_interfaz_principal/YTScreenActions.js
*/

(function () {
  function escapeText(value) {
    return window.YTLayout && window.YTLayout.escapeText ? window.YTLayout.escapeText(value) : String(value ?? "");
  }

  function getState() {
    return window.YTState ? window.YTState.getState() : {};
  }

  function getWorkflowTasks(state) {
    const tasks = state.workflow && state.workflow.progress && Array.isArray(state.workflow.progress.tasks) ? state.workflow.progress.tasks : [];
    if (!tasks.length) return `<li class="yt-progress-item yt-muted"><span>⏳</span>Aún no hay tareas ejecutadas.</li>`;
    return tasks.map((task) => {
      const icon = task.status === "OK" ? "✓" : task.status === "ERROR" ? "!" : task.status === "WARNING" ? "⚠" : "⏳";
      return `<li class="yt-progress-item"><span>${icon}</span><div><strong>${escapeText(task.label)}</strong><p>${escapeText(task.message || task.status)}</p></div></li>`;
    }).join("");
  }

  function renderCreateProject(state) {
    const value = state.currentProject && state.currentProject.name ? state.currentProject.name : "";
    return `
      <section class="yt-screen">
        <div class="yt-screen-header"><p class="yt-kicker">Paso 1</p><h2>Crear proyecto</h2><p>Primero crea el proyecto. Después podrás cargar un video largo o varios videos cortos.</p></div>
        <form id="yt-create-project-form" class="yt-form">
          <label for="yt-project-name">Nombre del proyecto</label>
          <input id="yt-project-name" name="projectName" type="text" placeholder="Ejemplo: Video institucional junio" value="${escapeText(value)}" required />
          <label for="yt-project-notes">Notas opcionales</label>
          <textarea id="yt-project-notes" name="notes" placeholder="Notas internas del proyecto"></textarea>
          <div class="yt-actions-row"><button type="submit" class="yt-primary-button">Crear proyecto</button></div>
        </form>
      </section>`;
  }

  function renderLoadMaterial(state) {
    const items = Array.isArray(state.mediaItems) ? state.mediaItems : [];
    return `
      <section class="yt-screen">
        <div class="yt-screen-header"><p class="yt-kicker">Paso 2</p><h2>Cargar videos</h2><p>Carga un video largo o varios videos cortos. La app decidirá el modo de trabajo.</p></div>
        <div class="yt-actions-row"><button type="button" class="yt-primary-button" data-action="select-material">Cargar uno o varios videos</button><button type="button" class="yt-secondary-button" data-action="process-automatically" ${items.length ? "" : "disabled"}>Procesar automáticamente</button></div>
        <section class="yt-list-card"><h3>Material cargado</h3>${items.length ? `<ul class="yt-media-list">${items.map((item, index) => `<li><strong>${index + 1}. ${escapeText(item.name || "Video")}</strong><span>${escapeText(item.size || "")}</span></li>`).join("")}</ul>` : `<p class="yt-muted">Todavía no hay videos cargados.</p>`}</section>
      </section>`;
  }

  function renderProcessing(state) {
    return `<section class="yt-screen"><div class="yt-screen-header"><p class="yt-kicker">Paso 3</p><h2>Procesamiento automático</h2><p>La app ejecuta por dentro transcripción, análisis, clips, subtítulos, capas, estilo y recursos.</p></div><div class="yt-actions-row"><button type="button" class="yt-primary-button" data-action="process-automatically">Iniciar procesamiento</button><button type="button" class="yt-secondary-button" data-action="go-review">Ir a revisión</button></div><ul class="yt-progress-list">${getWorkflowTasks(state)}</ul></section>`;
  }

  function renderReview(state) {
    const warnings = state.workflow && Array.isArray(state.workflow.warnings) ? state.workflow.warnings : [];
    const errors = state.workflow && Array.isArray(state.workflow.errors) ? state.workflow.errors : [];
    return `<section class="yt-screen"><div class="yt-screen-header"><p class="yt-kicker">Paso 4</p><h2>Revisar video largo y sugerencias</h2><p>Revisa el resultado del análisis y aprueba para pasar a elegir clips.</p></div><section class="yt-list-card"><h3>Resumen del procesamiento</h3><p>Estado: <strong>${escapeText(state.workflowStatus || "READY")}</strong></p>${warnings.length ? `<p class="yt-warning-text">Advertencias: ${escapeText(warnings.join(" | "))}</p>` : ""}${errors.length ? `<p class="yt-error-text">Errores: ${escapeText(errors.join(" | "))}</p>` : ""}</section><div class="yt-actions-row"><button type="button" class="yt-primary-button" data-action="approve-review">Aprobar revisión</button><button type="button" class="yt-secondary-button" data-action="process-automatically">Reprocesar</button></div></section>`;
  }

  function renderSelectClips(state) {
    const clips = state.currentClips && Array.isArray(state.currentClips.clips) ? state.currentClips.clips : state.workflow && state.workflow.results && state.workflow.results.clips && Array.isArray(state.workflow.results.clips.clips) ? state.workflow.results.clips.clips : [];
    return `<section class="yt-screen"><div class="yt-screen-header"><p class="yt-kicker">Paso 5</p><h2>Elegir clips</h2><p>Selecciona los clips sugeridos que quieres editar y exportar.</p></div><section class="yt-list-card"><h3>Clips sugeridos</h3>${clips.length ? clips.map((clip, index) => `<label class="yt-check-row"><input type="checkbox" name="selectedClip" value="${escapeText(clip.id || "clip_" + index)}" checked /><span><strong>${escapeText(clip.title || "Clip " + (index + 1))}</strong><small>${escapeText(clip.reason || clip.description || "Sugerido automáticamente")}</small></span></label>`).join("") : `<p class="yt-muted">Aún no hay clips sugeridos. Procesa el proyecto primero.</p>`}</section><div class="yt-actions-row"><button type="button" class="yt-primary-button" data-action="select-clips" ${clips.length ? "" : "disabled"}>Confirmar clips elegidos</button><button type="button" class="yt-secondary-button" data-action="process-automatically">Generar sugerencias</button></div></section>`;
  }

  function renderAutoEditing() {
    return `<section class="yt-screen"><div class="yt-screen-header"><p class="yt-kicker">Paso 6</p><h2>Edición automática</h2><p>La app aplicará subtítulos, capas, estilo y recursos a los elementos aprobados.</p></div><div class="yt-actions-row"><button type="button" class="yt-primary-button" data-action="advance-results">Continuar a revisión de resultados</button></div></section>`;
  }

  function renderReviewResults() {
    return `<section class="yt-screen"><div class="yt-screen-header"><p class="yt-kicker">Paso 7</p><h2>Revisar resultados</h2><p>Revisa los resultados finales antes de exportar todo.</p></div><div class="yt-actions-row"><button type="button" class="yt-primary-button" data-action="approve-results">Aprobar y exportar</button></div></section>`;
  }

  function renderExportAll() {
    return `<section class="yt-screen"><div class="yt-screen-header"><p class="yt-kicker">Paso 8</p><h2>Exportar todo</h2><p>La exportación completa se conectará con el bloque de exportación avanzado.</p></div><div class="yt-actions-row"><button type="button" class="yt-primary-button" data-action="prepare-export">Preparar exportación</button><button type="button" class="yt-secondary-button" data-action="go-package">Ir a paquete final</button></div></section>`;
  }

  function renderPackage() {
    return `<section class="yt-screen"><div class="yt-screen-header"><p class="yt-kicker">Paso 9</p><h2>Paquete final</h2><p>El paquete final organizará videos largos, clips, subtítulos, recursos usados, miniaturas y resumen.</p></div><div class="yt-actions-row"><button type="button" class="yt-primary-button" data-action="create-package">Crear paquete final</button><button type="button" class="yt-secondary-button" data-action="reset-workflow">Crear nuevo proyecto</button></div></section>`;
  }

  function resolveScreen(state) {
    switch (state.currentStep) {
      case "LOAD_MATERIAL": return renderLoadMaterial(state);

      case "PROCESSING":
      case "AUTO_PROCESSING": return renderProcessing(state);

      case "REVIEW_LONG_VIDEO": return renderReview(state);
      case "SELECT_CLIPS": return renderSelectClips(state);

      case "AUTO_EDIT":
      case "AUTO_EDITING": return renderAutoEditing(state);

      case "REVIEW_RESULTS": return renderReviewResults(state);
      case "EXPORT_ALL": return renderExportAll(state);
      case "FINAL_PACKAGE":
      case "COMPLETED": return renderPackage(state);
      case "CREATE_PROJECT":
      default: return renderCreateProject(state);
    }
  }

  function render() {
    const state = getState();
    if (window.YTLayout) {
      window.YTLayout.updateShellFromState(state);
      window.YTLayout.setMainContent(resolveScreen(state));
    }
  }

  window.YTScreenRouter = { render, resolveScreen };
})();

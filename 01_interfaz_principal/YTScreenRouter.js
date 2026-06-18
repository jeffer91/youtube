/*
Nombre completo: YTScreenRouter.js
Ruta: 01_interfaz_principal/YTScreenRouter.js
Función o funciones:
  - Enrutar pantallas principales.
  - Mostrar selector de temática en procesamiento.
Se conecta con:
  - YTState.js
  - YTThemeSelector.js
  - YTLayout.js
*/

(function () {
  function esc(value) {
    return window.YTLayout && window.YTLayout.escapeText ? window.YTLayout.escapeText(value) : String(value ?? "");
  }

  function card(title, text, action, button) {
    return '<section class="yt-screen"><div class="yt-screen-header"><h2>' + title + '</h2><p>' + text + '</p></div><div class="yt-actions-row"><button type="button" class="yt-primary-button" data-action="' + action + '">' + button + '</button></div></section>';
  }

  function createProject(state) {
    const name = state.currentProject && state.currentProject.name ? state.currentProject.name : '';
    return '<section class="yt-screen"><div class="yt-screen-header"><p class="yt-kicker">Paso 1</p><h2>Crear proyecto</h2><p>Crea el proyecto para iniciar.</p></div><form id="yt-create-project-form" class="yt-form"><label>Nombre del proyecto</label><input name="projectName" type="text" value="' + esc(name) + '" required><label>Notas</label><textarea name="notes"></textarea><div class="yt-actions-row"><button type="submit" class="yt-primary-button">Crear proyecto</button></div></form></section>';
  }

  function loadMaterial(state) {
    const total = Array.isArray(state.mediaItems) ? state.mediaItems.length : 0;
    return '<section class="yt-screen"><div class="yt-screen-header"><p class="yt-kicker">Paso 2</p><h2>Cargar videos</h2><p>Videos cargados: ' + total + '</p></div><div class="yt-actions-row"><button type="button" class="yt-primary-button" data-action="select-material">Cargar videos</button><button type="button" class="yt-secondary-button" data-action="go-processing">Elegir temática</button></div></section>';
  }

  function processing(state) {
    const selector = window.YTThemeSelector && typeof window.YTThemeSelector.render === 'function' ? window.YTThemeSelector.render(state) : '';
    return '<section class="yt-screen"><div class="yt-screen-header"><p class="yt-kicker">Paso 3</p><h2>Organización inteligente del video</h2><p>Elige temática y procesa el material.</p></div>' + selector + '<div class="yt-actions-row"><button type="button" class="yt-primary-button" data-action="process-automatically">Procesar y organizar</button><button type="button" class="yt-secondary-button" data-action="go-review">Ir a revisión</button></div></section>';
  }

  function review(state) {
    return '<section class="yt-screen"><div class="yt-screen-header"><p class="yt-kicker">Paso 4</p><h2>Revisar propuesta inteligente</h2><p>Temática: ' + esc(state.selectedThemeLabel || 'Genérico') + '</p></div><div class="yt-actions-row"><button type="button" class="yt-primary-button" data-action="approve-review">Aprobar revisión</button><button type="button" class="yt-secondary-button" data-action="process-automatically">Reprocesar</button></div></section>';
  }

  function resolveScreen(state) {
    switch (state.currentStep) {
      case 'LOAD_MATERIAL': return loadMaterial(state);
      case 'PROCESSING': return processing(state);
      case 'REVIEW_LONG_VIDEO': return review(state);
      case 'SELECT_CLIPS': return card('Elegir clips', 'Selecciona los clips sugeridos.', 'select-clips', 'Confirmar clips');
      case 'AUTO_EDIT': return card('Edición automática', 'Aplica el estilo y recursos.', 'advance-results', 'Continuar');
      case 'REVIEW_RESULTS': return card('Revisar resultados', 'Aprueba la edición final.', 'approve-results', 'Aprobar');
      case 'EXPORT_ALL': return card('Exportar todo', 'Exporta para todas las redes.', 'prepare-export', 'Preparar');
      case 'FINAL_PACKAGE':
      case 'COMPLETED': return card('Paquete final', 'Crea el paquete final.', 'create-package', 'Crear paquete');
      default: return createProject(state);
    }
  }

  function render() {
    const state = window.YTState ? window.YTState.getState() : {};
    if (!window.YTLayout) return;
    window.YTLayout.updateShellFromState(state);
    window.YTLayout.setMainContent(resolveScreen(state));
  }

  window.YTScreenRouter = { render, resolveScreen };
})();

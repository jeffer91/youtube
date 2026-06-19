/*
Nombre completo: YTScreenRouter.js
Ruta: 01_interfaz_principal/YTScreenRouter.js
Función o funciones:
  - Enrutar pantallas principales.
  - Mostrar carga de material, temática, procesamiento y revisión completa de propuesta.
Se conecta con:
  - YTState.js
  - YTThemeSelector.js
  - YTProposalReview.js
  - YTLayout.js
  - YTScreenActions.js
*/

(function () {
  function esc(value) {
    return window.YTLayout && window.YTLayout.escapeText ? window.YTLayout.escapeText(value) : String(value ?? "");
  }

  function getMediaItems(state) {
    return Array.isArray(state.mediaItems) ? state.mediaItems : [];
  }

  function renderMediaList(items) {
    if (!items.length) return '<p class="yt-muted">Todavía no hay videos cargados.</p>';
    return '<ul class="yt-media-list">' + items.map((item, index) => '<li><strong>' + esc(index + 1 + '. ' + (item.name || 'Video')) + '</strong><span>' + esc(item.durationLabel || item.duration || item.size || '') + '</span></li>').join('') + '</ul>';
  }

  function renderProgress(state) {
    const smart = state.smartProcessing || {};
    const videos = Array.isArray(state.videoProgress) ? state.videoProgress : [];
    return '<section class="yt-list-card"><h3>Avance</h3><p>' + esc(smart.message || 'Listo para procesar.') + '</p><div class="yt-progress-track"><div class="yt-progress-bar" style="width:' + Number(smart.percent || 0) + '%"></div></div>' + (videos.length ? '<div class="yt-video-progress-list">' + videos.map((video, index) => '<article class="yt-video-progress-card"><div><strong>' + esc(index + 1 + '. ' + (video.name || 'Video')) + '</strong><small>' + esc(video.message || video.status || 'Pendiente') + '</small></div><span>' + esc(video.status || 'PENDING') + '</span></article>').join('') + '</div>' : '') + '</section>';
  }

  function createProject(state) {
    const name = state.currentProject && state.currentProject.name ? state.currentProject.name : '';
    return '<section class="yt-screen"><div class="yt-screen-header"><p class="yt-kicker">Paso 1</p><h2>Crear proyecto</h2><p>Crea el proyecto para iniciar.</p></div><form id="yt-create-project-form" class="yt-form"><label>Nombre del proyecto</label><input name="projectName" type="text" value="' + esc(name) + '" required><label>Notas</label><textarea name="notes" placeholder="Notas internas opcionales"></textarea><div class="yt-actions-row"><button type="submit" class="yt-primary-button">Crear proyecto</button></div></form></section>';
  }

  function loadMaterial(state) {
    const items = getMediaItems(state);
    return '<section class="yt-screen"><div class="yt-screen-header"><p class="yt-kicker">Paso 2</p><h2>Cargar videos</h2><p>Carga un video largo o varios clips. Luego elige la temática.</p></div><div class="yt-actions-row"><button type="button" class="yt-primary-button" data-action="select-material">Cargar videos</button><button type="button" class="yt-secondary-button" data-action="go-processing" ' + (items.length ? '' : 'disabled') + '>Elegir temática</button></div><section class="yt-list-card"><h3>Material cargado</h3>' + renderMediaList(items) + '</section></section>';
  }

  function processing(state) {
    const selector = window.YTThemeSelector && typeof window.YTThemeSelector.render === 'function' ? window.YTThemeSelector.render(state) : '';
    return '<section class="yt-screen"><div class="yt-screen-header"><p class="yt-kicker">Paso 3</p><h2>Organización inteligente del video</h2><p>Elige temática y procesa el material. Se generará propuesta principal y alternativa.</p></div><section class="yt-list-card"><h3>Material a procesar</h3>' + renderMediaList(getMediaItems(state)) + '</section>' + selector + renderProgress(state) + '<div class="yt-actions-row"><button type="button" class="yt-primary-button" data-action="process-automatically">Procesar y organizar</button><button type="button" class="yt-secondary-button" data-action="go-review">Ir a revisión</button></div></section>';
  }

  function review(state) {
    const reviewHtml = window.YTProposalReview && typeof window.YTProposalReview.render === 'function' ? window.YTProposalReview.render(state) : '<p class="yt-muted">Revisión no disponible.</p>';
    return '<section class="yt-screen"><div class="yt-screen-header"><p class="yt-kicker">Paso 4</p><h2>Revisar propuesta inteligente</h2><p>Revisa el orden sugerido, transcripción, advertencias y alternativa antes de aprobar.</p></div>' + reviewHtml + '<div class="yt-actions-row"><button type="button" class="yt-primary-button" data-action="approve-review">Aprobar orden y continuar</button><button type="button" class="yt-secondary-button" data-action="save-approved-order">Guardar orden</button><button type="button" class="yt-secondary-button" data-action="process-automatically">Reprocesar</button></div></section>';
  }

  function selectClips(state) {
    const clips = state.currentClips && Array.isArray(state.currentClips.clips) ? state.currentClips.clips : state.mainProposal && Array.isArray(state.mainProposal.suggestedClips) ? state.mainProposal.suggestedClips : [];
    return '<section class="yt-screen"><div class="yt-screen-header"><p class="yt-kicker">Paso 5</p><h2>Elegir clips</h2><p>Selecciona los clips sugeridos para editar y exportar.</p></div><section class="yt-list-card"><h3>Clips sugeridos</h3>' + (clips.length ? clips.map((clip, index) => '<label class="yt-check-row"><input type="checkbox" name="selectedClip" value="' + esc(clip.id || 'clip_' + index) + '" checked><span><strong>' + esc(clip.title || 'Clip ' + (index + 1)) + '</strong><small>' + esc(clip.reason || clip.role || 'Sugerido automáticamente') + '</small></span></label>').join('') : '<p class="yt-muted">Todavía no hay clips sugeridos.</p>') + '</section><div class="yt-actions-row"><button type="button" class="yt-primary-button" data-action="select-clips">Confirmar clips</button></div></section>';
  }

  function simple(kicker, title, text, action, button) {
    return '<section class="yt-screen"><div class="yt-screen-header"><p class="yt-kicker">' + esc(kicker) + '</p><h2>' + esc(title) + '</h2><p>' + esc(text) + '</p></div><div class="yt-actions-row"><button type="button" class="yt-primary-button" data-action="' + esc(action) + '">' + esc(button) + '</button></div></section>';
  }

  function resolveScreen(state) {
    switch (state.currentStep) {
      case 'LOAD_MATERIAL': return loadMaterial(state);
      case 'PROCESSING':
      case 'AUTO_PROCESSING':
      case 'SMART_PROCESSING': return processing(state);
      case 'REVIEW_LONG_VIDEO':
      case 'ORGANIZATION_REVIEW': return review(state);
      case 'SELECT_CLIPS': return selectClips(state);
      case 'AUTO_EDIT':
      case 'AUTO_EDITING': return simple('Paso 6', 'Edición automática', 'Aplicar subtítulos, capas, estilo y recursos de la temática.', 'advance-results', 'Continuar');
      case 'REVIEW_RESULTS': return simple('Paso 7', 'Revisar resultados', 'Aprueba la edición final.', 'approve-results', 'Aprobar');
      case 'EXPORT_ALL': return simple('Paso 8', 'Exportar todo', 'Exporta para YouTube, Shorts, TikTok, Instagram Reels, Facebook Reels y cuadrado.', 'prepare-export', 'Preparar');
      case 'FINAL_PACKAGE':
      case 'COMPLETED': return simple('Paso 9', 'Paquete final', 'Crea el paquete final del proyecto.', 'create-package', 'Crear paquete');
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

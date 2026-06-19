/*
Nombre completo: YTProposalReview.js
Ruta: 01_interfaz_principal/YTProposalReview.js
Función o funciones:
  - Renderizar revisión de propuesta principal y alternativa.
  - Mostrar orden sugerido, razones, transcripción expandible y advertencias.
  - Leer orden aprobado desde la interfaz.
Se conecta con:
  - YTState.js
  - YTScreenRouter.js
  - YTScreenActions.js
*/

(function () {
  function esc(value) {
    return window.YTLayout && window.YTLayout.escapeText ? window.YTLayout.escapeText(value) : String(value ?? "");
  }

  function normalizeOrder(proposal) {
    if (!proposal) return [];
    if (Array.isArray(proposal.order)) return proposal.order;
    if (Array.isArray(proposal.videoOrder)) return proposal.videoOrder;
    return [];
  }

  function renderOrder(order = []) {
    if (!order.length) return '<p class="yt-muted">Aún no hay orden sugerido.</p>';
    return '<ol class="yt-proposal-order" id="yt-approved-order-list">' + order.map((item, index) => {
      const videoId = item.videoId || item.id || `video_${index + 1}`;
      const name = item.name || item.videoName || `Video ${index + 1}`;
      const role = item.role || "Video sugerido";
      const reason = item.reason || "Pendiente de explicación.";
      return '<li draggable="true" data-video-id="' + esc(videoId) + '" data-video-name="' + esc(name) + '"><strong>' + esc(index + 1 + '. ' + name) + '</strong><em>' + esc(role) + '</em><small>' + esc(reason) + '</small></li>';
    }).join('') + '</ol>';
  }

  function renderTranscript(state = {}) {
    const transcripts = Array.isArray(state.transcriptsByVideo) ? state.transcriptsByVideo : [];
    const organized = state.organizedTranscript || null;
    if (!transcripts.length && !organized) return '<p class="yt-muted">No hay transcripciones cargadas todavía.</p>';
    return '<details class="yt-details-card"><summary>Ver transcripción y resumen</summary>' +
      (organized ? '<p><strong>Transcripción organizada:</strong> ' + esc(organized.summary || organized.text || '') + '</p>' : '') +
      (transcripts.length ? '<ul class="yt-transcript-list">' + transcripts.map((item, index) => '<li><strong>' + esc(index + 1 + '. ' + (item.videoName || item.name || 'Video')) + '</strong><p>' + esc(item.summary || item.text || 'Transcripción pendiente.') + '</p></li>').join('') + '</ul>' : '') +
      '</details>';
  }

  function renderWarnings(state = {}) {
    const workflowWarnings = state.workflow && Array.isArray(state.workflow.warnings) ? state.workflow.warnings : [];
    const warnings = workflowWarnings.concat(state.lastError ? [state.lastError.message] : []);
    if (!warnings.length) return '';
    return '<section class="yt-list-card"><h3>Advertencias</h3><ul>' + warnings.map((item) => '<li class="yt-warning-text">' + esc(item) + '</li>').join('') + '</ul></section>';
  }

  function render(state = {}) {
    const main = state.mainProposal || (state.workflow && state.workflow.mainProposal) || null;
    const alternative = state.alternativeProposal || (state.workflow && state.workflow.alternativeProposal) || null;
    const mainOrder = normalizeOrder(main);
    const alternativeOrder = normalizeOrder(alternative);

    return '<section class="yt-proposal-review">' +
      '<section class="yt-list-card"><h3>Resumen de revisión</h3><p>Temática: <strong>' + esc(state.selectedThemeLabel || 'Genérico') + '</strong></p><p>Estado: <strong>' + esc(state.workflowStatus || 'READY') + '</strong></p></section>' +
      '<section class="yt-list-card"><h3>Propuesta principal</h3><p>' + esc(main && main.summary ? main.summary : 'Aún no hay propuesta principal generada.') + '</p>' + renderOrder(mainOrder) + '</section>' +
      '<section class="yt-list-card"><h3>Propuesta alternativa</h3><p>' + esc(alternative && alternative.summary ? alternative.summary : 'Aún no hay propuesta alternativa generada.') + '</p>' + renderOrder(alternativeOrder) + '</section>' +
      '<section class="yt-list-card"><h3>Transcripción</h3>' + renderTranscript(state) + '</section>' +
      renderWarnings(state) +
      '</section>';
  }

  function readApprovedOrder() {
    const rows = Array.from(document.querySelectorAll('#yt-approved-order-list li'));
    return rows.map((row, index) => ({ videoId: row.getAttribute('data-video-id') || '', name: row.getAttribute('data-video-name') || '', order: index + 1, status: 'APPROVED' }));
  }

  window.YTProposalReview = { render, readApprovedOrder };
})();

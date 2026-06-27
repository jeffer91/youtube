export function renderResultadoView() {
  return `
    <section class="aj-view-card result-final-page">
      <p class="eyebrow">Resultado</p>
      <h2>Video final y reporte completo</h2>
      <p>Revisa el video final, el reporte de efectos usados, textos, imágenes, animaciones, audio y observaciones antes de publicar.</p>
      <div class="result-final-actions"><button class="secondary-button" type="button" data-result-action="reload">Cargar último resultado</button></div>
      <p id="resultadoFinalStatus" class="mini-summary">Resultado pendiente de carga.</p>
      <video id="resultadoFinalVideo" class="result-final-video" controls playsinline hidden></video>
      <div id="resultadoFinalContent" class="result-final-content"></div>
    </section>
  `;
}

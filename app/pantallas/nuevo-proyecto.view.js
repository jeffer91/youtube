export function renderNuevoProyectoView() {
  return `
    <section class="aj-view-card aj-view-card--mini">
      <div>
        <p class="eyebrow">Nuevo proyecto</p>
        <h2>Nombre, video y entendimiento</h2>
        <p>La primera pantalla queda limpia: solo nombre del proyecto, carga de video(s) y primer procesado.</p>
      </div>
      <div class="aj-mini-tags" aria-label="Flujo inicial limpio">
        <span>Nombre</span><span>Video(s)</span><span>Entendimiento</span><span>Sin plataformas aún</span>
      </div>
    </section>
  `;
}

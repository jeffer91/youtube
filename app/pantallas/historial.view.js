export function renderHistorialView() {
  return `
    <section class="aj-view-card">
      <p class="eyebrow">Historial</p>
      <h2>Proyectos recientes</h2>
      <p>Consulta los proyectos guardados localmente, sus perfiles, plataformas y estado general.</p>
      <div class="history-toolbar">
        <p id="historyProjectsSummary">Historial pendiente de carga.</p>
        <button class="history-reload" type="button" data-history-action="reload">Actualizar historial</button>
      </div>
      <p id="historyProjectsStatus" class="mini-summary">Abre esta pantalla o presiona actualizar para cargar datos.</p>
      <div id="historyProjectsList" class="history-projects-list"></div>
    </section>
  `;
}

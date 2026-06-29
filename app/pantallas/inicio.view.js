export function renderInicioView() {
  return `
    <section class="aj-view-card aj-home-view aj-home-dashboard">
      <div class="aj-home-hero">
        <div>
          <p class="eyebrow">Panel principal</p>
          <h2>AutoVideoJeff</h2>
          <p>Editor automático modular para subir, procesar, probar efectos y revisar videos.</p>
        </div>
        <span class="aj-status-chip">Sistema listo</span>
      </div>

      <div class="aj-home-grid aj-home-actions" aria-label="Accesos rápidos">
        <button type="button" data-pantalla-destino="nuevo-proyecto">
          <strong>Nuevo proyecto</strong>
          <span>Subir video y elegir perfil.</span>
        </button>
        <button type="button" data-pantalla-destino="nuevo-proyecto">
          <strong>Procesar video</strong>
          <span>Iniciar edición automática.</span>
        </button>
        <button type="button" data-pantalla-destino="laboratorio-efectos">
          <strong>Laboratorio de efectos</strong>
          <span>Probar un solo efecto en un clip corto.</span>
        </button>
        <button type="button" data-pantalla-destino="biblioteca">
          <strong>Biblioteca</strong>
          <span>Recursos, rutas y materiales.</span>
        </button>
        <button type="button" data-pantalla-destino="historial">
          <strong>Historial</strong>
          <span>Videos y resultados previos.</span>
        </button>
      </div>

      <div class="aj-home-status">
        <span>Servidor local</span>
        <strong>Activo al procesar</strong>
        <span>Laboratorio</span>
        <strong>Prueba rápida disponible</strong>
        <span>Diagnóstico</span>
        <strong>Disponible</strong>
      </div>
    </section>
  `;
}
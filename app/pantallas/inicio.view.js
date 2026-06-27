export function renderInicioView() {
  return `
    <section class="aj-view-card aj-home-view">
      <p class="eyebrow">Inicio</p>
      <h2>Panel general de AutoVideoJeff</h2>
      <p>Resumen rápido de la app. Para subir y procesar videos entra en <strong>Nuevo proyecto</strong>.</p>
      <div class="aj-home-grid">
        <article><strong>Nuevo proyecto</strong><span>Subir video, elegir perfil y procesar.</span></article>
        <article><strong>Producción</strong><span>Revisar, aprobar, reemplazar y aprender.</span></article>
        <article><strong>Biblioteca</strong><span>Guardar recursos, rutas, URLs y licencias.</span></article>
        <article><strong>Diagnóstico</strong><span>Revisar errores, auditoría y estado técnico.</span></article>
      </div>
      <div class="aj-flow"><span>Inicio limpio</span><span>Sin procesador aquí</span><span>Flujo ordenado</span></div>
    </section>
  `;
}

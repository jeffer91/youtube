export function renderProcesadoView() {
  const etapas = ['Limpiando audio', 'Transcribiendo', 'Analizando con Gemini', 'Buscando recursos', 'Creando subtitulos', 'Aplicando efectos', 'Preparando exportacion'];
  return `
    <section class="aj-view-card">
      <p class="eyebrow">Procesado</p>
      <h2>Etapas de trabajo</h2>
      <ol class="aj-steps">${etapas.map((etapa) => `<li>${etapa}</li>`).join('')}</ol>
    </section>
  `;
}

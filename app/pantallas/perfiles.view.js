export function renderPerfilesView() {
  const lista = ['11 contra 11', 'Jeff Isekai', 'Creciaula', 'General', 'Institucional', 'El Don Historia', 'Jeff Verso'];
  return `
    <section class="aj-view-card">
      <p class="eyebrow">Perfiles</p>
      <h2>Estilos de edicion</h2>
      <div class="aj-tags">${lista.map((item) => `<span>${item}</span>`).join('')}</div>
    </section>
  `;
}

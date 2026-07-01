export const PERFILES = [
  { id: '11-contra-11', nombre: '11 contra 11', ritmo: 'rápido, deportivo y emocional', textos: 'marcadores, frases de impacto y debate', visual: 'zoom deportivo, color vibrante, barras y énfasis en jugadas', uso: 'fútbol, análisis, reacción y opinión' },
  { id: 'jeff-isekai', nombre: 'Jeff Isekai', ritmo: 'dinámico, anime y sorpresa', textos: 'ganchos tipo historia, preguntas y remates', visual: 'colores vivos, punch-in, efectos pop y energía visual', uso: 'anime, historias, reacciones o contenido narrativo' },
  { id: 'creciaula', nombre: 'Creciaula', ritmo: 'claro, educativo y ordenado', textos: 'ideas clave, resumen y pasos', visual: 'subtítulos limpios, tarjetas, resaltados y estructura', uso: 'clases, tutoriales, explicación y contenido formativo' },
  { id: 'institucional', nombre: 'Institucional', ritmo: 'sobrio, limpio y profesional', textos: 'títulos formales, lower thirds y avisos', visual: 'colores limpios, bordes suaves y mínima distracción', uso: 'instituto, eventos, comunicados y videos académicos' },
  { id: 'el-don-historia', nombre: 'El Don Historia', ritmo: 'narrativo, cinematográfico y pausado', textos: 'contexto, fechas, tensión y cierre', visual: 'contraste de cine, viñeta, tonos cálidos o fríos', uso: 'historias, documentales cortos y relatos' },
  { id: 'jeff-verso', nombre: 'Jeff Verso', ritmo: 'reflexivo, emocional y de marca personal', textos: 'frases destacadas, cierre visual y mensaje fuerte', visual: 'tono cálido, marca sutil, textos elegantes', uso: 'opinión, reflexión, historias personales' },
  { id: 'general', nombre: 'General', ritmo: 'equilibrado y seguro', textos: 'título inicial, palabras clave y CTA final', visual: 'zoom suave, nitidez, barra de progreso y textos moderados', uso: 'videos variados cuando no hay perfil específico' }
];

function renderPerfil(perfil) {
  return `
    <article class="profile-style-card" data-profile-style="${perfil.id}" data-profile-select="${perfil.id}">
      <header><strong>${perfil.nombre}</strong><span>${perfil.id}</span></header>
      <p>${perfil.uso}</p>
      <footer>
        <button class="profiles-mini-button" type="button" data-profile-select="${perfil.id}">Ver perfil</button>
      </footer>
    </article>
  `;
}

export function renderPerfilesView() {
  return `
    <section class="aj-view-card profiles-page" data-perfiles-root data-proceso-root="perfiles" data-proceso-paso-activo="elegir">
      <section id="profilesMessage" class="profiles-message" hidden></section>

      <section class="profiles-flow" aria-label="Navegación de perfiles">
        <button class="profiles-step is-active" type="button" data-perfiles-wizard-go="elegir" data-proceso-step="elegir"><span><strong>Elegir</strong></span></button>
        <button class="profiles-step is-locked" type="button" data-perfiles-wizard-go="ritmo" data-proceso-step="ritmo"><span><strong>Ritmo</strong></span></button>
        <button class="profiles-step is-locked" type="button" data-perfiles-wizard-go="textos" data-proceso-step="textos"><span><strong>Textos</strong></span></button>
        <button class="profiles-step is-locked" type="button" data-perfiles-wizard-go="visual" data-proceso-step="visual"><span><strong>Visual</strong></span></button>
        <button class="profiles-step is-locked" type="button" data-perfiles-wizard-go="uso" data-proceso-step="uso"><span><strong>Uso</strong></span></button>
        <span class="aj-status-chip" id="profilesStateChip">Sin perfil seleccionado</span>
      </section>

      <section class="profiles-wizard">
        <article class="profiles-wizard-panel is-active" data-perfiles-wizard-panel="elegir">
          <div class="profiles-panel-heading"><h3>Elegir perfil editorial</h3></div>
          <div class="profiles-grid">${PERFILES.map(renderPerfil).join('')}</div>
        </article>

        <article class="profiles-wizard-panel" data-perfiles-wizard-panel="ritmo" hidden>
          <div class="profiles-panel-heading"><h3>Ritmo</h3></div>
          <div id="profileRitmoDetail" class="profiles-detail-card"><div class="profiles-empty">Selecciona un perfil para ver su ritmo.</div></div>
        </article>

        <article class="profiles-wizard-panel" data-perfiles-wizard-panel="textos" hidden>
          <div class="profiles-panel-heading"><h3>Textos y frases</h3></div>
          <div id="profileTextosDetail" class="profiles-detail-card"><div class="profiles-empty">Selecciona un perfil para ver sus textos.</div></div>
        </article>

        <article class="profiles-wizard-panel" data-perfiles-wizard-panel="visual" hidden>
          <div class="profiles-panel-heading"><h3>Tratamiento visual</h3></div>
          <div id="profileVisualDetail" class="profiles-detail-card"><div class="profiles-empty">Selecciona un perfil para ver el tratamiento visual.</div></div>
        </article>

        <article class="profiles-wizard-panel" data-perfiles-wizard-panel="uso" hidden>
          <div class="profiles-panel-heading"><h3>Uso ideal</h3></div>
          <div id="profileUsoDetail" class="profiles-detail-card"><div class="profiles-empty">Selecciona un perfil para ver su uso ideal.</div></div>
        </article>
      </section>
    </section>
  `;
}

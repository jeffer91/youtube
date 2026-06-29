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
      <div class="profiles-hero">
        <div>
          <p class="eyebrow">Perfiles</p>
          <h2>Estilos de edición</h2>
          <p>Cada perfil explica cómo debe editar la app: ritmo, textos, efectos, animaciones, tono visual y uso recomendado. La información se muestra por partes.</p>
        </div>
        <span class="aj-status-chip" id="profilesStateChip">Sin perfil seleccionado</span>
      </div>

      <div data-proceso-resumen="perfiles"></div>

      <section class="profiles-flow" aria-label="Flujo guiado de perfiles">
        <button class="profiles-step is-active" type="button" data-perfiles-wizard-go="elegir" data-proceso-step="elegir"><b>1</b><span><strong>Elegir</strong><small>Perfil editorial</small></span></button>
        <button class="profiles-step is-locked" type="button" data-perfiles-wizard-go="ritmo" data-proceso-step="ritmo"><b>2</b><span><strong>Ritmo</strong><small>Velocidad y tono</small></span></button>
        <button class="profiles-step is-locked" type="button" data-perfiles-wizard-go="textos" data-proceso-step="textos"><b>3</b><span><strong>Textos</strong><small>Títulos y frases</small></span></button>
        <button class="profiles-step is-locked" type="button" data-perfiles-wizard-go="visual" data-proceso-step="visual"><b>4</b><span><strong>Visual</strong><small>Efectos y estética</small></span></button>
        <button class="profiles-step is-locked" type="button" data-perfiles-wizard-go="uso" data-proceso-step="uso"><b>5</b><span><strong>Uso</strong><small>Cuándo usarlo</small></span></button>
      </section>

      <section id="profilesMessage" class="profiles-message" hidden></section>

      <section class="profiles-wizard">
        <article class="profiles-wizard-panel is-active" data-perfiles-wizard-panel="elegir">
          <div class="profiles-panel-heading">
            <p class="eyebrow">Paso 1</p>
            <h3>Elegir perfil editorial</h3>
            <p>Selecciona primero el estilo del video. Después se revisa ritmo, textos, visual y uso ideal sin saturar la pantalla.</p>
          </div>
          <div class="profiles-grid">${PERFILES.map(renderPerfil).join('')}</div>
        </article>

        <article class="profiles-wizard-panel" data-perfiles-wizard-panel="ritmo" hidden>
          <div class="profiles-panel-heading">
            <p class="eyebrow">Paso 2</p>
            <h3>Ritmo del perfil</h3>
            <p>Define la velocidad, energía y sensación general de edición.</p>
          </div>
          <div id="profileRitmoDetail" class="profiles-detail-card"><div class="profiles-empty">Selecciona un perfil para ver su ritmo.</div></div>
        </article>

        <article class="profiles-wizard-panel" data-perfiles-wizard-panel="textos" hidden>
          <div class="profiles-panel-heading">
            <p class="eyebrow">Paso 3</p>
            <h3>Textos y frases</h3>
            <p>Revisa qué tipo de títulos, frases, marcadores o llamados debe usar la edición.</p>
          </div>
          <div id="profileTextosDetail" class="profiles-detail-card"><div class="profiles-empty">Selecciona un perfil para ver sus textos.</div></div>
        </article>

        <article class="profiles-wizard-panel" data-perfiles-wizard-panel="visual" hidden>
          <div class="profiles-panel-heading">
            <p class="eyebrow">Paso 4</p>
            <h3>Tratamiento visual</h3>
            <p>Revisa la estética, efectos, énfasis y estilo visual recomendado.</p>
          </div>
          <div id="profileVisualDetail" class="profiles-detail-card"><div class="profiles-empty">Selecciona un perfil para ver el tratamiento visual.</div></div>
        </article>

        <article class="profiles-wizard-panel" data-perfiles-wizard-panel="uso" hidden>
          <div class="profiles-panel-heading">
            <p class="eyebrow">Paso 5</p>
            <h3>Uso ideal</h3>
            <p>Confirma cuándo conviene usar este perfil antes de iniciar un proyecto.</p>
          </div>
          <div id="profileUsoDetail" class="profiles-detail-card"><div class="profiles-empty">Selecciona un perfil para ver su uso ideal.</div></div>
        </article>
      </section>
    </section>
  `;
}

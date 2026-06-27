const PERFILES = [
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
    <article class="profile-style-card" data-profile-style="${perfil.id}">
      <header><strong>${perfil.nombre}</strong><span>${perfil.id}</span></header>
      <dl>
        <div><dt>Ritmo</dt><dd>${perfil.ritmo}</dd></div>
        <div><dt>Textos</dt><dd>${perfil.textos}</dd></div>
        <div><dt>Visual</dt><dd>${perfil.visual}</dd></div>
        <div><dt>Uso ideal</dt><dd>${perfil.uso}</dd></div>
      </dl>
    </article>
  `;
}

export function renderPerfilesView() {
  return `
    <section class="aj-view-card profiles-page">
      <p class="eyebrow">Perfiles</p>
      <h2>Estilos de edición</h2>
      <p>Cada perfil explica cómo debe editar la app: ritmo, textos, efectos, animaciones, tono visual y uso recomendado.</p>
      <div class="profiles-grid">${PERFILES.map(renderPerfil).join('')}</div>
    </section>
  `;
}

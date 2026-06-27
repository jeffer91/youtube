export function renderBibliotecaView() {
  return `
    <section class="aj-view-card library-page">
      <p class="eyebrow">Biblioteca inteligente</p>
      <h2>Recursos para edición</h2>
      <p>Arrastra o elige un recurso. Después define para qué tipo de edición sirve, su categoría, tipo y tono.</p>

      <section id="libraryDropZone" class="library-drop-zone">
        <input id="libraryFileInput" type="file" hidden />
        <div>
          <strong>Arrastra un recurso aquí</strong>
          <span>Imagen, video, audio, fondo, overlay, transición o plantilla.</span>
        </div>
        <button class="library-button" type="button" data-library-action="choose-file">Elegir recurso</button>
      </section>

      <form class="library-form library-form--featured" onsubmit="return false;">
        <label><span>Nombre</span><input id="libraryNewName" type="text" placeholder="Ej: Fondo estadio" /></label>
        <label><span>Tipo</span><select id="libraryNewType"><option value="imagen">Imagen</option><option value="video">Video</option><option value="audio">Audio</option><option value="fondo">Fondo</option><option value="overlay">Overlay</option><option value="transicion">Transición</option><option value="plantilla">Plantilla</option></select></label>
        <label><span>Categoría</span><input id="libraryNewCategory" type="text" value="general" placeholder="fútbol, cine, educación..." /></label>
        <label><span>Tipo de edición</span><select id="libraryNewEditType"><option value="gancho_visual">Gancho visual</option><option value="apoyo_visual" selected>Apoyo visual</option><option value="transicion">Transición</option><option value="fondo">Fondo</option><option value="overlay">Overlay</option><option value="cierre">Cierre</option><option value="sonido">Sonido</option></select></label>
        <label><span>Tono</span><select id="libraryNewTone"><option value="energetico">Energético</option><option value="profesional">Profesional</option><option value="emocional">Emocional</option><option value="epico">Épico</option><option value="educativo">Educativo</option><option value="neutral" selected>Neutral</option></select></label>
        <label><span>Perfil</span><input id="libraryNewProfile" type="text" placeholder="general o perfil específico" /></label>
        <label><span>Tema</span><input id="libraryNewTopic" type="text" placeholder="Tema relacionado" /></label>
        <label><span>Momento sugerido</span><input id="libraryNewMoment" type="text" placeholder="inicio, medio, cierre, gol, explicación..." /></label>
        <label class="library-wide"><span>Ruta local</span><input id="libraryNewPath" type="text" placeholder="C:/recursos/archivo.mp4" /></label>
        <label class="library-wide"><span>URL</span><input id="libraryNewUrl" type="text" placeholder="https://..." /></label>
        <label><span>Licencia</span><input id="libraryNewLicense" type="text" value="pendiente_revision" /></label>
        <div class="library-actions"><button class="library-button is-save" type="button" data-library-action="save">Guardar recurso</button></div>
      </form>

      <div class="library-toolbar">
        <input id="librarySearchInput" data-library-filter type="search" placeholder="Buscar por tema, nombre o frase" />
        <select id="libraryTypeFilter" data-library-filter><option value="">Todos los tipos</option><option value="imagen">Imagen</option><option value="video">Video</option><option value="audio">Audio</option><option value="fondo">Fondo</option><option value="overlay">Overlay</option><option value="transicion">Transición</option><option value="plantilla">Plantilla</option></select>
        <select id="libraryCategoryFilter" data-library-filter><option value="">Todas las categorías</option></select>
        <select id="libraryProfileFilter" data-library-filter><option value="">Todos los perfiles</option><option value="11-contra-11">11 contra 11</option><option value="jeff-isekai">Jeff Isekai</option><option value="creciaula">Creciaula</option><option value="general">General</option><option value="institucional">Institucional</option><option value="el-don-historia">El Don Historia</option><option value="jeff-verso">Jeff Verso</option></select>
      </div>

      <div class="library-actions"><button class="library-button" type="button" data-library-action="reload">Actualizar biblioteca</button></div>
      <p id="libraryResourcesSummary" class="mini-summary">Biblioteca pendiente de carga.</p>
      <p id="libraryStatus" class="library-status">Arrastra un recurso o presiona actualizar.</p>
      <div id="libraryResourcesList" class="library-resources-list"></div>
    </section>
  `;
}

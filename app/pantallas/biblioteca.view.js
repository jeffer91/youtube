export function renderBibliotecaView() {
  return `
    <section class="aj-view-card">
      <p class="eyebrow">Biblioteca externa al flujo</p>
      <h2>Recursos por categorias</h2>
      <p>Gestiona imagenes, clips, fondos, musica, overlays, transiciones y recursos reutilizables.</p>

      <div class="library-toolbar">
        <input id="librarySearchInput" data-library-filter type="search" placeholder="Buscar por tema, nombre o frase" />
        <select id="libraryTypeFilter" data-library-filter>
          <option value="">Todos los tipos</option>
          <option value="imagen">Imagen</option>
          <option value="video">Video</option>
          <option value="audio">Audio</option>
          <option value="fondo">Fondo</option>
          <option value="overlay">Overlay</option>
          <option value="transicion">Transicion</option>
          <option value="plantilla">Plantilla</option>
        </select>
        <select id="libraryCategoryFilter" data-library-filter>
          <option value="">Todas las categorias</option>
        </select>
        <select id="libraryProfileFilter" data-library-filter>
          <option value="">Todos los perfiles</option>
          <option value="11-contra-11">11 contra 11</option>
          <option value="jeff-isekai">Jeff Isekai</option>
          <option value="creciaula">Creciaula</option>
          <option value="general">General</option>
          <option value="institucional">Institucional</option>
          <option value="el-don-historia">El Don Historia</option>
          <option value="jeff-verso">Jeff Verso</option>
        </select>
      </div>

      <div class="library-actions">
        <button class="library-button" type="button" data-library-action="reload">Actualizar biblioteca</button>
      </div>

      <p id="libraryResourcesSummary" class="mini-summary">Biblioteca pendiente de carga.</p>
      <p id="libraryStatus" class="library-status">Abre esta pantalla o presiona actualizar.</p>
      <div id="libraryResourcesList" class="library-resources-list"></div>

      <form class="library-form" onsubmit="return false;">
        <label><span>Nombre</span><input id="libraryNewName" type="text" placeholder="Ej: Fondo estadio" /></label>
        <label><span>Tipo</span><select id="libraryNewType"><option value="imagen">Imagen</option><option value="video">Video</option><option value="audio">Audio</option><option value="fondo">Fondo</option><option value="overlay">Overlay</option><option value="transicion">Transicion</option><option value="plantilla">Plantilla</option></select></label>
        <label><span>Categoria</span><input id="libraryNewCategory" type="text" value="general" /></label>
        <label><span>Perfil</span><input id="libraryNewProfile" type="text" placeholder="general o perfil especifico" /></label>
        <label><span>Tema</span><input id="libraryNewTopic" type="text" placeholder="Tema relacionado" /></label>
        <label><span>Ruta local</span><input id="libraryNewPath" type="text" placeholder="C:/recursos/archivo.mp4" /></label>
        <label><span>URL</span><input id="libraryNewUrl" type="text" placeholder="https://..." /></label>
        <label><span>Licencia</span><input id="libraryNewLicense" type="text" value="pendiente_revision" /></label>
        <div class="library-actions"><button class="library-button is-save" type="button" data-library-action="save">Guardar recurso</button></div>
      </form>
    </section>
  `;
}

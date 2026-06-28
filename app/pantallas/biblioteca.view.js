import { renderBibliotecaProyectoView } from './biblioteca-proyecto.view.js';

function renderBibliotecaGeneralPanel() {
  return `
    <section class="library-general-panel" data-library-general-root>
      <div class="library-section-head">
        <div>
          <p class="eyebrow">Biblioteca general</p>
          <h3>Recursos permanentes</h3>
          <p>Guarda intros, logos, sonidos, plantillas y recursos que se podrán reutilizar en varios videos.</p>
        </div>
        <span class="library-section-chip">Permanente</span>
      </div>

      <nav class="library-tabs" aria-label="Pestañas de biblioteca general">
        <button class="library-tab is-active" type="button" data-library-tab="carga">Carga</button>
        <button class="library-tab" type="button" data-library-tab="recursos">Recursos</button>
      </nav>

      <section id="libraryTabCarga" class="library-tab-panel is-active" data-library-panel="carga">
        <div class="library-upload-layout">
          <section class="library-upload-main">
            <div id="libraryDropZone" class="library-drop-zone">
              <input id="libraryFileInput" type="file" accept="video/*,image/*,audio/*,.mp4,.mov,.m4v,.avi,.mkv,.webm,.jpg,.jpeg,.png,.webp,.gif,.mp3,.wav,.m4a,.aac,.ogg,.flac" hidden />
              <div>
                <strong>Subir un archivo permanente</strong>
                <span>Video, imagen o audio. Un recurso a la vez.</span>
              </div>
              <button class="library-button" type="button" data-library-action="choose-file">Elegir archivo</button>
            </div>

            <article id="librarySelectedFileCard" class="library-selected-file">
              <span>Archivo seleccionado</span>
              <strong id="librarySelectedFileName">Ningún archivo seleccionado.</strong>
              <small id="librarySelectedFileMeta">Selecciona un archivo para clasificarlo.</small>
            </article>
          </section>

          <aside class="library-upload-side">
            <p class="eyebrow">Clasificación compacta</p>
            <h3>Datos del recurso</h3>
            <form class="library-form library-form--compact" onsubmit="return false;">
              <label class="library-wide"><span>Estilo de video</span><select id="libraryNewStyles" multiple size="4"></select><small>Puede pertenecer a varios estilos.</small></label>
              <label><span>Categoría</span><select id="libraryNewCategory"></select></label>
              <label><span>Otra categoría</span><input id="libraryNewCustomCategory" type="text" placeholder="Opcional" /></label>
              <label><span>Nombre</span><input id="libraryNewName" type="text" placeholder="Ej: Intro 11 contra 11" /></label>
              <label><span>Tipo</span><select id="libraryNewType"><option value="video">Video</option><option value="imagen">Imagen</option><option value="audio">Audio</option></select></label>
              <label><span>Tamaño/formato</span><select id="libraryNewFormat"><option value="desconocido">Detectar / desconocido</option><option value="horizontal-16-9">Horizontal 16:9</option><option value="vertical-9-16">Vertical 9:16</option><option value="cuadrado-1-1">Cuadrado 1:1</option><option value="audio">Audio</option><option value="imagen">Imagen</option></select></label>
              <label class="library-wide"><span>Etiquetas</span><input id="libraryNewTags" type="text" placeholder="intro, fútbol, logo, cierre" /></label>
              <label class="library-wide is-hidden"><span>Ruta local</span><input id="libraryNewPath" type="text" /></label>
              <input id="libraryNewOriginalName" type="hidden" />
              <input id="libraryNewMime" type="hidden" />
              <input id="libraryNewSize" type="hidden" />
              <div class="library-actions library-wide">
                <button class="library-button is-save" type="button" data-library-action="save">Guardar en biblioteca general</button>
                <button class="library-button is-muted" type="button" data-library-action="clear-form">Limpiar</button>
              </div>
            </form>
            <div id="libraryDuplicateBox" class="library-duplicate-box" hidden>
              <strong>Recurso posiblemente repetido</strong>
              <p id="libraryDuplicateText">Decide si quieres reemplazarlo o guardarlo como copia.</p>
              <div class="library-actions">
                <button class="library-button is-save" type="button" data-library-action="duplicate-replace">Reemplazar</button>
                <button class="library-button" type="button" data-library-action="duplicate-copy">Duplicar</button>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section id="libraryTabRecursos" class="library-tab-panel" data-library-panel="recursos" hidden>
        <div class="library-toolbar">
          <input id="librarySearchInput" data-library-filter type="search" placeholder="Buscar por nombre, etiqueta o categoría" />
          <select id="libraryTypeFilter" data-library-filter><option value="">Todos los tipos</option><option value="video">Video</option><option value="imagen">Imagen</option><option value="audio">Audio</option></select>
          <select id="libraryCategoryFilter" data-library-filter><option value="">Todas las categorías</option></select>
          <select id="libraryProfileFilter" data-library-filter><option value="">Todos los estilos</option></select>
          <select id="libraryViewMode" data-library-filter><option value="cards">Tarjetas</option><option value="table">Tabla</option></select>
          <button class="library-button" type="button" data-library-action="reload">Actualizar</button>
        </div>

        <div class="library-resource-header">
          <p id="libraryResourcesSummary" class="mini-summary">Biblioteca pendiente de carga.</p>
          <p id="libraryStatus" class="library-status">Sube un recurso o presiona actualizar.</p>
        </div>
        <div id="libraryResourcesList" class="library-resources-list"></div>
      </section>
    </section>
  `;
}

export function renderBibliotecaView() {
  return `
    <section class="aj-view-card library-page library-unified-page" data-library-unified-root>
      <div class="library-hero">
        <div>
          <p class="eyebrow">Biblioteca</p>
          <h2>Recursos para el Plan de edición</h2>
          <p>Administra en un solo lugar la biblioteca general permanente y la biblioteca temporal del proyecto actual.</p>
        </div>
        <span class="aj-status-chip">General + Proyecto</span>
      </div>

      <nav class="library-area-tabs" aria-label="Biblioteca general y proyecto">
        <button class="library-area-tab is-active" type="button" data-biblioteca-area-tab="general">
          <strong>General</strong>
          <span>Recursos permanentes</span>
        </button>
        <button class="library-area-tab" type="button" data-biblioteca-area-tab="proyecto">
          <strong>Proyecto</strong>
          <span>Recursos temporales del video</span>
        </button>
      </nav>

      <section class="library-area-panel is-active" data-biblioteca-area-panel="general">
        ${renderBibliotecaGeneralPanel()}
      </section>

      <section class="library-area-panel" data-biblioteca-area-panel="proyecto" hidden>
        ${renderBibliotecaProyectoView()}
      </section>
    </section>
  `;
}

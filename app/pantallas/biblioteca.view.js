import { renderBibliotecaProyectoView } from './biblioteca-proyecto.view.js';

function renderBibliotecaGeneralPanel() {
  return `
    <section class="library-general-panel" data-library-general-root data-proceso-root="biblioteca-general" data-proceso-paso-activo="subir-archivo">
      <div class="library-section-head">
        <div>
          <p class="eyebrow">Biblioteca general</p>
          <h3>Recursos permanentes</h3>
          <p>Guarda intros, logos, sonidos, plantillas y recursos que se podrán reutilizar en varios videos.</p>
        </div>
        <span class="library-section-chip">Permanente</span>
      </div>

      <div data-proceso-resumen="biblioteca-general"></div>

      <nav class="library-tabs" aria-label="Pestañas de biblioteca general">
        <button class="library-tab is-active" type="button" data-library-tab="carga">Carga guiada</button>
        <button class="library-tab" type="button" data-library-tab="recursos">Recursos guardados</button>
      </nav>

      <section id="libraryTabCarga" class="library-tab-panel is-active" data-library-panel="carga">
        <div class="library-guided-layout">
          <aside class="library-guided-rail" aria-label="Pasos de carga de biblioteca general">
            <button class="library-wizard-step is-active" type="button" data-library-wizard-go="archivo" data-proceso-step="subir-archivo">
              <b>1</b><span><strong>Subir archivo</strong><small>Primero elige un recurso.</small></span>
            </button>
            <button class="library-wizard-step" type="button" data-library-wizard-go="categoria" data-proceso-step="categoria">
              <b>2</b><span><strong>Categoría</strong><small>Clasifica el archivo.</small></span>
            </button>
            <button class="library-wizard-step" type="button" data-library-wizard-go="datos" data-proceso-step="datos-basicos">
              <b>3</b><span><strong>Datos</strong><small>Completa solo lo necesario.</small></span>
            </button>
            <button class="library-wizard-step" type="button" data-library-wizard-go="guardar" data-proceso-step="guardar">
              <b>4</b><span><strong>Guardar</strong><small>Analiza y registra.</small></span>
            </button>
            <button class="library-wizard-step" type="button" data-library-wizard-go="recursos" data-proceso-step="revisar">
              <b>5</b><span><strong>Revisar</strong><small>Ver lo guardado.</small></span>
            </button>
          </aside>

          <div class="library-guided-content">
            <section class="library-wizard-panel is-active" data-library-wizard-panel="archivo">
              <div class="library-panel-heading">
                <p class="eyebrow">Paso 1</p>
                <h3>Subir archivo permanente</h3>
                <p>Elige un solo archivo. Después de seleccionarlo, recién aparecerá la clasificación.</p>
              </div>
              <div class="library-upload-main">
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
              </div>
            </section>

            <section class="library-wizard-panel" data-library-wizard-panel="categoria" hidden>
              <div class="library-panel-heading">
                <p class="eyebrow">Paso 2</p>
                <h3>Elegir categoría</h3>
                <p>Solo define a qué grupo pertenece. Luego aparecerán los datos adicionales.</p>
              </div>
              <form class="library-form library-form--guided" onsubmit="return false;">
                <label class="library-wide"><span>Categoría</span><select id="libraryNewCategory"></select></label>
                <label class="library-wide"><span>Otra categoría</span><input id="libraryNewCustomCategory" type="text" placeholder="Opcional, solo si no existe la categoría" /></label>
                <div class="library-actions library-wide">
                  <button class="library-button is-save" type="button" data-library-wizard-go="datos">Continuar con datos</button>
                  <button class="library-button is-muted" type="button" data-library-wizard-go="archivo">Volver al archivo</button>
                </div>
              </form>
            </section>

            <section class="library-wizard-panel" data-library-wizard-panel="datos" hidden>
              <div class="library-panel-heading">
                <p class="eyebrow">Paso 3</p>
                <h3>Completar datos necesarios</h3>
                <p>El nombre, tipo y formato se llenan automáticamente cuando es posible. Ajusta solo lo necesario.</p>
              </div>
              <form class="library-form library-form--guided" onsubmit="return false;">
                <label class="library-wide"><span>Nombre</span><input id="libraryNewName" type="text" placeholder="Ej: Intro 11 contra 11" /></label>
                <label><span>Tipo</span><select id="libraryNewType"><option value="video">Video</option><option value="imagen">Imagen</option><option value="audio">Audio</option></select></label>
                <label><span>Tamaño/formato</span><select id="libraryNewFormat"><option value="desconocido">Detectar / desconocido</option><option value="horizontal-16-9">Horizontal 16:9</option><option value="vertical-9-16">Vertical 9:16</option><option value="cuadrado-1-1">Cuadrado 1:1</option><option value="audio">Audio</option><option value="imagen">Imagen</option></select></label>
                <label class="library-wide"><span>Estilo de video</span><select id="libraryNewStyles" multiple size="4"></select><small>Puede pertenecer a varios estilos.</small></label>
                <label class="library-wide"><span>Etiquetas</span><input id="libraryNewTags" type="text" placeholder="intro, fútbol, logo, cierre" /></label>
                <label class="library-wide is-hidden"><span>Ruta local</span><input id="libraryNewPath" type="text" /></label>
                <input id="libraryNewOriginalName" type="hidden" />
                <input id="libraryNewMime" type="hidden" />
                <input id="libraryNewSize" type="hidden" />
                <div class="library-actions library-wide">
                  <button class="library-button is-save" type="button" data-library-wizard-go="guardar">Continuar a guardar</button>
                  <button class="library-button is-muted" type="button" data-library-wizard-go="categoria">Volver a categoría</button>
                </div>
              </form>
            </section>

            <section class="library-wizard-panel" data-library-wizard-panel="guardar" hidden>
              <div class="library-panel-heading">
                <p class="eyebrow">Paso 4</p>
                <h3>Guardar recurso</h3>
                <p>La app analizará el archivo y lo guardará en la biblioteca general.</p>
              </div>
              <div class="library-save-review">
                <strong id="librarySaveReviewTitle">Recurso listo para guardar</strong>
                <p id="librarySaveReviewText">Confirma que el archivo y la categoría estén correctos.</p>
              </div>
              <div class="library-actions">
                <button class="library-button is-save" type="button" data-library-action="save">Guardar en biblioteca general</button>
                <button class="library-button is-muted" type="button" data-library-action="clear-form">Limpiar</button>
              </div>
              <div id="libraryDuplicateBox" class="library-duplicate-box" hidden>
                <strong>Recurso posiblemente repetido</strong>
                <p id="libraryDuplicateText">Decide si quieres reemplazarlo o guardarlo como copia.</p>
                <div class="library-actions">
                  <button class="library-button is-save" type="button" data-library-action="duplicate-replace">Reemplazar</button>
                  <button class="library-button" type="button" data-library-action="duplicate-copy">Duplicar</button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>

      <section id="libraryTabRecursos" class="library-tab-panel" data-library-panel="recursos" hidden>
        <div class="library-panel-heading">
          <p class="eyebrow">Paso 5</p>
          <h3>Recursos guardados</h3>
          <p>Busca, filtra y revisa los recursos permanentes disponibles para futuros videos.</p>
        </div>
        <details class="library-advanced-filters" data-proceso-avanzado>
          <summary>Filtros y vista avanzada</summary>
          <div class="library-toolbar">
            <input id="librarySearchInput" data-library-filter type="search" placeholder="Buscar por nombre, etiqueta o categoría" />
            <select id="libraryTypeFilter" data-library-filter><option value="">Todos los tipos</option><option value="video">Video</option><option value="imagen">Imagen</option><option value="audio">Audio</option></select>
            <select id="libraryCategoryFilter" data-library-filter><option value="">Todas las categorías</option></select>
            <select id="libraryProfileFilter" data-library-filter><option value="">Todos los estilos</option></select>
            <select id="libraryViewMode" data-library-filter><option value="cards">Tarjetas</option><option value="table">Tabla</option></select>
            <button class="library-button" type="button" data-library-action="reload">Actualizar</button>
          </div>
        </details>

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
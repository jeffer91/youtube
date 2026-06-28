export function renderBibliotecaProyectoView() {
  return `
    <section class="aj-view-card project-library-page" data-project-library-root>
      <div class="project-library-hero">
        <div>
          <p class="eyebrow">Etapa intermedia</p>
          <h2>Biblioteca del proyecto</h2>
          <p>Sube recursos temporales para este video después del Entendimiento y antes del Plan. Estos recursos no se copian desde la biblioteca general ni quedan permanentes.</p>
        </div>
        <span class="aj-status-chip" id="projectLibraryStateChip">Esperando proyecto</span>
      </div>

      <div class="project-library-toolbar">
        <label for="projectLibraryProjectId">
          <span>ID del proyecto</span>
          <input id="projectLibraryProjectId" type="text" placeholder="Pega aquí el proyectoId" autocomplete="off" />
        </label>
        <button id="projectLibraryLoadBtn" class="secondary-button" type="button">Cargar biblioteca proyecto</button>
        <button id="projectLibraryRefreshBtn" class="secondary-button" type="button">Actualizar</button>
      </div>

      <section id="projectLibraryMessage" class="project-library-message" hidden></section>

      <section class="project-library-kpis" aria-label="Resumen biblioteca proyecto">
        <article><span>Estado</span><strong id="projectLibraryEnabledKpi">—</strong></article>
        <article><span>Recursos proyecto</span><strong id="projectLibraryTotalKpi">0</strong></article>
        <article><span>Videos</span><strong id="projectLibraryVideosKpi">—</strong></article>
        <article><span>Listo para plan</span><strong id="projectLibraryReadyKpi">—</strong></article>
      </section>

      <div class="project-library-layout">
        <section class="project-library-upload-card">
          <header>
            <div>
              <p class="eyebrow">Carga temporal</p>
              <h3>Recurso específico del proyecto</h3>
            </div>
            <span id="projectLibraryUploadState">Pendiente</span>
          </header>

          <div id="projectLibraryDropZone" class="project-library-drop-zone">
            <input id="projectLibraryFileInput" type="file" accept="video/*,image/*,audio/*,.mp4,.mov,.m4v,.avi,.mkv,.webm,.jpg,.jpeg,.png,.webp,.gif,.mp3,.wav,.m4a,.aac,.ogg,.flac" hidden />
            <div>
              <strong>Subir un archivo</strong>
              <span>Video, imagen o audio temporal para este proyecto.</span>
            </div>
            <button class="project-library-button" type="button" data-project-library-action="choose-file">Elegir archivo</button>
          </div>

          <article class="project-library-selected-file">
            <span>Archivo seleccionado</span>
            <strong id="projectLibrarySelectedFileName">Ningún archivo seleccionado.</strong>
            <small id="projectLibrarySelectedFileMeta">Primero carga el entendimiento del proyecto.</small>
          </article>

          <form class="project-library-form" onsubmit="return false;">
            <label><span>Nombre sugerido</span><input id="projectLibraryNewName" type="text" placeholder="Ej: Logo invitado Ecuador vs Brasil" /></label>
            <label><span>Categoría</span><select id="projectLibraryNewCategory"></select></label>
            <label><span>Tipo</span><select id="projectLibraryNewType"><option value="video">Video</option><option value="imagen">Imagen</option><option value="audio">Audio</option></select></label>
            <label><span>Tamaño/formato</span><select id="projectLibraryNewFormat"><option value="desconocido">Detectar / desconocido</option><option value="horizontal-16-9">Horizontal 16:9</option><option value="vertical-9-16">Vertical 9:16</option><option value="cuadrado-1-1">Cuadrado 1:1</option><option value="audio">Audio</option><option value="imagen">Imagen</option></select></label>
            <label class="project-library-wide"><span>Uso sugerido</span><input id="projectLibraryNewUsage" type="text" placeholder="Ej: logo, apoyo visual, intro, ending" /></label>
            <label class="project-library-wide"><span>Etiquetas</span><input id="projectLibraryNewTags" type="text" placeholder="temporal, proyecto, logo" /></label>
            <input id="projectLibraryNewPath" type="hidden" />
            <input id="projectLibraryNewOriginalName" type="hidden" />
            <input id="projectLibraryNewMime" type="hidden" />
            <input id="projectLibraryNewSize" type="hidden" />
            <div class="project-library-actions project-library-wide">
              <button class="project-library-button is-save" type="button" data-project-library-action="save">Guardar temporal</button>
              <button class="project-library-button is-muted" type="button" data-project-library-action="clear-form">Limpiar</button>
            </div>
          </form>

          <div id="projectLibraryDuplicateBox" class="project-library-duplicate-box" hidden>
            <strong>Recurso temporal repetido</strong>
            <p id="projectLibraryDuplicateText">Decide si reemplazarlo o guardarlo como copia.</p>
            <div class="project-library-actions">
              <button class="project-library-button is-save" type="button" data-project-library-action="duplicate-replace">Reemplazar</button>
              <button class="project-library-button" type="button" data-project-library-action="duplicate-copy">Duplicar</button>
            </div>
          </div>
        </section>

        <section class="project-library-resources-card">
          <header>
            <div>
              <p class="eyebrow">Recursos temporales</p>
              <h3>Biblioteca del proyecto actual</h3>
            </div>
            <select id="projectLibraryViewMode"><option value="cards">Tarjetas</option><option value="table">Tabla</option></select>
          </header>
          <div id="projectLibraryResourcesList" class="project-library-resources-list"><div class="project-library-empty">Carga un proyecto para ver sus recursos temporales.</div></div>
        </section>
      </div>

      <footer class="project-library-footer">
        <div>
          <strong>Siguiente paso</strong>
          <span>Cuando hayas cargado recursos temporales, crea el Plan de edición. El plan usará biblioteca general + biblioteca proyecto sin copiarlas.</span>
        </div>
        <button id="projectLibraryCreatePlanBtn" class="primary-button" type="button" disabled>Ir al Plan de edición</button>
      </footer>
    </section>
  `;
}

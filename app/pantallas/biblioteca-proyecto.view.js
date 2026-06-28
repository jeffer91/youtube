export function renderBibliotecaProyectoView() {
  return `
    <section class="aj-view-card project-library-page" data-project-library-root data-smart-state="sin-proyecto">
      <div class="project-library-hero">
        <div>
          <p class="eyebrow">Etapa intermedia</p>
          <h2>Biblioteca del proyecto</h2>
          <p>Organiza los recursos temporales de este video después del Entendimiento y antes del Plan. La app activa cada paso cuando corresponde.</p>
        </div>
        <span class="aj-status-chip" id="projectLibraryStateChip">Esperando proyecto</span>
      </div>

      <section class="project-library-flow" aria-label="Flujo inteligente de biblioteca proyecto">
        <article id="projectLibraryStepProject" class="project-library-step is-active">
          <span>1</span>
          <div><strong>Proyecto</strong><small>Cargar ID y verificar Entendimiento</small></div>
        </article>
        <article id="projectLibraryStepUpload" class="project-library-step is-locked">
          <span>2</span>
          <div><strong>Subir</strong><small>Elegir archivo temporal</small></div>
        </article>
        <article id="projectLibraryStepReview" class="project-library-step is-locked">
          <span>3</span>
          <div><strong>Revisar</strong><small>Confirmar recursos guardados</small></div>
        </article>
        <article id="projectLibraryStepPlan" class="project-library-step is-locked">
          <span>4</span>
          <div><strong>Plan</strong><small>Continuar solo cuando esté listo</small></div>
        </article>
      </section>

      <section class="project-library-control-card" data-smart-section="proyecto">
        <div class="project-library-control-head">
          <div>
            <p class="eyebrow">Paso 1</p>
            <h3>Cargar proyecto</h3>
            <p>Primero valida que el proyecto tenga Entendimiento procesado. Después se activa la carga temporal.</p>
          </div>
          <span id="projectLibraryProjectStatus">Pendiente</span>
        </div>
        <div class="project-library-toolbar">
          <label for="projectLibraryProjectId">
            <span>ID del proyecto</span>
            <input id="projectLibraryProjectId" type="text" placeholder="Pega aquí el proyectoId" autocomplete="off" />
          </label>
          <button id="projectLibraryLoadBtn" class="secondary-button" type="button">Cargar biblioteca proyecto</button>
          <button id="projectLibraryRefreshBtn" class="secondary-button" type="button">Actualizar</button>
        </div>
      </section>

      <section id="projectLibraryMessage" class="project-library-message" hidden></section>

      <section class="project-library-kpis" aria-label="Resumen biblioteca proyecto">
        <article><span>Estado</span><strong id="projectLibraryEnabledKpi">—</strong></article>
        <article><span>Recursos proyecto</span><strong id="projectLibraryTotalKpi">0</strong></article>
        <article><span>Videos</span><strong id="projectLibraryVideosKpi">—</strong></article>
        <article><span>Listo para plan</span><strong id="projectLibraryReadyKpi">—</strong></article>
      </section>

      <div class="project-library-layout">
        <section class="project-library-upload-card is-disabled" data-smart-section="upload">
          <header>
            <div>
              <p class="eyebrow">Paso 2</p>
              <h3>Cargar recurso temporal</h3>
              <p>Este bloque se activa cuando el proyecto ya tiene Entendimiento. Primero eliges archivo; luego se activa el formulario.</p>
            </div>
            <span id="projectLibraryUploadState">Bloqueado</span>
          </header>

          <div id="projectLibraryDropZone" class="project-library-drop-zone is-disabled">
            <input id="projectLibraryFileInput" type="file" accept="video/*,image/*,audio/*,.mp4,.mov,.m4v,.avi,.mkv,.webm,.jpg,.jpeg,.png,.webp,.gif,.mp3,.wav,.m4a,.aac,.ogg,.flac" hidden />
            <div>
              <strong>Elegir archivo temporal</strong>
              <span id="projectLibraryActionHint">Primero carga el proyecto para habilitar esta acción.</span>
            </div>
            <button class="project-library-button" type="button" data-project-library-action="choose-file" disabled>Elegir archivo</button>
          </div>

          <article class="project-library-selected-file" id="projectLibrarySelectedFileBox">
            <span>Archivo seleccionado</span>
            <strong id="projectLibrarySelectedFileName">Ningún archivo seleccionado.</strong>
            <small id="projectLibrarySelectedFileMeta">El formulario se activa después de elegir un archivo.</small>
          </article>

          <form id="projectLibraryForm" class="project-library-form is-disabled" onsubmit="return false;">
            <fieldset id="projectLibraryFormFieldset" class="project-library-fieldset" disabled>
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
                <button id="projectLibrarySaveBtn" class="project-library-button is-save" type="button" data-project-library-action="save" disabled>Guardar temporal</button>
                <button class="project-library-button is-muted" type="button" data-project-library-action="clear-form">Limpiar</button>
              </div>
            </fieldset>
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

        <section class="project-library-resources-card is-disabled" data-smart-section="review">
          <header>
            <div>
              <p class="eyebrow">Paso 3</p>
              <h3>Revisar recursos temporales</h3>
              <p>Revisa lo que ya quedó guardado para este proyecto antes de enviar al Plan.</p>
            </div>
            <select id="projectLibraryViewMode"><option value="cards">Tarjetas</option><option value="table">Tabla</option></select>
          </header>
          <div id="projectLibraryResourcesList" class="project-library-resources-list"><div class="project-library-empty">Carga un proyecto para ver sus recursos temporales.</div></div>
        </section>
      </div>

      <footer class="project-library-footer is-disabled" data-smart-section="plan">
        <div>
          <strong>Paso 4 · Siguiente paso</strong>
          <span id="projectLibraryFooterHint">Cuando exista al menos un recurso temporal, se activará el paso hacia el Plan de edición.</span>
        </div>
        <button id="projectLibraryCreatePlanBtn" class="primary-button" type="button" disabled>Ir al Plan de edición</button>
      </footer>
    </section>
  `;
}

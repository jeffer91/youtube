export function renderBibliotecaProyectoView() {
  return `
    <section class="aj-view-card project-library-page" data-project-library-root data-smart-state="sin-proyecto" data-proceso-root="biblioteca-proyecto" data-proceso-paso-activo="cargar-proyecto">
      <div class="project-library-hero">
        <div>
          <p class="eyebrow">Etapa intermedia</p>
          <h2>Biblioteca del proyecto</h2>
          <p>Organiza los recursos temporales de este video después del Entendimiento y antes del Plan. La pantalla muestra solo el paso que corresponde.</p>
        </div>
        <span class="aj-status-chip" id="projectLibraryStateChip">Esperando proyecto</span>
      </div>

      <div data-proceso-resumen="biblioteca-proyecto"></div>

      <section class="project-library-flow" aria-label="Flujo guiado de biblioteca proyecto">
        <button id="projectLibraryStepProject" class="project-library-step is-active" type="button" data-project-library-wizard-go="proyecto" data-proceso-step="cargar-proyecto">
          <span>1</span><div><strong>Proyecto</strong><small>Cargar ID y validar Entendimiento</small></div>
        </button>
        <button id="projectLibraryStepUpload" class="project-library-step is-locked" type="button" data-project-library-wizard-go="archivo" data-proceso-step="elegir-archivo">
          <span>2</span><div><strong>Archivo</strong><small>Elegir recurso temporal</small></div>
        </button>
        <button id="projectLibraryStepCategory" class="project-library-step is-locked" type="button" data-project-library-wizard-go="categoria" data-proceso-step="categoria">
          <span>3</span><div><strong>Categoría</strong><small>Clasificar el recurso</small></div>
        </button>
        <button id="projectLibraryStepData" class="project-library-step is-locked" type="button" data-project-library-wizard-go="datos" data-proceso-step="uso-etiquetas">
          <span>4</span><div><strong>Uso</strong><small>Uso sugerido y etiquetas</small></div>
        </button>
        <button id="projectLibraryStepSave" class="project-library-step is-locked" type="button" data-project-library-wizard-go="guardar" data-proceso-step="guardar-temporal">
          <span>5</span><div><strong>Guardar</strong><small>Registrar temporal</small></div>
        </button>
        <button id="projectLibraryStepReview" class="project-library-step is-locked" type="button" data-project-library-wizard-go="revisar" data-proceso-step="revisar-recursos">
          <span>6</span><div><strong>Revisar</strong><small>Confirmar recursos</small></div>
        </button>
        <button id="projectLibraryStepPlan" class="project-library-step is-locked" type="button" data-project-library-wizard-go="plan" data-proceso-step="ir-plan">
          <span>7</span><div><strong>Plan</strong><small>Continuar solo cuando esté listo</small></div>
        </button>
      </section>

      <section id="projectLibraryMessage" class="project-library-message" hidden></section>

      <section class="project-library-kpis" aria-label="Resumen biblioteca proyecto">
        <article><span>Estado</span><strong id="projectLibraryEnabledKpi">—</strong></article>
        <article><span>Recursos proyecto</span><strong id="projectLibraryTotalKpi">0</strong></article>
        <article><span>Videos</span><strong id="projectLibraryVideosKpi">—</strong></article>
        <article><span>Listo para plan</span><strong id="projectLibraryReadyKpi">—</strong></article>
      </section>

      <section class="project-library-wizard">
        <article class="project-library-wizard-panel is-active" data-project-library-wizard-panel="proyecto" data-smart-section="proyecto">
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
        </article>

        <article class="project-library-wizard-panel project-library-upload-card is-disabled" data-project-library-wizard-panel="archivo" data-smart-section="upload" hidden>
          <header>
            <div>
              <p class="eyebrow">Paso 2</p>
              <h3>Elegir archivo temporal</h3>
              <p>Este paso se activa cuando el proyecto ya tiene Entendimiento. Elige un archivo y luego clasifícalo.</p>
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
        </article>

        <article class="project-library-wizard-panel is-disabled" data-project-library-wizard-panel="categoria" data-smart-section="categoria" hidden>
          <header>
            <div>
              <p class="eyebrow">Paso 3</p>
              <h3>Elegir categoría</h3>
              <p>La app sugiere una categoría por el nombre del archivo. Ajusta solo si hace falta.</p>
            </div>
          </header>
          <form class="project-library-form" onsubmit="return false;">
            <fieldset class="project-library-fieldset project-library-fieldset--single">
              <label class="project-library-wide"><span>Categoría</span><select id="projectLibraryNewCategory"></select></label>
              <div class="project-library-actions project-library-wide">
                <button class="project-library-button is-save" type="button" data-project-library-wizard-go="datos">Continuar con uso y etiquetas</button>
                <button class="project-library-button is-muted" type="button" data-project-library-wizard-go="archivo">Volver al archivo</button>
              </div>
            </fieldset>
          </form>
        </article>

        <article class="project-library-wizard-panel is-disabled" data-project-library-wizard-panel="datos" data-smart-section="datos" hidden>
          <header>
            <div>
              <p class="eyebrow">Paso 4</p>
              <h3>Uso sugerido y datos necesarios</h3>
              <p>Completa el nombre, tipo, formato, uso sugerido y etiquetas. No se muestran otros campos técnicos.</p>
            </div>
          </header>
          <form id="projectLibraryForm" class="project-library-form is-disabled" onsubmit="return false;">
            <fieldset id="projectLibraryFormFieldset" class="project-library-fieldset" disabled>
              <label class="project-library-wide"><span>Nombre sugerido</span><input id="projectLibraryNewName" type="text" placeholder="Ej: Logo invitado Ecuador vs Brasil" /></label>
              <label><span>Tipo</span><select id="projectLibraryNewType"><option value="video">Video</option><option value="imagen">Imagen</option><option value="audio">Audio</option></select></label>
              <label><span>Tamaño/formato</span><select id="projectLibraryNewFormat"><option value="desconocido">Detectar / desconocido</option><option value="horizontal-16-9">Horizontal 16:9</option><option value="vertical-9-16">Vertical 9:16</option><option value="cuadrado-1-1">Cuadrado 1:1</option><option value="audio">Audio</option><option value="imagen">Imagen</option></select></label>
              <label class="project-library-wide"><span>Uso sugerido</span><input id="projectLibraryNewUsage" type="text" placeholder="Ej: logo, apoyo visual, intro, ending" /></label>
              <label class="project-library-wide"><span>Etiquetas</span><input id="projectLibraryNewTags" type="text" placeholder="temporal, proyecto, logo" /></label>
              <input id="projectLibraryNewPath" type="hidden" />
              <input id="projectLibraryNewOriginalName" type="hidden" />
              <input id="projectLibraryNewMime" type="hidden" />
              <input id="projectLibraryNewSize" type="hidden" />
              <div class="project-library-actions project-library-wide">
                <button class="project-library-button is-save" type="button" data-project-library-wizard-go="guardar">Continuar a guardar</button>
                <button class="project-library-button is-muted" type="button" data-project-library-wizard-go="categoria">Volver a categoría</button>
              </div>
            </fieldset>
          </form>
        </article>

        <article class="project-library-wizard-panel is-disabled" data-project-library-wizard-panel="guardar" data-smart-section="guardar" hidden>
          <header>
            <div>
              <p class="eyebrow">Paso 5</p>
              <h3>Guardar temporal</h3>
              <p>Confirma el recurso temporal antes de analizarlo y guardarlo dentro del proyecto.</p>
            </div>
          </header>
          <div class="project-library-save-review">
            <strong id="projectLibrarySaveReviewTitle">Recurso temporal listo para guardar</strong>
            <p id="projectLibrarySaveReviewText">Confirma categoría, uso y etiquetas antes de continuar.</p>
          </div>
          <div class="project-library-actions">
            <button id="projectLibrarySaveBtn" class="project-library-button is-save" type="button" data-project-library-action="save" disabled>Guardar temporal</button>
            <button class="project-library-button is-muted" type="button" data-project-library-action="clear-form">Limpiar</button>
          </div>
          <div id="projectLibraryDuplicateBox" class="project-library-duplicate-box" hidden>
            <strong>Recurso temporal repetido</strong>
            <p id="projectLibraryDuplicateText">Decide si reemplazarlo o guardarlo como copia.</p>
            <div class="project-library-actions">
              <button class="project-library-button is-save" type="button" data-project-library-action="duplicate-replace">Reemplazar</button>
              <button class="project-library-button" type="button" data-project-library-action="duplicate-copy">Duplicar</button>
            </div>
          </div>
        </article>

        <article class="project-library-wizard-panel project-library-resources-card is-disabled" data-project-library-wizard-panel="revisar" data-smart-section="review" hidden>
          <header>
            <div>
              <p class="eyebrow">Paso 6</p>
              <h3>Revisar recursos temporales</h3>
              <p>Revisa lo que ya quedó guardado para este proyecto antes de enviar al Plan.</p>
            </div>
            <select id="projectLibraryViewMode"><option value="cards">Tarjetas</option><option value="table">Tabla</option></select>
          </header>
          <div id="projectLibraryResourcesList" class="project-library-resources-list"><div class="project-library-empty">Carga un proyecto para ver sus recursos temporales.</div></div>
        </article>

        <article class="project-library-wizard-panel project-library-footer is-disabled" data-project-library-wizard-panel="plan" data-smart-section="plan" hidden>
          <div>
            <strong>Paso 7 · Siguiente paso</strong>
            <span id="projectLibraryFooterHint">Cuando exista al menos un recurso temporal, se activará el paso hacia el Plan de edición.</span>
          </div>
          <button id="projectLibraryCreatePlanBtn" class="primary-button" type="button" disabled>Ir al Plan de edición</button>
        </article>
      </section>
    </section>
  `;
}
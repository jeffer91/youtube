export function renderBibliotecaProyectoView() {
  return `
    <section class="aj-view-card project-library-page" data-project-library-root data-smart-state="sin-proyecto" data-proceso-root="biblioteca-proyecto" data-proceso-paso-activo="cargar-proyecto">
      <style>
        .project-library-image-requests {
          border: 1px solid #dbeafe;
          border-radius: 22px;
          background: linear-gradient(180deg, #f8fbff, #fff);
          box-shadow: 0 12px 28px rgba(15, 23, 42, .07);
          padding: 15px;
          display: grid;
          gap: 12px;
          margin: 12px 0 14px;
        }

        .project-library-image-requests header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .project-library-image-requests h3 {
          margin: 0;
          color: #0f172a;
        }

        .project-library-image-requests p:not(.eyebrow) {
          margin: 4px 0 0;
          color: #64748b;
          font-weight: 800;
          max-width: 760px;
        }

        .project-library-image-chip,
        .project-library-image-counter {
          border-radius: 999px;
          background: #eff6ff;
          color: #1d4ed8;
          padding: 6px 10px;
          font-size: 11px;
          font-weight: 950;
          white-space: nowrap;
        }

        .project-library-image-pager {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }

        .project-library-image-pager-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .project-library-image-request-list {
          display: grid;
          gap: 10px;
        }

        .project-library-image-request-card {
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          background: #fff;
          padding: 14px;
          display: grid;
          gap: 12px;
        }

        .project-library-image-request-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
          flex-wrap: wrap;
        }

        .project-library-image-request-title strong {
          display: block;
          color: #0f172a;
          font-size: 20px;
          line-height: 1.15;
        }

        .project-library-image-search-box {
          border: 1px solid #bfdbfe;
          border-radius: 16px;
          background: #eff6ff;
          padding: 10px 12px;
        }

        .project-library-image-search-box span {
          display: block;
          color: #1d4ed8;
          font-size: 11px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: .04em;
        }

        .project-library-image-search-box strong {
          display: block;
          color: #0f172a;
          font-size: 18px;
          margin-top: 2px;
        }

        .project-library-image-description {
          margin: 0;
          color: #475569;
          font-weight: 800;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .project-library-smart-upload {
          border: 2px dashed #93c5fd;
          border-radius: 20px;
          background: #f8fbff;
          padding: 16px;
          display: grid;
          gap: 10px;
          cursor: pointer;
          transition: border-color .18s ease, background .18s ease, transform .18s ease;
        }

        .project-library-smart-upload:hover,
        .project-library-smart-upload.is-dragover {
          border-color: #2563eb;
          background: #eff6ff;
          transform: translateY(-1px);
        }

        .project-library-smart-upload strong {
          color: #0f172a;
          font-size: 16px;
        }

        .project-library-smart-upload span {
          color: #64748b;
          font-size: 12px;
          font-weight: 850;
        }

        .project-library-smart-upload-actions,
        .project-library-image-request-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .project-library-internet-results {
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          background: #fff;
          padding: 12px;
          display: grid;
          gap: 10px;
        }

        .project-library-internet-results header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin: 0;
        }

        .project-library-internet-options {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }

        .project-library-internet-option {
          min-height: 82px;
          border: 1px dashed #cbd5e1;
          border-radius: 14px;
          background: #f8fafc;
          display: grid;
          place-items: center;
          color: #64748b;
          font-size: 12px;
          font-weight: 900;
          text-align: center;
          padding: 8px;
        }

        .project-library-image-request-note {
          margin: 0;
          border: 1px dashed #bfdbfe;
          border-radius: 14px;
          background: #eff6ff;
          color: #1e3a8a;
          padding: 10px 12px;
          font-size: 12px;
          font-weight: 850;
        }

        @media (max-width: 760px) {
          .project-library-internet-options {
            grid-template-columns: 1fr;
          }
        }
      </style>

      <section id="projectLibraryMessage" class="project-library-message" hidden></section>

      <section class="project-library-kpis" aria-label="Resumen biblioteca proyecto">
        <article><span>Estado</span><strong id="projectLibraryEnabledKpi">—</strong></article>
        <article><span>Recursos proyecto</span><strong id="projectLibraryTotalKpi">0</strong></article>
        <article><span>Videos</span><strong id="projectLibraryVideosKpi">—</strong></article>
        <article><span>Listo para plan</span><strong id="projectLibraryReadyKpi">—</strong></article>
      </section>

      <section class="project-library-image-requests" data-project-library-image-requests>
        <header>
          <div>
            <p class="eyebrow">Apoyo visual</p>
            <h3>Imagen sugerida</h3>
            <p>Sube una imagen por vez. Puedes pegar, arrastrar, examinar o elegir una opción de internet cuando esté conectada.</p>
          </div>
          <span class="project-library-image-chip">Una por vez</span>
        </header>

        <div class="project-library-image-pager" aria-label="Paginación de imágenes sugeridas">
          <span id="projectLibrarySuggestedImagesCounter" class="project-library-image-counter">0 de 0</span>
          <div class="project-library-image-pager-actions">
            <button id="projectLibrarySuggestedPrevBtn" class="project-library-button is-muted" type="button" data-suggested-image-action="prev">Anterior</button>
            <button id="projectLibrarySuggestedNextBtn" class="project-library-button is-muted" type="button" data-suggested-image-action="next">Siguiente</button>
          </div>
        </div>

        <div id="projectLibrarySuggestedImagesList" class="project-library-image-request-list" aria-label="Imagen sugerida actual">
          <article class="project-library-image-request-card" data-image-suggestion-card="tema-principal" data-image-suggestion-state="pendiente">
            <div class="project-library-image-request-top">
              <div class="project-library-image-request-title">
                <strong>Tema principal del video</strong>
              </div>
              <span class="project-library-image-chip">Pendiente</span>
            </div>
            <div class="project-library-image-search-box">
              <span>Buscar</span>
              <strong>tema principal video</strong>
            </div>
            <p class="project-library-image-description">Imagen de apoyo para reforzar la idea central del video.</p>
            <div id="projectLibrarySuggestedDropZone" class="project-library-smart-upload" data-suggested-image-action="upload">
              <strong>Pega, arrastra o examina la imagen</strong>
              <span>Ctrl+V, soltar imagen aquí o usar el botón Examinar.</span>
              <div class="project-library-smart-upload-actions">
                <button class="project-library-button is-save" type="button" data-suggested-image-action="upload">Examinar imagen</button>
                <button class="project-library-button is-muted" type="button" data-suggested-image-action="skip">No necesaria</button>
              </div>
            </div>
            <section class="project-library-internet-results" aria-label="Opciones de internet">
              <header>
                <strong>Imágenes de internet</strong>
                <button class="project-library-button" type="button" data-suggested-image-action="search-internet">Buscar 3 imágenes</button>
              </header>
              <div class="project-library-internet-options" id="projectLibraryInternetImageOptions">
                <div class="project-library-internet-option">Opción 1</div>
                <div class="project-library-internet-option">Opción 2</div>
                <div class="project-library-internet-option">Opción 3</div>
              </div>
            </section>
          </article>
        </div>

        <p id="projectLibrarySuggestedImagesHint" class="project-library-image-request-note">
          Bloque 1: pantalla lista para trabajar una imagen por vez. Los siguientes bloques conectan pegado, arrastre, Gemini y búsqueda real.
        </p>
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

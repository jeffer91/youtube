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

        .project-library-image-chip {
          border-radius: 999px;
          background: #eff6ff;
          color: #1d4ed8;
          padding: 6px 10px;
          font-size: 11px;
          font-weight: 950;
          white-space: nowrap;
        }

        .project-library-image-request-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 10px;
        }

        .project-library-image-request-card {
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          background: #fff;
          padding: 12px;
          display: grid;
          gap: 8px;
        }

        .project-library-image-request-card strong {
          display: block;
          color: #0f172a;
          font-size: 15px;
        }

        .project-library-image-request-card span,
        .project-library-image-request-card small {
          display: block;
          color: #64748b;
          font-weight: 800;
          line-height: 1.35;
        }

        .project-library-image-request-card small {
          font-size: 11px;
        }

        .project-library-image-request-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .project-library-image-request-actions button:disabled {
          opacity: .55;
          cursor: not-allowed;
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
            <h3>Imágenes sugeridas para subir</h3>
            <p>Después de cargar el proyecto, aquí aparecerán las imágenes que conviene buscar y subir para reforzar el video.</p>
          </div>
          <span class="project-library-image-chip">Bloque 1 · Visual</span>
        </header>

        <div id="projectLibrarySuggestedImagesList" class="project-library-image-request-list" aria-label="Lista de imágenes sugeridas">
          <article class="project-library-image-request-card" data-image-suggestion-card="tema-principal">
            <div>
              <strong>Tema principal del video</strong>
              <span>Uso sugerido: imagen de apoyo para reforzar la idea central.</span>
              <small>Estado: pendiente de detección automática.</small>
            </div>
            <div class="project-library-image-request-actions">
              <button class="project-library-button is-save" type="button" disabled>Subir imagen</button>
              <button class="project-library-button is-muted" type="button" disabled>No necesaria</button>
            </div>
          </article>

          <article class="project-library-image-request-card" data-image-suggestion-card="personaje-lugar-equipo">
            <div>
              <strong>Personaje, lugar, equipo o país mencionado</strong>
              <span>Uso sugerido: recurso visual cuando se mencione en la transcripción.</span>
              <small>Estado: pendiente de detección automática.</small>
            </div>
            <div class="project-library-image-request-actions">
              <button class="project-library-button is-save" type="button" disabled>Subir imagen</button>
              <button class="project-library-button is-muted" type="button" disabled>No necesaria</button>
            </div>
          </article>

          <article class="project-library-image-request-card" data-image-suggestion-card="grafico-tabla-mapa">
            <div>
              <strong>Tabla, mapa o gráfico de apoyo</strong>
              <span>Uso sugerido: imagen explicativa para partes difíciles del video.</span>
              <small>Estado: pendiente de detección automática.</small>
            </div>
            <div class="project-library-image-request-actions">
              <button class="project-library-button is-save" type="button" disabled>Subir imagen</button>
              <button class="project-library-button is-muted" type="button" disabled>No necesaria</button>
            </div>
          </article>
        </div>

        <p id="projectLibrarySuggestedImagesHint" class="project-library-image-request-note">
          En el Bloque 2 estos botones se conectarán para que puedas subir cada imagen sugerida y guardarla como recurso temporal del proyecto.
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

/* =========================================================
Nombre completo: cp-popup.js
Ruta o ubicación: /src/pantallas/01-cargar-proyecto/popup/cp-popup.js
Funciones principales:
- Mostrar popup después de cargar videos.
- Mostrar miniatura, nombre y duración.
- Mostrar errores si existen.
- Cerrar popup con X.
- Mantener mensajes cortos.
========================================================= */

const POPUP_ID = "cpPopupVideos";

function crearMiniatura(video) {
  if (video.miniatura) {
    return `
      <img
        class="cp-popup-video__img"
        src="${video.miniatura}"
        alt="Miniatura"
      />
    `;
  }

  return `
    <div class="cp-popup-video__empty">
      Video
    </div>
  `;
}

function crearVideoPopup(video) {
  return `
    <article class="cp-popup-video">
      <div class="cp-popup-video__thumb">
        ${crearMiniatura(video)}
      </div>

      <div class="cp-popup-video__info">
        <strong>${video.nombre || "Video sin nombre"}</strong>
        <span>${video.duracionTexto || "00:00"}</span>
      </div>
    </article>
  `;
}

function crearErrores(errores = []) {
  if (!Array.isArray(errores) || errores.length === 0) {
    return "";
  }

  const items = errores
    .map((error) => `<li>${error}</li>`)
    .join("");

  return `
    <div class="cp-popup-errors">
      <h4>Errores</h4>
      <ul>${items}</ul>
    </div>
  `;
}

function quitarPopupExistente() {
  const existente = document.getElementById(POPUP_ID);

  if (existente) {
    existente.remove();
  }
}

export function cerrarPopupVideos() {
  quitarPopupExistente();
}

export function mostrarPopupVideos({ videos = [], errores = [] } = {}) {
  quitarPopupExistente();

  const videosHtml = Array.isArray(videos) && videos.length
    ? videos.map(crearVideoPopup).join("")
    : `
      <div class="cp-popup-empty">
        No se agregaron videos nuevos.
      </div>
    `;

  const popup = document.createElement("div");

  popup.id = POPUP_ID;
  popup.className = "cp-popup-backdrop";
  popup.innerHTML = `
    <section class="cp-popup" role="dialog" aria-modal="true">
      <header class="cp-popup__head">
        <div>
          <h3>Videos cargados</h3>
          <p>Revisa lo agregado.</p>
        </div>

        <button
          id="cpBtnCerrarPopup"
          class="cp-popup__close"
          type="button"
          aria-label="Cerrar"
        >
          ×
        </button>
      </header>

      <div class="cp-popup__body">
        <div class="cp-popup-list">
          ${videosHtml}
        </div>

        ${crearErrores(errores)}
      </div>
    </section>
  `;

  document.body.appendChild(popup);

  const btnCerrar = document.getElementById("cpBtnCerrarPopup");

  if (btnCerrar) {
    btnCerrar.addEventListener("click", cerrarPopupVideos);
  }

  popup.addEventListener("click", (event) => {
    if (event.target === popup) {
      cerrarPopupVideos();
    }
  });
}
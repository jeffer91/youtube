/* =========================================================
Nombre completo: cp-lista.js
Ruta o ubicación: /src/pantallas/01-cargar-proyecto/render/cp-lista.js
Funciones principales:
- Renderizar la lista de videos cargados.
- Mostrar miniatura, nombre y duración.
- Permitir quitar videos con X.
- Permitir ordenar con botones subir/bajar.
- Dejar lista preparada para drag and drop.
========================================================= */

function crearMiniatura(video) {
  if (video.miniatura) {
    return `
      <img
        class="cp-video-card__thumb-img"
        src="${video.miniatura}"
        alt="Miniatura de ${video.nombre || "video"}"
      />
    `;
  }

  return `
    <div class="cp-video-card__thumb-empty">
      Video
    </div>
  `;
}

function crearVideoItem(video, index, total) {
  const puedeSubir = index > 0;
  const puedeBajar = index < total - 1;

  return `
    <article
      class="cp-video-card"
      draggable="true"
      data-video-id="${video.id}"
    >
      <div class="cp-video-card__drag" title="Arrastrar">
        ⋮⋮
      </div>

      <div class="cp-video-card__thumb">
        ${crearMiniatura(video)}
      </div>

      <div class="cp-video-card__body">
        <strong>${video.nombre || "Video sin nombre"}</strong>
        <span>${video.duracionTexto || "00:00"}</span>
      </div>

      <div class="cp-video-card__controls">
        <button
          class="cp-icon-btn"
          type="button"
          data-cp-subir="${video.id}"
          ${puedeSubir ? "" : "disabled"}
          title="Subir"
        >
          ↑
        </button>

        <button
          class="cp-icon-btn"
          type="button"
          data-cp-bajar="${video.id}"
          ${puedeBajar ? "" : "disabled"}
          title="Bajar"
        >
          ↓
        </button>

        <button
          class="cp-icon-btn cp-icon-btn--danger"
          type="button"
          data-cp-quitar="${video.id}"
          title="Quitar"
        >
          ×
        </button>
      </div>
    </article>
  `;
}

export function renderListaVideos({ contenedor, videos }) {
  if (!contenedor) {
    return;
  }

  if (!Array.isArray(videos) || videos.length === 0) {
    contenedor.innerHTML = `
      <div class="cp-list-empty">
        <h4>No hay videos cargados</h4>
        <p>Regresa al paso 1 para cargar videos.</p>
      </div>
    `;
    return;
  }

  const items = videos
    .map((video, index) => crearVideoItem(video, index, videos.length))
    .join("");

  contenedor.innerHTML = `
    <div class="cp-video-list__items">
      ${items}
    </div>
  `;
}

function moverVideo(videos, videoId, direccion) {
  const lista = Array.isArray(videos) ? [...videos] : [];
  const index = lista.findIndex((video) => video.id === videoId);

  if (index < 0) {
    return lista;
  }

  const nuevoIndex = index + direccion;

  if (nuevoIndex < 0 || nuevoIndex >= lista.length) {
    return lista;
  }

  const temporal = lista[index];
  lista[index] = lista[nuevoIndex];
  lista[nuevoIndex] = temporal;

  return lista;
}

export function conectarListaVideos({ service }) {
  const botonesQuitar = document.querySelectorAll("[data-cp-quitar]");
  const botonesSubir = document.querySelectorAll("[data-cp-subir]");
  const botonesBajar = document.querySelectorAll("[data-cp-bajar]");

  botonesQuitar.forEach((boton) => {
    boton.addEventListener("click", () => {
      service.quitarVideo(boton.dataset.cpQuitar);
    });
  });

  botonesSubir.forEach((boton) => {
    boton.addEventListener("click", () => {
      const estado = service.obtenerEstado();
      const videos = moverVideo(estado.videos, boton.dataset.cpSubir, -1);
      service.ordenarVideos(videos);
    });
  });

  botonesBajar.forEach((boton) => {
    boton.addEventListener("click", () => {
      const estado = service.obtenerEstado();
      const videos = moverVideo(estado.videos, boton.dataset.cpBajar, 1);
      service.ordenarVideos(videos);
    });
  });
}

export function obtenerVideosDesdeDOM(videosActuales = []) {
  const tarjetas = document.querySelectorAll("[data-video-id]");
  const ids = Array.from(tarjetas).map((tarjeta) => tarjeta.dataset.videoId);

  return ids
    .map((id) => videosActuales.find((video) => video.id === id))
    .filter(Boolean);
}
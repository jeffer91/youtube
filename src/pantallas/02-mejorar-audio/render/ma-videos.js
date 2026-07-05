/* =========================================================
Nombre completo: ma-videos.js
Ruta o ubicación: /src/pantallas/02-mejorar-audio/render/ma-videos.js
Funciones principales:
- Renderizar el selector de videos recibidos desde Cargar proyecto.
- Mostrar todos los videos de la pantalla anterior.
- Permitir elegir el video actual.
- Mostrar estado pendiente o mejorado.
- Mantener poco texto en pantalla.
========================================================= */

import {
  obtenerNombreVideo,
  obtenerDuracionVideo,
  videoTieneMejora
} from "../helpers/ma-video.js";

function escaparHtml(texto) {
  return String(texto || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function crearOpcionVideo(video, videoActualId) {
  const seleccionado = video.id === videoActualId ? "selected" : "";
  const estado = videoTieneMejora(video) ? "Mejorado" : "Pendiente";
  const nombre = obtenerNombreVideo(video);
  const duracion = obtenerDuracionVideo(video);

  return `
    <option value="${escaparHtml(video.id)}" ${seleccionado}>
      ${escaparHtml(nombre)} · ${escaparHtml(duracion)} · ${estado}
    </option>
  `;
}

export function renderSelectorVideosMA({ contenedor, videos, videoActualId }) {
  if (!contenedor) {
    return;
  }

  if (!Array.isArray(videos) || videos.length === 0) {
    contenedor.innerHTML = `
      <div class="ma-video-empty">
        <strong>No hay videos</strong>
        <span>Regresa a Cargar proyecto.</span>
      </div>
    `;
    return;
  }

  const opciones = videos
    .map((video) => crearOpcionVideo(video, videoActualId))
    .join("");

  contenedor.innerHTML = `
    <label class="ma-field">
      <span>Video</span>
      <select id="maSelectorVideo" class="ma-input">
        ${opciones}
      </select>
    </label>
  `;
}

export function conectarSelectorVideosMA({ service }) {
  const selector = document.getElementById("maSelectorVideo");

  if (!selector || !service?.cambiarVideo) {
    return;
  }

  selector.addEventListener("change", () => {
    service.cambiarVideo(selector.value);
  });
}

export function renderResumenVideoMA({ contenedor, video }) {
  if (!contenedor) {
    return;
  }

  if (!video) {
    contenedor.innerHTML = `
      <div class="ma-summary-card">
        <span>Video</span>
        <strong>Sin selección</strong>
      </div>
    `;
    return;
  }

  const estado = videoTieneMejora(video) ? "Mejorado" : "Pendiente";

  contenedor.innerHTML = `
    <div class="ma-summary-grid">
      <div class="ma-summary-card">
        <span>Video</span>
        <strong>${escaparHtml(obtenerNombreVideo(video))}</strong>
      </div>

      <div class="ma-summary-card">
        <span>Duración</span>
        <strong>${escaparHtml(obtenerDuracionVideo(video))}</strong>
      </div>

      <div class="ma-summary-card">
        <span>Estado</span>
        <strong>${estado}</strong>
      </div>
    </div>
  `;
}
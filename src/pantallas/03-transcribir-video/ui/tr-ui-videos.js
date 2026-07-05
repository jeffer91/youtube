/* =========================================================
Nombre completo: tr-ui-videos.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/ui/tr-ui-videos.js
Funciones principales:
- Renderizar el selector de videos.
- Renderizar el resumen del video seleccionado.
- Mostrar si existe audio mejorado.
- Mantener separada la parte visual de videos.
Con qué se conecta:
- tr-ui-layout.js
- tr-selectores.js
========================================================= */

import {
  obtenerVideosTR,
  obtenerVideoSeleccionadoTR,
  videoTieneAudioMejoradoTR
} from "../estado/tr-selectores.js";

function escaparHtmlTR(texto) {
  return String(texto || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderSelectorVideosTR(contenedor, estado) {
  if (!contenedor) {
    return;
  }

  const videos = obtenerVideosTR(estado);
  const videoActual = obtenerVideoSeleccionadoTR(estado);

  if (!videos.length) {
    contenedor.innerHTML = `
      <div class="tr-empty">
        <div>
          <h3>No hay videos</h3>
          <p>Primero carga un proyecto con videos.</p>
        </div>
      </div>
    `;
    return;
  }

  contenedor.innerHTML = `
    <label class="tr-field">
      <span>Video para transcribir</span>
      <select id="trVideoSelect" class="tr-select">
        ${videos
          .map((video) => {
            const selected = video.id === videoActual?.id ? "selected" : "";

            return `
              <option value="${escaparHtmlTR(video.id)}" ${selected}>
                ${escaparHtmlTR(video.nombre)}
              </option>
            `;
          })
          .join("")}
      </select>
    </label>
  `;
}

export function renderResumenVideoTR(contenedor, estado) {
  if (!contenedor) {
    return;
  }

  const video = obtenerVideoSeleccionadoTR(estado);

  if (!video) {
    contenedor.innerHTML = `
      <div class="tr-empty">
        <div>
          <h3>Sin video seleccionado</h3>
          <p>No existe un video listo para transcribir.</p>
        </div>
      </div>
    `;
    return;
  }

  const miniaturaHtml = video.miniatura
    ? `<img src="${escaparHtmlTR(video.miniatura)}" alt="Miniatura del video">`
    : `<div class="tr-video-summary__thumb-empty">Video</div>`;

  const textoAudio = videoTieneAudioMejoradoTR(video)
    ? "Tiene audio mejorado disponible"
    : "Solo audio original disponible";

  contenedor.innerHTML = `
    <div class="tr-video-summary">
      <div class="tr-video-summary__thumb">
        ${miniaturaHtml}
      </div>

      <div class="tr-video-summary__body">
        <strong>${escaparHtmlTR(video.nombre)}</strong>
        <span>Duración: ${escaparHtmlTR(video.duracionTexto || "00:00")}</span>
        <span>${escaparHtmlTR(textoAudio)}</span>
      </div>
    </div>
  `;
}
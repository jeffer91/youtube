/* =========================================================
Nombre completo: tr-videos.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/render/tr-videos.js
Funciones principales:
- Renderizar pasos de la pantalla Transcribir video.
- Renderizar selector de videos del proyecto.
- Renderizar resumen del video seleccionado.
- Conectar cambio de video con el servicio de transcripción.
Con qué se conecta:
- tr.js
- tr-service.js
- tr-texto.js
========================================================= */

import {
  escaparHtmlTR
} from "../helpers/tr-texto.js";

function obtenerNombreVideoTR(video) {
  return video?.nombre || video?.ruta || "Video sin nombre";
}

function formatearPesoTR(pesoBytes) {
  const peso = Number(pesoBytes) || 0;

  if (peso <= 0) {
    return "Peso no disponible";
  }

  if (peso < 1024 * 1024) {
    return `${Math.round(peso / 1024)} KB`;
  }

  return `${(peso / 1024 / 1024).toFixed(1)} MB`;
}

export function renderPasosTR({ contenedor, pasos, pasoActual }) {
  if (!contenedor) {
    return;
  }

  const lista = Array.isArray(pasos) ? pasos : [];
  const indiceActual = lista.findIndex((paso) => paso.id === pasoActual);

  contenedor.innerHTML = lista.map((paso, indice) => {
    const activo = paso.id === pasoActual;
    const hecho = indiceActual > indice;

    return `
      <button
        class="tr-step ${activo ? "is-active" : ""} ${hecho ? "is-done" : ""}"
        type="button"
        data-tr-paso="${escaparHtmlTR(paso.id)}"
      >
        <span class="tr-step__number">${escaparHtmlTR(paso.numero)}</span>
        <span class="tr-step__info">
          <strong>${escaparHtmlTR(paso.titulo)}</strong>
          <small>${escaparHtmlTR(paso.descripcion)}</small>
        </span>
      </button>
    `;
  }).join("");
}

export function conectarPasosTR({ service }) {
  document.querySelectorAll("[data-tr-paso]").forEach((boton) => {
    boton.addEventListener("click", () => {
      service.cambiarPaso(boton.dataset.trPaso);
    });
  });
}

export function renderSelectorVideosTR({ contenedor, videos, videoActualId }) {
  if (!contenedor) {
    return;
  }

  const lista = Array.isArray(videos) ? videos : [];

  if (!lista.length) {
    contenedor.innerHTML = `
      <div class="tr-empty">
        <div>
          <h3>Sin videos</h3>
          <p>Primero carga un proyecto con videos.</p>
        </div>
      </div>
    `;
    return;
  }

  const opciones = lista.map((video) => {
    const seleccionado = video.id === videoActualId ? "selected" : "";
    const nombre = `${video.orden || ""}. ${obtenerNombreVideoTR(video)}`.trim();

    return `
      <option value="${escaparHtmlTR(video.id)}" ${seleccionado}>
        ${escaparHtmlTR(nombre)}
      </option>
    `;
  }).join("");

  contenedor.innerHTML = `
    <label class="tr-field">
      <span>Video a transcribir</span>
      <select id="trVideoActual" class="tr-select">
        ${opciones}
      </select>
      <small class="tr-help">La transcripción se guardará dentro del video seleccionado.</small>
    </label>
  `;
}

export function conectarSelectorVideosTR({ service }) {
  const selector = document.getElementById("trVideoActual");

  if (!selector) {
    return;
  }

  selector.addEventListener("change", () => {
    service.cambiarVideo(selector.value);
  });
}

export function renderResumenVideoTR({ contenedor, video, transcripcion }) {
  if (!contenedor) {
    return;
  }

  if (!video) {
    contenedor.innerHTML = `
      <div class="tr-video-summary">
        <div class="tr-video-summary__thumb">
          <div class="tr-video-summary__thumb-empty">Sin video</div>
        </div>
        <div class="tr-video-summary__body">
          <strong>No hay video seleccionado</strong>
          <span>Selecciona un video para continuar.</span>
        </div>
      </div>
    `;
    return;
  }

  const tieneTranscripcion = Boolean(transcripcion?.texto);
  const estadoTexto = tieneTranscripcion ? "Con transcripción" : "Sin transcripción guardada";

  contenedor.innerHTML = `
    <div class="tr-video-summary">
      <div class="tr-video-summary__thumb">
        ${video.url ? `<video src="${escaparHtmlTR(video.url)}" muted></video>` : `<div class="tr-video-summary__thumb-empty">Video</div>`}
      </div>
      <div class="tr-video-summary__body">
        <strong>${escaparHtmlTR(obtenerNombreVideoTR(video))}</strong>
        <span>${escaparHtmlTR(video.extension || "video")} · ${escaparHtmlTR(formatearPesoTR(video.pesoBytes))}</span>
        <span>${escaparHtmlTR(estadoTexto)}</span>
      </div>
    </div>
  `;
}

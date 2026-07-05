/* =========================================================
Nombre completo: tr-resultado.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/render/tr-resultado.js
Funciones principales:
- Renderizar resultado de transcripción.
- Mostrar texto limpio, segmentos y exportación preparada.
- Mantener HTML seguro al pintar texto generado o pegado.
Con qué se conecta:
- tr.js
- tr-service.js
- tr-tiempo.js
- tr-texto.js
========================================================= */

import {
  escaparHtmlTR,
  limitarTextoTR
} from "../helpers/tr-texto.js";

import {
  formatearTiempoCortoTR
} from "../helpers/tr-tiempo.js";

function renderSegmentosTR(segmentos) {
  const lista = Array.isArray(segmentos) ? segmentos : [];

  if (!lista.length) {
    return `<div class="tr-result__box">No hay segmentos todavía.</div>`;
  }

  return `
    <div class="tr-segment-list">
      ${lista.map((segmento, index) => {
        const inicio = segmento.inicioTexto || formatearTiempoCortoTR(segmento.inicio || 0);
        const fin = segmento.finTexto || formatearTiempoCortoTR(segmento.fin || 0);

        return `
          <div class="tr-segment">
            <strong>${index + 1}. ${escaparHtmlTR(inicio)} - ${escaparHtmlTR(fin)}</strong>
            <span>${escaparHtmlTR(segmento.texto || "")}</span>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderExportacionTR(exportacion) {
  if (!exportacion) {
    return `
      <div class="tr-result__box">
        Prepara una exportación TXT, SRT o JSON para ver aquí el contenido generado.
      </div>
    `;
  }

  return `
    <div class="tr-result__box">
      Archivo: ${escaparHtmlTR(exportacion.nombreArchivo)}\n\n${escaparHtmlTR(limitarTextoTR(exportacion.contenido, 2500))}
    </div>
  `;
}

export function renderResultadoTranscripcionTR({ contenedor, estado }) {
  if (!contenedor) {
    return;
  }

  const transcripcion = estado.transcripcionActual || null;
  const texto = transcripcion?.texto || "";
  const segmentos = transcripcion?.segmentos || [];
  const resumen = transcripcion?.resumen || {};

  if (!transcripcion) {
    contenedor.innerHTML = `
      <div class="tr-result__head">
        <div>
          <h3>Resultado</h3>
          <p>Cuando transcribas un video, el texto aparecerá aquí.</p>
        </div>
      </div>

      <div class="tr-empty">
        <div>
          <h3>Sin transcripción</h3>
          <p>Selecciona un video, elige un motor y presiona Transcribir.</p>
        </div>
      </div>
    `;
    return;
  }

  contenedor.innerHTML = `
    <div class="tr-result__head">
      <div>
        <h3>Resultado</h3>
        <p>${escaparHtmlTR(resumen.totalPalabras || 0)} palabras · ${escaparHtmlTR(segmentos.length)} segmentos · Motor ${escaparHtmlTR(transcripcion.motor || "manual")}</p>
      </div>
    </div>

    <div class="tr-result__tabs" role="tablist">
      <button class="tr-tab is-active" type="button" data-tr-tab="texto">Texto limpio</button>
      <button class="tr-tab" type="button" data-tr-tab="segmentos">Segmentos</button>
      <button class="tr-tab" type="button" data-tr-tab="exportacion">Exportación</button>
    </div>

    <div id="trResultadoTexto" class="tr-tab-content" data-tr-content="texto">
      <div class="tr-result__box">${escaparHtmlTR(texto || "Sin texto transcrito.")}</div>
    </div>

    <div id="trResultadoSegmentos" class="tr-tab-content tr-hidden" data-tr-content="segmentos">
      ${renderSegmentosTR(segmentos)}
    </div>

    <div id="trResultadoExportacion" class="tr-tab-content tr-hidden" data-tr-content="exportacion">
      ${renderExportacionTR(estado.exportacionActual)}
    </div>
  `;
}

export function conectarResultadoTranscripcionTR() {
  const tabs = document.querySelectorAll("[data-tr-tab]");
  const contenidos = document.querySelectorAll("[data-tr-content]");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const id = tab.dataset.trTab;

      tabs.forEach((item) => {
        item.classList.toggle("is-active", item.dataset.trTab === id);
      });

      contenidos.forEach((contenido) => {
        contenido.classList.toggle("tr-hidden", contenido.dataset.trContent !== id);
      });
    });
  });
}

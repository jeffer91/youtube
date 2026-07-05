/* =========================================================
Nombre completo: tr-ui-layout.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/ui/tr-ui-layout.js
Funciones principales:
- Coordinar el renderizado general de la pantalla Transcribir video.
- Delegar selector de videos, opciones, progreso, resultado y mensajes.
- Renderizar pasos y botones principales.
- Conectar eventos visuales básicos.
Con qué se conecta:
- tr.js
- tr-ui-videos.js
- tr-ui-opciones.js
- tr-ui-progreso.js
- tr-ui-resultado.js
- tr-ui-errores.js
- tr-selectores.js
========================================================= */

import {
  obtenerResultadoTR,
  puedeTranscribirTR
} from "../estado/tr-selectores.js";

import {
  renderSelectorVideosTR,
  renderResumenVideoTR
} from "./tr-ui-videos.js";

import { renderOpcionesTR } from "./tr-ui-opciones.js";
import { renderProgresoTR } from "./tr-ui-progreso.js";
import { renderResultadoTR } from "./tr-ui-resultado.js";
import { renderMensajesTR } from "./tr-ui-errores.js";

function escaparHtmlTR(texto) {
  return String(texto || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderPasosTR(contenedor, estado) {
  if (!contenedor) {
    return;
  }

  const resultado = obtenerResultadoTR(estado);
  const procesando = Boolean(estado?.procesando);
  const tieneVideo = Boolean(estado?.videoSeleccionadoId);

  const pasos = [
    {
      numero: "01",
      titulo: "Elegir video",
      detalle: "Selecciona el video del proyecto.",
      activo: !procesando && !resultado,
      listo: tieneVideo
    },
    {
      numero: "02",
      titulo: "Configurar",
      detalle: "Idioma, motor y calidad.",
      activo: !procesando && !resultado,
      listo: Boolean(estado?.opciones)
    },
    {
      numero: "03",
      titulo: "Transcribir",
      detalle: "Procesar audio y generar texto.",
      activo: procesando,
      listo: Boolean(resultado)
    },
    {
      numero: "04",
      titulo: "Guardar",
      detalle: "Exportar TXT, SRT, VTT o JSON.",
      activo: Boolean(resultado),
      listo: Boolean(resultado)
    }
  ];

  contenedor.innerHTML = `
    <div class="tr-steps">
      ${pasos
        .map((paso) => {
          const clases = [
            "tr-step",
            paso.activo ? "is-active" : "",
            paso.listo ? "is-done" : ""
          ]
            .filter(Boolean)
            .join(" ");

          return `
            <div class="${clases}">
              <div class="tr-step__number">${escaparHtmlTR(paso.numero)}</div>
              <div class="tr-step__info">
                <strong>${escaparHtmlTR(paso.titulo)}</strong>
                <small>${escaparHtmlTR(paso.detalle)}</small>
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderAccionesTR(contenedor, estado) {
  if (!contenedor) {
    return;
  }

  const puedeTranscribir = puedeTranscribirTR(estado);
  const resultado = obtenerResultadoTR(estado);
  const procesando = Boolean(estado?.procesando);

  contenedor.innerHTML = `
    <div class="tr-actions">
      <button type="button" class="tr-btn" id="trBtnIrAudio" ${procesando ? "disabled" : ""}>
        Volver a mejorar audio
      </button>

      <button type="button" class="tr-btn" id="trBtnProbarConexion" ${procesando ? "disabled" : ""}>
        Probar conexión
      </button>

      <button
        type="button"
        class="tr-btn tr-btn--primary"
        id="trBtnTranscribir"
        ${puedeTranscribir && !procesando ? "" : "disabled"}
      >
        ${procesando ? "Transcribiendo..." : "Transcribir video"}
      </button>

      <button type="button" class="tr-btn" id="trBtnExportar" ${resultado && !procesando ? "" : "disabled"}>
        Exportar
      </button>
    </div>
  `;
}

export function renderPantallaTR({ elementos, estado }) {
  renderPasosTR(elementos.pasos, estado);
  renderMensajesTR(elementos.mensajes, estado);
  renderSelectorVideosTR(elementos.selectorVideos, estado);
  renderResumenVideoTR(elementos.resumenVideo, estado);
  renderOpcionesTR(elementos.opciones, estado);
  renderProgresoTR(elementos.progreso, estado);
  renderResultadoTR(elementos.resultado, estado);
  renderAccionesTR(elementos.acciones, estado);
}

export function renderSinProyectoTR(root, errores = []) {
  if (!root) {
    return;
  }

  const erroresHtml = errores.length
    ? errores.map((error) => `<p>${escaparHtmlTR(error)}</p>`).join("")
    : "<p>Primero carga un proyecto con videos.</p>";

  root.innerHTML = `
    <section class="tr-screen" id="trRoot">
      <div class="app-empty">
        <div>
          <h3>No hay proyecto listo para transcribir</h3>
          ${erroresHtml}
        </div>
      </div>
    </section>
  `;
}

export function conectarEventosLayoutTR({
  onSeleccionarVideo,
  onCambiarOpcion,
  onProbarConexion,
  onTranscribir,
  onExportar,
  onIrAMejorarAudio
} = {}) {
  const selectorVideo = document.getElementById("trVideoSelect");
  const origenAudio = document.getElementById("trOrigenAudio");
  const idioma = document.getElementById("trIdioma");
  const motor = document.getElementById("trMotor");
  const calidad = document.getElementById("trCalidad");
  const btnProbarConexion = document.getElementById("trBtnProbarConexion");
  const btnTranscribir = document.getElementById("trBtnTranscribir");
  const btnExportar = document.getElementById("trBtnExportar");
  const btnIrAudio = document.getElementById("trBtnIrAudio");

  if (selectorVideo && typeof onSeleccionarVideo === "function") {
    selectorVideo.addEventListener("change", () => {
      onSeleccionarVideo(selectorVideo.value);
    });
  }

  if (origenAudio && typeof onCambiarOpcion === "function") {
    origenAudio.addEventListener("change", () => {
      onCambiarOpcion("origenAudio", origenAudio.value);
    });
  }

  if (idioma && typeof onCambiarOpcion === "function") {
    idioma.addEventListener("change", () => {
      onCambiarOpcion("idioma", idioma.value);
    });
  }

  if (motor && typeof onCambiarOpcion === "function") {
    motor.addEventListener("change", () => {
      onCambiarOpcion("motor", motor.value);
    });
  }

  if (calidad && typeof onCambiarOpcion === "function") {
    calidad.addEventListener("change", () => {
      onCambiarOpcion("calidad", calidad.value);
    });
  }

  if (btnProbarConexion && typeof onProbarConexion === "function") {
    btnProbarConexion.addEventListener("click", onProbarConexion);
  }

  if (btnTranscribir && typeof onTranscribir === "function") {
    btnTranscribir.addEventListener("click", onTranscribir);
  }

  if (btnExportar && typeof onExportar === "function") {
    btnExportar.addEventListener("click", onExportar);
  }

  if (btnIrAudio && typeof onIrAMejorarAudio === "function") {
    btnIrAudio.addEventListener("click", onIrAMejorarAudio);
  }
}
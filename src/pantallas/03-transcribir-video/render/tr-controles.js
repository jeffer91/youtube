/* =========================================================
Nombre completo: tr-controles.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/render/tr-controles.js
Funciones principales:
- Renderizar opciones de motor, idioma y texto manual.
- Renderizar progreso y estado del proceso de transcripción.
- Conectar controles con el servicio de transcripción.
Con qué se conecta:
- tr.js
- tr-service.js
- tr-validar.js
- tr-texto.js
========================================================= */

import {
  escaparHtmlTR
} from "../helpers/tr-texto.js";

function motorRequiereTextoManualTR(estado) {
  const motor = (estado.motores || []).find((item) => item.id === estado.motorId);
  return Boolean(motor?.requiereTextoManual);
}

function crearOpcionMotorTR(motor, motorActual) {
  const activo = motor.id === motorActual;

  return `
    <label class="tr-option-card ${activo ? "is-active" : ""}">
      <span class="tr-radio-line">
        <input
          type="radio"
          name="trMotorTranscripcion"
          value="${escaparHtmlTR(motor.id)}"
          ${activo ? "checked" : ""}
        />
        <span>
          <strong>${escaparHtmlTR(motor.nombre)}</strong><br />
          <span>${escaparHtmlTR(motor.descripcion)}</span>
        </span>
      </span>
    </label>
  `;
}

export function renderOpcionesTranscripcionTR({ contenedor, estado }) {
  if (!contenedor) {
    return;
  }

  const motores = Array.isArray(estado.motores) ? estado.motores : [];
  const requiereManual = motorRequiereTextoManualTR(estado);

  contenedor.innerHTML = `
    <div class="tr-panel__head">
      <h3>Opciones</h3>
      <p>Elige cómo quieres obtener la transcripción.</p>
    </div>

    <div class="tr-options">
      <div class="tr-field">
        <span>Idioma</span>
        <select id="trIdioma" class="tr-select">
          <option value="es" ${estado.idioma === "es" ? "selected" : ""}>Español</option>
          <option value="en" ${estado.idioma === "en" ? "selected" : ""}>Inglés</option>
          <option value="auto" ${estado.idioma === "auto" ? "selected" : ""}>Detectar automático</option>
        </select>
      </div>

      <div class="tr-field">
        <span>Motor</span>
        ${motores.map((motor) => crearOpcionMotorTR(motor, estado.motorId)).join("")}
      </div>

      <label class="tr-field ${requiereManual ? "" : "tr-hidden"}">
        <span>Transcripción manual</span>
        <textarea
          id="trTextoManual"
          class="tr-textarea"
          spellcheck="true"
        >${escaparHtmlTR(estado.textoManual || "")}</textarea>
        <small class="tr-help">Pega texto simple si usas TXT, o subtítulos con tiempos si usas SRT.</small>
      </label>
    </div>
  `;
}

export function conectarControlesTranscripcionTR({ service }) {
  const idioma = document.getElementById("trIdioma");
  const textoManual = document.getElementById("trTextoManual");

  if (idioma) {
    idioma.addEventListener("change", () => {
      service.cambiarIdioma(idioma.value);
    });
  }

  document.querySelectorAll("input[name='trMotorTranscripcion']").forEach((radio) => {
    radio.addEventListener("change", () => {
      if (radio.checked) {
        service.cambiarMotor(radio.value);
      }
    });
  });

  if (textoManual) {
    textoManual.addEventListener("input", () => {
      service.cambiarTextoManual(textoManual.value);
    });
  }
}

export function renderProgresoTranscripcionTR({ contenedor, estado }) {
  if (!contenedor) {
    return;
  }

  const progreso = Math.max(0, Math.min(100, Number(estado.progreso) || 0));
  const motor = (estado.motores || []).find((item) => item.id === estado.motorId);
  const transcripcion = estado.transcripcionActual || null;
  const totalPalabras = transcripcion?.resumen?.totalPalabras || 0;
  const totalSegmentos = Array.isArray(transcripcion?.segmentos) ? transcripcion.segmentos.length : 0;

  contenedor.innerHTML = `
    <div class="tr-panel__head">
      <h3>Progreso</h3>
      <p>${escaparHtmlTR(estado.estadoProceso || "Esperando acción.")}</p>
    </div>

    <div class="tr-progress">
      <div class="tr-progress__bar" aria-label="Progreso de transcripción">
        <div class="tr-progress__fill" style="width: ${progreso}%;"></div>
      </div>

      <div class="tr-progress__text">
        ${progreso}% completado
      </div>

      <div class="tr-progress__details">
        <div class="tr-chip-row">
          <span class="tr-chip">Motor: ${escaparHtmlTR(motor?.nombre || "Sin motor")}</span>
          <span class="tr-chip">Idioma: ${escaparHtmlTR(estado.idioma || "es")}</span>
          <span class="tr-chip">Palabras: ${escaparHtmlTR(String(totalPalabras))}</span>
          <span class="tr-chip">Segmentos: ${escaparHtmlTR(String(totalSegmentos))}</span>
        </div>
      </div>
    </div>
  `;
}

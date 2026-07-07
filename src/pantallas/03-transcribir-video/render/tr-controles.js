/* =========================================================
Nombre completo: tr-controles.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/render/tr-controles.js
Funciones principales:
- Renderizar opciones de motor automático e idioma.
- Eliminar campos de transcripción manual TXT/SRT.
- Renderizar progreso y estado del proceso de transcripción.
- Mostrar disponibilidad de Whisper local.
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

  contenedor.innerHTML = `
    <div class="tr-panel__head">
      <h3>Opciones</h3>
      <p>Elige el idioma y el motor automático de transcripción.</p>
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
        <span>Motor automático</span>
        ${motores.map((motor) => crearOpcionMotorTR(motor, estado.motorId)).join("")}
      </div>
    </div>
  `;
}

export function conectarControlesTranscripcionTR({ service }) {
  const idioma = document.getElementById("trIdioma");

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
}

function crearEstadoWhisperTextoTR(estado) {
  if (estado.verificandoWhisper) {
    return "Whisper: verificando";
  }

  if (estado.whisperDisponible === true) {
    return "Whisper: disponible";
  }

  if (estado.whisperDisponible === false) {
    return "Whisper: no disponible";
  }

  return "Whisper: sin verificar";
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
          <span class="tr-chip">${escaparHtmlTR(crearEstadoWhisperTextoTR(estado))}</span>
          <span class="tr-chip">Palabras: ${escaparHtmlTR(String(totalPalabras))}</span>
          <span class="tr-chip">Segmentos: ${escaparHtmlTR(String(totalSegmentos))}</span>
        </div>
      </div>
    </div>
  `;
}

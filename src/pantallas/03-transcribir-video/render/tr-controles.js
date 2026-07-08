/* =========================================================
Nombre completo: tr-controles.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/render/tr-controles.js
Funciones principales:
- Renderizar idioma y dos motores automáticos.
- Mostrar progreso por etapas y por lote de videos.
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

const ETAPAS_PROGRESO_TR = Object.freeze([
  {
    porcentaje: 10,
    titulo: "Preparar",
    descripcion: "Video y fuente"
  },
  {
    porcentaje: 25,
    titulo: "Audio",
    descripcion: "Extraer WAV"
  },
  {
    porcentaje: 45,
    titulo: "Motor",
    descripcion: "Procesar voz"
  },
  {
    porcentaje: 70,
    titulo: "Bloques",
    descripcion: "Ordenar tiempos"
  },
  {
    porcentaje: 95,
    titulo: "Resultado",
    descripcion: "Texto final"
  }
]);

function crearOpcionMotorTR(motor, motorActual) {
  const activo = motor.id === motorActual;

  return `
    <label class="tr-option-card tr-engine-card ${activo ? "is-active" : ""}">
      <span class="tr-radio-line">
        <input
          type="radio"
          name="trMotorTranscripcion"
          value="${escaparHtmlTR(motor.id)}"
          ${activo ? "checked" : ""}
        />
        <span class="tr-engine-card__body">
          <small class="tr-engine-card__tag">${escaparHtmlTR(motor.numero || "Motor")}</small>
          <strong>${escaparHtmlTR(motor.nombre)}</strong>
          <span>${escaparHtmlTR(motor.descripcion)}</span>
          <em>Modelo: ${escaparHtmlTR(motor.modelo || "base")} · ${escaparHtmlTR(motor.detalle || "Transcripción automática local.")}</em>
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
      <p>Elige el idioma y uno de los dos motores. Al transcribir, se procesarán todos los videos cargados.</p>
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
        <span>Motores de transcripción</span>
        <div class="tr-engine-grid">
          ${motores.map((motor) => crearOpcionMotorTR(motor, estado.motorId)).join("")}
        </div>
        <p class="tr-help">La transcripción es automática por lote: si cargaste 2 videos, se transcriben 2; si cargaste 3, se transcriben 3.</p>
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

function crearEtapasProgresoTR(progreso) {
  return ETAPAS_PROGRESO_TR.map((etapa) => {
    const completada = progreso >= etapa.porcentaje + 5;
    const activa = !completada && progreso >= etapa.porcentaje - 10;

    return `
      <div class="tr-progress-step ${completada ? "is-done" : ""} ${activa ? "is-active" : ""}">
        <span class="tr-progress-step__dot"></span>
        <strong>${escaparHtmlTR(etapa.titulo)}</strong>
        <small>${escaparHtmlTR(etapa.descripcion)}</small>
      </div>
    `;
  }).join("");
}

function renderResumenLoteTR(lote) {
  if (!lote || !lote.total) {
    return "";
  }

  return `
    <div class="tr-batch-summary">
      <strong>Lote de videos</strong>
      <span>${escaparHtmlTR(String(lote.procesados || 0))}/${escaparHtmlTR(String(lote.total || 0))} procesados</span>
      <span>${escaparHtmlTR(String(lote.exitosos || 0))} correctos</span>
      <span>${escaparHtmlTR(String(lote.fallidos || 0))} con error</span>
      ${lote.actualNombre ? `<small>Actual: ${escaparHtmlTR(lote.actualNombre)}</small>` : ""}
    </div>
  `;
}

export function renderProgresoTranscripcionTR({ contenedor, estado }) {
  if (!contenedor) {
    return;
  }

  const progreso = Math.max(0, Math.min(100, Number(estado.progreso) || 0));
  const motor = (estado.motores || []).find((item) => item.id === estado.motorId);
  const transcripcion = estado.transcripcionActual || null;
  const lote = estado.resultadoLoteTranscripcion || null;
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

      <div class="tr-progress__meta">
        <strong>${progreso}%</strong>
        <span>${progreso >= 100 ? "Transcripción terminada" : "Procesando lote"}</span>
      </div>

      ${renderResumenLoteTR(lote)}

      <div class="tr-progress-steps">
        ${crearEtapasProgresoTR(progreso)}
      </div>

      <div class="tr-progress__details">
        <div class="tr-chip-row">
          <span class="tr-chip">Motor: ${escaparHtmlTR(motor?.nombre || "Sin motor")}</span>
          <span class="tr-chip">Idioma: ${escaparHtmlTR(estado.idioma || "es")}</span>
          <span class="tr-chip">${escaparHtmlTR(crearEstadoWhisperTextoTR(estado))}</span>
          <span class="tr-chip">Palabras: ${escaparHtmlTR(String(totalPalabras))}</span>
          <span class="tr-chip">Bloques: ${escaparHtmlTR(String(totalSegmentos))}</span>
        </div>
      </div>
    </div>
  `;
}

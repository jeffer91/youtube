/* =========================================================
Nombre completo: tr-ui-opciones.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/ui/tr-ui-opciones.js
Funciones principales:
- Renderizar las opciones de transcripción.
- Mostrar origen de audio, idioma, motor y calidad.
- Desactivar audio mejorado si el video no lo tiene.
- Mantener separada la configuración visual del módulo.
Con qué se conecta:
- tr-ui-layout.js
- tr-selectores.js
========================================================= */

import {
  obtenerOpcionesTR,
  obtenerVideoSeleccionadoTR,
  videoTieneAudioMejoradoTR
} from "../estado/tr-selectores.js";

export function renderOpcionesTR(contenedor, estado) {
  if (!contenedor) {
    return;
  }

  const opciones = obtenerOpcionesTR(estado);
  const video = obtenerVideoSeleccionadoTR(estado);
  const tieneAudioMejorado = videoTieneAudioMejoradoTR(video);

  contenedor.innerHTML = `
    <div class="tr-panel__head">
      <h3>Opciones</h3>
      <p>Configura cómo quieres generar la transcripción del video.</p>
    </div>

    <div class="tr-options">
      <label class="tr-field">
        <span>Origen de audio</span>
        <select id="trOrigenAudio" class="tr-select">
          <option value="original" ${opciones.origenAudio === "original" ? "selected" : ""}>
            Audio original
          </option>

          <option
            value="audio-mejorado"
            ${opciones.origenAudio === "audio-mejorado" ? "selected" : ""}
            ${tieneAudioMejorado ? "" : "disabled"}
          >
            Audio mejorado
          </option>
        </select>
      </label>

      <label class="tr-field">
        <span>Idioma</span>
        <select id="trIdioma" class="tr-select">
          <option value="auto" ${opciones.idioma === "auto" ? "selected" : ""}>
            Detectar automático
          </option>

          <option value="es" ${opciones.idioma === "es" ? "selected" : ""}>
            Español
          </option>

          <option value="en" ${opciones.idioma === "en" ? "selected" : ""}>
            Inglés
          </option>
        </select>
      </label>

      <label class="tr-field">
        <span>Motor</span>
        <select id="trMotor" class="tr-select">
          <option value="whisper-local" ${opciones.motor === "whisper-local" ? "selected" : ""}>
            Whisper local
          </option>

          <option value="openai-api" ${opciones.motor === "openai-api" ? "selected" : ""}>
            OpenAI API
          </option>
        </select>
      </label>

      <label class="tr-field">
        <span>Calidad</span>
        <select id="trCalidad" class="tr-select">
          <option value="rapida" ${opciones.calidad === "rapida" ? "selected" : ""}>
            Rápida
          </option>

          <option value="equilibrada" ${opciones.calidad === "equilibrada" ? "selected" : ""}>
            Equilibrada
          </option>

          <option value="alta" ${opciones.calidad === "alta" ? "selected" : ""}>
            Alta precisión
          </option>
        </select>
      </label>
    </div>
  `;
}
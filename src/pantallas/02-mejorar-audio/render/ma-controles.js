/* =========================================================
Nombre completo: ma-controles.js
Ruta o ubicación: /src/pantallas/02-mejorar-audio/render/ma-controles.js
Funciones principales:
- Renderizar controles simples de mejora de audio sin mostrar perfiles visuales.
- Mostrar interruptores y niveles bajo, medio, alto.
- Conectar cambios con el servicio.
- Mantener una interfaz corta y clara para la capa de audio.
Con qué se conecta:
- ma-data.js
- ma-service.js
========================================================= */

import {
  obtenerControlesMA,
  obtenerNivelesMA
} from "../data/ma-data.js";

function escaparHtml(texto) {
  return String(texto || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function crearNivel(controlId, nivel, nivelActual) {
  const activo = nivel.id === nivelActual ? "is-active" : "";

  return `
    <button
      class="ma-level ${activo}"
      type="button"
      data-ma-nivel-control="${escaparHtml(controlId)}"
      data-ma-nivel="${escaparHtml(nivel.id)}"
    >
      ${escaparHtml(nivel.nombre)}
    </button>
  `;
}

function crearControl(control, estadoControl) {
  const activo = Boolean(estadoControl?.activo);
  const nivelActual = estadoControl?.nivel || control.nivelInicial || "medio";
  const niveles = obtenerNivelesMA()
    .map((nivel) => crearNivel(control.id, nivel, nivelActual))
    .join("");

  return `
    <article class="ma-control">
      <div class="ma-control__main">
        <label class="ma-switch">
          <input
            type="checkbox"
            data-ma-control="${escaparHtml(control.id)}"
            ${activo ? "checked" : ""}
          />
          <span></span>
        </label>

        <div class="ma-control__text">
          <strong>${escaparHtml(control.nombre)}</strong>
          <small>${escaparHtml(control.descripcion)}</small>
        </div>
      </div>

      <div class="ma-control__levels">
        ${niveles}
      </div>
    </article>
  `;
}

function obtenerTextoBotonProcesar(procesando) {
  if (procesando) {
    return "Mejorando audio...";
  }

  return "Mejorar audio";
}

export function renderControlesMA({
  contenedor,
  controles,
  procesando = false
}) {
  if (!contenedor) {
    return;
  }

  const controlesHtml = obtenerControlesMA()
    .map((control) => {
      return crearControl(control, controles?.[control.id]);
    })
    .join("");

  contenedor.innerHTML = `
    <section class="ma-controls">
      <div class="ma-controls__list">
        ${controlesHtml}
      </div>

      <div class="ma-controls__footer">
        <button
          id="maBtnSoloRuido"
          class="app-btn app-btn--ghost"
          type="button"
          ${procesando ? "disabled" : ""}
        >
          Limpiar ruido
        </button>

        <button
          id="maBtnMejorarAudio"
          class="app-btn"
          type="button"
          ${procesando ? "disabled" : ""}
        >
          ${escaparHtml(obtenerTextoBotonProcesar(procesando))}
        </button>
      </div>
    </section>
  `;
}

export function conectarControlesMA({ service }) {
  const checks = document.querySelectorAll("[data-ma-control]");
  const niveles = document.querySelectorAll("[data-ma-nivel-control]");
  const btnMejorar = document.getElementById("maBtnMejorarAudio");
  const btnSoloRuido = document.getElementById("maBtnSoloRuido");

  checks.forEach((check) => {
    check.addEventListener("change", () => {
      service.activarControl(check.dataset.maControl, check.checked);
    });
  });

  niveles.forEach((boton) => {
    boton.addEventListener("click", () => {
      service.cambiarNivel(
        boton.dataset.maNivelControl,
        boton.dataset.maNivel
      );
    });
  });

  if (btnMejorar) {
    btnMejorar.addEventListener("click", () => {
      service.mejorarAudioActual();
    });
  }

  if (btnSoloRuido) {
    btnSoloRuido.addEventListener("click", () => {
      service.aplicarSoloLimpiarRuido();
    });
  }
}

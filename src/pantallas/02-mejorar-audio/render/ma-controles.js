/* =========================================================
Nombre completo: ma-controles.js
Ruta o ubicación: /src/pantallas/02-mejorar-audio/render/ma-controles.js
Funciones principales:
- Renderizar perfiles inteligentes de mejora de audio.
- Renderizar controles simples de mejora de audio.
- Mostrar interruptores y niveles bajo, medio, alto.
- Conectar cambios con el servicio.
- Mantener una interfaz corta y clara.
Con qué se conecta:
- ma-data.js
- ma-service.js
========================================================= */

import {
  obtenerControlesMA,
  obtenerNivelesMA,
  obtenerPerfilesAudioMA
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

function crearPerfil(perfil, perfilActual) {
  const activo = perfil.id === perfilActual ? "is-active" : "";
  const recomendado = perfil.recomendado
    ? `<span class="ma-profile__badge">Recomendado</span>`
    : "";

  return `
    <button
      class="ma-profile ${activo}"
      type="button"
      data-ma-perfil="${escaparHtml(perfil.id)}"
    >
      <span class="ma-profile__title">
        <strong>${escaparHtml(perfil.nombre)}</strong>
        ${recomendado}
      </span>
      <small>${escaparHtml(perfil.descripcion)}</small>
    </button>
  `;
}

function crearPerfiles(perfilActual) {
  return obtenerPerfilesAudioMA()
    .map((perfil) => crearPerfil(perfil, perfilActual))
    .join("");
}

function obtenerTextoBotonProcesar(procesando) {
  if (procesando) {
    return "Mejorando audio...";
  }

  return "Mejorar audio inteligente";
}

export function renderControlesMA({
  contenedor,
  controles,
  perfilAudio = "automatico",
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
      <div class="ma-controls__head">
        <div>
          <h3>Audio inteligente</h3>
          <p>Elige un perfil o ajusta los controles manualmente.</p>
        </div>

        <button
          id="maBtnSoloRuido"
          class="app-btn app-btn--ghost"
          type="button"
          ${procesando ? "disabled" : ""}
        >
          Limpiar ruido
        </button>
      </div>

      <div class="ma-profiles">
        ${crearPerfiles(perfilAudio)}
      </div>

      <div class="ma-controls__list">
        ${controlesHtml}
      </div>

      <div class="ma-controls__footer">
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
  const perfiles = document.querySelectorAll("[data-ma-perfil]");
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

  perfiles.forEach((boton) => {
    boton.addEventListener("click", () => {
      if (typeof service.cambiarPerfilAudio === "function") {
        service.cambiarPerfilAudio(boton.dataset.maPerfil);
      }
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
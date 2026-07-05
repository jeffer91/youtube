/* =========================================================
Nombre completo: ma-comparar.js
Ruta o ubicación: /src/pantallas/02-mejorar-audio/render/ma-comparar.js
Funciones principales:
- Renderizar comparación Original / Mejorado.
- Mostrar dos reproductores lado a lado.
- Asegurar que el reproductor mejorado use el archivo nuevo.
- Mostrar modo real usado: principal, respaldo DSP o ultra seguro.
- Mostrar filtros usados en diagnóstico visible simple.
- Mostrar guardar capa cuando exista mejora.
Con qué se conecta:
- ma-service.js
- ma-video.js
- ma-pasos.js
- ma.css
========================================================= */

import {
  obtenerUrlVideo,
  obtenerNombreVideo,
  videoTieneMejora
} from "../helpers/ma-video.js";

function escaparHtml(texto) {
  return String(texto || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function convertirRutaArchivoAUrl(ruta) {
  if (!ruta) {
    return "";
  }

  const rutaTexto = String(ruta);

  if (
    rutaTexto.startsWith("file://") ||
    rutaTexto.startsWith("http://") ||
    rutaTexto.startsWith("https://") ||
    rutaTexto.startsWith("blob:") ||
    rutaTexto.startsWith("data:")
  ) {
    return rutaTexto;
  }

  const rutaNormalizada = rutaTexto.replaceAll("\\", "/");

  if (/^[a-zA-Z]:\//.test(rutaNormalizada)) {
    return encodeURI(`file:///${rutaNormalizada}`);
  }

  return encodeURI(rutaNormalizada);
}

function obtenerUrlOriginal(video) {
  return obtenerUrlVideo(video, "original") || convertirRutaArchivoAUrl(video?.ruta);
}

function obtenerUrlMejorado(video) {
  return (
    video?.audioMejorado?.url ||
    convertirRutaArchivoAUrl(video?.audioMejorado?.ruta) ||
    ""
  );
}

function obtenerTextoModoProcesamiento(audioMejorado) {
  const modo = audioMejorado?.modoProcesamiento || "";

  if (modo === "principal") {
    return "Filtro principal";
  }

  if (modo === "respaldo-dsp") {
    return "Respaldo DSP";
  }

  if (modo === "ultra-seguro") {
    return "Modo ultra seguro";
  }

  if (modo === "temporal") {
    return "Temporal";
  }

  return "Sin dato";
}

function obtenerTextoMotor(audioMejorado) {
  const motor = audioMejorado?.decisionAudio?.motorAudio || "";

  if (motor === "ia") {
    return "IA + DSP";
  }

  if (motor === "extremo") {
    return "Limpieza extrema";
  }

  if (motor === "dsp") {
    return "DSP";
  }

  return audioMejorado?.motor || "Audio";
}

function formatearPeso(bytes) {
  const numero = Number(bytes) || 0;

  if (!numero) {
    return "0 MB";
  }

  return `${(numero / 1024 / 1024).toFixed(2)} MB`;
}

function crearReproductorComparacion({ titulo, url, subtitulo, mensajeVacio }) {
  return `
    <article class="ma-player-card">
      <header>
        <div>
          <strong>${escaparHtml(titulo)}</strong>
          <span>${escaparHtml(subtitulo || "")}</span>
        </div>
      </header>

      ${
        url
          ? `
            <video
              src="${escaparHtml(url)}"
              controls
              preload="metadata"
            ></video>
          `
          : `
            <div class="ma-video-empty">
              <strong>${escaparHtml(mensajeVacio)}</strong>
              <span>No existe archivo para reproducir.</span>
            </div>
          `
      }
    </article>
  `;
}

function crearPestanasComparacion(modoComparacion, tieneMejora) {
  const modo = modoComparacion || "mejorado";

  return `
    <div class="ma-compare-tabs">
      <button
        class="ma-tab ${modo === "original" ? "is-active" : ""}"
        type="button"
        data-ma-modo-comparacion="original"
      >
        Escuchar original
      </button>

      <button
        class="ma-tab ${modo === "mejorado" ? "is-active" : ""}"
        type="button"
        data-ma-modo-comparacion="mejorado"
        ${tieneMejora ? "" : "disabled"}
      >
        Escuchar mejorado
      </button>
    </div>
  `;
}

function crearDiagnosticoAudio(video) {
  const audioMejorado = video?.audioMejorado || null;

  if (!audioMejorado) {
    return "";
  }

  const filtros = Array.isArray(audioMejorado.filtrosAudio)
    ? audioMejorado.filtrosAudio
    : [];

  const filtrosHtml = filtros.length
    ? filtros
        .slice(0, 8)
        .map((filtro) => `<code>${escaparHtml(filtro)}</code>`)
        .join("")
    : "<span>Sin filtros registrados.</span>";

  const iaDisponible = audioMejorado.capacidadesIA?.iaDisponible
    ? "Sí"
    : "No";

  const usaIA = audioMejorado.decisionAudio?.usaIA
    ? "Sí"
    : "No";

  return `
    <div class="ma-save-card">
      <strong>Diagnóstico del audio mejorado</strong>
      <span>Motor: ${escaparHtml(obtenerTextoMotor(audioMejorado))}</span>
      <span>Modo usado: ${escaparHtml(obtenerTextoModoProcesamiento(audioMejorado))}</span>
      <span>IA disponible: ${escaparHtml(iaDisponible)} · IA usada: ${escaparHtml(usaIA)}</span>
      <span>Peso generado: ${escaparHtml(formatearPeso(audioMejorado.pesoBytes))}</span>
      <span>Archivo: ${escaparHtml(audioMejorado.nombre || "Sin nombre")}</span>
      <div class="ma-filter-list">
        ${filtrosHtml}
      </div>
    </div>
  `;
}

function crearAvisoResultado(video) {
  const audioMejorado = video?.audioMejorado || null;

  if (!audioMejorado) {
    return `
      <div class="ma-alert ma-alert--error">
        Todavía no hay audio mejorado para comparar.
      </div>
    `;
  }

  const modo = obtenerTextoModoProcesamiento(audioMejorado);

  if (audioMejorado.modoProcesamiento === "ultra-seguro") {
    return `
      <div class="ma-alert ma-alert--error">
        Se generó con modo ultra seguro. Esto significa que el filtro fuerte falló y el resultado puede sonar parecido al original.
      </div>
    `;
  }

  return `
    <div class="ma-alert ma-alert--success">
      Audio mejorado listo. Modo usado: ${escaparHtml(modo)}.
    </div>
  `;
}

export function renderComparadorMA({ contenedor, video, modoComparacion = "mejorado" }) {
  if (!contenedor) {
    return;
  }

  if (!video) {
    contenedor.innerHTML = `
      <section class="ma-empty">
        <div>
          <strong>No hay video seleccionado</strong>
          <p>Selecciona un video para comparar el audio.</p>
        </div>
      </section>
    `;
    return;
  }

  const tieneMejora = videoTieneMejora(video);
  const urlOriginal = obtenerUrlOriginal(video);
  const urlMejorado = obtenerUrlMejorado(video);
  const nombreVideo = obtenerNombreVideo(video);
  const audioMejorado = video.audioMejorado || null;

  contenedor.innerHTML = `
    <section class="ma-compare">
      <div class="ma-compare__head">
        <div>
          <h3>Comparar audio</h3>
          <p>${escaparHtml(nombreVideo)}</p>
        </div>

        ${crearPestanasComparacion(modoComparacion, tieneMejora)}
      </div>

      ${crearAvisoResultado(video)}

      <div class="ma-compare-grid">
        ${crearReproductorComparacion({
          titulo: "Video original",
          subtitulo: "Archivo sin cambios",
          url: urlOriginal,
          mensajeVacio: "No se encontró el video original"
        })}

        ${crearReproductorComparacion({
          titulo: "Video mejorado",
          subtitulo: tieneMejora
            ? `${obtenerTextoMotor(audioMejorado)} · ${obtenerTextoModoProcesamiento(audioMejorado)}`
            : "Pendiente",
          url: tieneMejora ? urlMejorado : "",
          mensajeVacio: "Primero mejora el audio"
        })}
      </div>

      ${crearDiagnosticoAudio(video)}

      <div class="ma-actions">
        ${
          tieneMejora
            ? `
              <button id="maBtnDescargarInline" class="app-btn app-btn--ghost" type="button">
                Descargar video mejorado
              </button>
            `
            : `
              <div class="ma-note">
                Primero usa Mejorar audio inteligente.
              </div>
            `
        }
      </div>
    </section>
  `;
}

export function conectarComparadorMA({ service }) {
  const botonesModo = document.querySelectorAll("[data-ma-modo-comparacion]");
  const btnDescargar = document.getElementById("maBtnDescargarInline");

  botonesModo.forEach((boton) => {
    boton.addEventListener("click", () => {
      if (boton.disabled) {
        return;
      }

      service.cambiarModoComparacion(boton.dataset.maModoComparacion);
    });
  });

  if (btnDescargar) {
    btnDescargar.addEventListener("click", () => {
      service.descargarActual();
    });
  }
}

export function renderGuardarCapaMA({ contenedor, video, capaGuardada }) {
  if (!contenedor) {
    return;
  }

  const tieneMejora = videoTieneMejora(video);
  const audioMejorado = video?.audioMejorado || null;

  contenedor.innerHTML = `
    <section class="ma-save">
      <div>
        <h3>${capaGuardada ? "Capa guardada" : "Guardar capa de audio"}</h3>
        <p>
          ${
            tieneMejora
              ? "Guarda el audio mejorado como una capa del proyecto sin dañar el video original."
              : "Primero mejora el audio para poder guardar la capa."
          }
        </p>
      </div>

      <div class="ma-save-card">
        <strong>Estado</strong>
        <span>${capaGuardada ? "Audio guardado como capa." : tieneMejora ? "Listo para guardar." : "Pendiente."}</span>
        <span>Modo: ${escaparHtml(obtenerTextoModoProcesamiento(audioMejorado))}</span>
        <span>Motor: ${escaparHtml(obtenerTextoMotor(audioMejorado))}</span>
        <span>Archivo: ${escaparHtml(audioMejorado?.nombre || "Sin archivo mejorado")}</span>
      </div>

      ${
        capaGuardada
          ? `
            <div class="ma-alert ma-alert--success">
              La capa de audio mejorado fue guardada correctamente.
            </div>
          `
          : ""
      }
    </section>
  `;
}
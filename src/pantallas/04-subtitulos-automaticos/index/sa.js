/* =========================================================
Nombre completo: sa.js
Ruta o ubicación: /src/pantallas/04-subtitulos-automaticos/index/sa.js
Funciones principales:
- Iniciar la pantalla Subtítulos automáticos.
- Preparar subtítulos automáticamente desde transcripciones.
- Permitir elegir entre tres formatos visuales.
- Guardar subtítulos como última capa visible del proyecto.
- Continuar a Exportar video final sin quemar subtítulos todavía.
Con qué se conecta:
- sa.html
- sa.css
- router.js
- estadoApp.proyectoActivo
- sa-formatos.js
- sa-subtitulos.js
- window.videoEditorAPI.guardarProyectoLocal
========================================================= */

import {
  SA_FORMATO_DEFECTO,
  obtenerFormatosSubtitulosSA,
  obtenerFormatoSubtitulosSA
} from "../services/sa-formatos.js";

import {
  crearResumenSA,
  obtenerVideosSA,
  obtenerTranscripcionSA,
  obtenerSubtitulosPreparadosSA,
  contarPalabrasSA,
  prepararSubtitulosProyectoSA
} from "../services/sa-subtitulos.js";

let estadoAppActualSA = null;
let routerActualSA = null;
let proyectoActualSA = null;
let formatoActualSA = SA_FORMATO_DEFECTO;
let mensajeTemporalSA = "";
let tipoMensajeTemporalSA = "info";

function escaparHtmlSA(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function obtenerProyectoActivoSA() {
  if (!estadoAppActualSA?.obtenerProyectoActivo) return proyectoActualSA;
  return estadoAppActualSA.obtenerProyectoActivo() || proyectoActualSA;
}

function actualizarProyectoActivoSA(proyecto) {
  proyectoActualSA = proyecto;

  if (!estadoAppActualSA?.establecerProyectoActivo) return;

  const estadoGlobal = estadoAppActualSA.obtenerEstado?.() || {};
  estadoAppActualSA.establecerProyectoActivo(proyecto, estadoGlobal.rutaProyectoActivo || null);
}

async function guardarProyectoLocalSA(proyecto) {
  if (!window.videoEditorAPI?.guardarProyectoLocal) {
    return { ok: false, omitido: true, mensaje: "Proyecto actualizado en memoria." };
  }

  return await window.videoEditorAPI.guardarProyectoLocal(proyecto);
}

function obtenerElementosSA() {
  return {
    resumen: document.getElementById("saResumen"),
    formatos: document.getElementById("saFormatos"),
    videos: document.getElementById("saVideos"),
    transcribir: document.getElementById("saBtnVolverTranscripcion"),
    continuar: document.getElementById("saBtnContinuar")
  };
}

function mostrarMensajeSA(mensaje, tipo = "info") {
  mensajeTemporalSA = mensaje || "";
  tipoMensajeTemporalSA = tipo;
  renderizarPantallaSA();
}

function crearVistaPreviaSubtitulosSA(subtitulos) {
  const vista = subtitulos.slice(0, 3);
  if (!vista.length) return "";

  return `
    <div class="sa-preview-list">
      ${vista.map((subtitulo) => `
        <p><small>${escaparHtmlSA(subtitulo.inicioTexto)} - ${escaparHtmlSA(subtitulo.finTexto)}</small>${escaparHtmlSA(subtitulo.texto)}</p>
      `).join("")}
    </div>
  `;
}

function renderResumenSA(contenedor) {
  if (!contenedor) return;

  const proyecto = obtenerProyectoActivoSA();

  if (!proyecto) {
    contenedor.innerHTML = `
      <h3>Sin proyecto activo</h3>
      <p>Primero carga un proyecto y transcribe sus videos.</p>
    `;
    return;
  }

  const resumen = crearResumenSA(proyecto);
  const formato = obtenerFormatoSubtitulosSA(formatoActualSA);

  contenedor.innerHTML = `
    <h3>Resumen</h3>
    <p>${escaparHtmlSA(proyecto.nombre || "Proyecto sin nombre")}</p>

    <div class="sa-status ${resumen.puedeGenerarVideo ? "is-ok" : resumen.puedePreparar ? "is-warn" : "is-error"}">
      <strong>${resumen.puedeGenerarVideo ? "Subtítulos listos para exportar" : resumen.puedePreparar ? "Listo para preparar subtítulos" : "Faltan transcripciones"}</strong>
      <span>Formato actual: ${escaparHtmlSA(formato.nombre)}</span>
    </div>

    ${mensajeTemporalSA ? `
      <div class="sa-message is-${escaparHtmlSA(tipoMensajeTemporalSA)}">
        ${escaparHtmlSA(mensajeTemporalSA)}
      </div>
    ` : ""}

    <div class="sa-stats">
      <div class="sa-stat"><strong>Videos cargados</strong><span>${resumen.total}</span></div>
      <div class="sa-stat"><strong>Con transcripción</strong><span>${resumen.listos}</span></div>
      <div class="sa-stat"><strong>Pendientes</strong><span>${resumen.pendientes}</span></div>
      <div class="sa-stat"><strong>Con subtítulos</strong><span>${resumen.conSubtitulos}</span></div>
      <div class="sa-stat"><strong>Total subtítulos</strong><span>${resumen.totalSubtitulos}</span></div>
    </div>
  `;
}

function renderFormatosSA(contenedor) {
  if (!contenedor) return;

  const formatos = obtenerFormatosSubtitulosSA();

  contenedor.innerHTML = `
    <div class="sa-section-head">
      <div>
        <h3>Formato de subtítulos</h3>
        <p>Se guardará como capa. Se aplicará encima de todo recién en Exportar.</p>
      </div>
    </div>

    <div class="sa-format-grid">
      ${formatos.map((formato) => `
        <button
          class="sa-format-card ${formato.id === formatoActualSA ? "is-active" : ""}"
          type="button"
          data-sa-formato="${escaparHtmlSA(formato.id)}"
        >
          <span class="sa-format-card__tag">${escaparHtmlSA(formato.etiqueta || "Formato")}</span>
          <strong>${escaparHtmlSA(formato.nombre)}</strong>
          <small>${escaparHtmlSA(formato.descripcion)}</small>
          <span class="sa-preview-style ${escaparHtmlSA(formato.previewClass)}">Así se verá el subtítulo</span>
        </button>
      `).join("")}
    </div>
  `;
}

function renderVideosSA(contenedor) {
  if (!contenedor) return;

  const proyecto = obtenerProyectoActivoSA();
  const videos = obtenerVideosSA(proyecto);

  if (!videos.length) {
    contenedor.innerHTML = `
      <div class="sa-empty">
        <div>
          <h3>No hay videos cargados</h3>
          <p>Vuelve a cargar proyecto antes de continuar.</p>
        </div>
      </div>
    `;
    return;
  }

  contenedor.innerHTML = `
    <div class="sa-section-head">
      <div>
        <h3>Videos y subtítulos</h3>
        <p>Los subtítulos quedan guardados como capa superior. No se exportan aquí.</p>
      </div>
    </div>

    <div class="sa-video-list">
      ${videos.map((video, index) => {
        const transcripcion = obtenerTranscripcionSA(video);
        const subtitulos = obtenerSubtitulosPreparadosSA(video);
        const segmentos = Array.isArray(transcripcion?.segmentos) ? transcripcion.segmentos.length : 0;
        const palabras = contarPalabrasSA(transcripcion);
        const listo = Boolean(transcripcion?.texto);
        const preparado = subtitulos.length > 0;

        return `
          <article class="sa-video-card ${listo ? "is-ready" : "is-pending"}">
            <div class="sa-video-card__head">
              <strong>${index + 1}. ${escaparHtmlSA(video.nombre || "Video")}</strong>
              <span class="sa-chip">${preparado ? "Capa lista" : listo ? "Listo" : "Falta transcribir"}</span>
            </div>
            <p>${listo
              ? `${palabras} palabras · ${segmentos} bloques de tiempo · ${subtitulos.length} subtítulo(s).`
              : "Este video todavía no tiene transcripción guardada."}</p>
            ${preparado ? crearVistaPreviaSubtitulosSA(subtitulos) : ""}
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function actualizarBotonesSA() {
  const elementos = obtenerElementosSA();
  const proyecto = obtenerProyectoActivoSA();
  const resumen = crearResumenSA(proyecto);
  const formato = obtenerFormatoSubtitulosSA(formatoActualSA);

  if (elementos.continuar) {
    elementos.continuar.disabled = !resumen.puedePreparar && !resumen.puedeGenerarVideo;
    elementos.continuar.textContent = resumen.puedeGenerarVideo
      ? "Continuar a exportar"
      : resumen.puedePreparar
        ? `Guardar capa con ${formato.nombre}`
        : "Primero transcribe";
  }
}

function renderizarPantallaSA() {
  const elementos = obtenerElementosSA();
  renderResumenSA(elementos.resumen);
  renderFormatosSA(elementos.formatos);
  renderVideosSA(elementos.videos);
  actualizarBotonesSA();
  conectarEventosDinamicosSA();
}

async function prepararSubtitulosSA() {
  const proyecto = obtenerProyectoActivoSA();
  const resultado = prepararSubtitulosProyectoSA(proyecto, formatoActualSA);

  if (!resultado.ok) {
    mostrarMensajeSA((resultado.errores || []).join(" | ") || "No se pudieron preparar los subtítulos.", "error");
    return null;
  }

  let proyectoFinal = resultado.proyecto;
  const guardado = await guardarProyectoLocalSA(proyectoFinal);

  if (guardado?.ok && guardado.proyecto) {
    proyectoFinal = guardado.proyecto;
  }

  actualizarProyectoActivoSA(proyectoFinal);
  mensajeTemporalSA = resultado.mensajes?.[0] || "Subtítulos guardados como última capa visible.";
  tipoMensajeTemporalSA = "success";
  renderizarPantallaSA();
  return proyectoFinal;
}

async function continuarFlujoSA() {
  const proyecto = obtenerProyectoActivoSA();
  let resumen = crearResumenSA(proyecto);

  if (!resumen.puedePreparar && !resumen.puedeGenerarVideo) {
    mostrarMensajeSA("Falta transcribir los videos antes de preparar subtítulos.", "warn");
    return;
  }

  if (!resumen.puedeGenerarVideo) {
    await prepararSubtitulosSA();
    resumen = crearResumenSA(obtenerProyectoActivoSA());
  }

  if (resumen.puedeGenerarVideo && routerActualSA?.irA) {
    routerActualSA.irA("19-exportar-video-final");
  }
}

function conectarEventosDinamicosSA() {
  document.querySelectorAll("[data-sa-formato]").forEach((boton) => {
    boton.onclick = async () => {
      formatoActualSA = boton.dataset.saFormato || SA_FORMATO_DEFECTO;
      mensajeTemporalSA = `Formato seleccionado: ${obtenerFormatoSubtitulosSA(formatoActualSA).nombre}.`;
      tipoMensajeTemporalSA = "info";
      renderizarPantallaSA();
    };
  });
}

function conectarEventosBaseSA() {
  const elementos = obtenerElementosSA();

  if (elementos.transcribir) {
    elementos.transcribir.onclick = () => {
      if (routerActualSA?.irA) routerActualSA.irA("03-transcribir-video");
    };
  }

  if (elementos.continuar) {
    elementos.continuar.onclick = continuarFlujoSA;
  }
}

export async function iniciarPantallaSubtitulosAutomaticos({ router, estadoApp }) {
  routerActualSA = router;
  estadoAppActualSA = estadoApp;
  proyectoActualSA = obtenerProyectoActivoSA();
  formatoActualSA = proyectoActualSA?.subtitulosAutomaticos?.formatoVisual || SA_FORMATO_DEFECTO;
  mensajeTemporalSA = "";
  tipoMensajeTemporalSA = "info";

  conectarEventosBaseSA();
  renderizarPantallaSA();
}

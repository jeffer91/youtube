/* =========================================================
Nombre completo: rev.js
Ruta o ubicación: /src/pantallas/12-revision-exportacion/index/rev.js
Funciones principales:
- Iniciar el paso Revisión y exportación.
- Revisar checklist final de capas antes de exportar.
- Validar video, transcripción, subtítulos y orden final.
- Generar el video final usando Electron + FFmpeg.
- Mostrar antes/después y permitir descarga.
Con qué se conecta:
- rev.html
- rev.css
- proyecto-capas.js
- sa-subtitulos.js
- window.videoEditorAPI
========================================================= */

import {
  crearResumenSA,
  obtenerVideosSA,
  obtenerSubtitulosPreparadosSA,
  integrarVideosSubtituladosEnProyectoSA
} from "../../04-subtitulos-automaticos/services/sa-subtitulos.js";

import {
  crearChecklistProyecto,
  obtenerOrdenCapasParaRender
} from "../../../shared/proyecto/proyecto-capas.js";

let routerActualREV = null;
let estadoAppActualREV = null;
let proyectoActualREV = null;
let mensajeTemporalREV = "";
let tipoMensajeTemporalREV = "info";

function escaparHtmlREV(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function obtenerProyectoActivoREV() {
  if (!estadoAppActualREV?.obtenerProyectoActivo) return proyectoActualREV;
  return estadoAppActualREV.obtenerProyectoActivo() || proyectoActualREV;
}

function actualizarProyectoActivoREV(proyecto) {
  proyectoActualREV = proyecto;
  if (!estadoAppActualREV?.establecerProyectoActivo) return;

  const estadoGlobal = estadoAppActualREV.obtenerEstado?.() || {};
  estadoAppActualREV.establecerProyectoActivo(proyecto, estadoGlobal.rutaProyectoActivo || null);
}

async function guardarProyectoLocalREV(proyecto) {
  if (!window.videoEditorAPI?.guardarProyectoLocal) {
    return { ok: false, omitido: true, mensaje: "Proyecto actualizado en memoria." };
  }

  return await window.videoEditorAPI.guardarProyectoLocal(proyecto);
}

function obtenerElementosREV() {
  return {
    resumen: document.getElementById("exResumen"),
    checklist: document.getElementById("revChecklist"),
    capas: document.getElementById("exCapas"),
    comparacion: document.getElementById("exComparacion"),
    volver: document.getElementById("exBtnVolverSubtitulos"),
    generar: document.getElementById("exBtnGenerar")
  };
}

function obtenerVideoFinalREV(video) {
  return video?.subtitulosAutomaticos?.videoFinal || video?.videoSubtitulado || null;
}

function obtenerUrlOriginalREV(video) {
  return video?.url || (video?.ruta ? `file:///${String(video.ruta).replace(/\\/g, "/")}` : "");
}

function mostrarMensajeREV(mensaje, tipo = "info") {
  mensajeTemporalREV = mensaje || "";
  tipoMensajeTemporalREV = tipo;
  renderizarPantallaREV();
}

function crearClaseEstadoREV(estado) {
  if (estado === "ok") return "is-ok";
  if (estado === "error") return "is-error";
  return "is-warn";
}

function crearTextoEstadoREV(item) {
  if (item.estado === "ok") return "Listo";
  if (item.estado === "error") return "Obligatorio";
  return "Opcional";
}

function renderResumenREV(contenedor) {
  if (!contenedor) return;

  const proyecto = obtenerProyectoActivoREV();

  if (!proyecto) {
    contenedor.innerHTML = `
      <h3>Sin proyecto activo</h3>
      <p>Primero carga un proyecto.</p>
    `;
    return;
  }

  const checklist = crearChecklistProyecto(proyecto);
  const resumenSubtitulos = crearResumenSA(proyecto);

  contenedor.innerHTML = `
    <h3>Resumen final</h3>
    <p>${escaparHtmlREV(proyecto.nombre || "Proyecto sin nombre")}</p>

    <div class="ex-status ${checklist.puedeExportar ? "is-ok" : "is-error"}">
      <strong>${checklist.puedeExportar ? "Listo para exportar" : "Faltan puntos obligatorios"}</strong>
      <span>Los subtítulos se aplicarán como última capa visible.</span>
    </div>

    ${mensajeTemporalREV ? `
      <div class="ex-message is-${escaparHtmlREV(tipoMensajeTemporalREV)}">
        ${escaparHtmlREV(mensajeTemporalREV)}
      </div>
    ` : ""}

    <div class="ex-stats">
      <div class="ex-stat"><strong>Videos</strong><span>${checklist.videos}</span></div>
      <div class="ex-stat"><strong>Capas</strong><span>${checklist.capas}</span></div>
      <div class="ex-stat"><strong>Obligatorios</strong><span>${checklist.requeridosListos}/${checklist.requeridos}</span></div>
      <div class="ex-stat"><strong>Avance</strong><span>${checklist.porcentaje}%</span></div>
      <div class="ex-stat"><strong>Subtítulos</strong><span>${resumenSubtitulos.conSubtitulos}/${resumenSubtitulos.total}</span></div>
      <div class="ex-stat"><strong>Finales</strong><span>${resumenSubtitulos.conVideoFinal}</span></div>
    </div>
  `;
}

function renderChecklistREV(contenedor) {
  if (!contenedor) return;

  const proyecto = obtenerProyectoActivoREV();
  const checklist = crearChecklistProyecto(proyecto);

  contenedor.innerHTML = `
    <div>
      <h3>Checklist antes de exportar</h3>
      <p>La app revisa que el video tenga lo obligatorio y que las capas estén en el orden correcto.</p>
    </div>

    <div class="rev-check-grid">
      ${checklist.items.map((item) => `
        <article class="rev-check-item ${crearClaseEstadoREV(item.estado)}">
          <div class="rev-check-item__number">${escaparHtmlREV(item.numero)}</div>
          <div class="rev-check-item__body">
            <strong>${escaparHtmlREV(item.nombre)}</strong>
            <span>${escaparHtmlREV(item.detalle || item.descripcion)}</span>
          </div>
          <em>${escaparHtmlREV(crearTextoEstadoREV(item))}</em>
        </article>
      `).join("")}
    </div>
  `;
}

function renderCapasREV(contenedor) {
  if (!contenedor) return;

  const proyecto = obtenerProyectoActivoREV();
  const videos = obtenerVideosSA(proyecto);
  const orden = obtenerOrdenCapasParaRender();

  if (!videos.length) {
    contenedor.innerHTML = `
      <div class="ex-empty">
        <div>
          <h3>No hay videos</h3>
          <p>Vuelve a cargar proyecto.</p>
        </div>
      </div>
    `;
    return;
  }

  contenedor.innerHTML = `
    <div>
      <h3>Orden de render final</h3>
      <p>El exportador debe construir el video en este orden. Los subtítulos van al último.</p>
    </div>

    <div class="rev-render-order">
      ${orden.map((item) => `
        <article class="rev-render-step ${item.requerido ? "is-required" : ""}">
          <span>${escaparHtmlREV(item.numero)}</span>
          <div>
            <strong>${escaparHtmlREV(item.nombre)}</strong>
            <small>${escaparHtmlREV(item.tipo)}${item.requerido ? " · obligatorio" : " · opcional"}</small>
          </div>
        </article>
      `).join("")}
    </div>

    <div class="ex-layer-list">
      ${videos.map((video, index) => {
        const subtitulos = obtenerSubtitulosPreparadosSA(video);
        const videoFinal = obtenerVideoFinalREV(video);
        const tieneAudio = Boolean(video?.audioMejorado?.ruta || video?.audioMejorado?.url);
        const formato = video?.subtitulosAutomaticos?.formatoVisual || proyecto?.subtitulosAutomaticos?.formatoVisual || "negro-clasico";

        return `
          <article class="ex-layer-card">
            <strong>${index + 1}. ${escaparHtmlREV(video.nombre || "Video")}</strong>
            <span class="ex-chip">${videoFinal ? "Exportado" : subtitulos.length ? "Listo" : "Falta subtítulo"}</span>
            <p>Audio mejorado: ${tieneAudio ? "sí" : "no"} · Subtítulos: ${subtitulos.length} · Formato: ${escaparHtmlREV(formato)}</p>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function renderComparacionREV(contenedor) {
  if (!contenedor) return;

  const proyecto = obtenerProyectoActivoREV();
  const videos = obtenerVideosSA(proyecto);
  const videosGenerados = videos.filter((video) => obtenerVideoFinalREV(video));

  if (!videosGenerados.length) {
    contenedor.innerHTML = `
      <div class="ex-empty">
        <div>
          <h3>Antes y después</h3>
          <p>Cuando generes el video final, aquí aparecerá la comparación y la descarga.</p>
        </div>
      </div>
    `;
    return;
  }

  contenedor.innerHTML = `
    <div>
      <h3>Antes y después</h3>
      <p>Compara el video original con el video final exportado.</p>
    </div>

    <div class="ex-compare-list">
      ${videosGenerados.map((video) => {
        const videoFinal = obtenerVideoFinalREV(video);
        return `
          <article class="ex-compare-card">
            <h4>${escaparHtmlREV(video.nombre || "Video")}</h4>
            <div class="ex-compare-grid">
              <div class="ex-video-preview">
                <strong>Antes</strong>
                <video controls src="${escaparHtmlREV(obtenerUrlOriginalREV(video))}"></video>
              </div>
              <div class="ex-video-preview">
                <strong>Después</strong>
                <video controls src="${escaparHtmlREV(videoFinal.url || "")}"></video>
              </div>
            </div>
            <div class="ex-download-row">
              <span>${escaparHtmlREV(videoFinal.nombre || "video_final.mp4")}</span>
              <button class="ex-btn ex-btn--primary" type="button" data-rev-descargar="${escaparHtmlREV(video.id)}">Descargar video</button>
            </div>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function actualizarBotonesREV() {
  const elementos = obtenerElementosREV();
  const proyecto = obtenerProyectoActivoREV();
  const checklist = crearChecklistProyecto(proyecto);

  if (elementos.generar) {
    elementos.generar.disabled = !checklist.puedeExportar;
    elementos.generar.textContent = checklist.puedeExportar ? "Generar video final" : "Completa obligatorios";
  }
}

function renderizarPantallaREV() {
  const elementos = obtenerElementosREV();
  renderResumenREV(elementos.resumen);
  renderChecklistREV(elementos.checklist);
  renderCapasREV(elementos.capas);
  renderComparacionREV(elementos.comparacion);
  actualizarBotonesREV();
  conectarEventosDinamicosREV();
}

async function generarVideoFinalREV() {
  const proyecto = obtenerProyectoActivoREV();
  const checklist = crearChecklistProyecto(proyecto);

  if (!checklist.puedeExportar) {
    mostrarMensajeREV("Completa los puntos obligatorios antes de exportar.", "warn");
    return;
  }

  if (!window.videoEditorAPI?.generarVideoSubtitulos) {
    mostrarMensajeREV("La exportación requiere abrir la app con Electron usando npm start.", "error");
    return;
  }

  const elementos = obtenerElementosREV();

  if (elementos.generar) {
    elementos.generar.disabled = true;
    elementos.generar.textContent = "Generando video final...";
  }

  mensajeTemporalREV = "Generando video final. Los subtítulos se aplican al último.";
  tipoMensajeTemporalREV = "info";
  renderResumenREV(elementos.resumen);

  const formatoId = proyecto?.subtitulosAutomaticos?.formatoVisual || "negro-clasico";
  const exportacion = await window.videoEditorAPI.generarVideoSubtitulos({ proyecto, formatoId });

  if (!exportacion.ok && !exportacion.parcial) {
    mostrarMensajeREV(exportacion.mensaje || "No se pudo generar el video final.", "error");
    return;
  }

  const proyectoActualizado = integrarVideosSubtituladosEnProyectoSA({ proyecto, exportacion });
  const guardado = await guardarProyectoLocalREV(proyectoActualizado);
  actualizarProyectoActivoREV(guardado?.ok && guardado.proyecto ? guardado.proyecto : proyectoActualizado);

  mostrarMensajeREV(exportacion.mensaje || "Video final generado correctamente.", exportacion.parcial ? "warn" : "success");
}

async function descargarVideoREV(videoId) {
  const proyecto = obtenerProyectoActivoREV();
  const video = obtenerVideosSA(proyecto).find((item) => item.id === videoId);
  const videoFinal = obtenerVideoFinalREV(video);

  if (!videoFinal) {
    mostrarMensajeREV("No se encontró el video final para descargar.", "error");
    return;
  }

  if (!window.videoEditorAPI?.descargarVideoSubtitulado) {
    mostrarMensajeREV("La descarga requiere abrir la app con Electron.", "error");
    return;
  }

  const resultado = await window.videoEditorAPI.descargarVideoSubtitulado({
    videoSubtitulado: videoFinal,
    nombreArchivo: videoFinal.nombre || `${video?.nombre || "video"}_final.mp4`
  });

  mostrarMensajeREV(resultado.mensaje || (resultado.ok ? "Video descargado." : "No se pudo descargar."), resultado.ok ? "success" : "warn");
}

function conectarEventosDinamicosREV() {
  document.querySelectorAll("[data-rev-descargar]").forEach((boton) => {
    boton.onclick = () => descargarVideoREV(boton.dataset.revDescargar);
  });
}

function conectarEventosBaseREV() {
  const elementos = obtenerElementosREV();

  if (elementos.volver) {
    elementos.volver.onclick = () => {
      if (routerActualREV?.irA) routerActualREV.irA("11-subtitulos-finales");
    };
  }

  if (elementos.generar) {
    elementos.generar.onclick = generarVideoFinalREV;
  }
}

export async function iniciarPantallaRevisionExportacion({ router, estadoApp }) {
  routerActualREV = router;
  estadoAppActualREV = estadoApp;
  proyectoActualREV = obtenerProyectoActivoREV();
  mensajeTemporalREV = "";
  tipoMensajeTemporalREV = "info";

  conectarEventosBaseREV();
  renderizarPantallaREV();
}

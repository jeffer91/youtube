/* =========================================================
Nombre completo: ex.js
Ruta o ubicación: /src/pantallas/19-exportar-video-final/index/ex.js
Funciones principales:
- Iniciar la pantalla Exportar video final.
- Validar que existan subtítulos preparados como última capa.
- Generar el video final usando Electron + FFmpeg.
- Mostrar antes/después.
- Descargar el video final.
Con qué se conecta:
- ex.html
- ex.css
- router.js
- estadoApp.proyectoActivo
- sa-subtitulos.js
- window.videoEditorAPI
========================================================= */

import {
  crearResumenSA,
  obtenerVideosSA,
  obtenerSubtitulosPreparadosSA,
  integrarVideosSubtituladosEnProyectoSA
} from "../../04-subtitulos-automaticos/services/sa-subtitulos.js";

let routerActualEX = null;
let estadoAppActualEX = null;
let proyectoActualEX = null;
let resultadoExportacionEX = null;
let mensajeTemporalEX = "";
let tipoMensajeTemporalEX = "info";

function escaparHtmlEX(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function obtenerProyectoActivoEX() {
  if (!estadoAppActualEX?.obtenerProyectoActivo) return proyectoActualEX;
  return estadoAppActualEX.obtenerProyectoActivo() || proyectoActualEX;
}

function actualizarProyectoActivoEX(proyecto) {
  proyectoActualEX = proyecto;

  if (!estadoAppActualEX?.establecerProyectoActivo) return;

  const estadoGlobal = estadoAppActualEX.obtenerEstado?.() || {};
  estadoAppActualEX.establecerProyectoActivo(proyecto, estadoGlobal.rutaProyectoActivo || null);
}

async function guardarProyectoLocalEX(proyecto) {
  if (!window.videoEditorAPI?.guardarProyectoLocal) {
    return { ok: false, omitido: true, mensaje: "Proyecto actualizado en memoria." };
  }

  return await window.videoEditorAPI.guardarProyectoLocal(proyecto);
}

function obtenerElementosEX() {
  return {
    resumen: document.getElementById("exResumen"),
    capas: document.getElementById("exCapas"),
    comparacion: document.getElementById("exComparacion"),
    volver: document.getElementById("exBtnVolverSubtitulos"),
    generar: document.getElementById("exBtnGenerar")
  };
}

function obtenerVideoFinalEX(video) {
  return video?.subtitulosAutomaticos?.videoFinal || video?.videoSubtitulado || null;
}

function obtenerUrlOriginalEX(video) {
  return video?.url || (video?.ruta ? `file:///${String(video.ruta).replace(/\\/g, "/")}` : "");
}

function mostrarMensajeEX(mensaje, tipo = "info") {
  mensajeTemporalEX = mensaje || "";
  tipoMensajeTemporalEX = tipo;
  renderizarPantallaEX();
}

function renderResumenEX(contenedor) {
  if (!contenedor) return;

  const proyecto = obtenerProyectoActivoEX();

  if (!proyecto) {
    contenedor.innerHTML = `
      <h3>Sin proyecto activo</h3>
      <p>Primero carga un proyecto.</p>
    `;
    return;
  }

  const resumen = crearResumenSA(proyecto);
  const puedeExportar = resumen.puedeGenerarVideo;

  contenedor.innerHTML = `
    <h3>Resumen final</h3>
    <p>${escaparHtmlEX(proyecto.nombre || "Proyecto sin nombre")}</p>

    <div class="ex-status ${puedeExportar ? "is-ok" : "is-error"}">
      <strong>${puedeExportar ? "Listo para exportar" : "Faltan subtítulos preparados"}</strong>
      <span>Los subtítulos se aplicarán como última capa visible.</span>
    </div>

    ${mensajeTemporalEX ? `
      <div class="ex-message is-${escaparHtmlEX(tipoMensajeTemporalEX)}">
        ${escaparHtmlEX(mensajeTemporalEX)}
      </div>
    ` : ""}

    <div class="ex-stats">
      <div class="ex-stat"><strong>Videos</strong><span>${resumen.total}</span></div>
      <div class="ex-stat"><strong>Con subtítulos</strong><span>${resumen.conSubtitulos}</span></div>
      <div class="ex-stat"><strong>Videos finales</strong><span>${resumen.conVideoFinal}</span></div>
      <div class="ex-stat"><strong>Total subtítulos</strong><span>${resumen.totalSubtitulos}</span></div>
    </div>
  `;
}

function renderCapasEX(contenedor) {
  if (!contenedor) return;

  const proyecto = obtenerProyectoActivoEX();
  const videos = obtenerVideosSA(proyecto);

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
      <p>Se respeta el flujo por capas. Los subtítulos quedan encima de todo.</p>
    </div>

    <div class="ex-layer-list">
      ${videos.map((video, index) => {
        const subtitulos = obtenerSubtitulosPreparadosSA(video);
        const videoFinal = obtenerVideoFinalEX(video);
        const tieneAudio = Boolean(video?.audioMejorado?.ruta || video?.audioMejorado?.url);
        const formato = video?.subtitulosAutomaticos?.formatoVisual || proyecto?.subtitulosAutomaticos?.formatoVisual || "negro-clasico";

        return `
          <article class="ex-layer-card">
            <strong>${index + 1}. ${escaparHtmlEX(video.nombre || "Video")}</strong>
            <span class="ex-chip">${videoFinal ? "Exportado" : subtitulos.length ? "Listo" : "Falta subtítulo"}</span>
            <p>Audio mejorado: ${tieneAudio ? "sí" : "no"} · Subtítulos: ${subtitulos.length} · Formato: ${escaparHtmlEX(formato)}</p>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function renderComparacionEX(contenedor) {
  if (!contenedor) return;

  const proyecto = obtenerProyectoActivoEX();
  const videos = obtenerVideosSA(proyecto);
  const videosGenerados = videos.filter((video) => obtenerVideoFinalEX(video));

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
        const videoFinal = obtenerVideoFinalEX(video);
        return `
          <article class="ex-compare-card">
            <h4>${escaparHtmlEX(video.nombre || "Video")}</h4>
            <div class="ex-compare-grid">
              <div class="ex-video-preview">
                <strong>Antes</strong>
                <video controls src="${escaparHtmlEX(obtenerUrlOriginalEX(video))}"></video>
              </div>
              <div class="ex-video-preview">
                <strong>Después</strong>
                <video controls src="${escaparHtmlEX(videoFinal.url || "")}"></video>
              </div>
            </div>
            <div class="ex-download-row">
              <span>${escaparHtmlEX(videoFinal.nombre || "video_final.mp4")}</span>
              <button class="ex-btn ex-btn--primary" type="button" data-ex-descargar="${escaparHtmlEX(video.id)}">Descargar video</button>
            </div>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function actualizarBotonesEX() {
  const elementos = obtenerElementosEX();
  const resumen = crearResumenSA(obtenerProyectoActivoEX());

  if (elementos.generar) {
    elementos.generar.disabled = !resumen.puedeGenerarVideo;
    elementos.generar.textContent = resumen.puedeGenerarVideo ? "Generar video final" : "Primero prepara subtítulos";
  }
}

function renderizarPantallaEX() {
  const elementos = obtenerElementosEX();
  renderResumenEX(elementos.resumen);
  renderCapasEX(elementos.capas);
  renderComparacionEX(elementos.comparacion);
  actualizarBotonesEX();
  conectarEventosDinamicosEX();
}

async function generarVideoFinalEX() {
  const proyecto = obtenerProyectoActivoEX();
  const resumen = crearResumenSA(proyecto);

  if (!resumen.puedeGenerarVideo) {
    mostrarMensajeEX("Primero prepara los subtítulos como capa final.", "warn");
    return;
  }

  if (!window.videoEditorAPI?.generarVideoSubtitulos) {
    mostrarMensajeEX("La exportación requiere abrir la app con Electron usando npm start.", "error");
    return;
  }

  const elementos = obtenerElementosEX();

  if (elementos.generar) {
    elementos.generar.disabled = true;
    elementos.generar.textContent = "Generando video final...";
  }

  mensajeTemporalEX = "Generando video final. Los subtítulos se aplican al último.";
  tipoMensajeTemporalEX = "info";
  renderResumenEX(elementos.resumen);

  const formatoId = proyecto?.subtitulosAutomaticos?.formatoVisual || "negro-clasico";
  const exportacion = await window.videoEditorAPI.generarVideoSubtitulos({ proyecto, formatoId });
  resultadoExportacionEX = exportacion;

  if (!exportacion.ok && !exportacion.parcial) {
    mostrarMensajeEX(exportacion.mensaje || "No se pudo generar el video final.", "error");
    return;
  }

  const proyectoActualizado = integrarVideosSubtituladosEnProyectoSA({ proyecto, exportacion });
  const guardado = await guardarProyectoLocalEX(proyectoActualizado);
  actualizarProyectoActivoEX(guardado?.ok && guardado.proyecto ? guardado.proyecto : proyectoActualizado);

  mostrarMensajeEX(exportacion.mensaje || "Video final generado correctamente.", exportacion.parcial ? "warn" : "success");
}

async function descargarVideoEX(videoId) {
  const proyecto = obtenerProyectoActivoEX();
  const video = obtenerVideosSA(proyecto).find((item) => item.id === videoId);
  const videoFinal = obtenerVideoFinalEX(video);

  if (!videoFinal) {
    mostrarMensajeEX("No se encontró el video final para descargar.", "error");
    return;
  }

  if (!window.videoEditorAPI?.descargarVideoSubtitulado) {
    mostrarMensajeEX("La descarga requiere abrir la app con Electron.", "error");
    return;
  }

  const resultado = await window.videoEditorAPI.descargarVideoSubtitulado({
    videoSubtitulado: videoFinal,
    nombreArchivo: videoFinal.nombre || `${video?.nombre || "video"}_final.mp4`
  });

  mostrarMensajeEX(resultado.mensaje || (resultado.ok ? "Video descargado." : "No se pudo descargar."), resultado.ok ? "success" : "warn");
}

function conectarEventosDinamicosEX() {
  document.querySelectorAll("[data-ex-descargar]").forEach((boton) => {
    boton.onclick = () => descargarVideoEX(boton.dataset.exDescargar);
  });
}

function conectarEventosBaseEX() {
  const elementos = obtenerElementosEX();

  if (elementos.volver) {
    elementos.volver.onclick = () => {
      if (routerActualEX?.irA) routerActualEX.irA("04-subtitulos-automaticos");
    };
  }

  if (elementos.generar) {
    elementos.generar.onclick = generarVideoFinalEX;
  }
}

export async function iniciarPantallaExportarFinal({ router, estadoApp }) {
  routerActualEX = router;
  estadoAppActualEX = estadoApp;
  proyectoActualEX = obtenerProyectoActivoEX();
  resultadoExportacionEX = null;
  mensajeTemporalEX = "";
  tipoMensajeTemporalEX = "info";

  conectarEventosBaseEX();
  renderizarPantallaEX();
}

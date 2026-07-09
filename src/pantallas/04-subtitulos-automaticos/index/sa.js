/* =========================================================
Nombre completo: sa.js
Ruta o ubicación: /src/pantallas/04-subtitulos-automaticos/index/sa.js
Funciones principales:
- Iniciar la pantalla Subtítulos automáticos.
- Preparar subtítulos automáticamente desde transcripciones.
- Permitir elegir entre tres formatos visuales.
- Generar video final subtitulado mediante Electron + FFmpeg.
- Mostrar antes/después y botones de descarga.
Con qué se conecta:
- sa.html
- sa.css
- router.js
- estadoApp.proyectoActivo
- sa-formatos.js
- sa-subtitulos.js
- window.videoEditorAPI
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
  prepararSubtitulosProyectoSA,
  integrarVideosSubtituladosEnProyectoSA
} from "../services/sa-subtitulos.js";

let estadoAppActualSA = null;
let routerActualSA = null;
let proyectoActualSA = null;
let formatoActualSA = SA_FORMATO_DEFECTO;
let resultadoPreparacionSA = null;
let resultadoExportacionSA = null;
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

function mostrarMensajeSA(mensaje, tipo = "info") {
  mensajeTemporalSA = mensaje || "";
  tipoMensajeTemporalSA = tipo;
  renderizarPantallaSA();
}

function obtenerElementosSA() {
  return {
    resumen: document.getElementById("saResumen"),
    formatos: document.getElementById("saFormatos"),
    videos: document.getElementById("saVideos"),
    comparacion: document.getElementById("saComparacion"),
    volver: document.getElementById("saBtnVolverTranscripcion"),
    preparar: document.getElementById("saBtnContinuar"),
    generar: document.getElementById("saBtnGenerarVideo")
  };
}

function obtenerVideoFinalSA(video) {
  return video?.subtitulosAutomaticos?.videoFinal || video?.videoSubtitulado || null;
}

function obtenerUrlOriginalSA(video) {
  return video?.url || (video?.ruta ? `file:///${String(video.ruta).replace(/\\/g, "/")}` : "");
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
      <strong>${resumen.puedeGenerarVideo ? "Listo para generar video" : resumen.puedePreparar ? "Listo para preparar" : "Faltan transcripciones"}</strong>
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
      <div class="sa-stat"><strong>Videos finales</strong><span>${resumen.conVideoFinal}</span></div>
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
        <h3>Formato automático</h3>
        <p>Elige uno. La app aplicará el estilo sola al video final.</p>
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
        <p>La generación es automática. Solo revisa el estado por video.</p>
      </div>
    </div>

    <div class="sa-video-list">
      ${videos.map((video, index) => {
        const transcripcion = obtenerTranscripcionSA(video);
        const subtitulos = obtenerSubtitulosPreparadosSA(video);
        const videoFinal = obtenerVideoFinalSA(video);
        const segmentos = Array.isArray(transcripcion?.segmentos) ? transcripcion.segmentos.length : 0;
        const palabras = contarPalabrasSA(transcripcion);
        const listo = Boolean(transcripcion?.texto);
        const preparado = subtitulos.length > 0;
        const generado = Boolean(videoFinal?.url || videoFinal?.ruta);

        return `
          <article class="sa-video-card ${listo ? "is-ready" : "is-pending"}">
            <div class="sa-video-card__head">
              <strong>${index + 1}. ${escaparHtmlSA(video.nombre || "Video")}</strong>
              <span class="sa-chip">${generado ? "Video generado" : preparado ? "Subtítulos preparados" : listo ? "Listo" : "Pendiente"}</span>
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

function renderComparacionSA(contenedor) {
  if (!contenedor) return;

  const proyecto = obtenerProyectoActivoSA();
  const videos = obtenerVideosSA(proyecto);
  const videosGenerados = videos.filter((video) => obtenerVideoFinalSA(video));

  if (!videosGenerados.length) {
    contenedor.innerHTML = `
      <div class="sa-empty sa-empty--small">
        <div>
          <h3>Antes y después</h3>
          <p>Cuando generes el video subtitulado, aquí aparecerá la comparación y la descarga.</p>
        </div>
      </div>
    `;
    return;
  }

  contenedor.innerHTML = `
    <div class="sa-section-head">
      <div>
        <h3>Antes y después</h3>
        <p>Compara el video original con el video final subtitulado.</p>
      </div>
      ${resultadoExportacionSA?.carpetaSalida ? `<button id="saBtnAbrirCarpeta" class="sa-btn" type="button">Abrir carpeta</button>` : ""}
    </div>

    <div class="sa-compare-list">
      ${videosGenerados.map((video) => {
        const videoFinal = obtenerVideoFinalSA(video);
        return `
          <article class="sa-compare-card">
            <h4>${escaparHtmlSA(video.nombre || "Video")}</h4>
            <div class="sa-compare-grid">
              <div class="sa-video-preview">
                <strong>Antes</strong>
                <video controls src="${escaparHtmlSA(obtenerUrlOriginalSA(video))}"></video>
              </div>
              <div class="sa-video-preview">
                <strong>Después</strong>
                <video controls src="${escaparHtmlSA(videoFinal.url || "")}"></video>
              </div>
            </div>
            <div class="sa-download-row">
              <span>${escaparHtmlSA(videoFinal.nombre || "video_subtitulado.mp4")}</span>
              <button class="sa-btn sa-btn--primary" type="button" data-sa-descargar="${escaparHtmlSA(video.id)}">Descargar video</button>
            </div>
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

  if (elementos.preparar) {
    elementos.preparar.disabled = !resumen.puedePreparar;
    elementos.preparar.textContent = resumen.puedePreparar
      ? (resumen.conSubtitulos === resumen.total ? `Reconstruir con ${formato.nombre}` : "Preparar subtítulos")
      : "Faltan transcripciones";
  }

  if (elementos.generar) {
    elementos.generar.disabled = !resumen.puedeGenerarVideo;
    elementos.generar.textContent = resumen.puedeGenerarVideo ? "Generar video con subtítulos" : "Primero prepara subtítulos";
  }
}

function renderizarPantallaSA() {
  const elementos = obtenerElementosSA();
  renderResumenSA(elementos.resumen);
  renderFormatosSA(elementos.formatos);
  renderVideosSA(elementos.videos);
  renderComparacionSA(elementos.comparacion);
  actualizarBotonesSA();
  conectarEventosDinamicosSA();
}

async function prepararSubtitulosSA() {
  const proyecto = obtenerProyectoActivoSA();
  const resultado = prepararSubtitulosProyectoSA(proyecto, formatoActualSA);
  resultadoPreparacionSA = resultado;

  if (!resultado.ok) {
    mostrarMensajeSA((resultado.errores || []).join(" | ") || "No se pudieron preparar los subtítulos.", "error");
    return;
  }

  let proyectoFinal = resultado.proyecto;
  const guardado = await guardarProyectoLocalSA(proyectoFinal);

  if (guardado?.ok && guardado.proyecto) proyectoFinal = guardado.proyecto;

  actualizarProyectoActivoSA(proyectoFinal);
  mostrarMensajeSA(resultado.mensajes?.[0] || "Subtítulos preparados automáticamente.", "success");
}

async function generarVideoSubtituladoSA() {
  const proyecto = obtenerProyectoActivoSA();
  const resumen = crearResumenSA(proyecto);

  if (!resumen.puedeGenerarVideo) {
    mostrarMensajeSA("Primero prepara los subtítulos para todos los videos.", "warn");
    return;
  }

  if (!window.videoEditorAPI?.generarVideoSubtitulos) {
    mostrarMensajeSA("La generación de video requiere abrir la app con Electron usando npm start.", "error");
    return;
  }

  const elementos = obtenerElementosSA();
  if (elementos.generar) {
    elementos.generar.disabled = true;
    elementos.generar.textContent = "Generando video...";
  }

  mensajeTemporalSA = "Generando video con subtítulos. No cierres la app.";
  tipoMensajeTemporalSA = "info";
  renderResumenSA(elementos.resumen);

  const exportacion = await window.videoEditorAPI.generarVideoSubtitulos({
    proyecto,
    formatoId: formatoActualSA
  });

  resultadoExportacionSA = exportacion;

  if (!exportacion.ok && !exportacion.parcial) {
    mostrarMensajeSA(exportacion.mensaje || "No se pudo generar el video subtitulado.", "error");
    return;
  }

  const proyectoActualizado = integrarVideosSubtituladosEnProyectoSA({
    proyecto,
    exportacion
  });

  const guardado = await guardarProyectoLocalSA(proyectoActualizado);
  actualizarProyectoActivoSA(guardado?.ok && guardado.proyecto ? guardado.proyecto : proyectoActualizado);
  mostrarMensajeSA(exportacion.mensaje || "Video subtitulado generado correctamente.", exportacion.parcial ? "warn" : "success");
}

async function descargarVideoSA(videoId) {
  const proyecto = obtenerProyectoActivoSA();
  const video = obtenerVideosSA(proyecto).find((item) => item.id === videoId);
  const videoFinal = obtenerVideoFinalSA(video);

  if (!videoFinal) {
    mostrarMensajeSA("No se encontró el video final para descargar.", "error");
    return;
  }

  if (!window.videoEditorAPI?.descargarVideoSubtitulado) {
    mostrarMensajeSA("La descarga requiere abrir la app con Electron.", "error");
    return;
  }

  const resultado = await window.videoEditorAPI.descargarVideoSubtitulado({
    videoSubtitulado: videoFinal,
    nombreArchivo: videoFinal.nombre || `${video?.nombre || "video"}_subtitulado.mp4`
  });

  mostrarMensajeSA(resultado.mensaje || (resultado.ok ? "Video descargado." : "No se pudo descargar."), resultado.ok ? "success" : "warn");
}

async function abrirCarpetaSA() {
  const ruta = resultadoExportacionSA?.carpetaSalida || proyectoActualSA?.subtitulosAutomaticos?.carpetaSalida || "";

  if (!ruta || !window.videoEditorAPI?.abrirCarpetaSubtitulos) {
    mostrarMensajeSA("No hay carpeta de subtítulos disponible.", "warn");
    return;
  }

  const resultado = await window.videoEditorAPI.abrirCarpetaSubtitulos(ruta);
  mostrarMensajeSA(resultado.mensaje || "Carpeta abierta.", resultado.ok ? "success" : "warn");
}

function conectarEventosDinamicosSA() {
  document.querySelectorAll("[data-sa-formato]").forEach((boton) => {
    boton.onclick = () => {
      formatoActualSA = boton.dataset.saFormato || SA_FORMATO_DEFECTO;
      resultadoPreparacionSA = null;
      mensajeTemporalSA = `Formato seleccionado: ${obtenerFormatoSubtitulosSA(formatoActualSA).nombre}.`;
      tipoMensajeTemporalSA = "info";
      renderizarPantallaSA();
    };
  });

  document.querySelectorAll("[data-sa-descargar]").forEach((boton) => {
    boton.onclick = () => descargarVideoSA(boton.dataset.saDescargar);
  });

  const abrir = document.getElementById("saBtnAbrirCarpeta");
  if (abrir) abrir.onclick = abrirCarpetaSA;
}

function conectarEventosBaseSA() {
  const elementos = obtenerElementosSA();

  if (elementos.volver) {
    elementos.volver.onclick = () => {
      if (routerActualSA?.irA) routerActualSA.irA("03-transcribir-video");
    };
  }

  if (elementos.preparar) elementos.preparar.onclick = prepararSubtitulosSA;
  if (elementos.generar) elementos.generar.onclick = generarVideoSubtituladoSA;
}

export async function iniciarPantallaSubtitulosAutomaticos({ router, estadoApp }) {
  routerActualSA = router;
  estadoAppActualSA = estadoApp;
  proyectoActualSA = obtenerProyectoActivoSA();
  formatoActualSA = proyectoActualSA?.subtitulosAutomaticos?.formatoVisual || SA_FORMATO_DEFECTO;
  resultadoPreparacionSA = null;
  resultadoExportacionSA = null;
  mensajeTemporalSA = "";
  tipoMensajeTemporalSA = "info";

  conectarEventosBaseSA();
  renderizarPantallaSA();
}

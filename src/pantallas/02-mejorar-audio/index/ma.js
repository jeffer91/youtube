/* =========================================================
Nombre completo: ma.js
Ruta o ubicación: /src/pantallas/02-mejorar-audio/index/ma.js
Funciones principales:
- Iniciar la pantalla Mejorar audio.
- Recibir los videos cargados desde Cargar proyecto.
- Renderizar páginas, controles, progreso, comparación y guardado.
- Conectar botones y acciones de audio inteligente.
- Guardar la mejora como capa sin dañar el video original.
Con qué se conecta:
- ma.html
- ma.css
- ma-service.js
- ma-pasos.js
- ma-videos.js
- ma-controles.js
- ma-progreso.js
- ma-comparar.js
========================================================= */

import { crearMejorarAudioService } from "../services/ma-service.js";

import {
  renderPaginasMA,
  conectarPaginasMA,
  renderBotonesMA,
  conectarBotonesMA
} from "../render/ma-pasos.js";

import {
  renderSelectorVideosMA,
  conectarSelectorVideosMA,
  renderResumenVideoMA
} from "../render/ma-videos.js";

import {
  renderControlesMA,
  conectarControlesMA
} from "../render/ma-controles.js";

import { renderProgresoMA } from "../render/ma-progreso.js";

import {
  renderComparadorMA,
  conectarComparadorMA,
  renderGuardarCapaMA
} from "../render/ma-comparar.js";

import { obtenerVideoActual } from "../helpers/ma-video.js";
import { validarProyectoAudio } from "../validaciones/ma-validar.js";

let routerActual = null;
let estadoAppActual = null;
let serviceActual = null;

async function cargarHtmlMA() {
  const respuesta = await fetch(new URL("./ma.html", import.meta.url));

  if (!respuesta.ok) {
    throw new Error("No se pudo cargar ma.html.");
  }

  return await respuesta.text();
}

function obtenerElementosMA() {
  return {
    paginas: document.getElementById("maPaginas"),
    mensajes: document.getElementById("maMensajes"),
    selectorVideos: document.getElementById("maSelectorVideos"),
    resumenVideo: document.getElementById("maResumenVideo"),
    progreso: document.getElementById("maProgreso"),
    contenido: document.getElementById("maContenido"),
    acciones: document.getElementById("maAcciones")
  };
}

function escaparHtml(texto) {
  return String(texto || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderMensajesMA(contenedor, estado) {
  if (!contenedor) {
    return;
  }

  const errores = Array.isArray(estado.errores) ? estado.errores : [];
  const mensajes = Array.isArray(estado.mensajes) ? estado.mensajes : [];

  if (!errores.length && !mensajes.length) {
    contenedor.innerHTML = "";
    return;
  }

  const erroresHtml = errores
    .map((error) => {
      return `
        <div class="ma-alert ma-alert--error">
          ${escaparHtml(error)}
        </div>
      `;
    })
    .join("");

  const mensajesHtml = mensajes
    .map((mensaje) => {
      return `
        <div class="ma-alert ma-alert--success">
          ${escaparHtml(mensaje)}
        </div>
      `;
    })
    .join("");

  contenedor.innerHTML = `
    <div class="ma-messages">
      ${erroresHtml}
      ${mensajesHtml}
    </div>
  `;
}

function renderSinProyectoMA(root, errores = []) {
  if (!root) {
    return;
  }

  const erroresHtml = errores.length
    ? errores.map((error) => `<p>${escaparHtml(error)}</p>`).join("")
    : "<p>Primero carga un proyecto con videos.</p>";

  root.innerHTML = `
    <section class="ma-screen">
      <div class="ma-empty ma-empty--dark app-card">
        <strong>No hay proyecto para mejorar audio</strong>
        ${erroresHtml}
        <button id="maBtnVolverCarga" class="app-btn" type="button">
          Ir a Cargar proyecto
        </button>
      </div>
    </section>
  `;

  const boton = document.getElementById("maBtnVolverCarga");

  if (boton) {
    boton.addEventListener("click", () => {
      if (routerActual?.irA) {
        routerActual.irA("01-cargar-proyecto");
      }
    });
  }
}

function renderContenidoPaginaMA({ contenedor, estado, videoActual, service }) {
  if (!contenedor) {
    return;
  }

  if (estado.paginaActual === "controles") {
    renderControlesMA({
      contenedor,
      controles: estado.controles,
      perfilAudio: estado.perfilAudio,
      procesando: estado.procesando
    });

    conectarControlesMA({ service });
    return;
  }

  if (estado.paginaActual === "comparar") {
    renderComparadorMA({
      contenedor,
      video: videoActual,
      modoComparacion: estado.modoComparacion
    });

    conectarComparadorMA({ service });
    return;
  }

  renderGuardarCapaMA({
    contenedor,
    video: videoActual,
    capaGuardada: estado.capaGuardada
  });
}

function renderizarMA(service) {
  const estado = service.obtenerEstado();
  const elementos = obtenerElementosMA();
  const videoActual = obtenerVideoActual(estado.videos, estado.videoActualId);

  renderPaginasMA({
    contenedor: elementos.paginas,
    paginaActual: estado.paginaActual,
    procesando: estado.procesando
  });

  renderMensajesMA(elementos.mensajes, estado);

  renderSelectorVideosMA({
    contenedor: elementos.selectorVideos,
    videos: estado.videos,
    videoActualId: estado.videoActualId
  });

  renderResumenVideoMA({
    contenedor: elementos.resumenVideo,
    video: videoActual
  });

  renderProgresoMA({
    contenedor: elementos.progreso,
    progreso: estado.progresoGlobal
  });

  renderContenidoPaginaMA({
    contenedor: elementos.contenido,
    estado,
    videoActual,
    service
  });

  renderBotonesMA({
    contenedor: elementos.acciones,
    estado
  });

  conectarPaginasMA({ service });
  conectarSelectorVideosMA({ service });
  conectarBotonesMA({ service });
}

function obtenerProyectoActivoSeguro(estadoApp) {
  if (!estadoApp?.obtenerProyectoActivo) {
    return null;
  }

  return estadoApp.obtenerProyectoActivo();
}

export async function iniciarPantallaMejorarAudio({ root, router, estadoApp }) {
  routerActual = router;
  estadoAppActual = estadoApp;

  const proyectoActivo = obtenerProyectoActivoSeguro(estadoAppActual);
  const validacion = validarProyectoAudio(proyectoActivo);

  if (!validacion.ok) {
    renderSinProyectoMA(root, validacion.errores || []);
    return;
  }

  root.innerHTML = await cargarHtmlMA();

  serviceActual = crearMejorarAudioService({
    proyectoActivo,
    estadoApp: estadoAppActual
  });

  serviceActual.escuchar(() => {
    renderizarMA(serviceActual);
  });

  renderizarMA(serviceActual);
}

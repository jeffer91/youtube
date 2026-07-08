/* =========================================================
Nombre completo: tr.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/index/tr.js
Funciones principales:
- Iniciar la pantalla Transcribir video.
- Crear el servicio de transcripción.
- Renderizar pasos, videos, controles, progreso, resultado y acciones.
- Conectar eventos de usuario sin duplicarlos.
- Cargar ajustes visuales propios de la pantalla.
Con qué se conecta:
- tr.html
- tr.css
- tr-ajustes.css
- tr-service.js
- Archivos render de 03-transcribir-video
========================================================= */

import {
  crearTranscripcionService
} from "../services/tr-service.js";

import {
  renderPasosTR,
  conectarPasosTR,
  renderSelectorVideosTR,
  conectarSelectorVideosTR,
  renderResumenVideoTR
} from "../render/tr-videos.js";

import {
  renderOpcionesTranscripcionTR,
  conectarControlesTranscripcionTR,
  renderProgresoTranscripcionTR
} from "../render/tr-controles.js";

import {
  renderResultadoTranscripcionTR,
  conectarResultadoTranscripcionTR
} from "../render/tr-resultado.js";

import {
  renderMensajesTranscripcionTR,
  renderAccionesTranscripcionTR,
  conectarAccionesTranscripcionTR
} from "../render/tr-botones.js";

let serviceActualTR = null;
let routerActualTR = null;
let estadoAppActualTR = null;

function asegurarCssAjustesTR() {
  const cssId = "css-03-transcribir-video-ajustes";

  if (document.getElementById(cssId)) {
    return;
  }

  const link = document.createElement("link");
  link.id = cssId;
  link.rel = "stylesheet";
  link.href = new URL("./tr-ajustes.css", import.meta.url).href;
  document.head.appendChild(link);
}

function obtenerElementosTR() {
  return {
    pasos: document.getElementById("trPasos"),
    mensajes: document.getElementById("trMensajes"),
    selectorVideos: document.getElementById("trSelectorVideos"),
    resumenVideo: document.getElementById("trResumenVideo"),
    opciones: document.getElementById("trOpciones"),
    progreso: document.getElementById("trProgreso"),
    resultado: document.getElementById("trResultado"),
    acciones: document.getElementById("trAcciones")
  };
}

function obtenerProyectoActivoTR(estadoApp) {
  if (!estadoApp?.obtenerProyectoActivo) {
    return null;
  }

  return estadoApp.obtenerProyectoActivo();
}

function renderizarTR(service) {
  const estado = service.obtenerEstado();
  const elementos = obtenerElementosTR();
  const videoActual = service.obtenerVideoActual();

  renderPasosTR({
    contenedor: elementos.pasos,
    pasos: estado.pasos,
    pasoActual: estado.pasoActual
  });

  renderMensajesTranscripcionTR({
    contenedor: elementos.mensajes,
    estado
  });

  renderSelectorVideosTR({
    contenedor: elementos.selectorVideos,
    videos: estado.videos,
    videoActualId: estado.videoActualId
  });

  renderResumenVideoTR({
    contenedor: elementos.resumenVideo,
    video: videoActual,
    transcripcion: estado.transcripcionActual
  });

  renderOpcionesTranscripcionTR({
    contenedor: elementos.opciones,
    estado
  });

  renderProgresoTranscripcionTR({
    contenedor: elementos.progreso,
    estado
  });

  renderResultadoTranscripcionTR({
    contenedor: elementos.resultado,
    estado
  });

  renderAccionesTranscripcionTR({
    contenedor: elementos.acciones,
    estado
  });

  conectarPasosTR({ service });
  conectarSelectorVideosTR({ service });
  conectarControlesTranscripcionTR({ service });
  conectarResultadoTranscripcionTR({ service });
  conectarAccionesTranscripcionTR({
    service,
    router: routerActualTR
  });
}

export async function iniciarPantallaTranscribirVideo({ router, estadoApp }) {
  asegurarCssAjustesTR();

  routerActualTR = router;
  estadoAppActualTR = estadoApp;

  serviceActualTR = crearTranscripcionService({
    proyectoActivo: obtenerProyectoActivoTR(estadoAppActualTR),
    estadoApp: estadoAppActualTR
  });

  serviceActualTR.escuchar(() => {
    renderizarTR(serviceActualTR);
  });

  renderizarTR(serviceActualTR);
}

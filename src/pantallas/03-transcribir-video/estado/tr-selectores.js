/* =========================================================
Nombre completo: tr-selectores.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/estado/tr-selectores.js
Funciones principales:
- Obtener datos derivados del estado de transcripción.
- Obtener elementos HTML de la pantalla.
- Leer de forma segura el proyecto activo.
- Evitar repetir búsquedas y validaciones en otros archivos.
Con qué se conecta:
- tr.js
- tr-estado.js
- tr-ui-layout.js
========================================================= */

export function obtenerProyectoActivoSeguroTR(estadoApp) {
  if (!estadoApp?.obtenerProyectoActivo) {
    return null;
  }

  return estadoApp.obtenerProyectoActivo();
}

export function proyectoTieneVideosTR(proyectoActivo) {
  return Array.isArray(proyectoActivo?.videos) && proyectoActivo.videos.length > 0;
}

export function obtenerElementosPantallaTR() {
  return {
    root: document.getElementById("trRoot"),
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

export function obtenerVideosTR(estado) {
  return Array.isArray(estado?.videos) ? estado.videos : [];
}

export function obtenerVideoSeleccionadoTR(estado) {
  const videos = obtenerVideosTR(estado);
  const videoId = estado?.videoSeleccionadoId;

  if (!videoId) {
    return videos[0] || null;
  }

  return videos.find((video) => video.id === videoId) || videos[0] || null;
}

export function obtenerOpcionesTR(estado) {
  return estado?.opciones || {};
}

export function obtenerProgresoTR(estado) {
  return estado?.progreso || {
    porcentaje: 0,
    estado: "pendiente",
    texto: "Todavía no se ha iniciado la transcripción."
  };
}

export function obtenerResultadoTR(estado) {
  return estado?.resultado || null;
}

export function obtenerMensajesTR(estado) {
  return Array.isArray(estado?.mensajes) ? estado.mensajes : [];
}

export function obtenerErroresTR(estado) {
  return Array.isArray(estado?.errores) ? estado.errores : [];
}

export function puedeTranscribirTR(estado) {
  const video = obtenerVideoSeleccionadoTR(estado);

  if (!video) {
    return false;
  }

  if (estado?.procesando) {
    return false;
  }

  return Boolean(video.ruta || video.url);
}

export function videoTieneAudioMejoradoTR(video) {
  return Boolean(
    video?.audioMejorado?.ruta ||
    video?.audioMejorado?.url ||
    video?.audioMejorado?.rutaSalida
  );
}
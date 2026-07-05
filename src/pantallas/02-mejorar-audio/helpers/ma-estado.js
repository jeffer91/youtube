/* =========================================================
Nombre completo: ma-estado.js
Ruta o ubicación: /src/pantallas/02-mejorar-audio/helpers/ma-estado.js
Funciones principales:
- Crear el estado inicial de Mejorar audio.
- Preparar controles de audio inteligente.
- Preparar videos recibidos desde el proyecto.
- Guardar perfil de audio, análisis y diagnóstico.
- Mantener la pantalla ordenada por páginas.
Con qué se conecta:
- ma-service.js
- ma-data.js
- ma-video.js
========================================================= */

import {
  crearControlesInicialesMA,
  obtenerPerfilInicialMA
} from "../data/ma-data.js";

function clonar(valor) {
  return JSON.parse(JSON.stringify(valor || null));
}

function normalizarVideo(video, index) {
  const fuente = video && typeof video === "object" ? video : {};

  return {
    ...fuente,
    id: fuente.id || `video-${index + 1}`,
    nombre: fuente.nombre || `Video ${index + 1}`,
    ruta: fuente.ruta || "",
    url: fuente.url || "",
    extension: fuente.extension || "",
    pesoBytes: fuente.pesoBytes || 0,
    duracionSegundos: fuente.duracionSegundos || 0,
    duracionTexto: fuente.duracionTexto || "00:00",
    orden: fuente.orden || index + 1,
    audioMejorado: fuente.audioMejorado || null,
    procesado: Boolean(fuente.procesado || fuente.audioMejorado),
    errorAudio: fuente.errorAudio || ""
  };
}

function normalizarVideos(videos) {
  if (!Array.isArray(videos)) {
    return [];
  }

  return videos.map((video, index) => normalizarVideo(video, index));
}

export function crearEstadoInicialMA(proyectoActivo) {
  const videos = normalizarVideos(proyectoActivo?.videos || []);
  const primerVideo = videos.length ? videos[0].id : "";
  const perfilInicial = obtenerPerfilInicialMA();

  return {
    paginaActual: "controles",
    videoActualId: primerVideo,
    videos,
    perfilAudio: perfilInicial,
    controles: crearControlesInicialesMA(),
    modoComparacion: "original",
    procesando: false,
    guardando: false,
    descargando: false,
    capaGuardada: false,
    errores: [],
    mensajes: [],
    resultadoActual: null,
    ultimoAnalisisAudio: null,
    ultimoDiagnosticoAudio: null
  };
}

export function clonarEstadoMA(valor) {
  return clonar(valor);
}

export function limpiarMensajesEstadoMA(estado) {
  return {
    ...estado,
    errores: [],
    mensajes: []
  };
}

export function estadoTieneVideosMA(estado) {
  return Array.isArray(estado?.videos) && estado.videos.length > 0;
}

export function estadoEstaProcesandoMA(estado) {
  return Boolean(estado?.procesando || estado?.guardando || estado?.descargando);
}
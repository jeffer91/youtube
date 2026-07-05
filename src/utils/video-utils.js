/* =========================================================
Nombre completo: video-utils.js
Ruta o ubicación: /src/utils/video-utils.js
Funciones principales:
- Validar extensiones de video permitidas.
- Formatear duración de video.
- Crear datos simples para mostrar videos.
- Apoyar funciones generales de video.
========================================================= */

export const EXTENSIONES_VIDEO_PERMITIDAS = ["mp4", "mov", "avi", "mkv", "webm"];

export function esExtensionVideoValida(extension) {
  const ext = String(extension || "")
    .toLowerCase()
    .replace(".", "")
    .trim();

  return EXTENSIONES_VIDEO_PERMITIDAS.includes(ext);
}

export function formatearDuracion(segundos) {
  const total = Number(segundos);

  if (!Number.isFinite(total) || total <= 0) {
    return "00:00";
  }

  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const segundosFinales = Math.floor(total % 60);

  const mm = String(minutos).padStart(2, "0");
  const ss = String(segundosFinales).padStart(2, "0");

  if (horas > 0) {
    const hh = String(horas).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }

  return `${mm}:${ss}`;
}

export function crearResumenVideo(video) {
  if (!video || typeof video !== "object") {
    return {
      id: "",
      nombre: "Video sin nombre",
      duracionTexto: "00:00",
      extension: "",
      url: "",
      ruta: ""
    };
  }

  return {
    id: video.id || "",
    nombre: video.nombre || "Video sin nombre",
    duracionTexto: video.duracionTexto || formatearDuracion(video.duracionSegundos),
    extension: video.extension || "",
    url: video.url || "",
    ruta: video.ruta || ""
  };
}

export function ordenarVideosPorIndice(videos) {
  if (!Array.isArray(videos)) {
    return [];
  }

  return videos
    .map((video, index) => ({
      ...video,
      orden: Number.isFinite(Number(video.orden)) ? Number(video.orden) : index + 1
    }))
    .sort((a, b) => a.orden - b.orden);
}

export function reasignarOrdenVideos(videos) {
  if (!Array.isArray(videos)) {
    return [];
  }

  return videos.map((video, index) => ({
    ...video,
    orden: index + 1
  }));
}

export function obtenerVideoPorId(videos, videoId) {
  if (!Array.isArray(videos)) {
    return null;
  }

  return videos.find((video) => video.id === videoId) || null;
}
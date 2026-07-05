/* =========================================================
Nombre completo: ma-video.js
Ruta o ubicación: /src/pantallas/02-mejorar-audio/helpers/ma-video.js
Funciones principales:
- Obtener el video actual.
- Cambiar datos del video procesado.
- Crear URL de reproducción para original o mejorado.
- Preparar datos para comparación.
========================================================= */

export function obtenerVideoActual(videos, videoActualId) {
  if (!Array.isArray(videos) || !videoActualId) {
    return null;
  }

  return videos.find((video) => video.id === videoActualId) || null;
}

export function obtenerIndiceVideo(videos, videoActualId) {
  if (!Array.isArray(videos)) {
    return -1;
  }

  return videos.findIndex((video) => video.id === videoActualId);
}

export function actualizarVideoEnLista(videos, videoId, cambios) {
  if (!Array.isArray(videos)) {
    return [];
  }

  return videos.map((video) => {
    if (video.id !== videoId) {
      return video;
    }

    return {
      ...video,
      ...cambios
    };
  });
}

export function obtenerUrlVideo(video, modoComparacion = "original") {
  if (!video) {
    return "";
  }

  if (modoComparacion === "mejorado" && video.audioMejorado?.url) {
    return video.audioMejorado.url;
  }

  return video.url || "";
}

export function videoTieneMejora(video) {
  return Boolean(video?.audioMejorado?.url || video?.audioMejorado?.ruta);
}

export function obtenerNombreVideo(video) {
  return video?.nombre || "Video sin nombre";
}

export function obtenerDuracionVideo(video) {
  return video?.duracionTexto || "00:00";
}

export function crearResumenVideoAudio(video) {
  if (!video) {
    return {
      nombre: "Sin video",
      duracion: "00:00",
      estado: "Pendiente"
    };
  }

  return {
    nombre: obtenerNombreVideo(video),
    duracion: obtenerDuracionVideo(video),
    estado: videoTieneMejora(video) ? "Mejorado" : "Pendiente"
  };
}
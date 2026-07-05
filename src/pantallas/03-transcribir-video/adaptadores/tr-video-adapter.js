/* =========================================================
Nombre completo: tr-video-adapter.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/adaptadores/tr-video-adapter.js
Funciones principales:
- Convertir videos del proyecto al formato interno de transcripción.
- Normalizar nombres, rutas, duración, miniatura y audio mejorado.
- Evitar que la pantalla trabaje con campos indefinidos.
- Mantener compatibilidad con futuros cambios del proyecto.
Con qué se conecta:
- tr-caso-cargar-videos.js
- tr-selectores.js
- tr-caso-transcribir.js
========================================================= */

function limpiarTextoTR(valor) {
  return String(valor || "").trim();
}

function crearIdVideoTemporalTR(index) {
  return `video-${index + 1}`;
}

function normalizarAudioMejoradoTR(video) {
  const audioMejorado = video?.audioMejorado || video?.audio || null;

  if (!audioMejorado || typeof audioMejorado !== "object") {
    return null;
  }

  return {
    ruta: limpiarTextoTR(audioMejorado.ruta || audioMejorado.rutaSalida || ""),
    url: limpiarTextoTR(audioMejorado.url || ""),
    nombre: limpiarTextoTR(audioMejorado.nombre || ""),
    creadoEn: limpiarTextoTR(audioMejorado.creadoEn || audioMejorado.fecha || "")
  };
}

export function adaptarVideoParaTranscripcionTR(video, index = 0) {
  const fuente = video && typeof video === "object" ? video : {};

  return {
    ...fuente,
    id: limpiarTextoTR(fuente.id) || crearIdVideoTemporalTR(index),
    nombre: limpiarTextoTR(fuente.nombre) || `Video ${index + 1}`,
    ruta: limpiarTextoTR(fuente.ruta),
    url: limpiarTextoTR(fuente.url),
    extension: limpiarTextoTR(fuente.extension),
    pesoBytes: Number(fuente.pesoBytes || 0),
    fechaModificacion: fuente.fechaModificacion || null,
    orden: Number(fuente.orden || index + 1),
    duracionSegundos: Number(fuente.duracionSegundos || 0),
    duracionTexto: limpiarTextoTR(fuente.duracionTexto) || "00:00",
    miniatura: limpiarTextoTR(fuente.miniatura),
    audioMejorado: normalizarAudioMejoradoTR(fuente),
    transcripcion: fuente.transcripcion || null
  };
}

export function adaptarListaVideosParaTranscripcionTR(videos) {
  if (!Array.isArray(videos)) {
    return [];
  }

  return videos.map((video, index) => adaptarVideoParaTranscripcionTR(video, index));
}

export function obtenerRutaVideoParaTranscripcionTR(video, origenAudio = "original") {
  if (!video) {
    return "";
  }

  if (origenAudio === "audio-mejorado") {
    return video.audioMejorado?.ruta || video.audioMejorado?.url || "";
  }

  return video.ruta || video.url || "";
}
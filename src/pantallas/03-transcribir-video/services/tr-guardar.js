/* =========================================================
Nombre completo: tr-guardar.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/services/tr-guardar.js
Funciones principales:
- Guardar la transcripción dentro del proyecto activo.
- Asociar la transcripción al video seleccionado.
- Mantener el video original sin cambios.
- Preparar el proyecto para la pantalla 04 Subtítulos.
- Enviar la transcripción a Google Sheets como base principal.
Con qué se conecta:
- tr-service.js
- tr-validar.js
- tr-json.js
- gs-avances.repository.js
========================================================= */

import {
  validarProyectoTranscripcionTR,
  validarVideoTranscripcionTR,
  validarResultadoTranscripcionTR
} from "../validaciones/tr-validar.js";

import {
  normalizarTranscripcionJsonTR
} from "../formatos/tr-json.js";

import {
  guardarTranscripcionEnGoogleSheetsGS
} from "../../../shared/google-sheets/gs-avances.repository.js";

function clonarTR(valor) {
  return JSON.parse(JSON.stringify(valor || null));
}

function crearErrorGuardarTR(errores) {
  return {
    ok: false,
    proyecto: null,
    video: null,
    mensaje: "No se pudo guardar la transcripción.",
    errores: Array.isArray(errores) ? errores : [String(errores || "Error desconocido.")]
  };
}

function enviarTranscripcionGoogleSheetsTR({ proyecto, video, transcripcion }) {
  guardarTranscripcionEnGoogleSheetsGS({ proyecto, video, transcripcion })
    .catch(() => {});
}

function actualizarVideoConTranscripcionTR(video, transcripcion) {
  const transcripcionNormalizada = normalizarTranscripcionJsonTR(transcripcion, { video });

  return {
    ...video,
    transcripcion: transcripcionNormalizada,
    transcripciones: [
      ...(Array.isArray(video.transcripciones) ? video.transcripciones : []),
      transcripcionNormalizada
    ],
    actualizadoEn: new Date().toISOString()
  };
}

function actualizarListaVideosTR(videos, videoActualizado) {
  return videos.map((video) => {
    if (video.id !== videoActualizado.id) {
      return video;
    }

    return videoActualizado;
  });
}

export function guardarTranscripcionEnProyectoTR({ proyecto, video, transcripcion }) {
  const errores = [];
  const proyectoValidado = validarProyectoTranscripcionTR(proyecto);
  const videoValidado = validarVideoTranscripcionTR(video);
  const transcripcionValidada = validarResultadoTranscripcionTR(transcripcion);

  if (!proyectoValidado.ok) {
    errores.push(...proyectoValidado.errores);
  }

  if (!videoValidado.ok) {
    errores.push(...videoValidado.errores);
  }

  if (!transcripcionValidada.ok) {
    errores.push(...transcripcionValidada.errores);
  }

  if (errores.length) {
    return crearErrorGuardarTR(errores);
  }

  const proyectoBase = clonarTR(proyecto);
  const videos = Array.isArray(proyectoBase.videos) ? proyectoBase.videos : [];
  const existeVideo = videos.some((item) => item.id === video.id);

  if (!existeVideo) {
    return crearErrorGuardarTR(["El video seleccionado ya no existe en el proyecto."]);
  }

  const videoActualizado = actualizarVideoConTranscripcionTR(video, transcripcion);
  const proyectoActualizado = {
    ...proyectoBase,
    videos: actualizarListaVideosTR(videos, videoActualizado),
    pantallaActual: "04-subtitulos-automaticos",
    actualizadoEn: new Date().toISOString()
  };

  enviarTranscripcionGoogleSheetsTR({
    proyecto: proyectoActualizado,
    video: videoActualizado,
    transcripcion: videoActualizado.transcripcion
  });

  return {
    ok: true,
    proyecto: proyectoActualizado,
    video: videoActualizado,
    transcripcion: videoActualizado.transcripcion,
    mensaje: "Transcripción guardada. Google Sheets se actualiza como base principal.",
    errores: []
  };
}

export function obtenerTranscripcionVideoTR(video) {
  if (!video || typeof video !== "object") {
    return null;
  }

  if (video.transcripcion) {
    return normalizarTranscripcionJsonTR(video.transcripcion, { video });
  }

  if (Array.isArray(video.transcripciones) && video.transcripciones.length) {
    return normalizarTranscripcionJsonTR(video.transcripciones[video.transcripciones.length - 1], { video });
  }

  return null;
}

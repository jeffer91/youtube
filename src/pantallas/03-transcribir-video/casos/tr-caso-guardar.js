/* =========================================================
Nombre completo: tr-caso-guardar.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/casos/tr-caso-guardar.js
Funciones principales:
- Preparar el guardado de una transcripción dentro del proyecto.
- Asociar la transcripción al video correcto.
- Mantener intactos los demás videos.
- Devolver un proyecto actualizado.
Con qué se conecta:
- tr.js
- tr-proyecto-adapter.js
- tr-modelo-transcripcion.js
========================================================= */

import { crearModeloTranscripcionTR } from "../dominio/tr-modelo-transcripcion.js";

export function guardarTranscripcionEnProyectoTR({ proyectoActivo, videoId, resultado }) {
  if (!proyectoActivo || typeof proyectoActivo !== "object") {
    return {
      ok: false,
      proyecto: proyectoActivo,
      mensaje: "No existe un proyecto activo para guardar la transcripción."
    };
  }

  if (!Array.isArray(proyectoActivo.videos)) {
    return {
      ok: false,
      proyecto: proyectoActivo,
      mensaje: "El proyecto activo no tiene una lista de videos válida."
    };
  }

  if (!videoId) {
    return {
      ok: false,
      proyecto: proyectoActivo,
      mensaje: "No se seleccionó un video para guardar la transcripción."
    };
  }

  const transcripcion = crearModeloTranscripcionTR(resultado);

  if (!transcripcion.ok) {
    return {
      ok: false,
      proyecto: proyectoActivo,
      mensaje: transcripcion.mensaje
    };
  }

  let encontrado = false;

  const videosActualizados = proyectoActivo.videos.map((video) => {
    if (video.id !== videoId) {
      return video;
    }

    encontrado = true;

    return {
      ...video,
      transcripcion: transcripcion.data
    };
  });

  if (!encontrado) {
    return {
      ok: false,
      proyecto: proyectoActivo,
      mensaje: "No se encontró el video seleccionado dentro del proyecto."
    };
  }

  return {
    ok: true,
    proyecto: {
      ...proyectoActivo,
      videos: videosActualizados,
      actualizadoEn: new Date().toISOString()
    },
    mensaje: "Transcripción guardada dentro del proyecto."
  };
}
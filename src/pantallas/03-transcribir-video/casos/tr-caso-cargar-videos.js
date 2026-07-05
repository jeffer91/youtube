/* =========================================================
Nombre completo: tr-caso-cargar-videos.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/casos/tr-caso-cargar-videos.js
Funciones principales:
- Preparar los videos del proyecto activo para transcripción.
- Validar que exista proyecto y videos.
- Convertir videos al formato interno del módulo.
- Evitar que la pantalla trabaje con datos incompletos.
Con qué se conecta:
- tr.js
- tr-video-adapter.js
- tr-proyecto-adapter.js
========================================================= */

import { adaptarProyectoParaTranscripcionTR } from "../adaptadores/tr-proyecto-adapter.js";
import { adaptarListaVideosParaTranscripcionTR } from "../adaptadores/tr-video-adapter.js";

export function cargarVideosDelProyectoTR(proyectoActivo) {
  const proyecto = adaptarProyectoParaTranscripcionTR(proyectoActivo);

  if (!proyecto.ok) {
    return {
      ok: false,
      videos: [],
      mensaje: proyecto.mensaje
    };
  }

  const videos = adaptarListaVideosParaTranscripcionTR(proyecto.proyecto.videos);

  if (!videos.length) {
    return {
      ok: false,
      videos: [],
      mensaje: "El proyecto no tiene videos disponibles para transcribir."
    };
  }

  return {
    ok: true,
    videos,
    mensaje: "Videos cargados correctamente."
  };
}

export function obtenerVideoInicialTR(videos) {
  if (!Array.isArray(videos) || videos.length === 0) {
    return null;
  }

  return videos[0];
}

export function buscarVideoPorIdTR(videos, videoId) {
  if (!Array.isArray(videos)) {
    return null;
  }

  return videos.find((video) => video.id === videoId) || null;
}
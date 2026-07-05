/* =========================================================
Nombre completo: cp-duracion.js
Ruta o ubicación: /src/pantallas/01-cargar-proyecto/helpers/cp-duracion.js
Funciones principales:
- Obtener la duración real de un video cargado.
- Usar un elemento video temporal.
- Devolver duración en segundos.
- Evitar bloquear la pantalla si falla.
========================================================= */

import { formatearDuracion } from "../../../utils/video-utils.js";

export function obtenerDuracionVideo(urlVideo) {
  return new Promise((resolve) => {
    if (!urlVideo) {
      resolve({
        ok: false,
        duracionSegundos: 0,
        duracionTexto: "00:00",
        mensaje: "No existe URL del video."
      });
      return;
    }

    const video = document.createElement("video");

    video.preload = "metadata";
    video.src = urlVideo;
    video.muted = true;

    const limpiar = () => {
      video.removeAttribute("src");
      video.load();
    };

    video.onloadedmetadata = () => {
      const duracion = Number(video.duration);

      limpiar();

      if (!Number.isFinite(duracion) || duracion <= 0) {
        resolve({
          ok: false,
          duracionSegundos: 0,
          duracionTexto: "00:00",
          mensaje: "No se pudo leer la duración."
        });
        return;
      }

      resolve({
        ok: true,
        duracionSegundos: duracion,
        duracionTexto: formatearDuracion(duracion)
      });
    };

    video.onerror = () => {
      limpiar();

      resolve({
        ok: false,
        duracionSegundos: 0,
        duracionTexto: "00:00",
        mensaje: "No se pudo cargar el video para leer duración."
      });
    };
  });
}

export async function agregarDuracionAVideo(video) {
  if (!video || !video.url) {
    return {
      ...video,
      duracionSegundos: 0,
      duracionTexto: "00:00"
    };
  }

  const resultado = await obtenerDuracionVideo(video.url);

  return {
    ...video,
    duracionSegundos: resultado.duracionSegundos,
    duracionTexto: resultado.duracionTexto
  };
}

export async function agregarDuracionAVideos(videos) {
  if (!Array.isArray(videos)) {
    return [];
  }

  const videosConDuracion = [];

  for (const video of videos) {
    const videoFinal = await agregarDuracionAVideo(video);
    videosConDuracion.push(videoFinal);
  }

  return videosConDuracion;
}
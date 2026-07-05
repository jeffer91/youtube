/* =========================================================
Nombre completo: ma-descarga.js
Ruta o ubicación: /src/pantallas/02-mejorar-audio/services/ma-descarga.js
Funciones principales:
- Descargar el video con audio mejorado.
- Usar API de Electron si existe.
- Usar descarga simple como respaldo temporal.
- Validar que el video tenga mejora aplicada.
========================================================= */

import { videoTieneMejora } from "../helpers/ma-video.js";

function crearNombreDescarga(video) {
  const nombreBase = String(video?.nombre || "video-mejorado")
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${nombreBase || "video"}-audio-mejorado.mp4`;
}

function descargarConEnlace(url, nombreArchivo) {
  const enlace = document.createElement("a");

  enlace.href = url;
  enlace.download = nombreArchivo;
  enlace.style.display = "none";

  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
}

export async function descargarVideoMejorado(video) {
  if (!video) {
    return {
      ok: false,
      mensaje: "No hay video seleccionado."
    };
  }

  if (!videoTieneMejora(video)) {
    return {
      ok: false,
      mensaje: "Primero mejora el audio."
    };
  }

  const audioMejorado = video.audioMejorado;
  const nombreArchivo = crearNombreDescarga(video);

  if (window.videoEditorAPI?.descargarVideoMejorado) {
    const resultado = await window.videoEditorAPI.descargarVideoMejorado({
      video,
      audioMejorado,
      nombreArchivo
    });

    if (!resultado?.ok) {
      return {
        ok: false,
        mensaje: resultado?.mensaje || "No se pudo descargar el video."
      };
    }

    return {
      ok: true,
      mensaje: "Video descargado."
    };
  }

  const urlDescarga = audioMejorado?.url || video.url;

  if (!urlDescarga) {
    return {
      ok: false,
      mensaje: "No existe archivo para descargar."
    };
  }

  descargarConEnlace(urlDescarga, nombreArchivo);

  return {
    ok: true,
    mensaje: "Descarga iniciada."
  };
}
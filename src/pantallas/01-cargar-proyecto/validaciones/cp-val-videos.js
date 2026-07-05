/* =========================================================
Nombre completo: cp-val-videos.js
Ruta o ubicación: /src/pantallas/01-cargar-proyecto/validaciones/cp-val-videos.js
Funciones principales:
- Validar datos básicos de videos cargados.
- Verificar formatos permitidos.
- Verificar que los archivos sigan existiendo.
- Devolver errores simples para el usuario.
========================================================= */

import { esExtensionVideoValida } from "../../../utils/video-utils.js";

export function validarVideoBasico(video) {
  const errores = [];

  if (!video || typeof video !== "object") {
    return {
      ok: false,
      errores: ["Video no válido."]
    };
  }

  if (!video.id) {
    errores.push("Video sin identificador.");
  }

  if (!video.nombre) {
    errores.push("Video sin nombre.");
  }

  if (!video.ruta) {
    errores.push(`Ruta faltante: ${video.nombre || "video"}.`);
  }

  if (!video.url) {
    errores.push(`URL faltante: ${video.nombre || "video"}.`);
  }

  if (!esExtensionVideoValida(video.extension)) {
    errores.push(`Formato no compatible: ${video.nombre || "video"}.`);
  }

  return {
    ok: errores.length === 0,
    errores
  };
}

export function validarVideosBasicos(videos) {
  const errores = [];

  if (!Array.isArray(videos) || videos.length === 0) {
    return {
      ok: false,
      errores: ["Carga al menos un video."]
    };
  }

  videos.forEach((video) => {
    const resultado = validarVideoBasico(video);

    if (!resultado.ok) {
      errores.push(...resultado.errores);
    }
  });

  return {
    ok: errores.length === 0,
    errores
  };
}

export async function validarArchivoExiste(video) {
  if (!video?.ruta) {
    return {
      ok: false,
      mensaje: `No existe ruta para ${video?.nombre || "video"}.`
    };
  }

  if (!window.videoEditorAPI?.verificarArchivo) {
    return {
      ok: false,
      mensaje: "No se puede verificar el archivo."
    };
  }

  const resultado = await window.videoEditorAPI.verificarArchivo(video.ruta);

  if (!resultado.ok || !resultado.existe) {
    return {
      ok: false,
      mensaje: `No se encontró el archivo: ${video.nombre || "video"}.`
    };
  }

  return {
    ok: true,
    mensaje: ""
  };
}

export async function validarArchivosExisten(videos) {
  const errores = [];

  if (!Array.isArray(videos) || videos.length === 0) {
    return {
      ok: false,
      errores: ["Carga al menos un video."]
    };
  }

  for (const video of videos) {
    const resultado = await validarArchivoExiste(video);

    if (!resultado.ok) {
      errores.push(resultado.mensaje);
    }
  }

  return {
    ok: errores.length === 0,
    errores
  };
}
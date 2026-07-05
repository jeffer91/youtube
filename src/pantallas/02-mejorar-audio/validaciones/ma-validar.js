/* =========================================================
Nombre completo: ma-validar.js
Ruta o ubicación: /src/pantallas/02-mejorar-audio/validaciones/ma-validar.js
Funciones principales:
- Validar que exista un proyecto con videos.
- Validar video seleccionado.
- Validar controles de audio inteligente.
- Validar que exista audio mejorado antes de guardar capa.
- Devolver errores claros para el usuario.
Con qué se conecta:
- ma.js
- ma-service.js
- ma-data.js
========================================================= */

import {
  limpiarNivelMA
} from "../data/ma-data.js";

function crearError(mensaje) {
  return {
    ok: false,
    errores: [mensaje]
  };
}

function videoTieneRuta(video) {
  return Boolean(video?.ruta || video?.url);
}

function videoTieneAudioMejorado(video) {
  return Boolean(video?.audioMejorado?.ruta || video?.audioMejorado?.url);
}

export function validarProyectoAudio(proyecto) {
  if (!proyecto || typeof proyecto !== "object") {
    return crearError("Primero debes crear o cargar un proyecto.");
  }

  if (!Array.isArray(proyecto.videos) || proyecto.videos.length === 0) {
    return crearError("Este proyecto no tiene videos para mejorar audio.");
  }

  const videosValidos = proyecto.videos.filter(videoTieneRuta);

  if (!videosValidos.length) {
    return crearError("Los videos del proyecto no tienen rutas válidas.");
  }

  return {
    ok: true,
    errores: [],
    proyecto
  };
}

export function validarVideoSeleccionado(videos, videoActualId) {
  if (!Array.isArray(videos) || videos.length === 0) {
    return {
      ok: false,
      errores: ["No hay videos disponibles."],
      video: null
    };
  }

  if (!videoActualId) {
    return {
      ok: false,
      errores: ["Selecciona un video."],
      video: null
    };
  }

  const video = videos.find((item) => item.id === videoActualId) || null;

  if (!video) {
    return {
      ok: false,
      errores: ["No se encontró el video seleccionado."],
      video: null
    };
  }

  if (!videoTieneRuta(video)) {
    return {
      ok: false,
      errores: ["El video seleccionado no tiene una ruta válida."],
      video: null
    };
  }

  return {
    ok: true,
    errores: [],
    video
  };
}

export function validarControlesAudio(controles) {
  if (!controles || typeof controles !== "object") {
    return crearError("No se encontraron controles de audio.");
  }

  const controlesRequeridos = [
    "reducirRuido",
    "mejorarVoz",
    "nivelarVolumen"
  ];

  const faltantes = controlesRequeridos.filter((controlId) => {
    return !controles[controlId] || typeof controles[controlId] !== "object";
  });

  if (faltantes.length) {
    return crearError("Faltan controles de audio para procesar el video.");
  }

  const activos = controlesRequeridos.filter((controlId) => {
    return Boolean(controles[controlId]?.activo);
  });

  if (!activos.length) {
    return crearError("Activa al menos una mejora de audio.");
  }

  const nivelesInvalidos = controlesRequeridos.filter((controlId) => {
    const nivel = controles[controlId]?.nivel;
    return limpiarNivelMA(nivel) !== nivel;
  });

  if (nivelesInvalidos.length) {
    return crearError("Uno o más niveles de audio no son válidos.");
  }

  return {
    ok: true,
    errores: []
  };
}

export function validarGuardarCapaAudio({ videos, videoActualId }) {
  const validacionVideo = validarVideoSeleccionado(videos, videoActualId);

  if (!validacionVideo.ok) {
    return validacionVideo;
  }

  if (!videoTieneAudioMejorado(validacionVideo.video)) {
    return {
      ok: false,
      errores: ["Primero mejora el audio antes de guardar la capa."],
      video: validacionVideo.video
    };
  }

  return {
    ok: true,
    errores: [],
    video: validacionVideo.video
  };
}
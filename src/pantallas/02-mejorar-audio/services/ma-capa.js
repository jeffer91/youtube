/* =========================================================
Nombre completo: ma-capa.js
Ruta o ubicación: /src/pantallas/02-mejorar-audio/services/ma-capa.js
Funciones principales:
- Crear la capa de audio mejorado.
- Agregar o actualizar la capa en el proyecto.
- Mantener el video original intacto.
- Guardar relación entre video y audio mejorado.
========================================================= */

import { MA_CAPA_AUDIO } from "../data/ma-data.js";
import { videoTieneMejora } from "../helpers/ma-video.js";

function crearIdCapa(videoId) {
  return `${MA_CAPA_AUDIO.id}-${videoId}`;
}

export function crearCapaAudioMejorado(video) {
  if (!video || !videoTieneMejora(video)) {
    return null;
  }

  return {
    ...MA_CAPA_AUDIO,
    id: crearIdCapa(video.id),
    videoId: video.id,
    nombre: `Audio mejorado - ${video.nombre || "video"}`,
    activa: true,
    datos: {
      audioMejorado: video.audioMejorado,
      videoOriginal: {
        id: video.id,
        nombre: video.nombre,
        ruta: video.ruta,
        url: video.url
      }
    },
    creadoEn: new Date().toISOString(),
    actualizadoEn: new Date().toISOString()
  };
}

export function agregarOActualizarCapa(proyecto, capaNueva) {
  if (!proyecto || !capaNueva) {
    return proyecto;
  }

  const capas = Array.isArray(proyecto.capas) ? [...proyecto.capas] : [];
  const index = capas.findIndex((capa) => capa.id === capaNueva.id);

  if (index >= 0) {
    capas[index] = {
      ...capas[index],
      ...capaNueva,
      actualizadoEn: new Date().toISOString()
    };
  } else {
    capas.push(capaNueva);
  }

  return {
    ...proyecto,
    capas,
    actualizadoEn: new Date().toISOString()
  };
}

export function guardarCapaAudioEnProyecto({ proyecto, video }) {
  const capa = crearCapaAudioMejorado(video);

  if (!capa) {
    return {
      ok: false,
      proyecto,
      capa: null,
      mensaje: "Primero mejora el audio."
    };
  }

  const proyectoActualizado = agregarOActualizarCapa(proyecto, capa);

  return {
    ok: true,
    proyecto: proyectoActualizado,
    capa,
    mensaje: "Capa guardada."
  };
}

export function contarCapasAudioMejorado(proyecto) {
  if (!proyecto || !Array.isArray(proyecto.capas)) {
    return 0;
  }

  return proyecto.capas.filter((capa) => {
    return String(capa.id || "").startsWith(MA_CAPA_AUDIO.id);
  }).length;
}
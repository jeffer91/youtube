/* =========================================================
Nombre completo: tr-caso-transcribir.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/casos/tr-caso-transcribir.js
Funciones principales:
- Preparar la solicitud de transcripción.
- Validar video, opciones y API de Electron.
- Enviar la petición al adaptador de Electron.
- Devolver una respuesta simple para la pantalla.
Con qué se conecta:
- tr.js
- tr-selectores.js
- tr-validaciones.js
- tr-api-electron.js
========================================================= */

import {
  obtenerVideoSeleccionadoTR,
  obtenerOpcionesTR
} from "../estado/tr-selectores.js";

import { validarSolicitudTranscripcionTR } from "../dominio/tr-validaciones.js";

function crearPayloadTranscripcionTR({ estado, video, opciones }) {
  return {
    proyectoId: estado?.proyectoActivo?.id || "",
    proyectoNombre: estado?.proyectoActivo?.nombre || "",
    video: {
      id: video.id,
      nombre: video.nombre,
      ruta: video.ruta,
      url: video.url,
      duracionSegundos: video.duracionSegundos,
      duracionTexto: video.duracionTexto,
      audioMejorado: video.audioMejorado || null
    },
    opciones: {
      origenAudio: opciones.origenAudio || "original",
      idioma: opciones.idioma || "es",
      motor: opciones.motor || "whisper-local",
      calidad: opciones.calidad || "equilibrada",
      formatoSalida: opciones.formatoSalida || "txt-srt-vtt"
    }
  };
}

export async function ejecutarCasoTranscribirTR({ estado, apiElectron }) {
  const video = obtenerVideoSeleccionadoTR(estado);
  const opciones = obtenerOpcionesTR(estado);

  const validacion = validarSolicitudTranscripcionTR({
    video,
    opciones
  });

  if (!validacion.ok) {
    return {
      ok: false,
      mensaje: validacion.mensaje,
      resultado: null
    };
  }

  if (!apiElectron?.transcribirVideo) {
    return {
      ok: false,
      mensaje: "La conexión con Electron no está preparada para transcribir.",
      resultado: null
    };
  }

  const payload = crearPayloadTranscripcionTR({
    estado,
    video,
    opciones
  });

  const respuesta = await apiElectron.transcribirVideo(payload);

  if (!respuesta?.ok) {
    return {
      ok: false,
      mensaje: respuesta?.mensaje || "No se pudo transcribir el video.",
      resultado: null
    };
  }

  return {
    ok: true,
    mensaje: respuesta.mensaje || "Transcripción completada.",
    resultado: respuesta.resultado || null
  };
}
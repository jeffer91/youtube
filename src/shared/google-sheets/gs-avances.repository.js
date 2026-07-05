/* =========================================================
Nombre completo: gs-avances.repository.js
Ruta o ubicación: /src/shared/google-sheets/gs-avances.repository.js
Funciones principales:
- Guardar avances de pantallas en Google Sheets como base principal.
- Enviar audio mejorado, capas y transcripciones a Google Sheets.
- Usar PendientesSync real cuando Google Sheets no responde.
- No detener el flujo si el respaldo local ya fue actualizado.
Con qué se conecta:
- gs-registros.mapper.js
- gs-operaciones.factory.js
- ma-service.js
- tr-service.js
- electron/services/sync
========================================================= */

import {
  mapearAudioAGoogleSheetsGS,
  mapearTranscripcionAGoogleSheetsGS
} from "./gs-registros.mapper.js";

import {
  crearOperacionGoogleSheetsGS,
  crearOperacionPendienteSyncGS
} from "./gs-operaciones.factory.js";

function apiGoogleSheetsDisponibleGS() {
  return Boolean(window.videoEditorAPI?.enviarOperacionGoogleSheets);
}

function crearRespuestaNoDisponibleGS(operacion) {
  return {
    ok: false,
    mensaje: "Google Sheets no está disponible desde la app. El avance queda pendiente de sincronización.",
    pendienteSync: crearOperacionPendienteSyncGS({
      operacion,
      error: "API de Google Sheets no disponible."
    }),
    pendienteSyncGuardado: false
  };
}

async function enviarOperacionAvanceGS(operacion) {
  if (!apiGoogleSheetsDisponibleGS()) {
    return crearRespuestaNoDisponibleGS(operacion);
  }

  const resultado = await window.videoEditorAPI.enviarOperacionGoogleSheets(operacion);

  if (!resultado?.ok) {
    return {
      ok: false,
      mensaje: resultado?.mensaje || "No se pudo guardar el avance en Google Sheets.",
      detalle: resultado?.detalle || "",
      errores: resultado?.errores || [],
      pendienteSync: resultado?.pendienteSync || crearOperacionPendienteSyncGS({
        operacion,
        error: resultado?.mensaje || resultado?.detalle || "Error al enviar avance a Google Sheets."
      }),
      pendienteSyncGuardado: Boolean(resultado?.pendienteSyncGuardado)
    };
  }

  return {
    ok: true,
    mensaje: resultado.mensaje || "Avance guardado en Google Sheets.",
    respuesta: resultado,
    pendienteSync: null,
    pendienteSyncGuardado: false
  };
}

export async function guardarAudioMejoradoEnGoogleSheetsGS({ proyecto, video, capa }) {
  const audio = video?.audioMejorado || capa?.datos?.audioMejorado || null;
  const operacion = crearOperacionGoogleSheetsGS({
    tipo: "guardarAudioMejorado",
    entidad: "audio",
    prioridad: "ALTA",
    payload: {
      proyectoId: proyecto?.id || "",
      videoId: video?.id || "",
      audio: mapearAudioAGoogleSheetsGS({ proyecto, video, audio }),
      capa: capa || null,
      actualizadoEn: new Date().toISOString()
    }
  });

  return await enviarOperacionAvanceGS(operacion);
}

export async function guardarTranscripcionEnGoogleSheetsGS({ proyecto, video, transcripcion }) {
  const operacion = crearOperacionGoogleSheetsGS({
    tipo: "guardarTranscripcion",
    entidad: "transcripcion",
    prioridad: "ALTA",
    payload: {
      proyectoId: proyecto?.id || "",
      videoId: video?.id || "",
      transcripcion: mapearTranscripcionAGoogleSheetsGS({
        proyecto,
        video,
        transcripcion
      }),
      actualizadoEn: new Date().toISOString()
    }
  });

  return await enviarOperacionAvanceGS(operacion);
}

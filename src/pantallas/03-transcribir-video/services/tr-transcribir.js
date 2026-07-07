/* =========================================================
Nombre completo: tr-transcribir.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/services/tr-transcribir.js
Funciones principales:
- Ejecutar la transcripción según el motor automático seleccionado.
- Eliminar transcripción manual TXT/SRT del flujo.
- Llamar al motor real de Electron cuando exista Whisper local.
- Normalizar el resultado final de transcripción.
Con qué se conecta:
- tr-service.js
- tr-validar.js
- tr-json.js
========================================================= */

import {
  MOTOR_TRANSCRIPCION_DEFECTO_TR,
  MOTORES_TRANSCRIPCION_TR,
  validarAntesDeTranscribirTR
} from "../validaciones/tr-validar.js";

import {
  normalizarTranscripcionJsonTR
} from "../formatos/tr-json.js";

import {
  limpiarTextoTR
} from "../helpers/tr-texto.js";

function crearErrorTR(mensaje, extras = {}) {
  return {
    ok: false,
    transcripcion: null,
    mensaje,
    errores: [mensaje],
    ...extras
  };
}

function crearRespuestaOkTR(transcripcion, mensaje = "Transcripción lista.") {
  return {
    ok: true,
    transcripcion,
    mensaje,
    errores: []
  };
}

function obtenerAPITranscripcionTR() {
  if (window.videoEditorAPI?.transcribirVideo) {
    return window.videoEditorAPI;
  }

  return null;
}

function esMotorAutomaticoWhisperTR(motorId) {
  return [
    MOTORES_TRANSCRIPCION_TR.WHISPER_RAPIDO,
    MOTORES_TRANSCRIPCION_TR.WHISPER_EQUILIBRADO,
    MOTORES_TRANSCRIPCION_TR.WHISPER_PRECISO
  ].includes(motorId);
}

async function transcribirWhisperAutomaticoTR({ video, idioma, motorId }) {
  const api = obtenerAPITranscripcionTR();

  if (!api) {
    return crearErrorTR(
      "No hay motor de transcripción configurado. Abre la app con Electron y verifica Whisper local."
    );
  }

  const resultado = await api.transcribirVideo({
    video,
    idioma: limpiarTextoTR(idioma) || "es",
    motor: motorId
  });

  if (!resultado?.ok) {
    return crearErrorTR(resultado?.mensaje || "No se pudo transcribir con Whisper local.", {
      errores: resultado?.errores || [resultado?.detalle || "Error desconocido."].filter(Boolean),
      diagnostico: resultado?.diagnostico || null
    });
  }

  const transcripcion = normalizarTranscripcionJsonTR(resultado.transcripcion, { video });
  return crearRespuestaOkTR(transcripcion, resultado.mensaje || "Transcripción automática terminada.");
}

export async function transcribirVideoTR({
  proyecto,
  video,
  motorId = MOTOR_TRANSCRIPCION_DEFECTO_TR,
  idioma = "es"
} = {}) {
  const validacion = validarAntesDeTranscribirTR({
    proyecto,
    video,
    motorId
  });

  if (!validacion.ok) {
    return crearErrorTR("No se puede iniciar la transcripción.", {
      errores: validacion.errores
    });
  }

  try {
    if (esMotorAutomaticoWhisperTR(motorId)) {
      return await transcribirWhisperAutomaticoTR({ video, idioma, motorId });
    }

    return crearErrorTR("El motor seleccionado no está disponible.");
  } catch (error) {
    return crearErrorTR(error?.message || "No se pudo completar la transcripción.");
  }
}

/* =========================================================
Nombre completo: tr-transcribir.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/services/tr-transcribir.js
Funciones principales:
- Ejecutar la transcripción según el motor seleccionado.
- Usar transcripción manual TXT o SRT para pruebas sin fingir IA.
- Llamar al motor real de Electron cuando exista Whisper local.
- Normalizar el resultado final de transcripción.
Con qué se conecta:
- tr-service.js
- tr-validar.js
- tr-txt.js
- tr-srt.js
- tr-json.js
========================================================= */

import {
  MOTORES_TRANSCRIPCION_TR,
  validarAntesDeTranscribirTR
} from "../validaciones/tr-validar.js";

import {
  leerTxtManualTR
} from "../formatos/tr-txt.js";

import {
  leerSrtManualTR
} from "../formatos/tr-srt.js";

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

function crearTranscripcionDesdeSrtTR({ lecturaSrt, video, idioma }) {
  return normalizarTranscripcionJsonTR({
    id: `tr-${video?.id || Date.now()}-${Date.now()}`,
    videoId: video?.id || "",
    idioma: limpiarTextoTR(idioma) || "es",
    motor: "manual-srt",
    modo: "manual",
    texto: lecturaSrt.texto,
    segmentos: lecturaSrt.segmentos,
    creadoEn: new Date().toISOString()
  }, { video });
}

async function transcribirManualTxtTR({ textoManual, video, idioma }) {
  const lectura = leerTxtManualTR(textoManual, {
    video,
    idioma
  });

  if (!lectura.ok) {
    return crearErrorTR("No se pudo leer la transcripción manual TXT.", {
      errores: lectura.errores
    });
  }

  const transcripcion = normalizarTranscripcionJsonTR(lectura.transcripcion, { video });
  return crearRespuestaOkTR(transcripcion, "Transcripción manual TXT cargada.");
}

async function transcribirManualSrtTR({ textoManual, video, idioma }) {
  const lectura = leerSrtManualTR(textoManual);

  if (!lectura.ok) {
    return crearErrorTR("No se pudo leer la transcripción manual SRT.", {
      errores: lectura.errores
    });
  }

  const transcripcion = crearTranscripcionDesdeSrtTR({
    lecturaSrt: lectura,
    video,
    idioma
  });

  return crearRespuestaOkTR(transcripcion, "Transcripción manual SRT cargada.");
}

async function transcribirWhisperLocalTR({ video, idioma }) {
  const api = obtenerAPITranscripcionTR();

  if (!api) {
    return crearErrorTR(
      "No hay motor de transcripción configurado. Instala Whisper local o usa transcripción manual TXT/SRT."
    );
  }

  const resultado = await api.transcribirVideo({
    video,
    idioma: limpiarTextoTR(idioma) || "es",
    motor: MOTORES_TRANSCRIPCION_TR.WHISPER_LOCAL
  });

  if (!resultado?.ok) {
    return crearErrorTR(resultado?.mensaje || "No se pudo transcribir con Whisper local.", {
      errores: resultado?.errores || [resultado?.detalle || "Error desconocido."].filter(Boolean),
      diagnostico: resultado?.diagnostico || null
    });
  }

  const transcripcion = normalizarTranscripcionJsonTR(resultado.transcripcion, { video });
  return crearRespuestaOkTR(transcripcion, resultado.mensaje || "Transcripción real terminada.");
}

export async function transcribirVideoTR({
  proyecto,
  video,
  motorId = MOTORES_TRANSCRIPCION_TR.MANUAL_TXT,
  textoManual = "",
  idioma = "es"
} = {}) {
  const validacion = validarAntesDeTranscribirTR({
    proyecto,
    video,
    motorId,
    textoManual
  });

  if (!validacion.ok) {
    return crearErrorTR("No se puede iniciar la transcripción.", {
      errores: validacion.errores
    });
  }

  try {
    if (motorId === MOTORES_TRANSCRIPCION_TR.MANUAL_TXT) {
      return await transcribirManualTxtTR({ textoManual, video, idioma });
    }

    if (motorId === MOTORES_TRANSCRIPCION_TR.MANUAL_SRT) {
      return await transcribirManualSrtTR({ textoManual, video, idioma });
    }

    if (motorId === MOTORES_TRANSCRIPCION_TR.WHISPER_LOCAL) {
      return await transcribirWhisperLocalTR({ video, idioma });
    }

    return crearErrorTR("El motor seleccionado no está disponible.");
  } catch (error) {
    return crearErrorTR(error?.message || "No se pudo completar la transcripción.");
  }
}

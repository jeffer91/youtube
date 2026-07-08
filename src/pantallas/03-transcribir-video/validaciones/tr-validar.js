/* =========================================================
Nombre completo: tr-validar.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/validaciones/tr-validar.js
Funciones principales:
- Validar proyecto activo para transcripción.
- Validar video seleccionado.
- Validar dos motores automáticos de transcripción.
- Validar resultado de transcripción.
Con qué se conecta:
- tr-service.js
- tr-transcribir.js
- tr-guardar.js
========================================================= */

import {
  limpiarTextoTR,
  limpiarTextoVisibleTR
} from "../helpers/tr-texto.js";

export const MOTORES_TRANSCRIPCION_TR = Object.freeze({
  WHISPER_LOCAL: "whisper-local",
  WHISPER_PRECISO: "whisper-preciso",
  WHISPER_EQUILIBRADO_LEGACY: "whisper-equilibrado",
  WHISPER_RAPIDO_LEGACY: "whisper-rapido"
});

export const MOTOR_TRANSCRIPCION_DEFECTO_TR = MOTORES_TRANSCRIPCION_TR.WHISPER_LOCAL;

export function obtenerMotoresTranscripcionTR() {
  return [
    {
      id: MOTORES_TRANSCRIPCION_TR.WHISPER_LOCAL,
      numero: "Motor 1",
      nombre: "Whisper local",
      descripcion: "Motor recomendado para transcribir rápido con buena calidad.",
      detalle: "Usa el modelo base y prioriza el audio mejorado si existe.",
      modelo: "base",
      requiereElectron: true
    },
    {
      id: MOTORES_TRANSCRIPCION_TR.WHISPER_PRECISO,
      numero: "Motor 2",
      nombre: "Whisper preciso",
      descripcion: "Motor más lento, pero más útil para audios importantes.",
      detalle: "Usa el modelo small para mejorar precisión y segmentación.",
      modelo: "small",
      requiereElectron: true
    }
  ];
}

function normalizarMotorLegacyTR(motorId) {
  const id = limpiarTextoTR(motorId) || MOTOR_TRANSCRIPCION_DEFECTO_TR;

  if (id === MOTORES_TRANSCRIPCION_TR.WHISPER_EQUILIBRADO_LEGACY) {
    return MOTORES_TRANSCRIPCION_TR.WHISPER_LOCAL;
  }

  if (id === MOTORES_TRANSCRIPCION_TR.WHISPER_RAPIDO_LEGACY) {
    return MOTORES_TRANSCRIPCION_TR.WHISPER_LOCAL;
  }

  return id;
}

export function obtenerMotorTranscripcionTR(motorId) {
  const id = normalizarMotorLegacyTR(motorId);
  return obtenerMotoresTranscripcionTR().find((motor) => motor.id === id) || null;
}

export function validarProyectoTranscripcionTR(proyecto) {
  const errores = [];

  if (!proyecto || typeof proyecto !== "object") {
    errores.push("Primero carga un proyecto.");
  }

  if (proyecto && !Array.isArray(proyecto.videos)) {
    errores.push("El proyecto no tiene una lista válida de videos.");
  }

  if (Array.isArray(proyecto?.videos) && proyecto.videos.length === 0) {
    errores.push("El proyecto no tiene videos para transcribir.");
  }

  return {
    ok: errores.length === 0,
    errores
  };
}

export function validarVideoTranscripcionTR(video) {
  const errores = [];

  if (!video || typeof video !== "object") {
    errores.push("Selecciona un video para transcribir.");
  }

  if (video && !limpiarTextoTR(video.id)) {
    errores.push("El video seleccionado no tiene identificador.");
  }

  if (video && !limpiarTextoTR(video.ruta) && !limpiarTextoTR(video.url)) {
    errores.push("El video seleccionado no tiene una ruta válida.");
  }

  return {
    ok: errores.length === 0,
    errores
  };
}

export function validarMotorTranscripcionTR(motorId) {
  const motor = obtenerMotorTranscripcionTR(motorId);

  if (!motor) {
    return {
      ok: false,
      motor: null,
      errores: ["El motor de transcripción no es válido."]
    };
  }

  return {
    ok: true,
    motor,
    errores: []
  };
}

export function validarAntesDeTranscribirTR({ proyecto, video, motorId }) {
  const errores = [];
  const proyectoValidado = validarProyectoTranscripcionTR(proyecto);
  const videoValidado = validarVideoTranscripcionTR(video);
  const motorValidado = validarMotorTranscripcionTR(motorId);

  if (!proyectoValidado.ok) {
    errores.push(...proyectoValidado.errores);
  }

  if (!videoValidado.ok) {
    errores.push(...videoValidado.errores);
  }

  if (!motorValidado.ok) {
    errores.push(...motorValidado.errores);
  }

  return {
    ok: errores.length === 0,
    motor: motorValidado.motor,
    errores
  };
}

export function validarResultadoTranscripcionTR(transcripcion) {
  const errores = [];

  if (!transcripcion || typeof transcripcion !== "object") {
    errores.push("No existe una transcripción para guardar.");
  }

  if (transcripcion && !limpiarTextoVisibleTR(transcripcion.texto)) {
    errores.push("La transcripción no tiene texto.");
  }

  if (transcripcion && !Array.isArray(transcripcion.segmentos)) {
    errores.push("La transcripción no tiene segmentos válidos.");
  }

  return {
    ok: errores.length === 0,
    errores
  };
}

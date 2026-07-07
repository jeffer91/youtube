/* =========================================================
Nombre completo: tr-validar.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/validaciones/tr-validar.js
Funciones principales:
- Validar proyecto activo para transcripción.
- Validar video seleccionado.
- Validar motores automáticos de transcripción.
- Validar resultado de transcripción.
- Eliminar opciones manuales TXT/SRT del flujo visible.
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
  WHISPER_RAPIDO: "whisper-rapido",
  WHISPER_EQUILIBRADO: "whisper-equilibrado",
  WHISPER_PRECISO: "whisper-preciso"
});

export const MOTOR_TRANSCRIPCION_DEFECTO_TR = MOTORES_TRANSCRIPCION_TR.WHISPER_EQUILIBRADO;

export function obtenerMotoresTranscripcionTR() {
  return [
    {
      id: MOTORES_TRANSCRIPCION_TR.WHISPER_RAPIDO,
      nombre: "Whisper rápido",
      descripcion: "Transcripción automática más ligera para pruebas rápidas.",
      modelo: "tiny",
      requiereTextoManual: false,
      requiereElectron: true
    },
    {
      id: MOTORES_TRANSCRIPCION_TR.WHISPER_EQUILIBRADO,
      nombre: "Whisper equilibrado",
      descripcion: "Transcripción automática recomendada por velocidad y calidad.",
      modelo: "base",
      requiereTextoManual: false,
      requiereElectron: true
    },
    {
      id: MOTORES_TRANSCRIPCION_TR.WHISPER_PRECISO,
      nombre: "Whisper preciso",
      descripcion: "Transcripción automática con mayor precisión para audios importantes.",
      modelo: "small",
      requiereTextoManual: false,
      requiereElectron: true
    }
  ];
}

export function obtenerMotorTranscripcionTR(motorId) {
  const id = limpiarTextoTR(motorId) || MOTOR_TRANSCRIPCION_DEFECTO_TR;
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

export function validarTextoManualTranscripcionTR() {
  return {
    ok: true,
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

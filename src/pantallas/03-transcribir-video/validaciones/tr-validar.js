/* =========================================================
Nombre completo: tr-validar.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/validaciones/tr-validar.js
Funciones principales:
- Validar proyecto activo para transcripción.
- Validar video seleccionado.
- Validar motor de transcripción.
- Validar texto manual y resultado de transcripción.
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
  MANUAL_TXT: "manual-txt",
  MANUAL_SRT: "manual-srt",
  WHISPER_LOCAL: "whisper-local"
});

export function obtenerMotoresTranscripcionTR() {
  return [
    {
      id: MOTORES_TRANSCRIPCION_TR.MANUAL_TXT,
      nombre: "Manual TXT",
      descripcion: "Pegar texto de transcripción para pruebas o correcciones rápidas.",
      requiereTextoManual: true,
      requiereElectron: false
    },
    {
      id: MOTORES_TRANSCRIPCION_TR.MANUAL_SRT,
      nombre: "Manual SRT",
      descripcion: "Pegar subtítulos SRT con tiempos.",
      requiereTextoManual: true,
      requiereElectron: false
    },
    {
      id: MOTORES_TRANSCRIPCION_TR.WHISPER_LOCAL,
      nombre: "Whisper local",
      descripcion: "Transcripción real desde Electron cuando el motor esté instalado.",
      requiereTextoManual: false,
      requiereElectron: true
    }
  ];
}

export function obtenerMotorTranscripcionTR(motorId) {
  const id = limpiarTextoTR(motorId) || MOTORES_TRANSCRIPCION_TR.MANUAL_TXT;
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

export function validarTextoManualTranscripcionTR({ motorId, textoManual }) {
  const motor = obtenerMotorTranscripcionTR(motorId);
  const texto = limpiarTextoVisibleTR(textoManual);

  if (!motor?.requiereTextoManual) {
    return {
      ok: true,
      errores: []
    };
  }

  if (!texto) {
    return {
      ok: false,
      errores: ["Pega una transcripción manual antes de continuar."]
    };
  }

  if (texto.length < 3) {
    return {
      ok: false,
      errores: ["La transcripción manual es demasiado corta."]
    };
  }

  if (motor.id === MOTORES_TRANSCRIPCION_TR.MANUAL_SRT && !texto.includes("-->")) {
    return {
      ok: false,
      errores: ["El contenido SRT debe incluir tiempos con -->."]
    };
  }

  return {
    ok: true,
    errores: []
  };
}

export function validarAntesDeTranscribirTR({ proyecto, video, motorId, textoManual }) {
  const errores = [];
  const proyectoValidado = validarProyectoTranscripcionTR(proyecto);
  const videoValidado = validarVideoTranscripcionTR(video);
  const motorValidado = validarMotorTranscripcionTR(motorId);
  const textoValidado = validarTextoManualTranscripcionTR({ motorId, textoManual });

  if (!proyectoValidado.ok) {
    errores.push(...proyectoValidado.errores);
  }

  if (!videoValidado.ok) {
    errores.push(...videoValidado.errores);
  }

  if (!motorValidado.ok) {
    errores.push(...motorValidado.errores);
  }

  if (!textoValidado.ok) {
    errores.push(...textoValidado.errores);
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

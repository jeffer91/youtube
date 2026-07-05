/* =========================================================
Nombre completo: tr-estado.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/estado/tr-estado.js
Funciones principales:
- Crear el estado local de la pantalla Transcribir video.
- Guardar video seleccionado, opciones, progreso, resultado y mensajes.
- Actualizar el estado sin mezclar lógica visual.
- Mantener datos simples para que otros módulos los usen.
Con qué se conecta:
- tr.js
- tr-selectores.js
- tr-ui-layout.js
========================================================= */

const OPCIONES_DEFECTO_TR = {
  origenAudio: "original",
  idioma: "es",
  motor: "whisper-local",
  calidad: "equilibrada",
  formatoSalida: "txt-srt-vtt"
};

const PROGRESO_DEFECTO_TR = {
  porcentaje: 0,
  estado: "pendiente",
  texto: "Todavía no se ha iniciado la transcripción."
};

function clonarTR(valor) {
  return JSON.parse(JSON.stringify(valor || null));
}

function normalizarVideoTR(video, index) {
  const fuente = video && typeof video === "object" ? video : {};

  return {
    ...fuente,
    id: fuente.id || `video-${index + 1}`,
    nombre: fuente.nombre || `Video ${index + 1}`,
    ruta: fuente.ruta || "",
    url: fuente.url || "",
    extension: fuente.extension || "",
    pesoBytes: fuente.pesoBytes || 0,
    duracionSegundos: fuente.duracionSegundos || 0,
    duracionTexto: fuente.duracionTexto || "00:00",
    orden: fuente.orden || index + 1,
    miniatura: fuente.miniatura || "",
    audioMejorado: fuente.audioMejorado || null,
    transcripcion: fuente.transcripcion || null
  };
}

function obtenerVideosInicialesTR(proyectoActivo) {
  if (!Array.isArray(proyectoActivo?.videos)) {
    return [];
  }

  return proyectoActivo.videos.map(normalizarVideoTR);
}

function obtenerPrimerVideoIdTR(videos) {
  if (!Array.isArray(videos) || videos.length === 0) {
    return null;
  }

  return videos[0].id || null;
}

export function crearEstadoTranscripcion({ proyectoActivo } = {}) {
  const videos = obtenerVideosInicialesTR(proyectoActivo);

  return {
    proyectoActivo: clonarTR(proyectoActivo),
    videos,
    videoSeleccionadoId: obtenerPrimerVideoIdTR(videos),
    opciones: {
      ...OPCIONES_DEFECTO_TR
    },
    progreso: {
      ...PROGRESO_DEFECTO_TR
    },
    resultado: null,
    mensajes: [],
    errores: [],
    procesando: false
  };
}

export function actualizarVideoSeleccionadoTR(estado, videoId) {
  return {
    ...estado,
    videoSeleccionadoId: videoId || null,
    resultado: null,
    progreso: {
      ...PROGRESO_DEFECTO_TR
    }
  };
}

export function actualizarOpcionesTR(estado, opcionesParciales = {}) {
  return {
    ...estado,
    opciones: {
      ...(estado?.opciones || OPCIONES_DEFECTO_TR),
      ...opcionesParciales
    }
  };
}

export function actualizarProgresoTR(estado, progresoParcial = {}) {
  return {
    ...estado,
    progreso: {
      ...(estado?.progreso || PROGRESO_DEFECTO_TR),
      ...progresoParcial
    }
  };
}

export function establecerProcesandoTR(estado, procesando) {
  return {
    ...estado,
    procesando: Boolean(procesando)
  };
}

export function establecerResultadoTR(estado, resultado) {
  return {
    ...estado,
    resultado: resultado || null,
    procesando: false,
    progreso: {
      porcentaje: 100,
      estado: "completado",
      texto: "Transcripción completada."
    }
  };
}

export function limpiarMensajesTR(estado) {
  return {
    ...estado,
    mensajes: [],
    errores: []
  };
}

export function agregarMensajeTR(estado, mensaje) {
  const mensajes = Array.isArray(estado?.mensajes) ? estado.mensajes : [];

  return {
    ...estado,
    mensajes: [...mensajes, String(mensaje || "").trim()].filter(Boolean)
  };
}

export function agregarErrorTR(estado, error) {
  const errores = Array.isArray(estado?.errores) ? estado.errores : [];

  return {
    ...estado,
    errores: [...errores, String(error || "").trim()].filter(Boolean)
  };
}
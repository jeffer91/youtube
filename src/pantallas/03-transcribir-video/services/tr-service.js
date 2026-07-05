/* =========================================================
Nombre completo: tr-service.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/services/tr-service.js
Funciones principales:
- Mantener el estado interno de la pantalla Transcribir video.
- Seleccionar video, motor, idioma y texto manual.
- Ejecutar transcripción sin fingir resultados.
- Guardar transcripción en el proyecto activo.
- Preparar exportaciones TXT, SRT y JSON.
Con qué se conecta:
- tr.js
- tr-transcribir.js
- tr-guardar.js
- tr-exportar.js
- tr-proyecto-adapter.js
========================================================= */

import {
  adaptarProyectoParaTranscripcionTR
} from "../adaptadores/tr-proyecto-adapter.js";

import {
  MOTORES_TRANSCRIPCION_TR,
  obtenerMotoresTranscripcionTR,
  validarProyectoTranscripcionTR,
  validarVideoTranscripcionTR,
  validarResultadoTranscripcionTR
} from "../validaciones/tr-validar.js";

import {
  transcribirVideoTR
} from "./tr-transcribir.js";

import {
  guardarTranscripcionEnProyectoTR,
  obtenerTranscripcionVideoTR
} from "./tr-guardar.js";

import {
  prepararExportacionTranscripcionTR,
  obtenerFormatosExportacionTR
} from "./tr-exportar.js";

const PASOS_TR = Object.freeze([
  {
    id: "seleccionar",
    numero: "01",
    titulo: "Seleccionar video",
    descripcion: "Elige el video que quieres transcribir."
  },
  {
    id: "configurar",
    numero: "02",
    titulo: "Configurar motor",
    descripcion: "Usa Whisper local o transcripción manual."
  },
  {
    id: "transcribir",
    numero: "03",
    titulo: "Transcribir",
    descripcion: "Genera texto y segmentos."
  },
  {
    id: "guardar",
    numero: "04",
    titulo: "Guardar",
    descripcion: "Guarda y prepara subtítulos."
  }
]);

function clonarTR(valor) {
  return JSON.parse(JSON.stringify(valor || null));
}

function crearListaVideosTR(proyecto) {
  if (!proyecto || !Array.isArray(proyecto.videos)) {
    return [];
  }

  return proyecto.videos.map((video, index) => ({
    ...video,
    orden: video.orden || index + 1
  }));
}

function obtenerPrimerVideoIdTR(videos) {
  return Array.isArray(videos) && videos.length ? videos[0].id : "";
}

function obtenerVideoPorIdTR(videos, videoId) {
  if (!Array.isArray(videos)) {
    return null;
  }

  return videos.find((video) => video.id === videoId) || videos[0] || null;
}

function crearEstadoInicialTR({ proyectoActivo }) {
  const adaptado = adaptarProyectoParaTranscripcionTR(proyectoActivo);
  const proyecto = adaptado.ok ? adaptado.proyecto : null;
  const videos = crearListaVideosTR(proyecto);
  const videoActualId = obtenerPrimerVideoIdTR(videos);
  const videoActual = obtenerVideoPorIdTR(videos, videoActualId);
  const transcripcionActual = obtenerTranscripcionVideoTR(videoActual);

  return {
    proyecto,
    proyectoValido: adaptado.ok,
    pasos: PASOS_TR,
    pasoActual: "seleccionar",
    videos,
    videoActualId,
    idioma: "es",
    motorId: MOTORES_TRANSCRIPCION_TR.MANUAL_TXT,
    motores: obtenerMotoresTranscripcionTR(),
    formatosExportacion: obtenerFormatosExportacionTR(),
    textoManual: "",
    transcripcionActual,
    exportacionActual: null,
    procesando: false,
    guardando: false,
    exportando: false,
    progreso: 0,
    estadoProceso: adaptado.ok ? "Listo para transcribir." : adaptado.mensaje,
    mensajes: adaptado.ok ? [] : [],
    errores: adaptado.ok ? [] : [adaptado.mensaje]
  };
}

function calcularPasoDespuesDeTranscripcionTR(transcripcion) {
  return transcripcion ? "guardar" : "configurar";
}

export function crearTranscripcionService({ proyectoActivo, estadoApp } = {}) {
  let estado = crearEstadoInicialTR({ proyectoActivo });
  const listeners = new Set();

  function notificar() {
    const copia = obtenerEstado();

    listeners.forEach((listener) => {
      if (typeof listener === "function") {
        listener(copia);
      }
    });
  }

  function obtenerEstado() {
    return clonarTR(estado);
  }

  function actualizar(cambios = {}) {
    estado = {
      ...estado,
      ...cambios
    };

    notificar();
    return obtenerEstado();
  }

  function limpiarMensajes() {
    return actualizar({
      mensajes: [],
      errores: []
    });
  }

  function obtenerVideoActual() {
    return obtenerVideoPorIdTR(estado.videos, estado.videoActualId);
  }

  function cambiarPaso(pasoId) {
    const existe = PASOS_TR.some((paso) => paso.id === pasoId);

    if (!existe) {
      return obtenerEstado();
    }

    return actualizar({
      pasoActual: pasoId,
      mensajes: [],
      errores: []
    });
  }

  function cambiarVideo(videoId) {
    const video = obtenerVideoPorIdTR(estado.videos, videoId);
    const validacion = validarVideoTranscripcionTR(video);

    if (!validacion.ok) {
      return actualizar({
        errores: validacion.errores,
        mensajes: []
      });
    }

    return actualizar({
      videoActualId: video.id,
      pasoActual: "configurar",
      transcripcionActual: obtenerTranscripcionVideoTR(video),
      exportacionActual: null,
      progreso: 0,
      estadoProceso: "Video seleccionado.",
      mensajes: ["Video seleccionado para transcripción."],
      errores: []
    });
  }

  function cambiarMotor(motorId) {
    const motorExiste = obtenerMotoresTranscripcionTR().some((motor) => motor.id === motorId);

    if (!motorExiste) {
      return actualizar({
        errores: ["El motor seleccionado no es válido."],
        mensajes: []
      });
    }

    return actualizar({
      motorId,
      pasoActual: "configurar",
      exportacionActual: null,
      estadoProceso: "Motor seleccionado.",
      mensajes: [],
      errores: []
    });
  }

  function cambiarIdioma(idioma) {
    return actualizar({
      idioma: String(idioma || "es").trim() || "es",
      mensajes: [],
      errores: []
    });
  }

  function cambiarTextoManual(textoManual) {
    return actualizar({
      textoManual: String(textoManual || ""),
      mensajes: [],
      errores: []
    });
  }

  async function transcribirActual() {
    const validacionProyecto = validarProyectoTranscripcionTR(estado.proyecto);
    const video = obtenerVideoActual();

    if (!validacionProyecto.ok) {
      return actualizar({
        errores: validacionProyecto.errores,
        mensajes: []
      });
    }

    actualizar({
      procesando: true,
      pasoActual: "transcribir",
      progreso: 15,
      estadoProceso: "Preparando transcripción...",
      mensajes: ["Iniciando transcripción."],
      errores: []
    });

    const resultado = await transcribirVideoTR({
      proyecto: estado.proyecto,
      video,
      motorId: estado.motorId,
      textoManual: estado.textoManual,
      idioma: estado.idioma
    });

    if (!resultado.ok) {
      return actualizar({
        procesando: false,
        progreso: 0,
        estadoProceso: resultado.mensaje || "No se pudo transcribir.",
        mensajes: [],
        errores: resultado.errores || [resultado.mensaje || "No se pudo transcribir."]
      });
    }

    return actualizar({
      procesando: false,
      pasoActual: calcularPasoDespuesDeTranscripcionTR(resultado.transcripcion),
      progreso: 100,
      transcripcionActual: resultado.transcripcion,
      exportacionActual: null,
      estadoProceso: resultado.mensaje || "Transcripción terminada.",
      mensajes: [resultado.mensaje || "Transcripción terminada."],
      errores: []
    });
  }

  function guardarActual() {
    const video = obtenerVideoActual();
    const validacion = validarResultadoTranscripcionTR(estado.transcripcionActual);

    if (!validacion.ok) {
      return actualizar({
        errores: validacion.errores,
        mensajes: []
      });
    }

    actualizar({
      guardando: true,
      mensajes: ["Guardando transcripción..."],
      errores: []
    });

    const resultado = guardarTranscripcionEnProyectoTR({
      proyecto: estado.proyecto,
      video,
      transcripcion: estado.transcripcionActual
    });

    if (!resultado.ok) {
      return actualizar({
        guardando: false,
        errores: resultado.errores,
        mensajes: []
      });
    }

    if (estadoApp?.establecerProyectoActivo) {
      estadoApp.establecerProyectoActivo(resultado.proyecto);
    }

    return actualizar({
      guardando: false,
      proyecto: resultado.proyecto,
      videos: crearListaVideosTR(resultado.proyecto),
      videoActualId: resultado.video.id,
      transcripcionActual: resultado.transcripcion,
      pasoActual: "guardar",
      estadoProceso: resultado.mensaje,
      mensajes: [resultado.mensaje],
      errores: []
    });
  }

  function prepararExportacion(formatoId = "txt") {
    const video = obtenerVideoActual();
    const resultado = prepararExportacionTranscripcionTR({
      formatoId,
      proyecto: estado.proyecto,
      video,
      transcripcion: estado.transcripcionActual
    });

    if (!resultado.ok) {
      return actualizar({
        exportacionActual: null,
        errores: resultado.errores,
        mensajes: []
      });
    }

    return actualizar({
      exportacionActual: resultado.exportacion,
      mensajes: [`Exportación ${resultado.exportacion.nombreFormato} preparada.`],
      errores: []
    });
  }

  function escuchar(listener) {
    if (typeof listener !== "function") {
      return () => {};
    }

    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }

  return {
    obtenerEstado,
    actualizar,
    limpiarMensajes,
    obtenerVideoActual,
    cambiarPaso,
    cambiarVideo,
    cambiarMotor,
    cambiarIdioma,
    cambiarTextoManual,
    transcribirActual,
    guardarActual,
    prepararExportacion,
    escuchar
  };
}

/* =========================================================
Nombre completo: tr-service.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/services/tr-service.js
Funciones principales:
- Mantener el estado interno de la pantalla Transcribir video.
- Seleccionar video, motor automático e idioma.
- Verificar Whisper local antes de usar transcripción real.
- Ejecutar transcripción automática sin opciones manuales TXT/SRT.
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
  MOTOR_TRANSCRIPCION_DEFECTO_TR,
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
    descripcion: "Usa uno de los motores automáticos de Whisper."
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
    motorId: MOTOR_TRANSCRIPCION_DEFECTO_TR,
    motores: obtenerMotoresTranscripcionTR(),
    formatosExportacion: obtenerFormatosExportacionTR(),
    textoManual: "",
    transcripcionActual,
    exportacionActual: null,
    whisperDisponible: null,
    ultimoDiagnosticoWhisper: null,
    procesando: false,
    guardando: false,
    exportando: false,
    verificandoWhisper: false,
    progreso: 0,
    estadoProceso: adaptado.ok ? "Listo para transcribir." : adaptado.mensaje,
    mensajes: adaptado.ok ? [] : [],
    errores: adaptado.ok ? [] : [adaptado.mensaje]
  };
}

function calcularPasoDespuesDeTranscripcionTR(transcripcion) {
  return transcripcion ? "guardar" : "configurar";
}

async function consultarWhisperElectronTR() {
  if (!window.videoEditorAPI?.verificarWhisperTranscripcion) {
    return {
      ok: false,
      disponible: false,
      mensaje: "La verificación de Whisper no está disponible. Abre la app con Electron usando npm start."
    };
  }

  return await window.videoEditorAPI.verificarWhisperTranscripcion();
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
      estadoProceso: "Motor automático seleccionado.",
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

  function cambiarTextoManual() {
    return obtenerEstado();
  }

  async function verificarWhisperActual() {
    actualizar({
      verificandoWhisper: true,
      mensajes: ["Verificando Whisper local..."],
      errores: []
    });

    try {
      const resultado = await consultarWhisperElectronTR();

      if (!resultado.ok) {
        return actualizar({
          verificandoWhisper: false,
          whisperDisponible: false,
          ultimoDiagnosticoWhisper: resultado,
          mensajes: [],
          errores: [resultado.mensaje || "Whisper local no está disponible."]
        });
      }

      return actualizar({
        verificandoWhisper: false,
        whisperDisponible: true,
        ultimoDiagnosticoWhisper: resultado,
        mensajes: [resultado.mensaje || "Whisper local está disponible."],
        errores: []
      });
    } catch (error) {
      return actualizar({
        verificandoWhisper: false,
        whisperDisponible: false,
        ultimoDiagnosticoWhisper: null,
        mensajes: [],
        errores: [error?.message || "No se pudo verificar Whisper local."]
      });
    }
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
      estadoProceso: "Preparando transcripción automática...",
      mensajes: ["Iniciando transcripción automática."],
      errores: []
    });

    const resultado = await transcribirVideoTR({
      proyecto: estado.proyecto,
      video,
      motorId: estado.motorId,
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
    verificarWhisperActual,
    transcribirActual,
    guardarActual,
    prepararExportacion,
    escuchar
  };
}

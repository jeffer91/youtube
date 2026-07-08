/* =========================================================
Nombre completo: tr-service.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/services/tr-service.js
Funciones principales:
- Mantener el estado interno de la pantalla Transcribir video.
- Seleccionar video, motor automático e idioma.
- Verificar Whisper local antes de usar transcripción real.
- Ejecutar transcripción automática con progreso visual por etapas.
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
    descripcion: "Elige uno de los dos motores automáticos."
  },
  {
    id: "transcribir",
    numero: "03",
    titulo: "Transcribir",
    descripcion: "Genera texto y bloques de tiempo."
  },
  {
    id: "guardar",
    numero: "04",
    titulo: "Guardar",
    descripcion: "Guarda y pasa a subtítulos."
  }
]);

const PROGRESO_AUTOMATICO_TR = Object.freeze([
  {
    progreso: 12,
    mensaje: "Preparando video y fuente de audio..."
  },
  {
    progreso: 24,
    mensaje: "Extrayendo audio limpio para transcripción..."
  },
  {
    progreso: 38,
    mensaje: "Iniciando motor de transcripción..."
  },
  {
    progreso: 52,
    mensaje: "Analizando voz y generando texto..."
  },
  {
    progreso: 68,
    mensaje: "Separando la transcripción por bloques de tiempo..."
  },
  {
    progreso: 82,
    mensaje: "Preparando segmentos y subtítulos..."
  },
  {
    progreso: 92,
    mensaje: "Revisando resultado final antes de mostrarlo..."
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

function existeTranscripcionTR(transcripcion) {
  return Boolean(transcripcion?.texto);
}

function crearEstadoInicialTR({ proyectoActivo }) {
  const adaptado = adaptarProyectoParaTranscripcionTR(proyectoActivo);
  const proyecto = adaptado.ok ? adaptado.proyecto : null;
  const videos = crearListaVideosTR(proyecto);
  const videoActualId = obtenerPrimerVideoIdTR(videos);
  const videoActual = obtenerVideoPorIdTR(videos, videoActualId);
  const transcripcionActual = obtenerTranscripcionVideoTR(videoActual);
  const tieneTranscripcion = existeTranscripcionTR(transcripcionActual);

  return {
    proyecto,
    proyectoValido: adaptado.ok,
    pasos: PASOS_TR,
    pasoActual: tieneTranscripcion ? "guardar" : "seleccionar",
    videos,
    videoActualId,
    idioma: "es",
    motorId: MOTOR_TRANSCRIPCION_DEFECTO_TR,
    motores: obtenerMotoresTranscripcionTR(),
    formatosExportacion: obtenerFormatosExportacionTR(),
    transcripcionActual,
    transcripcionGuardada: tieneTranscripcion,
    puedeAvanzarSubtitulos: tieneTranscripcion,
    exportacionActual: null,
    whisperDisponible: null,
    ultimoDiagnosticoWhisper: null,
    procesando: false,
    guardando: false,
    exportando: false,
    verificandoWhisper: false,
    progreso: tieneTranscripcion ? 100 : 0,
    estadoProceso: tieneTranscripcion
      ? "Transcripción guardada. Puedes pasar a subtítulos."
      : (adaptado.ok ? "Listo para transcribir." : adaptado.mensaje),
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
  let temporizadorProgreso = null;
  let indiceProgreso = 0;
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

  function detenerProgresoAutomatico() {
    if (temporizadorProgreso) {
      clearInterval(temporizadorProgreso);
      temporizadorProgreso = null;
    }

    indiceProgreso = 0;
  }

  function iniciarProgresoAutomatico() {
    detenerProgresoAutomatico();
    indiceProgreso = 0;

    temporizadorProgreso = setInterval(() => {
      if (!estado.procesando) {
        detenerProgresoAutomatico();
        return;
      }

      const etapa = PROGRESO_AUTOMATICO_TR[indiceProgreso];

      if (etapa) {
        indiceProgreso += 1;

        if (etapa.progreso > estado.progreso) {
          actualizar({
            progreso: etapa.progreso,
            estadoProceso: etapa.mensaje,
            mensajes: [etapa.mensaje],
            errores: []
          });
        }

        return;
      }

      const progresoSiguiente = Math.min(96, Math.max(estado.progreso + 1, estado.progreso));

      if (progresoSiguiente !== estado.progreso) {
        actualizar({
          progreso: progresoSiguiente,
          estadoProceso: "El motor sigue procesando. Esto puede tardar según el tamaño del video.",
          mensajes: ["Transcripción en proceso. No cierres la app."],
          errores: []
        });
      }
    }, 1300);
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

    const transcripcionVideo = obtenerTranscripcionVideoTR(video);
    const tieneTranscripcion = existeTranscripcionTR(transcripcionVideo);

    return actualizar({
      videoActualId: video.id,
      pasoActual: tieneTranscripcion ? "guardar" : "configurar",
      transcripcionActual: transcripcionVideo,
      transcripcionGuardada: tieneTranscripcion,
      puedeAvanzarSubtitulos: tieneTranscripcion,
      exportacionActual: null,
      progreso: tieneTranscripcion ? 100 : 0,
      estadoProceso: tieneTranscripcion ? "Este video ya tiene transcripción guardada." : "Video seleccionado.",
      mensajes: [tieneTranscripcion ? "Video con transcripción cargada." : "Video seleccionado para transcripción."],
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
      progreso: 8,
      transcripcionGuardada: false,
      puedeAvanzarSubtitulos: false,
      estadoProceso: "Preparando transcripción automática...",
      mensajes: ["Iniciando transcripción automática."],
      errores: []
    });

    iniciarProgresoAutomatico();

    try {
      const resultado = await transcribirVideoTR({
        proyecto: estado.proyecto,
        video,
        motorId: estado.motorId,
        idioma: estado.idioma
      });

      detenerProgresoAutomatico();

      if (!resultado.ok) {
        return actualizar({
          procesando: false,
          progreso: 0,
          transcripcionGuardada: false,
          puedeAvanzarSubtitulos: false,
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
        transcripcionGuardada: false,
        puedeAvanzarSubtitulos: true,
        exportacionActual: null,
        estadoProceso: resultado.mensaje || "Transcripción terminada.",
        mensajes: [resultado.mensaje || "Transcripción terminada."],
        errores: []
      });
    } catch (error) {
      detenerProgresoAutomatico();

      return actualizar({
        procesando: false,
        progreso: 0,
        transcripcionGuardada: false,
        puedeAvanzarSubtitulos: false,
        estadoProceso: "No se pudo completar la transcripción.",
        mensajes: [],
        errores: [error?.message || "No se pudo completar la transcripción."]
      });
    }
  }

  function guardarActual() {
    const video = obtenerVideoActual();
    const validacion = validarResultadoTranscripcionTR(estado.transcripcionActual);

    if (!validacion.ok) {
      return actualizar({
        errores: validacion.errores,
        mensajes: [],
        transcripcionGuardada: false
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
        transcripcionGuardada: false,
        puedeAvanzarSubtitulos: false,
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
      transcripcionGuardada: true,
      puedeAvanzarSubtitulos: true,
      pasoActual: "guardar",
      estadoProceso: "Transcripción guardada. Puedes pasar a subtítulos.",
      mensajes: [resultado.mensaje, "Ya puedes continuar a la pantalla de subtítulos."].filter(Boolean),
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
    verificarWhisperActual,
    transcribirActual,
    guardarActual,
    prepararExportacion,
    escuchar
  };
}

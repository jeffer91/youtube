/* =========================================================
Nombre completo: tr-service.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/services/tr-service.js
Funciones principales:
- Mantener el estado interno de la pantalla Transcribir video.
- Seleccionar video, motor automático e idioma.
- Verificar Whisper local antes de usar transcripción real.
- Transcribir automáticamente todos los videos cargados en lote.
- Guardar cada transcripción dentro del proyecto activo.
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
    titulo: "Videos",
    descripcion: "Revisa los videos cargados."
  },
  {
    id: "configurar",
    numero: "02",
    titulo: "Motor",
    descripcion: "Elige uno de los dos motores."
  },
  {
    id: "transcribir",
    numero: "03",
    titulo: "Transcribir lote",
    descripcion: "Genera texto para todos."
  },
  {
    id: "guardar",
    numero: "04",
    titulo: "Subtítulos",
    descripcion: "Continúa con subtítulos."
  }
]);

const PROGRESO_AUTOMATICO_TR = Object.freeze([
  {
    interno: 10,
    mensaje: "Preparando video y fuente de audio..."
  },
  {
    interno: 24,
    mensaje: "Extrayendo audio limpio para transcripción..."
  },
  {
    interno: 38,
    mensaje: "Iniciando motor de transcripción..."
  },
  {
    interno: 55,
    mensaje: "Analizando voz y generando texto..."
  },
  {
    interno: 72,
    mensaje: "Separando la transcripción por bloques de tiempo..."
  },
  {
    interno: 88,
    mensaje: "Preparando segmentos y subtítulos..."
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

function obtenerNombreVideoTR(video, indice = 0) {
  return String(video?.nombre || `Video ${indice + 1}`).trim() || `Video ${indice + 1}`;
}

function existeTranscripcionTR(transcripcion) {
  return Boolean(transcripcion?.texto);
}

function videoTieneTranscripcionTR(video) {
  return existeTranscripcionTR(obtenerTranscripcionVideoTR(video));
}

function todosVideosTranscritosTR(videos) {
  const lista = Array.isArray(videos) ? videos : [];

  if (!lista.length) {
    return false;
  }

  return lista.every((video) => videoTieneTranscripcionTR(video));
}

function contarVideosTranscritosTR(videos) {
  const lista = Array.isArray(videos) ? videos : [];
  return lista.filter((video) => videoTieneTranscripcionTR(video)).length;
}

function crearResultadoLoteVacioTR(videos = []) {
  const total = Array.isArray(videos) ? videos.length : 0;
  const transcritos = contarVideosTranscritosTR(videos);

  return {
    total,
    procesados: 0,
    exitosos: transcritos,
    fallidos: 0,
    pendientes: Math.max(total - transcritos, 0),
    actualIndice: 0,
    actualVideoId: "",
    actualNombre: "",
    errores: []
  };
}

function calcularProgresoLoteTR({ indice, total, interno }) {
  const totalSeguro = Math.max(1, Number(total) || 1);
  const indiceSeguro = Math.max(0, Number(indice) || 0);
  const internoSeguro = Math.max(0, Math.min(100, Number(interno) || 0));
  const progreso = ((indiceSeguro + (internoSeguro / 100)) / totalSeguro) * 100;

  return Math.max(1, Math.min(96, Math.round(progreso)));
}

function crearEstadoInicialTR({ proyectoActivo }) {
  const adaptado = adaptarProyectoParaTranscripcionTR(proyectoActivo);
  const proyecto = adaptado.ok ? adaptado.proyecto : null;
  const videos = crearListaVideosTR(proyecto);
  const videoActualId = obtenerPrimerVideoIdTR(videos);
  const videoActual = obtenerVideoPorIdTR(videos, videoActualId);
  const transcripcionActual = obtenerTranscripcionVideoTR(videoActual);
  const todosTranscritos = todosVideosTranscritosTR(videos);

  return {
    proyecto,
    proyectoValido: adaptado.ok,
    pasos: PASOS_TR,
    pasoActual: todosTranscritos ? "guardar" : "seleccionar",
    videos,
    videoActualId,
    idioma: "es",
    motorId: MOTOR_TRANSCRIPCION_DEFECTO_TR,
    motores: obtenerMotoresTranscripcionTR(),
    formatosExportacion: obtenerFormatosExportacionTR(),
    transcripcionActual,
    transcripcionGuardada: todosTranscritos,
    puedeAvanzarSubtitulos: todosTranscritos,
    exportacionActual: null,
    whisperDisponible: null,
    ultimoDiagnosticoWhisper: null,
    resultadoLoteTranscripcion: crearResultadoLoteVacioTR(videos),
    procesando: false,
    guardando: false,
    exportando: false,
    verificandoWhisper: false,
    progreso: todosTranscritos ? 100 : 0,
    estadoProceso: todosTranscritos
      ? "Todos los videos tienen transcripción. Puedes pasar a subtítulos."
      : (adaptado.ok ? "Listo para transcribir todos los videos cargados." : adaptado.mensaje),
    mensajes: adaptado.ok ? [] : [],
    errores: adaptado.ok ? [] : [adaptado.mensaje]
  };
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

  function sincronizarProyectoActivo(proyecto) {
    if (estadoApp?.establecerProyectoActivo) {
      estadoApp.establecerProyectoActivo(proyecto);
    }
  }

  function detenerProgresoAutomatico() {
    if (temporizadorProgreso) {
      clearInterval(temporizadorProgreso);
      temporizadorProgreso = null;
    }

    indiceProgreso = 0;
  }

  function iniciarProgresoAutomatico({ indice, total, nombre }) {
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

        const progreso = calcularProgresoLoteTR({
          indice,
          total,
          interno: etapa.interno
        });

        if (progreso > estado.progreso) {
          actualizar({
            progreso,
            estadoProceso: `${etapa.mensaje} ${nombre}`,
            mensajes: [`Procesando ${nombre}.`],
            errores: []
          });
        }

        return;
      }

      const limiteVideo = calcularProgresoLoteTR({
        indice,
        total,
        interno: 96
      });
      const progresoSiguiente = Math.min(limiteVideo, estado.progreso + 1);

      if (progresoSiguiente !== estado.progreso) {
        actualizar({
          progreso: progresoSiguiente,
          estadoProceso: `El motor sigue transcribiendo ${nombre}.`,
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
    const todosTranscritos = todosVideosTranscritosTR(estado.videos);

    return actualizar({
      videoActualId: video.id,
      pasoActual: todosTranscritos ? "guardar" : "configurar",
      transcripcionActual: transcripcionVideo,
      transcripcionGuardada: todosTranscritos,
      puedeAvanzarSubtitulos: todosTranscritos,
      exportacionActual: null,
      progreso: todosTranscritos ? 100 : estado.progreso,
      estadoProceso: transcripcionVideo ? "Este video ya tiene transcripción." : "Video seleccionado.",
      mensajes: [transcripcionVideo ? "Video con transcripción cargada." : "Video seleccionado para transcripción."],
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
    const videosIniciales = Array.isArray(estado.videos) ? estado.videos : [];
    const total = videosIniciales.length;

    if (!validacionProyecto.ok) {
      return actualizar({
        errores: validacionProyecto.errores,
        mensajes: []
      });
    }

    if (!total) {
      return actualizar({
        errores: ["No hay videos cargados para transcribir."],
        mensajes: []
      });
    }

    let proyectoTrabajo = estado.proyecto;
    let videosTrabajo = crearListaVideosTR(proyectoTrabajo);
    let ultimoVideoOk = null;
    let ultimaTranscripcionOk = null;
    const erroresLote = [];
    const resultadosLote = [];

    actualizar({
      procesando: true,
      pasoActual: "transcribir",
      progreso: 1,
      transcripcionGuardada: false,
      puedeAvanzarSubtitulos: false,
      resultadoLoteTranscripcion: {
        total,
        procesados: 0,
        exitosos: 0,
        fallidos: 0,
        pendientes: total,
        actualIndice: 0,
        actualVideoId: "",
        actualNombre: "",
        errores: []
      },
      estadoProceso: `Preparando transcripción automática para ${total} video(s).`,
      mensajes: [`Se transcribirán automáticamente ${total} video(s).`],
      errores: []
    });

    for (let indice = 0; indice < videosIniciales.length; indice += 1) {
      const video = videosIniciales[indice];
      const nombre = obtenerNombreVideoTR(video, indice);
      const progresoInicio = calcularProgresoLoteTR({ indice, total, interno: 4 });

      actualizar({
        videoActualId: video.id,
        transcripcionActual: obtenerTranscripcionVideoTR(video),
        progreso: Math.max(estado.progreso, progresoInicio),
        estadoProceso: `Transcribiendo ${indice + 1} de ${total}: ${nombre}`,
        mensajes: [`Transcribiendo ${indice + 1} de ${total}: ${nombre}`],
        resultadoLoteTranscripcion: {
          total,
          procesados: indice,
          exitosos: resultadosLote.filter((item) => item.ok).length,
          fallidos: resultadosLote.filter((item) => !item.ok).length,
          pendientes: Math.max(total - indice, 0),
          actualIndice: indice + 1,
          actualVideoId: video.id || "",
          actualNombre: nombre,
          errores: erroresLote
        },
        errores: []
      });

      iniciarProgresoAutomatico({ indice, total, nombre });

      try {
        const resultado = await transcribirVideoTR({
          proyecto: proyectoTrabajo,
          video,
          motorId: estado.motorId,
          idioma: estado.idioma
        });

        detenerProgresoAutomatico();

        if (!resultado.ok) {
          const mensaje = `${nombre}: ${resultado.mensaje || "No se pudo transcribir."}`;
          erroresLote.push(mensaje);
          resultadosLote.push({
            videoId: video.id || "",
            nombre,
            ok: false,
            mensaje
          });

          actualizar({
            progreso: calcularProgresoLoteTR({ indice, total, interno: 100 }),
            estadoProceso: `No se pudo transcribir ${nombre}. Continuando con el siguiente video.`,
            mensajes: [],
            errores: [mensaje],
            resultadoLoteTranscripcion: {
              total,
              procesados: indice + 1,
              exitosos: resultadosLote.filter((item) => item.ok).length,
              fallidos: resultadosLote.filter((item) => !item.ok).length,
              pendientes: Math.max(total - indice - 1, 0),
              actualIndice: indice + 1,
              actualVideoId: video.id || "",
              actualNombre: nombre,
              errores: erroresLote
            }
          });

          continue;
        }

        const guardado = guardarTranscripcionEnProyectoTR({
          proyecto: proyectoTrabajo,
          video,
          transcripcion: resultado.transcripcion
        });

        if (!guardado.ok) {
          const mensaje = `${nombre}: ${guardado.errores?.[0] || "No se pudo guardar la transcripción."}`;
          erroresLote.push(mensaje);
          resultadosLote.push({
            videoId: video.id || "",
            nombre,
            ok: false,
            mensaje
          });

          actualizar({
            estadoProceso: `La transcripción de ${nombre} se generó, pero no se pudo guardar.`,
            mensajes: [],
            errores: [mensaje]
          });

          continue;
        }

        proyectoTrabajo = guardado.proyecto;
        videosTrabajo = crearListaVideosTR(proyectoTrabajo);
        ultimoVideoOk = guardado.video;
        ultimaTranscripcionOk = guardado.transcripcion;
        resultadosLote.push({
          videoId: guardado.video.id || "",
          nombre,
          ok: true,
          mensaje: guardado.mensaje || "Transcripción guardada."
        });

        sincronizarProyectoActivo(proyectoTrabajo);

        actualizar({
          proyecto: proyectoTrabajo,
          videos: videosTrabajo,
          videoActualId: guardado.video.id,
          transcripcionActual: guardado.transcripcion,
          progreso: Math.min(100, Math.round(((indice + 1) / total) * 100)),
          estadoProceso: `Transcripción guardada para ${nombre}.`,
          mensajes: [`${nombre} transcrito correctamente.`],
          errores: erroresLote.length ? [...erroresLote] : [],
          resultadoLoteTranscripcion: {
            total,
            procesados: indice + 1,
            exitosos: resultadosLote.filter((item) => item.ok).length,
            fallidos: resultadosLote.filter((item) => !item.ok).length,
            pendientes: Math.max(total - indice - 1, 0),
            actualIndice: indice + 1,
            actualVideoId: guardado.video.id || "",
            actualNombre: nombre,
            errores: erroresLote
          }
        });
      } catch (error) {
        detenerProgresoAutomatico();

        const mensaje = `${nombre}: ${error?.message || "No se pudo completar la transcripción."}`;
        erroresLote.push(mensaje);
        resultadosLote.push({
          videoId: video.id || "",
          nombre,
          ok: false,
          mensaje
        });

        actualizar({
          estadoProceso: `Error al transcribir ${nombre}. Continuando con el siguiente video.`,
          mensajes: [],
          errores: [mensaje],
          resultadoLoteTranscripcion: {
            total,
            procesados: indice + 1,
            exitosos: resultadosLote.filter((item) => item.ok).length,
            fallidos: resultadosLote.filter((item) => !item.ok).length,
            pendientes: Math.max(total - indice - 1, 0),
            actualIndice: indice + 1,
            actualVideoId: video.id || "",
            actualNombre: nombre,
            errores: erroresLote
          }
        });
      }
    }

    detenerProgresoAutomatico();

    const exitosos = resultadosLote.filter((item) => item.ok).length;
    const fallidos = resultadosLote.filter((item) => !item.ok).length;
    const todosOk = exitosos === total && fallidos === 0;
    const puedeAvanzar = exitosos > 0 && todosVideosTranscritosTR(videosTrabajo);

    if (!exitosos) {
      return actualizar({
        procesando: false,
        pasoActual: "configurar",
        progreso: 0,
        transcripcionGuardada: false,
        puedeAvanzarSubtitulos: false,
        estadoProceso: "No se pudo transcribir ningún video.",
        mensajes: [],
        errores: erroresLote.length ? erroresLote : ["No se pudo transcribir ningún video."],
        resultadoLoteTranscripcion: {
          total,
          procesados: total,
          exitosos,
          fallidos,
          pendientes: 0,
          actualIndice: total,
          actualVideoId: "",
          actualNombre: "",
          errores: erroresLote
        }
      });
    }

    return actualizar({
      procesando: false,
      proyecto: proyectoTrabajo,
      videos: videosTrabajo,
      videoActualId: ultimoVideoOk?.id || estado.videoActualId,
      transcripcionActual: ultimaTranscripcionOk || estado.transcripcionActual,
      pasoActual: puedeAvanzar ? "guardar" : "transcribir",
      progreso: 100,
      transcripcionGuardada: puedeAvanzar,
      puedeAvanzarSubtitulos: puedeAvanzar,
      exportacionActual: null,
      estadoProceso: todosOk
        ? `Transcripción terminada para ${total} video(s). Puedes pasar a subtítulos.`
        : `Se transcribieron ${exitosos} de ${total} video(s). Revisa los pendientes antes de continuar.`,
      mensajes: [
        todosOk
          ? `Todos los videos fueron transcritos correctamente.`
          : `Se transcribieron ${exitosos} de ${total} video(s).`
      ],
      errores: erroresLote,
      resultadoLoteTranscripcion: {
        total,
        procesados: total,
        exitosos,
        fallidos,
        pendientes: Math.max(total - exitosos - fallidos, 0),
        actualIndice: total,
        actualVideoId: ultimoVideoOk?.id || "",
        actualNombre: ultimoVideoOk?.nombre || "",
        errores: erroresLote
      }
    });
  }

  function guardarActual() {
    const video = obtenerVideoActual();
    const validacion = validarResultadoTranscripcionTR(estado.transcripcionActual);

    if (!validacion.ok) {
      return actualizar({
        errores: validacion.errores,
        mensajes: [],
        transcripcionGuardada: todosVideosTranscritosTR(estado.videos),
        puedeAvanzarSubtitulos: todosVideosTranscritosTR(estado.videos)
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
        transcripcionGuardada: todosVideosTranscritosTR(estado.videos),
        puedeAvanzarSubtitulos: todosVideosTranscritosTR(estado.videos),
        errores: resultado.errores,
        mensajes: []
      });
    }

    const videosActualizados = crearListaVideosTR(resultado.proyecto);
    const todosTranscritos = todosVideosTranscritosTR(videosActualizados);

    sincronizarProyectoActivo(resultado.proyecto);

    return actualizar({
      guardando: false,
      proyecto: resultado.proyecto,
      videos: videosActualizados,
      videoActualId: resultado.video.id,
      transcripcionActual: resultado.transcripcion,
      transcripcionGuardada: todosTranscritos,
      puedeAvanzarSubtitulos: todosTranscritos,
      pasoActual: todosTranscritos ? "guardar" : "transcribir",
      estadoProceso: todosTranscritos
        ? "Todas las transcripciones están guardadas. Puedes pasar a subtítulos."
        : "Transcripción guardada. Aún faltan videos por transcribir.",
      mensajes: [resultado.mensaje].filter(Boolean),
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

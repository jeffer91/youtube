/* =========================================================
Nombre completo: ma-service.js
Ruta o ubicación: /src/pantallas/02-mejorar-audio/services/ma-service.js
Funciones principales:
- Mantener el estado interno de Mejorar audio.
- Cambiar páginas internas.
- Manejar perfiles inteligentes de audio.
- Mejorar audio de todos los videos cargados.
- Guardar en estado el video mejorado real.
- Guardar diagnóstico, modo usado y filtros usados.
- Comparar original y mejorado.
- Guardar capa y descargar video mejorado.
Con qué se conecta:
- ma-audio.js
- ma-lote.js
- ma-capa.js
- ma-descarga.js
- ma-data.js
- ma-comparar.js
- ma-pasos.js
========================================================= */

import {
  crearControlesSoloRuido,
  crearControlesPerfilAudio
} from "./ma-audio.js";

import {
  procesarLoteAudioVideos,
  crearProgresoLoteVacio
} from "./ma-lote.js";

import {
  obtenerPerfilInicialMA,
  obtenerPerfilAudioPorId,
  crearControlesInicialesMA
} from "../data/ma-data.js";

import { guardarCapaAudioEnProyecto } from "./ma-capa.js";
import { descargarVideoMejorado } from "./ma-descarga.js";

const PAGINAS_VALIDAS = ["controles", "comparar", "guardar"];
const MODOS_VALIDOS = ["original", "mejorado"];

function clonar(valor) {
  try {
    return JSON.parse(JSON.stringify(valor));
  } catch (error) {
    return valor;
  }
}

function crearListaVideos(proyectoActivo) {
  if (!proyectoActivo || !Array.isArray(proyectoActivo.videos)) {
    return [];
  }

  return proyectoActivo.videos.map((video, index) => ({
    ...video,
    orden: video.orden || index + 1
  }));
}

function obtenerPrimerVideoId(videos) {
  return Array.isArray(videos) && videos.length ? videos[0].id : "";
}

function obtenerVideoPorId(videos, videoId) {
  if (!Array.isArray(videos)) {
    return null;
  }

  return videos.find((video) => video.id === videoId) || videos[0] || null;
}

function videoTieneMejora(video) {
  return Boolean(video?.audioMejorado?.url || video?.audioMejorado?.ruta);
}

function obtenerPrimerVideoConMejora(videos) {
  if (!Array.isArray(videos)) {
    return null;
  }

  return videos.find((video) => videoTieneMejora(video)) || videos[0] || null;
}

function actualizarVideoEnLista(videos, videoActualizado) {
  if (!Array.isArray(videos)) {
    return [];
  }

  return videos.map((video) => {
    if (video.id !== videoActualizado.id) {
      return video;
    }

    return {
      ...video,
      ...videoActualizado
    };
  });
}

function actualizarVideoEnProyecto(proyecto, videoActualizado) {
  if (!proyecto || !Array.isArray(proyecto.videos)) {
    return proyecto;
  }

  return {
    ...proyecto,
    videos: actualizarVideoEnLista(proyecto.videos, videoActualizado),
    actualizadoEn: new Date().toISOString()
  };
}

function actualizarVideosEnProyecto(proyecto, videosActualizados) {
  if (!proyecto || !Array.isArray(videosActualizados)) {
    return proyecto;
  }

  return {
    ...proyecto,
    videos: videosActualizados,
    actualizadoEn: new Date().toISOString()
  };
}

function limpiarNivel(nivel) {
  const valor = String(nivel || "").trim();

  if (["bajo", "medio", "alto"].includes(valor)) {
    return valor;
  }

  return "medio";
}

function normalizarControl(control, respaldo = {}) {
  const fuente = control && typeof control === "object" ? control : {};

  return {
    activo: typeof fuente.activo === "boolean"
      ? fuente.activo
      : Boolean(respaldo.activo),
    nivel: limpiarNivel(fuente.nivel || respaldo.nivel || "medio")
  };
}

function normalizarControles(controles) {
  const controlesBase = crearControlesInicialesMA();
  const fuente = controles && typeof controles === "object" ? controles : controlesBase;

  return {
    reducirRuido: normalizarControl(fuente.reducirRuido, controlesBase.reducirRuido),
    mejorarVoz: normalizarControl(fuente.mejorarVoz, controlesBase.mejorarVoz),
    nivelarVolumen: normalizarControl(fuente.nivelarVolumen, controlesBase.nivelarVolumen)
  };
}

function crearEstadoInicial({ proyectoActivo }) {
  const videos = crearListaVideos(proyectoActivo);
  const perfilInicial = obtenerPerfilInicialMA();

  return {
    proyectoId: proyectoActivo?.id || "",
    paginaActual: "controles",
    videos,
    videoActualId: obtenerPrimerVideoId(videos),
    controles: normalizarControles(crearControlesPerfilAudio(perfilInicial)),
    perfilAudio: perfilInicial,
    modoComparacion: "mejorado",
    procesando: false,
    guardando: false,
    descargando: false,
    capaGuardada: false,
    resultadoActual: null,
    ultimoAnalisisAudio: null,
    ultimoDiagnosticoAudio: null,
    ultimaDecisionAudio: null,
    ultimasCapacidadesIA: null,
    ultimoModoProcesamiento: "",
    ultimosFiltrosUsados: [],
    ultimosErroresProcesamiento: [],
    progresoGlobal: crearProgresoLoteVacio(),
    resultadosLoteAudio: [],
    loteCompletado: false,
    loteConErrores: false,
    puedeAvanzarTranscripcion: false,
    mensajes: [],
    errores: []
  };
}

function crearMensajePerfil(perfilId) {
  const perfil = obtenerPerfilAudioPorId(perfilId);
  return `Perfil ${perfil.nombre} activado.`;
}

function crearResumenResultado(resultado) {
  return {
    audioMejorado: resultado?.audioMejorado || null,
    diagnostico: resultado?.diagnostico || null,
    decisionAudio: resultado?.decisionAudio || resultado?.audioMejorado?.decisionAudio || null,
    capacidadesIA: resultado?.capacidadesIA || resultado?.audioMejorado?.capacidadesIA || null,
    analisisAudio: resultado?.analisisAudio || resultado?.audioMejorado?.analisisAudio || null,
    erroresProcesamiento: resultado?.erroresProcesamiento || resultado?.audioMejorado?.erroresProcesamiento || []
  };
}

function crearResumenDesdeAudioMejorado(audioMejorado) {
  return crearResumenResultado({
    audioMejorado,
    diagnostico: null,
    decisionAudio: audioMejorado?.decisionAudio || null,
    capacidadesIA: audioMejorado?.capacidadesIA || null,
    analisisAudio: audioMejorado?.analisisAudio || null,
    erroresProcesamiento: audioMejorado?.erroresProcesamiento || []
  });
}

function crearMensajeMotor(audioMejorado) {
  const modo = audioMejorado?.modoProcesamiento || "";
  const decision = audioMejorado?.decisionAudio || {};
  const motor = decision?.motorAudio || "";

  if (modo === "principal" && motor === "ia") {
    return "Audio mejorado con IA + DSP usando filtro principal.";
  }

  if (modo === "principal" && motor === "extremo") {
    return "Audio mejorado con limpieza extrema usando filtro principal.";
  }

  if (modo === "principal") {
    return "Audio mejorado con DSP usando filtro principal.";
  }

  if (modo === "respaldo-dsp") {
    return "Audio mejorado con respaldo DSP.";
  }

  if (modo === "ultra-seguro") {
    return "Audio mejorado con modo ultra seguro.";
  }

  return "Audio mejorado correctamente.";
}

function crearMensajeLoteExitoso(resultadoLote) {
  if (!resultadoLote) {
    return "Audio mejorado correctamente en todos los videos.";
  }

  if (resultadoLote.total === 1) {
    return "Audio mejorado correctamente en 1 video.";
  }

  return `Audio mejorado correctamente en ${resultadoLote.total} videos.`;
}

function crearErroresLote(resultadoLote) {
  const errores = Array.isArray(resultadoLote?.errores) ? resultadoLote.errores : [];

  if (!errores.length) {
    return ["No se pudo completar la mejora de audio de todos los videos."];
  }

  return [
    "No se pudo completar la mejora de audio de todos los videos.",
    ...errores.slice(0, 4)
  ];
}

function validarVideoActual(estado) {
  const video = obtenerVideoPorId(estado.videos, estado.videoActualId);

  if (!video) {
    return {
      ok: false,
      video: null,
      errores: ["Selecciona un video antes de continuar."]
    };
  }

  if (!video.ruta && !video.url) {
    return {
      ok: false,
      video,
      errores: ["El video seleccionado no tiene una ruta válida."]
    };
  }

  return {
    ok: true,
    video,
    errores: []
  };
}

function validarVideosLote(estado) {
  const videos = Array.isArray(estado.videos) ? estado.videos : [];

  if (!videos.length) {
    return {
      ok: false,
      videos: [],
      errores: ["No hay videos cargados para mejorar audio."]
    };
  }

  const videosSinRuta = videos.filter((video) => !video?.ruta && !video?.url);

  if (videosSinRuta.length) {
    return {
      ok: false,
      videos,
      errores: [
        `Hay ${videosSinRuta.length} video(s) sin ruta válida. Vuelve a cargar el proyecto.`
      ]
    };
  }

  return {
    ok: true,
    videos,
    errores: []
  };
}

function validarControles(estado) {
  const controles = normalizarControles(estado.controles);
  const hayActivo = Object.values(controles).some((control) => control.activo);

  if (!hayActivo) {
    return {
      ok: false,
      controles,
      errores: ["Activa al menos una mejora de audio."]
    };
  }

  return {
    ok: true,
    controles,
    errores: []
  };
}

function validarGuardarCapa(estado) {
  const video = obtenerVideoPorId(estado.videos, estado.videoActualId);

  if (!video) {
    return {
      ok: false,
      video: null,
      errores: ["Selecciona un video antes de guardar la capa."]
    };
  }

  if (!videoTieneMejora(video)) {
    return {
      ok: false,
      video,
      errores: ["Primero mejora el audio."]
    };
  }

  return {
    ok: true,
    video,
    errores: []
  };
}

function obtenerSiguientePagina(paginaActual) {
  const index = PAGINAS_VALIDAS.indexOf(paginaActual);

  if (index < 0) {
    return PAGINAS_VALIDAS[0];
  }

  return PAGINAS_VALIDAS[Math.min(index + 1, PAGINAS_VALIDAS.length - 1)];
}

function obtenerPaginaAnterior(paginaActual) {
  const index = PAGINAS_VALIDAS.indexOf(paginaActual);

  if (index < 0) {
    return PAGINAS_VALIDAS[0];
  }

  return PAGINAS_VALIDAS[Math.max(index - 1, 0)];
}

function obtenerMensajeProgreso(progreso) {
  if (!progreso?.mensaje) {
    return "Mejorando audio de todos los videos...";
  }

  return progreso.mensaje;
}

function obtenerEstadoDiagnosticoDesdeVideo(video) {
  const resumen = crearResumenDesdeAudioMejorado(video?.audioMejorado || null);

  return {
    resultadoActual: resumen.audioMejorado,
    ultimoAnalisisAudio: resumen.analisisAudio,
    ultimoDiagnosticoAudio: resumen.diagnostico,
    ultimaDecisionAudio: resumen.decisionAudio,
    ultimasCapacidadesIA: resumen.capacidadesIA,
    ultimoModoProcesamiento: resumen.audioMejorado?.modoProcesamiento || "",
    ultimosFiltrosUsados: resumen.audioMejorado?.filtrosAudio || [],
    ultimosErroresProcesamiento: resumen.erroresProcesamiento
  };
}

export function crearMejorarAudioService({ proyectoActivo, estadoApp }) {
  let proyecto = proyectoActivo;
  let estado = crearEstadoInicial({ proyectoActivo: proyecto });
  const listeners = new Set();

  function notificar() {
    listeners.forEach((listener) => {
      try {
        listener(clonar(estado));
      } catch (error) {
        console.error("Error en listener de Mejorar audio:", error);
      }
    });
  }

  function obtenerEstado() {
    return clonar(estado);
  }

  function actualizar(cambios = {}) {
    estado = {
      ...estado,
      ...cambios
    };

    notificar();
    return obtenerEstado();
  }

  function sincronizarProyectoActivo() {
    if (estadoApp?.establecerProyectoActivo) {
      estadoApp.establecerProyectoActivo(proyecto);
    }
  }

  function limpiarMensajes() {
    return actualizar({
      mensajes: [],
      errores: []
    });
  }

  function cambiarPagina(paginaId) {
    if (!PAGINAS_VALIDAS.includes(paginaId)) {
      return obtenerEstado();
    }

    if ((paginaId === "comparar" || paginaId === "guardar") && paginaId !== "controles") {
      const validado = validarVideoActual(estado);

      if (!validado.ok) {
        return actualizar({
          errores: validado.errores,
          mensajes: []
        });
      }
    }

    return actualizar({
      paginaActual: paginaId,
      mensajes: [],
      errores: []
    });
  }

  function paginaSiguiente() {
    const siguiente = obtenerSiguientePagina(estado.paginaActual);
    return cambiarPagina(siguiente);
  }

  function paginaAnterior() {
    const anterior = obtenerPaginaAnterior(estado.paginaActual);
    return cambiarPagina(anterior);
  }

  function cambiarVideo(videoId) {
    const video = obtenerVideoPorId(estado.videos, videoId);

    if (!video) {
      return actualizar({
        errores: ["No se encontró el video seleccionado."],
        mensajes: []
      });
    }

    const diagnosticoVideo = obtenerEstadoDiagnosticoDesdeVideo(video);

    return actualizar({
      videoActualId: video.id,
      paginaActual: "controles",
      modoComparacion: "mejorado",
      capaGuardada: false,
      ...diagnosticoVideo,
      mensajes: [],
      errores: []
    });
  }

  function activarControl(controlId, activo) {
    if (!estado.controles?.[controlId]) {
      return obtenerEstado();
    }

    return actualizar({
      perfilAudio: "personalizado",
      controles: {
        ...estado.controles,
        [controlId]: {
          ...estado.controles[controlId],
          activo: Boolean(activo)
        }
      },
      loteCompletado: false,
      puedeAvanzarTranscripcion: false,
      mensajes: [],
      errores: []
    });
  }

  function cambiarNivel(controlId, nivel) {
    if (!estado.controles?.[controlId]) {
      return obtenerEstado();
    }

    return actualizar({
      perfilAudio: "personalizado",
      controles: {
        ...estado.controles,
        [controlId]: {
          ...estado.controles[controlId],
          nivel: limpiarNivel(nivel)
        }
      },
      loteCompletado: false,
      puedeAvanzarTranscripcion: false,
      mensajes: [],
      errores: []
    });
  }

  function cambiarPerfilAudio(perfilId) {
    const perfil = obtenerPerfilAudioPorId(perfilId);
    const controles = crearControlesPerfilAudio(perfil.id);

    return actualizar({
      perfilAudio: perfil.id,
      controles: normalizarControles(controles),
      loteCompletado: false,
      puedeAvanzarTranscripcion: false,
      mensajes: [crearMensajePerfil(perfil.id)],
      errores: []
    });
  }

  function aplicarSoloLimpiarRuido() {
    const controles = crearControlesSoloRuido(estado.controles);

    return actualizar({
      perfilAudio: "personalizado",
      controles: normalizarControles(controles),
      loteCompletado: false,
      puedeAvanzarTranscripcion: false,
      mensajes: ["Modo limpiar ruido aplicado."],
      errores: []
    });
  }

  function cambiarModoComparacion(modo) {
    if (!MODOS_VALIDOS.includes(modo)) {
      return obtenerEstado();
    }

    return actualizar({
      modoComparacion: modo,
      mensajes: [],
      errores: []
    });
  }

  async function mejorarAudioTodos() {
    const validadoVideos = validarVideosLote(estado);

    if (!validadoVideos.ok) {
      return actualizar({
        errores: validadoVideos.errores,
        mensajes: []
      });
    }

    const validadoControles = validarControles(estado);

    if (!validadoControles.ok) {
      return actualizar({
        errores: validadoControles.errores,
        mensajes: []
      });
    }

    let videosTrabajo = clonar(validadoVideos.videos);

    actualizar({
      procesando: true,
      guardando: false,
      descargando: false,
      capaGuardada: false,
      resultadoActual: null,
      resultadosLoteAudio: [],
      loteCompletado: false,
      loteConErrores: false,
      puedeAvanzarTranscripcion: false,
      progresoGlobal: {
        ...crearProgresoLoteVacio(),
        activo: true,
        estado: "INICIANDO",
        total: videosTrabajo.length,
        mensaje: `Preparando ${videosTrabajo.length} video(s) para mejorar audio.`
      },
      mensajes: ["Mejorando audio de todos los videos..."],
      errores: []
    });

    const resultadoLote = await procesarLoteAudioVideos({
      videos: videosTrabajo,
      controles: validadoControles.controles,
      perfilAudio: estado.perfilAudio,

      onProgreso: async (progreso) => {
        actualizar({
          progresoGlobal: progreso,
          mensajes: [obtenerMensajeProgreso(progreso)],
          errores: []
        });
      },

      onVideoProcesado: async ({ videoActualizado, resultadoVideo }) => {
        videosTrabajo = actualizarVideoEnLista(videosTrabajo, videoActualizado);
        proyecto = actualizarVideoEnProyecto(proyecto, videoActualizado);
        sincronizarProyectoActivo();

        const diagnosticoVideo = resultadoVideo?.ok
          ? obtenerEstadoDiagnosticoDesdeVideo(videoActualizado)
          : {};

        actualizar({
          videos: videosTrabajo,
          videoActualId: videoActualizado.id,
          ...diagnosticoVideo,
          resultadosLoteAudio: [
            ...estado.resultadosLoteAudio.filter((item) => item.videoId !== resultadoVideo.videoId),
            resultadoVideo
          ]
        });
      }
    });

    proyecto = actualizarVideosEnProyecto(proyecto, videosTrabajo);
    sincronizarProyectoActivo();

    const primerVideoMejorado = obtenerPrimerVideoConMejora(videosTrabajo);
    const diagnosticoFinal = obtenerEstadoDiagnosticoDesdeVideo(primerVideoMejorado);

    if (!resultadoLote.ok) {
      return actualizar({
        videos: videosTrabajo,
        procesando: false,
        paginaActual: "controles",
        videoActualId: primerVideoMejorado?.id || estado.videoActualId,
        ...diagnosticoFinal,
        progresoGlobal: resultadoLote.progreso || crearProgresoLoteVacio(),
        resultadosLoteAudio: resultadoLote.resultados || [],
        loteCompletado: false,
        loteConErrores: true,
        puedeAvanzarTranscripcion: false,
        mensajes: [],
        errores: crearErroresLote(resultadoLote)
      });
    }

    return actualizar({
      videos: videosTrabajo,
      procesando: false,
      paginaActual: "comparar",
      modoComparacion: "mejorado",
      videoActualId: primerVideoMejorado?.id || estado.videoActualId,
      ...diagnosticoFinal,
      progresoGlobal: resultadoLote.progreso || crearProgresoLoteVacio(),
      resultadosLoteAudio: resultadoLote.resultados || [],
      loteCompletado: true,
      loteConErrores: false,
      puedeAvanzarTranscripcion: true,
      mensajes: [
        crearMensajeLoteExitoso(resultadoLote),
        crearMensajeMotor(primerVideoMejorado?.audioMejorado)
      ],
      errores: []
    });
  }

  async function mejorarAudioActual() {
    return await mejorarAudioTodos();
  }

  async function descargarActual() {
    const validado = validarGuardarCapa(estado);

    if (!validado.ok) {
      return actualizar({
        errores: validado.errores,
        mensajes: []
      });
    }

    actualizar({
      descargando: true,
      mensajes: ["Preparando descarga..."],
      errores: []
    });

    const resultado = await descargarVideoMejorado(validado.video);

    if (!resultado.ok) {
      return actualizar({
        descargando: false,
        errores: [resultado.mensaje || "No se pudo descargar el video."],
        mensajes: []
      });
    }

    return actualizar({
      descargando: false,
      mensajes: [resultado.mensaje || "Video descargado."],
      errores: []
    });
  }

  function guardarCapaActual() {
    const validado = validarGuardarCapa(estado);

    if (!validado.ok) {
      return actualizar({
        errores: validado.errores,
        mensajes: []
      });
    }

    actualizar({
      guardando: true,
      mensajes: ["Guardando capa de audio..."],
      errores: []
    });

    const resultado = guardarCapaAudioEnProyecto({
      proyecto,
      video: validado.video
    });

    if (!resultado.ok) {
      return actualizar({
        guardando: false,
        errores: [resultado.mensaje || "No se pudo guardar la capa."],
        mensajes: []
      });
    }

    proyecto = resultado.proyecto || proyecto;
    sincronizarProyectoActivo();

    return actualizar({
      guardando: false,
      capaGuardada: true,
      mensajes: [resultado.mensaje || "Capa de audio guardada."],
      errores: []
    });
  }

  function obtenerProyectoActualizado() {
    return proyecto;
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
    cambiarPagina,
    paginaSiguiente,
    paginaAnterior,
    cambiarVideo,
    activarControl,
    cambiarNivel,
    cambiarPerfilAudio,
    aplicarSoloLimpiarRuido,
    cambiarModoComparacion,
    mejorarAudioActual,
    mejorarAudioTodos,
    descargarActual,
    guardarCapaActual,
    obtenerProyectoActualizado,
    escuchar
  };
}

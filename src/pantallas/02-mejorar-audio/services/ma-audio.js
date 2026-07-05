/* =========================================================
Nombre completo: ma-audio.js
Ruta o ubicación: /src/pantallas/02-mejorar-audio/services/ma-audio.js
Funciones principales:
- Preparar el procesamiento real de mejora de audio.
- Usar la API de Electron expuesta por preload.js.
- Enviar video, controles y perfil al motor de audio.
- Evitar resultados falsos o temporales como si fueran mejoras reales.
- Devolver datos completos del nuevo video con audio procesado.
- Mostrar mensajes claros cuando falla FFmpeg.
- Mostrar si se usó principal, respaldo DSP o ultra seguro.
- Priorizar Voz Natural para videos hablando a cámara.
Con qué se conecta:
- ma-service.js
- ma-data.js
- ma-audio-electron.js
- preload.js
========================================================= */

import {
  crearControlesDesdePerfilMA
} from "../data/ma-data.js";

const PERFIL_AUDIO_DEFECTO = "natural";

function limpiarNivel(nivel) {
  const valor = String(nivel || "").trim();

  if (["bajo", "medio", "alto"].includes(valor)) {
    return valor;
  }

  return "medio";
}

function limpiarPerfilAudio(perfilAudio) {
  const perfil = String(perfilAudio || "").trim();
  return perfil || PERFIL_AUDIO_DEFECTO;
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

function crearControlesNaturales() {
  return {
    reducirRuido: {
      activo: true,
      nivel: "bajo"
    },
    mejorarVoz: {
      activo: true,
      nivel: "medio"
    },
    nivelarVolumen: {
      activo: true,
      nivel: "medio"
    }
  };
}

function crearResumenControles(controles) {
  const fuente = controles && typeof controles === "object" ? controles : {};
  const respaldo = crearControlesNaturales();

  return {
    reducirRuido: normalizarControl(fuente.reducirRuido, respaldo.reducirRuido),
    mejorarVoz: normalizarControl(fuente.mejorarVoz, respaldo.mejorarVoz),
    nivelarVolumen: normalizarControl(fuente.nivelarVolumen, respaldo.nivelarVolumen)
  };
}

function obtenerAPIAudio() {
  if (window.videoEditorAPI?.mejorarAudio) {
    return window.videoEditorAPI;
  }

  return null;
}

function crearAudioMejoradoTemporal({ video, controles, perfilAudio }) {
  return {
    id: `temp-${video?.id || Date.now()}`,
    videoId: video?.id || "",
    nombre: `${video?.nombre || "video"} - audio temporal`,
    ruta: "",
    url: video?.url || "",
    extension: video?.extension || "mp4",
    pesoBytes: video?.pesoBytes || 0,
    controles,
    perfilAudio,
    descripcion: "Vista temporal sin motor Electron. No es una mejora real.",
    filtrosAudio: [],
    filtrosPrincipales: [],
    filtrosRespaldo: [],
    filtrosUltraSeguro: [],
    modoProcesamiento: "temporal",
    decisionAudio: {
      perfilAudio,
      motorAudio: "temporal",
      usaIA: false,
      usarArnndn: false,
      intensidadDSP: "baja",
      razon: "Motor Electron no disponible."
    },
    capacidadesIA: null,
    analisisAudio: null,
    erroresProcesamiento: [],
    temporal: true,
    motor: "temporal",
    creadoEn: new Date().toISOString()
  };
}

function completarAudioMejorado({
  audioMejorado,
  video,
  controles,
  perfilAudio,
  resultado
}) {
  const fuente = audioMejorado && typeof audioMejorado === "object" ? audioMejorado : {};

  return {
    id: fuente.id || `ma-${video?.id || Date.now()}-${Date.now()}`,
    videoId: fuente.videoId || video?.id || "",
    nombre: fuente.nombre || `${video?.nombre || "video"} - audio procesado`,
    ruta: fuente.ruta || "",
    url: fuente.url || "",
    extension: fuente.extension || "mp4",
    pesoBytes: fuente.pesoBytes || 0,
    fechaModificacion: fuente.fechaModificacion || Date.now(),
    controles: fuente.controles || controles,
    perfilAudio: fuente.perfilAudio || perfilAudio,
    descripcion: fuente.descripcion || "",
    filtrosAudio: Array.isArray(fuente.filtrosAudio) ? fuente.filtrosAudio : [],
    filtrosPrincipales: Array.isArray(fuente.filtrosPrincipales) ? fuente.filtrosPrincipales : [],
    filtrosRespaldo: Array.isArray(fuente.filtrosRespaldo) ? fuente.filtrosRespaldo : [],
    filtrosUltraSeguro: Array.isArray(fuente.filtrosUltraSeguro) ? fuente.filtrosUltraSeguro : [],
    modoProcesamiento: fuente.modoProcesamiento || "principal",
    decisionAudio: fuente.decisionAudio || resultado?.decisionAudio || null,
    capacidadesIA: fuente.capacidadesIA || resultado?.capacidadesIA || null,
    analisisAudio: fuente.analisisAudio || resultado?.analisisAudio || null,
    erroresProcesamiento: Array.isArray(fuente.erroresProcesamiento) ? fuente.erroresProcesamiento : [],
    temporal: Boolean(fuente.temporal),
    motor: fuente.motor || "ffmpeg-dsp-natural",
    creadoEn: fuente.creadoEn || new Date().toISOString()
  };
}

function validarVideoParaAudio(video) {
  if (!video) {
    return {
      ok: false,
      mensaje: "No hay video seleccionado."
    };
  }

  if (!video.ruta && !video.url) {
    return {
      ok: false,
      mensaje: "El video no tiene una ruta válida."
    };
  }

  return {
    ok: true
  };
}

function crearMensajeErrorMotor(resultado) {
  const mensajeBase = resultado?.mensaje || "No se pudo procesar el audio.";
  const detalle = resultado?.detalle || "";
  const errores = Array.isArray(resultado?.erroresProcesamiento)
    ? resultado.erroresProcesamiento
    : [];

  if (errores.length) {
    const resumenErrores = errores
      .map((error) => `${error.intento}: ${error.mensaje}`)
      .join(" | ");

    return `${mensajeBase} Detalle: ${resumenErrores}`;
  }

  if (detalle) {
    return `${mensajeBase} Detalle: ${detalle}`;
  }

  return mensajeBase;
}

function validarResultadoMotor(resultado) {
  if (!resultado) {
    return {
      ok: false,
      mensaje: "El motor no devolvió respuesta."
    };
  }

  if (!resultado.ok) {
    return {
      ok: false,
      mensaje: crearMensajeErrorMotor(resultado)
    };
  }

  if (!resultado.audioMejorado?.ruta || !resultado.audioMejorado?.url) {
    return {
      ok: false,
      mensaje: "El motor terminó, pero no devolvió un archivo procesado válido."
    };
  }

  if (!resultado.audioMejorado?.pesoBytes || resultado.audioMejorado.pesoBytes <= 0) {
    return {
      ok: false,
      mensaje: "El motor generó un archivo vacío."
    };
  }

  return {
    ok: true
  };
}

function crearResultadoError({
  mensaje,
  diagnostico = null,
  decisionAudio = null,
  capacidadesIA = null,
  erroresProcesamiento = []
}) {
  return {
    ok: false,
    temporal: false,
    mensaje,
    audioMejorado: null,
    diagnostico,
    decisionAudio,
    capacidadesIA,
    erroresProcesamiento
  };
}

export async function mejorarAudioVideo({
  video,
  controles,
  perfilAudio = PERFIL_AUDIO_DEFECTO
}) {
  const perfilFinal = limpiarPerfilAudio(perfilAudio);
  const validacionVideo = validarVideoParaAudio(video);

  if (!validacionVideo.ok) {
    return crearResultadoError({
      mensaje: validacionVideo.mensaje
    });
  }

  const controlesFinales = crearResumenControles(controles);
  const apiAudio = obtenerAPIAudio();

  if (!apiAudio) {
    return crearResultadoError({
      mensaje: "La API real de audio no está disponible. Abre la app con Electron usando npm start."
    });
  }

  try {
    const resultado = await apiAudio.mejorarAudio({
      video,
      controles: controlesFinales,
      perfilAudio: perfilFinal
    });

    const validacionMotor = validarResultadoMotor(resultado);

    if (!validacionMotor.ok) {
      return crearResultadoError({
        mensaje: validacionMotor.mensaje,
        diagnostico: resultado?.diagnostico || null,
        decisionAudio: resultado?.decisionAudio || null,
        capacidadesIA: resultado?.capacidadesIA || null,
        erroresProcesamiento: resultado?.erroresProcesamiento || []
      });
    }

    const audioMejorado = completarAudioMejorado({
      audioMejorado: resultado.audioMejorado,
      video,
      controles: controlesFinales,
      perfilAudio: perfilFinal,
      resultado
    });

    return {
      ok: true,
      temporal: false,
      mensaje: crearTextoEstadoProceso({
        ok: true,
        mensaje: resultado.mensaje,
        audioMejorado
      }),
      audioMejorado,
      diagnostico: resultado.diagnostico || null,
      decisionAudio: audioMejorado.decisionAudio || resultado.diagnostico?.decisionAudio || null,
      capacidadesIA: audioMejorado.capacidadesIA || resultado.diagnostico?.capacidadesIA || null,
      analisisAudio: audioMejorado.analisisAudio || null,
      erroresProcesamiento: audioMejorado.erroresProcesamiento || resultado.diagnostico?.errores || []
    };
  } catch (error) {
    return crearResultadoError({
      mensaje: error?.message || "No se pudo procesar el audio.",
      erroresProcesamiento: []
    });
  }
}

export function crearControlesPerfilAudio(perfilAudio) {
  return crearResumenControles(crearControlesDesdePerfilMA(limpiarPerfilAudio(perfilAudio)));
}

export function crearControlesSoloRuido(controlesActuales) {
  const controles = crearResumenControles(controlesActuales);

  return {
    reducirRuido: {
      activo: true,
      nivel: controles.reducirRuido?.nivel === "alto" ? "medio" : "medio"
    },
    mejorarVoz: {
      activo: false,
      nivel: controles.mejorarVoz?.nivel || "medio"
    },
    nivelarVolumen: {
      activo: true,
      nivel: "medio"
    }
  };
}

function crearTextoMotorAudio(decisionAudio) {
  const motor = decisionAudio?.motorAudio || "";

  if (motor === "ia") {
    return "IA + DSP";
  }

  if (motor === "extremo") {
    return "limpieza extrema";
  }

  if (motor === "dsp") {
    return "DSP natural";
  }

  return "";
}

function crearTextoModoProcesamiento(modo) {
  if (modo === "principal") {
    return "filtro principal";
  }

  if (modo === "respaldo-dsp") {
    return "respaldo DSP";
  }

  if (modo === "ultra-seguro") {
    return "modo ultra seguro";
  }

  if (modo === "temporal") {
    return "modo temporal";
  }

  return "";
}

function crearAdvertenciaModo(modo) {
  if (modo === "ultra-seguro") {
    return " Es una versión mínima para evitar dañar la voz.";
  }

  if (modo === "respaldo-dsp") {
    return " Se usó respaldo porque el filtro principal no funcionó.";
  }

  return "";
}

export function crearTextoEstadoProceso(resultado) {
  if (!resultado) {
    return "";
  }

  if (!resultado.ok) {
    return resultado.mensaje || "No se pudo procesar el audio.";
  }

  const modo = resultado.audioMejorado?.modoProcesamiento;
  const decisionAudio = resultado.audioMejorado?.decisionAudio || resultado.decisionAudio || null;
  const textoMotor = crearTextoMotorAudio(decisionAudio);
  const textoModo = crearTextoModoProcesamiento(modo);
  const advertencia = crearAdvertenciaModo(modo);

  if (modo === "temporal") {
    return "Audio preparado en modo temporal. No es una mejora real.";
  }

  if (textoMotor && textoModo) {
    return `Audio procesado con ${textoMotor} usando ${textoModo}. Compáralo con el original antes de guardarlo.${advertencia}`;
  }

  if (textoModo) {
    return `Audio procesado usando ${textoModo}. Compáralo con el original antes de guardarlo.${advertencia}`;
  }

  if (textoMotor) {
    return `Audio procesado con ${textoMotor}. Compáralo con el original antes de guardarlo.`;
  }

  return resultado.mensaje || "Audio procesado. Compáralo con el original antes de guardarlo.";
}

export function obtenerResumenMotorAudio(audioMejorado) {
  const decisionAudio = audioMejorado?.decisionAudio || null;
  const capacidadesIA = audioMejorado?.capacidadesIA || null;

  return {
    motor: crearTextoMotorAudio(decisionAudio) || audioMejorado?.motor || "Audio",
    usaIA: Boolean(decisionAudio?.usaIA),
    iaDisponible: Boolean(capacidadesIA?.iaDisponible),
    razon: decisionAudio?.razon || "",
    mensajeIA: capacidadesIA?.mensaje || "",
    modoProcesamiento: audioMejorado?.modoProcesamiento || "",
    modoTexto: crearTextoModoProcesamiento(audioMejorado?.modoProcesamiento),
    erroresProcesamiento: audioMejorado?.erroresProcesamiento || [],
    filtrosUsados: audioMejorado?.filtrosAudio || []
  };
}

export function crearAudioTemporalParaPruebas({ video, controles, perfilAudio = PERFIL_AUDIO_DEFECTO }) {
  return crearAudioMejoradoTemporal({
    video,
    controles: crearResumenControles(controles),
    perfilAudio: limpiarPerfilAudio(perfilAudio)
  });
}
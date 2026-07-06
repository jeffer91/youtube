/* =========================================================
Nombre completo: ma-lote.js
Ruta o ubicación: /src/pantallas/02-mejorar-audio/services/ma-lote.js
Funciones principales:
- Procesar en lote todos los videos cargados en Mejorar audio.
- Ejecutar la mejora de audio video por video para no saturar FFmpeg.
- Calcular progreso general del lote.
- Guardar resultado individual por cada video.
- Evitar que el lote quede a medias sin diagnóstico.
Con qué se conecta:
- ma-service.js
- ma-audio.js
========================================================= */

import { mejorarAudioVideo } from "./ma-audio.js";

const ESTADO_LOTE_INACTIVO = "INACTIVO";
const ESTADO_LOTE_INICIANDO = "INICIANDO";
const ESTADO_LOTE_PROCESANDO = "PROCESANDO";
const ESTADO_LOTE_FINALIZADO = "FINALIZADO";
const ESTADO_LOTE_ERROR = "ERROR";

function limpiarTexto(valor) {
  return String(valor || "").trim();
}

function clonar(valor) {
  try {
    return JSON.parse(JSON.stringify(valor));
  } catch (error) {
    return valor;
  }
}

function normalizarNumero(valor, respaldo = 0) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : respaldo;
}

function calcularPorcentaje({ procesados, total }) {
  const totalSeguro = Math.max(normalizarNumero(total, 0), 0);

  if (!totalSeguro) {
    return 0;
  }

  const procesadosSeguro = Math.max(normalizarNumero(procesados, 0), 0);
  return Math.min(100, Math.round((procesadosSeguro / totalSeguro) * 100));
}

function obtenerNombreVideo(video, indice = 0) {
  return limpiarTexto(video?.nombre) || `Video ${indice + 1}`;
}

function normalizarVideos(videos) {
  if (!Array.isArray(videos)) {
    return [];
  }

  return videos
    .filter((video) => video && typeof video === "object")
    .map((video, index) => ({
      ...video,
      orden: video.orden || index + 1
    }));
}

function crearResultadoVideoPendiente({ video, indice }) {
  return {
    videoId: video?.id || "",
    nombre: obtenerNombreVideo(video, indice),
    indice,
    estado: "PENDIENTE",
    ok: false,
    mensaje: "",
    audioMejorado: null,
    diagnostico: null,
    decisionAudio: null,
    capacidadesIA: null,
    analisisAudio: null,
    erroresProcesamiento: []
  };
}

function crearResultadoVideoOk({ video, indice, resultado }) {
  return {
    videoId: video?.id || "",
    nombre: obtenerNombreVideo(video, indice),
    indice,
    estado: "MEJORADO",
    ok: true,
    mensaje: resultado?.mensaje || "Audio mejorado correctamente.",
    audioMejorado: resultado?.audioMejorado || null,
    diagnostico: resultado?.diagnostico || null,
    decisionAudio: resultado?.decisionAudio || resultado?.audioMejorado?.decisionAudio || null,
    capacidadesIA: resultado?.capacidadesIA || resultado?.audioMejorado?.capacidadesIA || null,
    analisisAudio: resultado?.analisisAudio || resultado?.audioMejorado?.analisisAudio || null,
    erroresProcesamiento: resultado?.erroresProcesamiento || resultado?.audioMejorado?.erroresProcesamiento || []
  };
}

function crearResultadoVideoError({ video, indice, error, resultado = null }) {
  const mensaje = limpiarTexto(
    resultado?.mensaje ||
    error?.message ||
    "No se pudo mejorar el audio de este video."
  );

  return {
    videoId: video?.id || "",
    nombre: obtenerNombreVideo(video, indice),
    indice,
    estado: "ERROR",
    ok: false,
    mensaje,
    audioMejorado: null,
    diagnostico: resultado?.diagnostico || null,
    decisionAudio: resultado?.decisionAudio || null,
    capacidadesIA: resultado?.capacidadesIA || null,
    analisisAudio: resultado?.analisisAudio || null,
    erroresProcesamiento: resultado?.erroresProcesamiento || []
  };
}

function crearVideoActualizadoConResultado({ video, resultadoVideo }) {
  if (!resultadoVideo?.ok || !resultadoVideo?.audioMejorado) {
    return {
      ...video,
      audioEstado: "ERROR",
      audioError: resultadoVideo?.mensaje || "No se pudo mejorar el audio.",
      audioProcesadoEn: new Date().toISOString()
    };
  }

  return {
    ...video,
    audioMejorado: resultadoVideo.audioMejorado,
    audioEstado: "MEJORADO",
    audioError: "",
    audioProcesadoEn: new Date().toISOString()
  };
}

export function crearProgresoLoteVacio() {
  return {
    activo: false,
    estado: ESTADO_LOTE_INACTIVO,
    total: 0,
    procesados: 0,
    mejorados: 0,
    fallidos: 0,
    porcentaje: 0,
    actualIndice: 0,
    actualVideoId: "",
    actualNombre: "",
    mensaje: "",
    iniciadoEn: "",
    actualizadoEn: "",
    finalizadoEn: ""
  };
}

function crearProgresoLote({
  estado,
  total,
  procesados,
  mejorados,
  fallidos,
  actualIndice = 0,
  actualVideoId = "",
  actualNombre = "",
  mensaje = "",
  iniciadoEn = "",
  finalizadoEn = ""
}) {
  const actualizadoEn = new Date().toISOString();

  return {
    activo: estado !== ESTADO_LOTE_INACTIVO && estado !== ESTADO_LOTE_FINALIZADO && estado !== ESTADO_LOTE_ERROR,
    estado,
    total,
    procesados,
    mejorados,
    fallidos,
    porcentaje: calcularPorcentaje({ procesados, total }),
    actualIndice,
    actualVideoId,
    actualNombre,
    mensaje,
    iniciadoEn,
    actualizadoEn,
    finalizadoEn
  };
}

async function emitirProgreso(callback, progreso) {
  if (typeof callback !== "function") {
    return;
  }

  await callback(clonar(progreso));
}

async function emitirVideoProcesado(callback, datos) {
  if (typeof callback !== "function") {
    return;
  }

  await callback(clonar(datos));
}

function crearResumenFinal({ total, mejorados, fallidos }) {
  if (fallidos > 0) {
    return `Se procesaron ${mejorados} de ${total} videos. ${fallidos} video(s) necesitan revisión.`;
  }

  if (total === 1) {
    return "Audio mejorado correctamente en 1 video.";
  }

  return `Audio mejorado correctamente en ${total} videos.`;
}

function crearErrorSinVideos() {
  return {
    ok: false,
    total: 0,
    procesados: 0,
    mejorados: 0,
    fallidos: 0,
    resultados: [],
    errores: ["No hay videos cargados para mejorar audio."],
    mensaje: "No hay videos cargados para mejorar audio.",
    progreso: crearProgresoLoteVacio()
  };
}

export async function procesarLoteAudioVideos({
  videos,
  controles,
  perfilAudio,
  onProgreso,
  onVideoProcesado
}) {
  const videosLote = normalizarVideos(videos);
  const total = videosLote.length;
  const iniciadoEn = new Date().toISOString();

  if (!total) {
    return crearErrorSinVideos();
  }

  let procesados = 0;
  let mejorados = 0;
  let fallidos = 0;
  const resultados = [];

  await emitirProgreso(
    onProgreso,
    crearProgresoLote({
      estado: ESTADO_LOTE_INICIANDO,
      total,
      procesados,
      mejorados,
      fallidos,
      mensaje: `Preparando ${total} video(s) para mejorar audio.`,
      iniciadoEn
    })
  );

  for (let indice = 0; indice < videosLote.length; indice += 1) {
    const video = videosLote[indice];
    const resultadoPendiente = crearResultadoVideoPendiente({ video, indice });
    const nombreVideo = resultadoPendiente.nombre;

    await emitirProgreso(
      onProgreso,
      crearProgresoLote({
        estado: ESTADO_LOTE_PROCESANDO,
        total,
        procesados,
        mejorados,
        fallidos,
        actualIndice: indice + 1,
        actualVideoId: video.id || "",
        actualNombre: nombreVideo,
        mensaje: `Mejorando audio ${indice + 1} de ${total}: ${nombreVideo}`,
        iniciadoEn
      })
    );

    let resultadoMotor = null;
    let resultadoVideo = null;

    try {
      resultadoMotor = await mejorarAudioVideo({
        video,
        controles,
        perfilAudio
      });

      if (!resultadoMotor?.ok) {
        resultadoVideo = crearResultadoVideoError({
          video,
          indice,
          resultado: resultadoMotor
        });
      } else {
        resultadoVideo = crearResultadoVideoOk({
          video,
          indice,
          resultado: resultadoMotor
        });
      }
    } catch (error) {
      resultadoVideo = crearResultadoVideoError({
        video,
        indice,
        error,
        resultado: resultadoMotor
      });
    }

    procesados += 1;

    if (resultadoVideo.ok) {
      mejorados += 1;
    } else {
      fallidos += 1;
    }

    resultados.push(resultadoVideo);

    const videoActualizado = crearVideoActualizadoConResultado({
      video,
      resultadoVideo
    });

    await emitirVideoProcesado(onVideoProcesado, {
      videoOriginal: video,
      videoActualizado,
      resultadoVideo,
      resultadoMotor,
      indice,
      total,
      procesados,
      mejorados,
      fallidos
    });

    await emitirProgreso(
      onProgreso,
      crearProgresoLote({
        estado: ESTADO_LOTE_PROCESANDO,
        total,
        procesados,
        mejorados,
        fallidos,
        actualIndice: indice + 1,
        actualVideoId: video.id || "",
        actualNombre: nombreVideo,
        mensaje: `Procesados ${procesados} de ${total}.`,
        iniciadoEn
      })
    );
  }

  const finalizadoEn = new Date().toISOString();
  const ok = fallidos === 0;
  const errores = resultados
    .filter((resultado) => !resultado.ok)
    .map((resultado) => `${resultado.nombre}: ${resultado.mensaje}`);

  const progresoFinal = crearProgresoLote({
    estado: ok ? ESTADO_LOTE_FINALIZADO : ESTADO_LOTE_ERROR,
    total,
    procesados,
    mejorados,
    fallidos,
    mensaje: crearResumenFinal({ total, mejorados, fallidos }),
    iniciadoEn,
    finalizadoEn
  });

  await emitirProgreso(onProgreso, progresoFinal);

  return {
    ok,
    total,
    procesados,
    mejorados,
    fallidos,
    resultados,
    errores,
    mensaje: crearResumenFinal({ total, mejorados, fallidos }),
    progreso: progresoFinal
  };
}

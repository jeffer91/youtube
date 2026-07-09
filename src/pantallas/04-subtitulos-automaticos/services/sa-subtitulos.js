/* =========================================================
Nombre completo: sa-subtitulos.js
Ruta o ubicación: /src/pantallas/04-subtitulos-automaticos/services/sa-subtitulos.js
Funciones principales:
- Leer transcripciones guardadas dentro del proyecto activo.
- Crear subtítulos automáticos por video.
- Crear archivos SRT y ASS en memoria.
- Guardar los subtítulos como capa del proyecto.
- Mantener el video original intacto.
Con qué se conecta:
- sa.js
- sa-formatos.js
- sa-electron.js
========================================================= */

import {
  SA_FORMATO_DEFECTO,
  obtenerFormatoSubtitulosSA
} from "./sa-formatos.js";

const SA_CAPA_SUBTITULOS = Object.freeze({
  id: "subtitulos-automaticos",
  tipo: "subtitulos",
  nombre: "Subtítulos automáticos",
  activa: true
});

function limpiarTextoSA(valor) {
  return String(valor ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function clonarSeguroSA(valor) {
  try {
    return JSON.parse(JSON.stringify(valor || null));
  } catch (error) {
    return null;
  }
}

function normalizarSegundosSA(valor, respaldo = 0) {
  const numero = Number(valor);

  if (!Number.isFinite(numero) || numero < 0) {
    return Math.max(0, Number(respaldo) || 0);
  }

  return Math.round(numero * 1000) / 1000;
}

function formatearTiempoSrtSA(segundosEntrada) {
  const totalMilisegundos = Math.max(0, Math.round(normalizarSegundosSA(segundosEntrada) * 1000));
  const horas = Math.floor(totalMilisegundos / 3600000);
  const minutos = Math.floor((totalMilisegundos % 3600000) / 60000);
  const segundos = Math.floor((totalMilisegundos % 60000) / 1000);
  const milisegundos = totalMilisegundos % 1000;

  return [
    String(horas).padStart(2, "0"),
    String(minutos).padStart(2, "0"),
    String(segundos).padStart(2, "0")
  ].join(":") + `,${String(milisegundos).padStart(3, "0")}`;
}

function formatearTiempoAssSA(segundosEntrada) {
  const totalCentisegundos = Math.max(0, Math.round(normalizarSegundosSA(segundosEntrada) * 100));
  const horas = Math.floor(totalCentisegundos / 360000);
  const minutos = Math.floor((totalCentisegundos % 360000) / 6000);
  const segundos = Math.floor((totalCentisegundos % 6000) / 100);
  const centisegundos = totalCentisegundos % 100;

  return [
    String(horas),
    String(minutos).padStart(2, "0"),
    String(segundos).padStart(2, "0")
  ].join(":") + `.${String(centisegundos).padStart(2, "0")}`;
}

function formatearTiempoCortoSA(segundosEntrada) {
  const totalSegundos = Math.max(0, Math.round(normalizarSegundosSA(segundosEntrada)));
  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;

  return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}

function obtenerTextoSegmentoSA(segmento) {
  return limpiarTextoSA(segmento?.texto || segmento?.text || "");
}

function dividirTextoEnBloquesSA(texto, palabrasPorBloque = 10) {
  const palabras = limpiarTextoSA(texto).split(/\s+/).filter(Boolean);
  const bloques = [];

  for (let i = 0; i < palabras.length; i += palabrasPorBloque) {
    const bloque = palabras.slice(i, i + palabrasPorBloque).join(" ");
    if (bloque) bloques.push(bloque);
  }

  return bloques;
}

function crearSegmentosEstimadosSA(transcripcion) {
  const bloques = dividirTextoEnBloquesSA(transcripcion?.texto || "");
  let cursor = 0;

  return bloques.map((texto, index) => {
    const palabras = texto.split(/\s+/).filter(Boolean).length;
    const duracion = Math.max(2.2, Math.min(6, (palabras / 145) * 60));
    const inicio = cursor;
    const fin = inicio + duracion;
    cursor = fin;

    return {
      id: `segmento-estimado-${index + 1}`,
      indice: index + 1,
      inicio,
      fin,
      texto,
      estimado: true
    };
  });
}

function normalizarSegmentosSA(transcripcion) {
  const segmentosBase = Array.isArray(transcripcion?.segmentos) ? transcripcion.segmentos : [];
  const fuente = segmentosBase.length ? segmentosBase : crearSegmentosEstimadosSA(transcripcion);
  let ultimoFin = 0;

  return fuente
    .map((segmento, index) => {
      const texto = obtenerTextoSegmentoSA(segmento);
      if (!texto) return null;

      const inicioBase = segmento?.inicio ?? segmento?.start ?? ultimoFin;
      const inicio = Math.max(ultimoFin, normalizarSegundosSA(inicioBase, ultimoFin));
      const finBase = segmento?.fin ?? segmento?.end ?? inicio + 3;
      const fin = Math.max(inicio + 0.5, normalizarSegundosSA(finBase, inicio + 3));
      ultimoFin = fin;

      return {
        id: segmento?.id || `subtitulo-${index + 1}`,
        indice: index + 1,
        inicio,
        fin,
        duracion: Math.round((fin - inicio) * 1000) / 1000,
        inicioTexto: segmento?.inicioTexto || formatearTiempoCortoSA(inicio),
        finTexto: segmento?.finTexto || formatearTiempoCortoSA(fin),
        inicioSrt: segmento?.inicioSrt || formatearTiempoSrtSA(inicio),
        finSrt: segmento?.finSrt || formatearTiempoSrtSA(fin),
        inicioAss: formatearTiempoAssSA(inicio),
        finAss: formatearTiempoAssSA(fin),
        texto,
        estimado: Boolean(segmento?.estimado)
      };
    })
    .filter(Boolean);
}

function escaparTextoAssSA(texto) {
  return limpiarTextoSA(texto)
    .replace(/[{}]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\N");
}

function crearTextoSrtSA(subtitulos) {
  return subtitulos
    .map((subtitulo, index) => {
      return [
        String(index + 1),
        `${subtitulo.inicioSrt} --> ${subtitulo.finSrt}`,
        subtitulo.texto
      ].join("\n");
    })
    .join("\n\n");
}

function crearLineaEstiloAssSA(formato) {
  const ass = formato.ass || {};
  return [
    "Style: Default",
    ass.fontName || "Arial",
    ass.fontSize || 62,
    ass.primaryColour || "&H00FFFFFF",
    ass.secondaryColour || "&H00FFFFFF",
    ass.outlineColour || "&H00000000",
    ass.backColour || "&H99000000",
    ass.bold ?? -1,
    0,
    0,
    0,
    100,
    100,
    0,
    0,
    ass.borderStyle || 3,
    ass.outline ?? 1,
    ass.shadow ?? 0,
    ass.alignment || 2,
    ass.marginL || 90,
    ass.marginR || 90,
    ass.marginV || 78,
    1
  ].join(",");
}

function crearTextoAssSA({ subtitulos, formatoId }) {
  const formato = obtenerFormatoSubtitulosSA(formatoId);
  const eventos = subtitulos
    .map((subtitulo) => {
      return [
        "Dialogue: 0",
        subtitulo.inicioAss,
        subtitulo.finAss,
        "Default",
        "",
        0,
        0,
        0,
        "",
        escaparTextoAssSA(subtitulo.texto)
      ].join(",");
    })
    .join("\n");

  return [
    "[Script Info]",
    "ScriptType: v4.00+",
    "WrapStyle: 2",
    "ScaledBorderAndShadow: yes",
    "YCbCr Matrix: TV.709",
    "PlayResX: 1920",
    "PlayResY: 1080",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    crearLineaEstiloAssSA(formato),
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    eventos
  ].join("\n");
}

function crearIdCapaSubtitulosSA(videoId) {
  return `${SA_CAPA_SUBTITULOS.id}-${videoId}`;
}

function crearSubtitulosVideoSA(video, formatoId = SA_FORMATO_DEFECTO) {
  const transcripcion = obtenerTranscripcionSA(video);

  if (!transcripcion?.texto) {
    return {
      ok: false,
      video,
      mensaje: `${video?.nombre || "Video"}: no tiene transcripción guardada.`
    };
  }

  const subtitulos = normalizarSegmentosSA(transcripcion).map((segmento, index) => ({
    id: `${video?.id || "video"}-subtitulo-${index + 1}`,
    videoId: video?.id || "",
    indice: index + 1,
    inicio: segmento.inicio,
    fin: segmento.fin,
    duracion: segmento.duracion,
    inicioTexto: segmento.inicioTexto,
    finTexto: segmento.finTexto,
    inicioSrt: segmento.inicioSrt,
    finSrt: segmento.finSrt,
    inicioAss: segmento.inicioAss,
    finAss: segmento.finAss,
    texto: segmento.texto,
    estimado: segmento.estimado,
    origen: "transcripcion"
  }));

  if (!subtitulos.length) {
    return {
      ok: false,
      video,
      mensaje: `${video?.nombre || "Video"}: la transcripción no tiene texto suficiente para subtítulos.`
    };
  }

  return {
    ok: true,
    video,
    subtitulos,
    srt: crearTextoSrtSA(subtitulos),
    ass: crearTextoAssSA({ subtitulos, formatoId }),
    formato: obtenerFormatoSubtitulosSA(formatoId),
    total: subtitulos.length,
    mensaje: `${video?.nombre || "Video"}: ${subtitulos.length} subtítulo(s) preparado(s).`
  };
}

function crearCapaSubtitulosSA({ video, resultado }) {
  const fecha = new Date().toISOString();

  return {
    ...SA_CAPA_SUBTITULOS,
    id: crearIdCapaSubtitulosSA(video.id),
    videoId: video.id,
    nombre: `Subtítulos automáticos - ${video.nombre || "video"}`,
    activa: true,
    datos: {
      formato: "ASS/SRT",
      formatoVisual: resultado.formato?.id || SA_FORMATO_DEFECTO,
      total: resultado.total,
      subtitulos: resultado.subtitulos,
      srt: resultado.srt,
      ass: resultado.ass,
      videoOriginal: {
        id: video.id,
        nombre: video.nombre,
        ruta: video.ruta,
        url: video.url
      }
    },
    creadoEn: fecha,
    actualizadoEn: fecha
  };
}

function agregarOActualizarCapaSA(capasActuales, capaNueva) {
  const capas = Array.isArray(capasActuales) ? [...capasActuales] : [];
  const index = capas.findIndex((capa) => capa.id === capaNueva.id);

  if (index >= 0) {
    capas[index] = {
      ...capas[index],
      ...capaNueva,
      actualizadoEn: new Date().toISOString()
    };
  } else {
    capas.push(capaNueva);
  }

  return capas;
}

function actualizarVideoConSubtitulosSA(video, resultado) {
  const fecha = new Date().toISOString();

  return {
    ...video,
    subtitulos: resultado.subtitulos,
    subtitulosAutomaticos: {
      estado: "PREPARADO",
      formato: "ASS/SRT",
      formatoVisual: resultado.formato?.id || SA_FORMATO_DEFECTO,
      total: resultado.total,
      subtitulos: resultado.subtitulos,
      srt: resultado.srt,
      ass: resultado.ass,
      origen: "transcripcion",
      actualizadoEn: fecha
    },
    actualizadoEn: fecha
  };
}

export function obtenerVideosSA(proyecto) {
  return Array.isArray(proyecto?.videos) ? proyecto.videos : [];
}

export function obtenerTranscripcionSA(video) {
  if (video?.transcripcion?.texto) return video.transcripcion;
  if (Array.isArray(video?.transcripciones) && video.transcripciones.length) {
    return video.transcripciones[video.transcripciones.length - 1];
  }
  return null;
}

export function obtenerSubtitulosPreparadosSA(video) {
  if (Array.isArray(video?.subtitulosAutomaticos?.subtitulos)) {
    return video.subtitulosAutomaticos.subtitulos;
  }
  if (Array.isArray(video?.subtitulos)) return video.subtitulos;
  return [];
}

export function contarPalabrasSA(transcripcion) {
  const texto = limpiarTextoSA(transcripcion?.texto || "");
  if (!texto) return 0;
  return texto.split(/\s+/).filter(Boolean).length;
}

export function videoTieneSubtitulosSA(video) {
  return obtenerSubtitulosPreparadosSA(video).length > 0;
}

export function crearResumenSA(proyecto) {
  const videos = obtenerVideosSA(proyecto);
  const listos = videos.filter((video) => obtenerTranscripcionSA(video));
  const conSubtitulos = videos.filter((video) => videoTieneSubtitulosSA(video));
  const conVideoFinal = videos.filter((video) => video?.subtitulosAutomaticos?.videoFinal?.ruta || video?.videoSubtitulado?.ruta);
  const totalSubtitulos = videos.reduce((total, video) => total + obtenerSubtitulosPreparadosSA(video).length, 0);
  const pendientes = Math.max(videos.length - listos.length, 0);

  return {
    videos,
    total: videos.length,
    listos: listos.length,
    pendientes,
    conSubtitulos: conSubtitulos.length,
    conVideoFinal: conVideoFinal.length,
    totalSubtitulos,
    puedePreparar: videos.length > 0 && pendientes === 0,
    puedeGenerarVideo: videos.length > 0 && conSubtitulos.length === videos.length
  };
}

export function prepararSubtitulosProyectoSA(proyecto, formatoId = SA_FORMATO_DEFECTO) {
  const proyectoBase = clonarSeguroSA(proyecto);
  const videos = obtenerVideosSA(proyectoBase);
  const formato = obtenerFormatoSubtitulosSA(formatoId);
  const errores = [];
  const resultados = [];

  if (!proyectoBase) {
    return { ok: false, proyecto: null, resultados: [], errores: ["No hay proyecto activo."], mensajes: [] };
  }

  if (!videos.length) {
    return { ok: false, proyecto: proyectoBase, resultados: [], errores: ["No hay videos cargados para preparar subtítulos."], mensajes: [] };
  }

  videos.forEach((video) => {
    const resultado = crearSubtitulosVideoSA(video, formato.id);
    if (!resultado.ok) errores.push(resultado.mensaje);
    else resultados.push(resultado);
  });

  if (errores.length) {
    return { ok: false, proyecto: proyectoBase, resultados, errores, mensajes: [] };
  }

  const resultadosPorVideo = new Map(resultados.map((resultado) => [resultado.video.id, resultado]));
  const videosActualizados = videos.map((video) => {
    const resultado = resultadosPorVideo.get(video.id);
    return resultado ? actualizarVideoConSubtitulosSA(video, resultado) : video;
  });

  let capasActualizadas = Array.isArray(proyectoBase.capas) ? [...proyectoBase.capas] : [];

  videosActualizados.forEach((video) => {
    const resultado = resultadosPorVideo.get(video.id);
    if (!resultado) return;
    capasActualizadas = agregarOActualizarCapaSA(capasActualizadas, crearCapaSubtitulosSA({ video, resultado }));
  });

  const totalSubtitulos = resultados.reduce((total, resultado) => total + resultado.total, 0);
  const fecha = new Date().toISOString();
  const proyectoActualizado = {
    ...proyectoBase,
    videos: videosActualizados,
    capas: capasActualizadas,
    pantallaActual: "04-subtitulos-automaticos",
    subtitulosAutomaticos: {
      estado: "PREPARADO",
      totalVideos: videosActualizados.length,
      totalSubtitulos,
      formato: "ASS/SRT",
      formatoVisual: formato.id,
      actualizadoEn: fecha
    },
    actualizadoEn: fecha
  };

  return {
    ok: true,
    proyecto: proyectoActualizado,
    resultados,
    formato,
    totalVideos: videosActualizados.length,
    totalSubtitulos,
    errores: [],
    mensajes: [`Subtítulos preparados automáticamente con formato ${formato.nombre}.`]
  };
}

export function integrarVideosSubtituladosEnProyectoSA({ proyecto, exportacion }) {
  const proyectoBase = clonarSeguroSA(proyecto);

  if (!proyectoBase || !exportacion?.ok) {
    return proyectoBase || proyecto;
  }

  const resultadosOk = new Map(
    (exportacion.resultados || [])
      .filter((resultado) => resultado.ok && resultado.videoSubtitulado)
      .map((resultado) => [resultado.videoId, resultado.videoSubtitulado])
  );

  const videos = obtenerVideosSA(proyectoBase).map((video) => {
    const videoSubtitulado = resultadosOk.get(video.id);

    if (!videoSubtitulado) {
      return video;
    }

    return {
      ...video,
      videoSubtitulado,
      subtitulosAutomaticos: {
        ...(video.subtitulosAutomaticos || {}),
        estado: "VIDEO_GENERADO",
        videoFinal: videoSubtitulado,
        actualizadoEn: new Date().toISOString()
      },
      actualizadoEn: new Date().toISOString()
    };
  });

  return {
    ...proyectoBase,
    videos,
    subtitulosAutomaticos: {
      ...(proyectoBase.subtitulosAutomaticos || {}),
      estado: "VIDEO_GENERADO",
      carpetaSalida: exportacion.carpetaSalida || "",
      totalVideosGenerados: resultadosOk.size,
      actualizadoEn: new Date().toISOString()
    },
    actualizadoEn: new Date().toISOString()
  };
}

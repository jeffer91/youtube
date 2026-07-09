/* =========================================================
Nombre completo: sa-electron.js
Ruta o ubicación: /src/pantallas/04-subtitulos-automaticos/electron/sa-electron.js
Funciones principales:
- Registrar procesos Electron de Subtítulos automáticos.
- Guardar archivos ASS temporales por video.
- Quemar subtítulos sobre el video usando FFmpeg.
- Generar videos finales subtitulados sin modificar originales.
- Descargar el video final subtitulado y abrir la carpeta de salida.
Con qué se conecta:
- electron/main/main.js
- electron/preload/preload.js
- ma-ffmpeg-runner.js
========================================================= */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { pathToFileURL } = require("url");

const {
  validarMotorFFmpeg,
  ejecutarFFmpeg
} = require("../../02-mejorar-audio/electron/ma-ffmpeg-runner.js");

const PESO_MINIMO_VIDEO_VALIDO = 1024;

function limpiarTextoSA(valor) {
  return String(valor || "").trim();
}

function limpiarNombreArchivoSA(texto) {
  return limpiarTextoSA(texto || "video")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, " ")
    .trim() || "video";
}

function limpiarNombreCarpetaSA(texto) {
  return limpiarNombreArchivoSA(texto || "proyecto")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70) || "proyecto";
}

function crearMarcaTiempoSA() {
  const fecha = new Date();
  return [
    fecha.getFullYear(),
    String(fecha.getMonth() + 1).padStart(2, "0"),
    String(fecha.getDate()).padStart(2, "0")
  ].join("-") + "_" + [
    String(fecha.getHours()).padStart(2, "0"),
    String(fecha.getMinutes()).padStart(2, "0"),
    String(fecha.getSeconds()).padStart(2, "0")
  ].join("-");
}

function obtenerRutaProcesadosSA({ obtenerRutaData, asegurarCarpeta }) {
  const rutaProcesados = path.join(obtenerRutaData(), "procesados");
  asegurarCarpeta(rutaProcesados);
  return rutaProcesados;
}

function obtenerCarpetaSubtitulosSA({ obtenerRutaData, asegurarCarpeta, proyecto }) {
  const raiz = path.join(obtenerRutaProcesadosSA({ obtenerRutaData, asegurarCarpeta }), "subtitulos-automaticos");
  asegurarCarpeta(raiz);

  const idProyecto = limpiarNombreCarpetaSA(proyecto?.id || proyecto?.nombre || "proyecto");
  const carpetaProyecto = path.join(raiz, idProyecto);
  asegurarCarpeta(carpetaProyecto);

  return carpetaProyecto;
}

function obtenerVideoEntradaSA(video) {
  const audioMejorado = video?.audioMejorado || null;

  if (audioMejorado?.ruta && fs.existsSync(audioMejorado.ruta)) {
    return {
      ruta: audioMejorado.ruta,
      url: audioMejorado.url || pathToFileURL(audioMejorado.ruta).href,
      tipo: "audio-mejorado"
    };
  }

  if (video?.ruta && fs.existsSync(video.ruta)) {
    return {
      ruta: video.ruta,
      url: video.url || pathToFileURL(video.ruta).href,
      tipo: "original"
    };
  }

  return null;
}

function validarVideoParaSubtitulosSA(video) {
  if (!video || typeof video !== "object") {
    return { ok: false, mensaje: "No se recibió información del video." };
  }

  const entrada = obtenerVideoEntradaSA(video);

  if (!entrada) {
    return { ok: false, mensaje: `${video.nombre || "Video"}: no se encontró el archivo de video.` };
  }

  const ass = limpiarTextoSA(video?.subtitulosAutomaticos?.ass || "");

  if (!ass) {
    return { ok: false, mensaje: `${video.nombre || "Video"}: no tiene subtítulos ASS preparados.` };
  }

  return { ok: true, entrada, ass };
}

function validarArchivoGeneradoSA(rutaSalida) {
  if (!rutaSalida || !fs.existsSync(rutaSalida)) {
    return { ok: false, mensaje: "FFmpeg terminó, pero no generó el video subtitulado." };
  }

  const stat = fs.statSync(rutaSalida);

  if (!stat.size || stat.size <= PESO_MINIMO_VIDEO_VALIDO) {
    return { ok: false, mensaje: "El video subtitulado se generó vacío o demasiado pequeño." };
  }

  return { ok: true, stat };
}

function crearRutasSalidaSA({ carpetaSalida, video, formatoId }) {
  const nombreOriginal = limpiarNombreArchivoSA(video?.nombre || "video.mp4");
  const base = limpiarNombreArchivoSA(path.parse(nombreOriginal).name || "video");
  const formato = limpiarNombreArchivoSA(formatoId || "subtitulos").toLowerCase();
  const marca = crearMarcaTiempoSA();
  const unico = crypto.randomBytes(3).toString("hex");

  const nombreAss = `${base}_subtitulos_${formato}_${marca}_${unico}.ass`;
  const nombreVideo = `${base}_subtitulado_${formato}_${marca}_${unico}.mp4`;

  return {
    nombreAss,
    rutaAss: path.join(carpetaSalida, nombreAss),
    nombreVideo,
    rutaVideo: path.join(carpetaSalida, nombreVideo)
  };
}

function escaparRutaFiltroSubtitulosSA(rutaArchivo) {
  return String(rutaArchivo || "")
    .replace(/\\/g, "/")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/,/g, "\\,")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]");
}

async function quemarSubtitulosVideoSA({ video, carpetaSalida, formatoId }) {
  const validacion = validarVideoParaSubtitulosSA(video);

  if (!validacion.ok) {
    return {
      ok: false,
      videoId: video?.id || "",
      nombre: video?.nombre || "Video",
      mensaje: validacion.mensaje
    };
  }

  const rutas = crearRutasSalidaSA({ carpetaSalida, video, formatoId });
  fs.writeFileSync(rutas.rutaAss, validacion.ass, "utf8");

  const filtroSubtitulos = `subtitles='${escaparRutaFiltroSubtitulosSA(rutas.rutaAss)}'`;

  try {
    const resultadoFFmpeg = await ejecutarFFmpeg([
      "-y",
      "-hide_banner",
      "-i",
      validacion.entrada.ruta,
      "-map",
      "0:v:0",
      "-map",
      "0:a?",
      "-vf",
      filtroSubtitulos,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "20",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-movflags",
      "+faststart",
      "-shortest",
      rutas.rutaVideo
    ]);

    const validacionSalida = validarArchivoGeneradoSA(rutas.rutaVideo);

    if (!validacionSalida.ok) {
      return {
        ok: false,
        videoId: video.id || "",
        nombre: video.nombre || "Video",
        mensaje: validacionSalida.mensaje
      };
    }

    return {
      ok: true,
      videoId: video.id || "",
      nombre: video.nombre || rutas.nombreVideo,
      mensaje: `${video.nombre || "Video"}: video subtitulado generado.`,
      videoEntrada: validacion.entrada,
      archivoAss: {
        nombre: rutas.nombreAss,
        ruta: rutas.rutaAss,
        url: pathToFileURL(rutas.rutaAss).href
      },
      videoSubtitulado: {
        id: `sa-video-${video.id || Date.now()}-${Date.now()}`,
        videoId: video.id || "",
        nombre: rutas.nombreVideo,
        ruta: rutas.rutaVideo,
        url: pathToFileURL(rutas.rutaVideo).href,
        extension: "mp4",
        pesoBytes: validacionSalida.stat.size,
        fechaModificacion: validacionSalida.stat.mtimeMs,
        formatoVisual: formatoId,
        origenVideo: validacion.entrada.tipo,
        creadoEn: new Date().toISOString()
      },
      diagnostico: {
        comando: resultadoFFmpeg.comando || "",
        rutaAss: rutas.rutaAss,
        rutaVideo: rutas.rutaVideo
      }
    };
  } catch (error) {
    return {
      ok: false,
      videoId: video.id || "",
      nombre: video.nombre || "Video",
      mensaje: `${video.nombre || "Video"}: no se pudo generar el video subtitulado.`,
      detalle: error.message
    };
  }
}

async function generarVideosSubtituladosSA({ datos, obtenerRutaData, asegurarCarpeta }) {
  const motor = validarMotorFFmpeg();

  if (!motor.ok) return motor;

  const proyecto = datos?.proyecto || null;
  const formatoId = limpiarTextoSA(datos?.formatoId || proyecto?.subtitulosAutomaticos?.formatoVisual || "negro-clasico");
  const videos = Array.isArray(proyecto?.videos) ? proyecto.videos : [];

  if (!proyecto) {
    return { ok: false, mensaje: "No se recibió el proyecto activo." };
  }

  if (!videos.length) {
    return { ok: false, mensaje: "No hay videos para generar subtítulos." };
  }

  const carpetaSalida = obtenerCarpetaSubtitulosSA({ obtenerRutaData, asegurarCarpeta, proyecto });
  const resultados = [];

  for (const video of videos) {
    const resultado = await quemarSubtitulosVideoSA({ video, carpetaSalida, formatoId });
    resultados.push(resultado);
  }

  const exitosos = resultados.filter((resultado) => resultado.ok).length;
  const fallidos = resultados.length - exitosos;

  return {
    ok: exitosos > 0 && fallidos === 0,
    parcial: exitosos > 0 && fallidos > 0,
    mensaje: fallidos
      ? `Se generaron ${exitosos} de ${resultados.length} video(s). Revisa los errores.`
      : `Videos subtitulados generados correctamente: ${exitosos}.`,
    formatoId,
    carpetaSalida,
    resultados,
    total: resultados.length,
    exitosos,
    fallidos
  };
}

async function descargarVideoSubtituladoSA({ datosDescarga, dialog, obtenerVentanaPrincipal }) {
  const videoSubtitulado = datosDescarga?.videoSubtitulado || datosDescarga?.video?.videoSubtitulado || null;
  const rutaOrigen = videoSubtitulado?.ruta || "";

  if (!rutaOrigen || !fs.existsSync(rutaOrigen)) {
    return { ok: false, mensaje: "No se encontró el video subtitulado para descargar." };
  }

  const nombreSugerido = limpiarNombreArchivoSA(datosDescarga?.nombreArchivo || videoSubtitulado.nombre || "video_subtitulado.mp4");
  const resultado = await dialog.showSaveDialog(obtenerVentanaPrincipal(), {
    title: "Guardar video subtitulado",
    defaultPath: nombreSugerido.endsWith(".mp4") ? nombreSugerido : `${nombreSugerido}.mp4`,
    filters: [{ name: "Video MP4", extensions: ["mp4"] }]
  });

  if (resultado.canceled || !resultado.filePath) {
    return { ok: false, cancelado: true, mensaje: "Descarga cancelada." };
  }

  if (path.resolve(rutaOrigen) !== path.resolve(resultado.filePath)) {
    fs.copyFileSync(rutaOrigen, resultado.filePath);
  }

  return {
    ok: true,
    mensaje: "Video subtitulado guardado correctamente.",
    ruta: resultado.filePath,
    url: pathToFileURL(resultado.filePath).href
  };
}

function registrarSubtitulosAutomaticosElectron({
  ipcMain,
  dialog,
  obtenerVentanaPrincipal,
  obtenerRutaData,
  asegurarCarpeta,
  shell
}) {
  if (!ipcMain || !dialog || !obtenerVentanaPrincipal || !obtenerRutaData || !asegurarCarpeta) {
    throw new Error("Faltan dependencias para registrar Subtítulos automáticos en Electron.");
  }

  ipcMain.handle("subtitulos:generar-video", async (_evento, datos) => {
    try {
      return await generarVideosSubtituladosSA({ datos, obtenerRutaData, asegurarCarpeta });
    } catch (error) {
      return {
        ok: false,
        mensaje: "No se pudieron generar los videos subtitulados.",
        detalle: error.message
      };
    }
  });

  ipcMain.handle("subtitulos:descargar-video", async (_evento, datosDescarga) => {
    try {
      return await descargarVideoSubtituladoSA({ datosDescarga, dialog, obtenerVentanaPrincipal });
    } catch (error) {
      return {
        ok: false,
        mensaje: "No se pudo guardar el video subtitulado.",
        detalle: error.message
      };
    }
  });

  ipcMain.handle("subtitulos:abrir-carpeta", async (_evento, rutaCarpeta) => {
    try {
      if (!rutaCarpeta || !fs.existsSync(rutaCarpeta)) {
        return { ok: false, mensaje: "No se encontró la carpeta de videos subtitulados." };
      }

      if (shell?.openPath) await shell.openPath(rutaCarpeta);
      return { ok: true, ruta: rutaCarpeta };
    } catch (error) {
      return { ok: false, mensaje: "No se pudo abrir la carpeta.", detalle: error.message };
    }
  });
}

module.exports = {
  registrarSubtitulosAutomaticosElectron
};

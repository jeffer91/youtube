/* =========================================================
Nombre completo: fin-electron.js
Ruta o ubicación: /src/pantallas/02-formato-inteligente/electron/fin-electron.js
Funciones principales:
- Inspeccionar la orientación y resolución del video original.
- Convertir cualquier video vertical u horizontal a formato cuadrado 1:1.
- Mantener visible todo el contenido sobre un fondo difuminado.
- Generar un MP4 real de 1080 x 1080 mediante FFmpeg.
- Validar que el archivo final exista y tenga contenido.
Con qué se conecta:
- electron/main/main.js
- electron/preload/preload.js
- 02-mejorar-audio/electron/ma-ffmpeg-runner.js
========================================================= */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { pathToFileURL } = require("url");

const {
  validarMotorFFmpeg,
  ejecutarFFmpeg,
  inspeccionarEntrada
} = require("../../02-mejorar-audio/electron/ma-ffmpeg-runner.js");

const TAMANO_CUADRADO = 1080;
const PESO_MINIMO_VALIDO = 1024;

function limpiarTextoFIN(valor) {
  return String(valor || "").trim();
}

function limpiarNombreArchivoFIN(valor) {
  const nombre = limpiarTextoFIN(valor || "video")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return nombre || "video";
}

function crearMarcaTiempoFIN() {
  return new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .slice(0, 19);
}

function obtenerVideoOriginalFIN(video) {
  const originalGuardado = video?.videoOriginal || video?.formatoCuadrado?.original || null;

  if (originalGuardado?.ruta) {
    return originalGuardado;
  }

  return {
    id: video?.id || "",
    nombre: video?.nombre || "video",
    ruta: video?.ruta || "",
    url: video?.url || "",
    extension: video?.extension || "",
    pesoBytes: Number(video?.pesoBytes) || 0,
    fechaModificacion: Number(video?.fechaModificacion) || 0,
    duracionSegundos: Number(video?.duracionSegundos || video?.duracion) || 0,
    duracionTexto: video?.duracionTexto || ""
  };
}

function validarVideoEntradaFIN(video) {
  if (!video || typeof video !== "object") {
    return {
      ok: false,
      mensaje: "No se recibió información del video."
    };
  }

  const original = obtenerVideoOriginalFIN(video);

  if (!original.ruta) {
    return {
      ok: false,
      mensaje: "El video no tiene una ruta original válida."
    };
  }

  if (!fs.existsSync(original.ruta)) {
    return {
      ok: false,
      mensaje: `No se encontró el archivo original: ${original.nombre || original.ruta}`
    };
  }

  return {
    ok: true,
    original
  };
}

function parsearResolucionFIN(resolucion) {
  const coincidencia = limpiarTextoFIN(resolucion).match(/^(\d{2,5})x(\d{2,5})$/i);

  if (!coincidencia) {
    return {
      ancho: 0,
      alto: 0
    };
  }

  return {
    ancho: Number(coincidencia[1]) || 0,
    alto: Number(coincidencia[2]) || 0
  };
}

function extraerRotacionFIN(stderr) {
  const texto = String(stderr || "");
  const coincidencia =
    texto.match(/rotation of\s+(-?\d+(?:\.\d+)?)\s+degrees/i) ||
    texto.match(/rotate\s*:\s*(-?\d+(?:\.\d+)?)/i);

  if (!coincidencia) {
    return 0;
  }

  const rotacion = Number(coincidencia[1]) || 0;
  return ((rotacion % 360) + 360) % 360;
}

function crearDiagnosticoFIN(inspeccion) {
  const resolucionBase = parsearResolucionFIN(inspeccion?.video?.resolucion);
  const rotacion = extraerRotacionFIN(inspeccion?.stderr);
  const intercambiar = rotacion === 90 || rotacion === 270;
  const ancho = intercambiar ? resolucionBase.alto : resolucionBase.ancho;
  const alto = intercambiar ? resolucionBase.ancho : resolucionBase.alto;

  let orientacion = "desconocida";

  if (ancho > 0 && alto > 0) {
    if (ancho === alto) orientacion = "cuadrado";
    else if (ancho > alto) orientacion = "horizontal";
    else orientacion = "vertical";
  }

  return {
    ancho,
    alto,
    resolucion: ancho && alto ? `${ancho}x${alto}` : inspeccion?.video?.resolucion || "",
    orientacion,
    relacionAspecto: ancho && alto ? Number((ancho / alto).toFixed(4)) : 0,
    rotacion,
    duracionSegundos: Number(inspeccion?.duracionSegundos) || 0,
    tieneAudio: Boolean(inspeccion?.tieneAudio),
    codecVideo: inspeccion?.video?.codec || "",
    fps: inspeccion?.video?.fps || ""
  };
}

function obtenerCarpetaSalidaFIN({ obtenerRutaData, asegurarCarpeta }) {
  const carpeta = path.join(
    obtenerRutaData(),
    "procesados",
    "formato-cuadrado"
  );

  asegurarCarpeta(carpeta);
  return carpeta;
}

function crearRutaSalidaFIN({ video, obtenerRutaData, asegurarCarpeta }) {
  const original = obtenerVideoOriginalFIN(video);
  const base = limpiarNombreArchivoFIN(path.parse(original.nombre || "video").name);
  const marcaTiempo = crearMarcaTiempoFIN();
  const unico = crypto.randomBytes(4).toString("hex");
  const nombre = `${base}_cuadrado-1x1_${marcaTiempo}_${unico}.mp4`;
  const carpeta = obtenerCarpetaSalidaFIN({ obtenerRutaData, asegurarCarpeta });

  return {
    nombre,
    ruta: path.join(carpeta, nombre)
  };
}

function borrarArchivoFIN(rutaArchivo) {
  try {
    if (rutaArchivo && fs.existsSync(rutaArchivo)) {
      fs.unlinkSync(rutaArchivo);
    }
  } catch (error) {
    console.warn("[FORMATO CUADRADO] No se pudo borrar archivo incompleto:", error.message);
  }
}

function validarSalidaFIN(rutaSalida) {
  if (!rutaSalida || !fs.existsSync(rutaSalida)) {
    return {
      ok: false,
      mensaje: "FFmpeg terminó, pero no generó el video cuadrado."
    };
  }

  const stat = fs.statSync(rutaSalida);

  if (!stat.size || stat.size <= PESO_MINIMO_VALIDO) {
    return {
      ok: false,
      mensaje: "El video cuadrado se generó vacío o incompleto."
    };
  }

  return {
    ok: true,
    stat
  };
}

function construirFiltroCuadradoFIN() {
  return [
    "[0:v:0]split=2[fin_bg_src][fin_fg_src]",
    `[fin_bg_src]scale=${TAMANO_CUADRADO}:${TAMANO_CUADRADO}:force_original_aspect_ratio=increase,crop=${TAMANO_CUADRADO}:${TAMANO_CUADRADO},boxblur=24:2[fin_bg]`,
    `[fin_fg_src]scale=${TAMANO_CUADRADO}:${TAMANO_CUADRADO}:force_original_aspect_ratio=decrease[fin_fg]`,
    "[fin_bg][fin_fg]overlay=(W-w)/2:(H-h)/2:format=auto,setsar=1,format=yuv420p[fin_out]"
  ].join(";");
}

async function inspeccionarVideoFormatoFIN(video) {
  const validacion = validarVideoEntradaFIN(video);

  if (!validacion.ok) {
    return validacion;
  }

  const motor = validarMotorFFmpeg();

  if (!motor.ok) {
    return motor;
  }

  const inspeccion = await inspeccionarEntrada(validacion.original.ruta);

  if (!inspeccion?.tieneVideo) {
    return {
      ok: false,
      mensaje: "El archivo seleccionado no contiene una pista de video válida."
    };
  }

  return {
    ok: true,
    original: validacion.original,
    diagnostico: crearDiagnosticoFIN(inspeccion)
  };
}

async function convertirVideoCuadradoFIN({
  datos,
  obtenerRutaData,
  asegurarCarpeta
}) {
  const video = datos?.video;
  const validacion = validarVideoEntradaFIN(video);

  if (!validacion.ok) {
    return validacion;
  }

  const motor = validarMotorFFmpeg();

  if (!motor.ok) {
    return motor;
  }

  const inspeccion = await inspeccionarEntrada(validacion.original.ruta);

  if (!inspeccion?.tieneVideo) {
    return {
      ok: false,
      mensaje: "El archivo original no contiene una pista de video válida."
    };
  }

  const diagnosticoOriginal = crearDiagnosticoFIN(inspeccion);
  const salida = crearRutaSalidaFIN({
    video,
    obtenerRutaData,
    asegurarCarpeta
  });

  borrarArchivoFIN(salida.ruta);

  try {
    const resultadoFFmpeg = await ejecutarFFmpeg([
      "-y",
      "-hide_banner",
      "-i",
      validacion.original.ruta,
      "-filter_complex",
      construirFiltroCuadradoFIN(),
      "-map",
      "[fin_out]",
      "-map",
      "0:a?",
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "18",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-movflags",
      "+faststart",
      "-metadata:s:v:0",
      "rotate=0",
      salida.ruta
    ]);

    const validacionSalida = validarSalidaFIN(salida.ruta);

    if (!validacionSalida.ok) {
      borrarArchivoFIN(salida.ruta);
      return validacionSalida;
    }

    const fecha = new Date().toISOString();

    return {
      ok: true,
      mensaje: `${validacion.original.nombre || "Video"} convertido correctamente a cuadrado 1:1.`,
      original: validacion.original,
      diagnosticoOriginal,
      videoCuadrado: {
        id: `fin-${video?.id || Date.now()}-${Date.now()}`,
        videoId: video?.id || "",
        nombre: salida.nombre,
        ruta: salida.ruta,
        url: pathToFileURL(salida.ruta).href,
        extension: "mp4",
        pesoBytes: validacionSalida.stat.size,
        fechaModificacion: validacionSalida.stat.mtimeMs,
        ancho: TAMANO_CUADRADO,
        alto: TAMANO_CUADRADO,
        resolucion: `${TAMANO_CUADRADO}x${TAMANO_CUADRADO}`,
        relacionAspecto: "1:1",
        orientacion: "cuadrado",
        estrategia: "contenido-completo-con-fondo-difuminado",
        fondo: "difuminado",
        sujeto: "centrado",
        codecVideo: "h264",
        codecAudio: inspeccion.tieneAudio ? "aac" : "",
        motor: "ffmpeg-libx264",
        crf: 18,
        aplicado: true,
        creadoEn: fecha
      },
      diagnostico: {
        comando: resultadoFFmpeg?.comando || "",
        orientacionOriginal: diagnosticoOriginal.orientacion,
        resolucionOriginal: diagnosticoOriginal.resolucion,
        resolucionFinal: `${TAMANO_CUADRADO}x${TAMANO_CUADRADO}`
      }
    };
  } catch (error) {
    borrarArchivoFIN(salida.ruta);

    return {
      ok: false,
      mensaje: "No se pudo convertir el video a formato cuadrado.",
      detalle: error.message,
      diagnosticoOriginal
    };
  }
}

function registrarFormatoInteligenteElectron({
  ipcMain,
  obtenerRutaData,
  asegurarCarpeta
}) {
  if (!ipcMain || !obtenerRutaData || !asegurarCarpeta) {
    throw new Error("Faltan dependencias para registrar Formato inteligente.");
  }

  ipcMain.handle("formato:inspeccionar-video", async (_evento, video) => {
    try {
      return await inspeccionarVideoFormatoFIN(video);
    } catch (error) {
      return {
        ok: false,
        mensaje: "No se pudo inspeccionar el formato del video.",
        detalle: error.message
      };
    }
  });

  ipcMain.handle("formato:convertir-cuadrado", async (_evento, datos) => {
    try {
      return await convertirVideoCuadradoFIN({
        datos,
        obtenerRutaData,
        asegurarCarpeta
      });
    } catch (error) {
      return {
        ok: false,
        mensaje: "No se pudo generar el video cuadrado.",
        detalle: error.message
      };
    }
  });
}

module.exports = {
  registrarFormatoInteligenteElectron
};

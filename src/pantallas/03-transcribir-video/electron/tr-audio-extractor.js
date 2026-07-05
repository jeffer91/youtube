/* =========================================================
Nombre completo: tr-audio-extractor.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/electron/tr-audio-extractor.js
Funciones principales:
- Extraer audio WAV desde un video para transcripción.
- Usar FFmpeg desde Electron de forma controlada.
- Validar que el archivo de audio generado exista y tenga peso.
- Devolver errores claros sin mostrar detalles técnicos al usuario final.
Con qué se conecta:
- tr-electron.js
- tr-whisper-runner.js
- @ffmpeg-installer/ffmpeg
========================================================= */

const fs = require("fs");
const path = require("path");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");

ffmpeg.setFfmpegPath(ffmpegPath);

const PESO_MINIMO_WAV_TR = 1024;

function limpiarNombreArchivoTR(texto) {
  return String(texto || "video")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 80) || "video";
}

function crearMarcaTiempoTR() {
  return new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .slice(0, 19);
}

function asegurarCarpetaLocalTR(rutaCarpeta) {
  if (!fs.existsSync(rutaCarpeta)) {
    fs.mkdirSync(rutaCarpeta, { recursive: true });
  }
}

function obtenerRutaAudiosTranscripcionTR({ obtenerRutaData, asegurarCarpeta }) {
  const ruta = path.join(obtenerRutaData(), "procesados", "transcripcion-audio");

  if (typeof asegurarCarpeta === "function") {
    asegurarCarpeta(ruta);
  } else {
    asegurarCarpetaLocalTR(ruta);
  }

  return ruta;
}

function crearRutaWavTR({ video, obtenerRutaData, asegurarCarpeta }) {
  const carpeta = obtenerRutaAudiosTranscripcionTR({ obtenerRutaData, asegurarCarpeta });
  const base = limpiarNombreArchivoTR(path.parse(video?.nombre || "video").name || "video");
  const nombre = `${base}_transcripcion_${crearMarcaTiempoTR()}.wav`;

  return path.join(carpeta, nombre);
}

function obtenerPesoArchivoTR(rutaArchivo) {
  try {
    if (!rutaArchivo || !fs.existsSync(rutaArchivo)) {
      return 0;
    }

    return fs.statSync(rutaArchivo).size || 0;
  } catch (error) {
    return 0;
  }
}

function borrarArchivoSiExisteTR(rutaArchivo) {
  try {
    if (rutaArchivo && fs.existsSync(rutaArchivo)) {
      fs.unlinkSync(rutaArchivo);
    }
  } catch (error) {
    console.warn("No se pudo borrar audio temporal de transcripción:", error.message);
  }
}

function validarVideoEntradaTR(video) {
  if (!video || typeof video !== "object") {
    return {
      ok: false,
      mensaje: "No se recibió información del video."
    };
  }

  if (!video.ruta) {
    return {
      ok: false,
      mensaje: "El video no tiene una ruta local válida."
    };
  }

  if (!fs.existsSync(video.ruta)) {
    return {
      ok: false,
      mensaje: `No se encontró el video original: ${video.nombre || video.ruta}`
    };
  }

  return {
    ok: true
  };
}

function validarAudioExtraidoTR(rutaAudio) {
  const peso = obtenerPesoArchivoTR(rutaAudio);

  if (!rutaAudio || !fs.existsSync(rutaAudio)) {
    return {
      ok: false,
      mensaje: "FFmpeg terminó, pero no generó el audio para transcribir."
    };
  }

  if (peso <= PESO_MINIMO_WAV_TR) {
    borrarArchivoSiExisteTR(rutaAudio);

    return {
      ok: false,
      mensaje: "El audio generado quedó vacío o demasiado pequeño."
    };
  }

  return {
    ok: true,
    pesoBytes: peso
  };
}

function ejecutarExtraccionWavTR({ rutaEntrada, rutaSalida }) {
  return new Promise((resolve) => {
    borrarArchivoSiExisteTR(rutaSalida);

    ffmpeg(rutaEntrada)
      .noVideo()
      .audioCodec("pcm_s16le")
      .audioChannels(1)
      .audioFrequency(16000)
      .format("wav")
      .outputOptions(["-map", "0:a:0?"])
      .on("end", () => {
        resolve({
          ok: true
        });
      })
      .on("error", (error) => {
        resolve({
          ok: false,
          mensaje: "No se pudo extraer el audio del video.",
          detalle: error.message
        });
      })
      .save(rutaSalida);
  });
}

async function extraerAudioParaTranscripcionTR({ video, obtenerRutaData, asegurarCarpeta }) {
  const validacion = validarVideoEntradaTR(video);

  if (!validacion.ok) {
    return validacion;
  }

  const rutaAudio = crearRutaWavTR({
    video,
    obtenerRutaData,
    asegurarCarpeta
  });

  const extraccion = await ejecutarExtraccionWavTR({
    rutaEntrada: video.ruta,
    rutaSalida: rutaAudio
  });

  if (!extraccion.ok) {
    borrarArchivoSiExisteTR(rutaAudio);
    return extraccion;
  }

  const audioValidado = validarAudioExtraidoTR(rutaAudio);

  if (!audioValidado.ok) {
    return audioValidado;
  }

  return {
    ok: true,
    audio: {
      ruta: rutaAudio,
      nombre: path.basename(rutaAudio),
      extension: "wav",
      pesoBytes: audioValidado.pesoBytes,
      creadoEn: new Date().toISOString()
    },
    mensaje: "Audio preparado para transcripción."
  };
}

module.exports = {
  extraerAudioParaTranscripcionTR,
  borrarArchivoSiExisteTR,
  obtenerRutaAudiosTranscripcionTR
};

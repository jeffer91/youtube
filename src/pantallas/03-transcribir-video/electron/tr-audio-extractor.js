/* =========================================================
Nombre completo: tr-audio-extractor.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/electron/tr-audio-extractor.js
Funciones principales:
- Extraer audio WAV desde un video para transcripción.
- Preferir el archivo con audio mejorado cuando exista.
- Usar el video original solo como respaldo si no hay audio mejorado.
- Usar FFmpeg desde @ffmpeg-installer/ffmpeg sin depender de fluent-ffmpeg.
- Validar que el archivo de audio generado exista y tenga peso.
- Devolver errores claros sin mostrar detalles técnicos al usuario final.
Con qué se conecta:
- tr-electron.js
- tr-whisper-runner.js
- @ffmpeg-installer/ffmpeg
========================================================= */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

let ffmpegInstaller = null;

try {
  ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
} catch (error) {
  ffmpegInstaller = null;
}

const PESO_MINIMO_WAV_TR = 1024;
const TIMEOUT_EXTRACCION_MS_TR = 10 * 60 * 1000;

function obtenerRutaFFmpegTR() {
  return ffmpegInstaller?.path || "";
}

function validarMotorFFmpegTR() {
  const rutaFFmpeg = obtenerRutaFFmpegTR();

  if (!rutaFFmpeg) {
    return {
      ok: false,
      mensaje: "FFmpeg no está instalado. Ejecuta npm install y vuelve a abrir la app."
    };
  }

  return {
    ok: true,
    rutaFFmpeg
  };
}

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

function obtenerFuenteTranscripcionTR(video) {
  const rutaMejorada = video?.audioMejorado?.ruta || "";

  if (rutaMejorada && fs.existsSync(rutaMejorada)) {
    return {
      ruta: rutaMejorada,
      nombre: video.audioMejorado.nombre || video.nombre || "video-mejorado.mp4",
      tipo: "audio-mejorado"
    };
  }

  return {
    ruta: video?.ruta || "",
    nombre: video?.nombre || "video.mp4",
    tipo: "original"
  };
}

function crearRutaWavTR({ video, fuente, obtenerRutaData, asegurarCarpeta }) {
  const carpeta = obtenerRutaAudiosTranscripcionTR({ obtenerRutaData, asegurarCarpeta });
  const base = limpiarNombreArchivoTR(path.parse(fuente?.nombre || video?.nombre || "video").name || "video");
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

  const fuente = obtenerFuenteTranscripcionTR(video);

  if (!fuente.ruta) {
    return {
      ok: false,
      mensaje: "El video no tiene una ruta local válida para transcribir."
    };
  }

  if (!fs.existsSync(fuente.ruta)) {
    return {
      ok: false,
      mensaje: `No se encontró el archivo para transcribir: ${fuente.nombre || fuente.ruta}`
    };
  }

  return {
    ok: true,
    fuente
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

function crearResumenErrorFFmpegTR(stderr, codigo) {
  const ultimasLineas = String(stderr || "")
    .split(/\r?\n/)
    .map((linea) => linea.trim())
    .filter(Boolean)
    .slice(-10)
    .join(" | ");

  return ultimasLineas || `FFmpeg terminó con código ${codigo}.`;
}

function ejecutarExtraccionWavTR({ rutaEntrada, rutaSalida }) {
  return new Promise((resolve) => {
    const motor = validarMotorFFmpegTR();

    if (!motor.ok) {
      resolve(motor);
      return;
    }

    borrarArchivoSiExisteTR(rutaSalida);

    const args = [
      "-y",
      "-hide_banner",
      "-i",
      rutaEntrada,
      "-map",
      "0:a:0?",
      "-vn",
      "-acodec",
      "pcm_s16le",
      "-ac",
      "1",
      "-ar",
      "16000",
      "-f",
      "wav",
      rutaSalida
    ];

    const proceso = spawn(motor.rutaFFmpeg, args, {
      windowsHide: true,
      shell: false
    });

    let stderr = "";

    const timeout = setTimeout(() => {
      try {
        proceso.kill("SIGTERM");
      } catch (error) {
        console.warn("No se pudo detener FFmpeg:", error.message);
      }

      borrarArchivoSiExisteTR(rutaSalida);
      resolve({
        ok: false,
        mensaje: "La extracción de audio tardó demasiado y fue detenida.",
        detalle: "Timeout de FFmpeg."
      });
    }, TIMEOUT_EXTRACCION_MS_TR);

    proceso.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proceso.on("error", (error) => {
      clearTimeout(timeout);
      borrarArchivoSiExisteTR(rutaSalida);
      resolve({
        ok: false,
        mensaje: "No se pudo ejecutar FFmpeg para extraer audio.",
        detalle: error.message
      });
    });

    proceso.on("close", (codigo) => {
      clearTimeout(timeout);

      if (codigo === 0) {
        resolve({
          ok: true
        });
        return;
      }

      borrarArchivoSiExisteTR(rutaSalida);
      resolve({
        ok: false,
        mensaje: "No se pudo extraer el audio del video.",
        detalle: crearResumenErrorFFmpegTR(stderr, codigo)
      });
    });
  });
}

async function extraerAudioParaTranscripcionTR({ video, obtenerRutaData, asegurarCarpeta }) {
  const validacion = validarVideoEntradaTR(video);

  if (!validacion.ok) {
    return validacion;
  }

  const rutaAudio = crearRutaWavTR({
    video,
    fuente: validacion.fuente,
    obtenerRutaData,
    asegurarCarpeta
  });

  const extraccion = await ejecutarExtraccionWavTR({
    rutaEntrada: validacion.fuente.ruta,
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
      fuente: validacion.fuente,
      creadoEn: new Date().toISOString()
    },
    mensaje: validacion.fuente.tipo === "audio-mejorado"
      ? "Audio mejorado preparado para transcripción."
      : "Audio original preparado para transcripción."
  };
}

module.exports = {
  extraerAudioParaTranscripcionTR,
  borrarArchivoSiExisteTR,
  obtenerRutaAudiosTranscripcionTR,
  obtenerFuenteTranscripcionTR
};

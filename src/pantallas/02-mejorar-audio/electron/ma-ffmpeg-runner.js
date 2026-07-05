/* =========================================================
Nombre completo: ma-ffmpeg-runner.js
Ruta o ubicación: /src/pantallas/02-mejorar-audio/electron/ma-ffmpeg-runner.js
Funciones principales:
- Cargar FFmpeg desde @ffmpeg-installer/ffmpeg.
- Validar que FFmpeg esté disponible.
- Ejecutar comandos FFmpeg de forma segura.
- Inspeccionar si un video tiene audio y video.
- Medir volumen del audio original.
- Detectar silencios largos.
- Verificar si FFmpeg soporta filtros específicos.
- Procesar un video aplicando filtros de audio.
Con qué se conecta:
- ma-audio-electron.js
- ma-audio-analisis.js
- ma-audio-modelos.js
========================================================= */

const { spawn } = require("child_process");

let ffmpegInstaller = null;

try {
  ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
} catch (error) {
  ffmpegInstaller = null;
}

function obtenerRutaFFmpeg() {
  return ffmpegInstaller?.path || "";
}

function validarMotorFFmpeg() {
  const rutaFFmpeg = obtenerRutaFFmpeg();

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

function limpiarArgumentosFFmpeg(argumentos) {
  if (!Array.isArray(argumentos)) {
    return [];
  }

  return argumentos
    .filter((argumento) => argumento !== null && argumento !== undefined)
    .map((argumento) => String(argumento));
}

function crearResumenError(stderr, codigo) {
  const ultimasLineas = String(stderr || "")
    .split(/\r?\n/)
    .map((linea) => linea.trim())
    .filter(Boolean)
    .slice(-12)
    .join(" | ");

  return ultimasLineas || `FFmpeg terminó con código ${codigo}.`;
}

function ejecutarFFmpeg(argumentos, opciones = {}) {
  return new Promise((resolve, reject) => {
    const motor = validarMotorFFmpeg();

    if (!motor.ok) {
      reject(new Error(motor.mensaje));
      return;
    }

    const argsFinales = limpiarArgumentosFFmpeg(argumentos);

    const proceso = spawn(motor.rutaFFmpeg, argsFinales, {
      windowsHide: true,
      shell: false
    });

    let stdout = "";
    let stderr = "";

    proceso.stdout.on("data", (data) => {
      const texto = data.toString();
      stdout += texto;

      if (typeof opciones.onStdout === "function") {
        opciones.onStdout(texto);
      }
    });

    proceso.stderr.on("data", (data) => {
      const texto = data.toString();
      stderr += texto;

      if (typeof opciones.onStderr === "function") {
        opciones.onStderr(texto);
      }
    });

    proceso.on("error", (error) => {
      reject(error);
    });

    proceso.on("close", (codigo) => {
      const resultado = {
        ok: codigo === 0,
        codigo,
        stdout,
        stderr,
        rutaFFmpeg: motor.rutaFFmpeg,
        argumentos: argsFinales,
        comando: `"${motor.rutaFFmpeg}" ${argsFinales.join(" ")}`
      };

      if (codigo === 0 || opciones.aceptarCodigoError === true) {
        resolve(resultado);
        return;
      }

      reject(new Error(crearResumenError(stderr, codigo)));
    });
  });
}

function buscarLineaAudio(stderr) {
  return String(stderr || "")
    .split(/\r?\n/)
    .find((linea) => /Stream #.*Audio:/i.test(linea)) || "";
}

function buscarLineaVideo(stderr) {
  return String(stderr || "")
    .split(/\r?\n/)
    .find((linea) => /Stream #.*Video:/i.test(linea)) || "";
}

function extraerInfoAudio(stderr) {
  const lineaAudio = buscarLineaAudio(stderr);

  if (!lineaAudio) {
    return {
      tieneAudio: false,
      codec: "",
      sampleRate: "",
      canales: "",
      linea: ""
    };
  }

  const codecMatch = lineaAudio.match(/Audio:\s*([^,]+)/i);
  const sampleRateMatch = lineaAudio.match(/(\d+)\s*Hz/i);
  const canalesMatch = lineaAudio.match(/Hz,\s*([^,]+)/i);

  return {
    tieneAudio: true,
    codec: codecMatch?.[1]?.trim() || "",
    sampleRate: sampleRateMatch?.[1] || "",
    canales: canalesMatch?.[1]?.trim() || "",
    linea: lineaAudio.trim()
  };
}

function extraerInfoVideo(stderr) {
  const lineaVideo = buscarLineaVideo(stderr);

  if (!lineaVideo) {
    return {
      tieneVideo: false,
      codec: "",
      resolucion: "",
      fps: "",
      linea: ""
    };
  }

  const codecMatch = lineaVideo.match(/Video:\s*([^,]+)/i);
  const resolucionMatch = lineaVideo.match(/(\d{2,5}x\d{2,5})/i);
  const fpsMatch = lineaVideo.match(/(\d+(?:\.\d+)?)\s*fps/i);

  return {
    tieneVideo: true,
    codec: codecMatch?.[1]?.trim() || "",
    resolucion: resolucionMatch?.[1] || "",
    fps: fpsMatch?.[1] || "",
    linea: lineaVideo.trim()
  };
}

function extraerDuracionSegundos(stderr) {
  const match = String(stderr || "").match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/i);

  if (!match) {
    return 0;
  }

  const horas = Number(match[1]) || 0;
  const minutos = Number(match[2]) || 0;
  const segundos = Number(match[3]) || 0;

  return Number((horas * 3600 + minutos * 60 + segundos).toFixed(3));
}

function obtenerSalidaNulaFFmpeg() {
  return process.platform === "win32" ? "NUL" : "/dev/null";
}

function extraerNumeroDb(stderr, etiqueta) {
  const regex = new RegExp(`${etiqueta}:\\s*(-?\\d+(?:\\.\\d+)?)\\s*dB`, "i");
  const match = String(stderr || "").match(regex);

  if (!match) {
    return null;
  }

  return Number(match[1]);
}

function extraerSilencios(stderr) {
  const lineas = String(stderr || "").split(/\r?\n/);
  const silencios = [];
  let silencioActual = null;

  lineas.forEach((linea) => {
    const inicioMatch = linea.match(/silence_start:\s*(-?\d+(?:\.\d+)?)/i);
    const finMatch = linea.match(/silence_end:\s*(-?\d+(?:\.\d+)?).*silence_duration:\s*(\d+(?:\.\d+)?)/i);

    if (inicioMatch) {
      silencioActual = {
        inicio: Number(inicioMatch[1]),
        fin: null,
        duracion: null
      };
    }

    if (finMatch) {
      const silencio = silencioActual || {
        inicio: null,
        fin: null,
        duracion: null
      };

      silencio.fin = Number(finMatch[1]);
      silencio.duracion = Number(finMatch[2]);

      silencios.push(silencio);
      silencioActual = null;
    }
  });

  return silencios;
}

async function inspeccionarEntrada(rutaEntrada) {
  const resultado = await ejecutarFFmpeg(["-hide_banner", "-i", rutaEntrada], {
    aceptarCodigoError: true
  });

  const audio = extraerInfoAudio(resultado.stderr);
  const video = extraerInfoVideo(resultado.stderr);
  const duracionSegundos = extraerDuracionSegundos(resultado.stderr);

  return {
    ok: true,
    rutaEntrada,
    tieneAudio: audio.tieneAudio,
    tieneVideo: video.tieneVideo,
    audio,
    video,
    duracionSegundos,
    stderr: resultado.stderr
  };
}

async function medirAudioVolumen(rutaEntrada) {
  const resultado = await ejecutarFFmpeg([
    "-hide_banner",
    "-i",
    rutaEntrada,
    "-vn",
    "-af",
    "volumedetect",
    "-f",
    "null",
    obtenerSalidaNulaFFmpeg()
  ]);

  return {
    ok: true,
    meanVolume: extraerNumeroDb(resultado.stderr, "mean_volume"),
    maxVolume: extraerNumeroDb(resultado.stderr, "max_volume"),
    stderr: resultado.stderr
  };
}

async function detectarSilencios(rutaEntrada) {
  const resultado = await ejecutarFFmpeg([
    "-hide_banner",
    "-i",
    rutaEntrada,
    "-vn",
    "-af",
    "silencedetect=n=-35dB:d=0.5",
    "-f",
    "null",
    obtenerSalidaNulaFFmpeg()
  ]);

  const silencios = extraerSilencios(resultado.stderr);

  return {
    ok: true,
    silencios,
    totalSilencios: silencios.length,
    stderr: resultado.stderr
  };
}

async function obtenerFiltrosFFmpeg() {
  const resultado = await ejecutarFFmpeg(["-hide_banner", "-filters"], {
    aceptarCodigoError: true
  });

  return `${resultado.stdout || ""}\n${resultado.stderr || ""}`;
}

async function ffmpegSoportaFiltro(nombreFiltro) {
  const filtro = String(nombreFiltro || "").trim().toLowerCase();

  if (!filtro) {
    return false;
  }

  try {
    const salida = await obtenerFiltrosFFmpeg();
    return salida.toLowerCase().includes(filtro);
  } catch (error) {
    return false;
  }
}

function unirFiltrosAudio(filtrosAudio) {
  if (!Array.isArray(filtrosAudio) || !filtrosAudio.length) {
    return "anull";
  }

  return filtrosAudio
    .map((filtro) => String(filtro || "").trim())
    .filter(Boolean)
    .join(",");
}

async function procesarVideoConFiltros({
  rutaEntrada,
  rutaSalida,
  filtrosAudio,
  copiarVideo = true
}) {
  const filtros = unirFiltrosAudio(filtrosAudio);
  const opcionesVideo = copiarVideo
    ? ["-c:v", "copy"]
    : ["-c:v", "libx264", "-preset", "veryfast", "-crf", "18"];

  return await ejecutarFFmpeg([
    "-y",
    "-hide_banner",
    "-i",
    rutaEntrada,
    "-map",
    "0:v:0",
    "-map",
    "0:a:0",
    ...opcionesVideo,
    "-af",
    filtros,
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-movflags",
    "+faststart",
    "-shortest",
    rutaSalida
  ]);
}

async function procesarVideoConFiltroComplejo({
  rutaEntrada,
  rutaSalida,
  filtroComplejo,
  copiarVideo = true
}) {
  const filtro = String(filtroComplejo || "").trim() || "[0:a]anull[aout]";
  const opcionesVideo = copiarVideo
    ? ["-c:v", "copy"]
    : ["-c:v", "libx264", "-preset", "veryfast", "-crf", "18"];

  return await ejecutarFFmpeg([
    "-y",
    "-hide_banner",
    "-i",
    rutaEntrada,
    "-filter_complex",
    filtro,
    "-map",
    "0:v:0",
    "-map",
    "[aout]",
    ...opcionesVideo,
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-movflags",
    "+faststart",
    "-shortest",
    rutaSalida
  ]);
}

module.exports = {
  obtenerRutaFFmpeg,
  validarMotorFFmpeg,
  ejecutarFFmpeg,
  inspeccionarEntrada,
  medirAudioVolumen,
  detectarSilencios,
  obtenerFiltrosFFmpeg,
  ffmpegSoportaFiltro,
  unirFiltrosAudio,
  procesarVideoConFiltros,
  procesarVideoConFiltroComplejo
};
/* =========================================================
Nombre completo: tr-whisper-runner.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/electron/tr-whisper-runner.js
Funciones principales:
- Verificar disponibilidad de Whisper local.
- Ejecutar Whisper con un audio WAV preparado.
- Elegir modelo según motor automático: local o preciso.
- Leer salida JSON/TXT/SRT generada por Whisper.
- Normalizar el resultado para la pantalla de transcripción.
- Forzar UTF-8 al ejecutar Python/Whisper en Windows.
Con qué se conecta:
- tr-electron.js
- tr-audio-extractor.js
- child_process
========================================================= */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const WHISPER_TIMEOUT_MS_TR = 20 * 60 * 1000;

const MOTORES_WHISPER_TR = Object.freeze({
  LOCAL: "whisper-local",
  PRECISO: "whisper-preciso",
  RAPIDO_LEGACY: "whisper-rapido",
  EQUILIBRADO_LEGACY: "whisper-equilibrado"
});

function limpiarTextoTR(valor) {
  return String(valor || "").trim();
}

function limpiarTextoVisibleTR(valor) {
  return limpiarTextoTR(valor)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\t ]+/g, " ")
    .replace(/ *\n+ */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function crearIdTR(videoId) {
  return `tr-${limpiarTextoTR(videoId) || "video"}-${Date.now()}`;
}

function asegurarCarpetaTR(rutaCarpeta) {
  if (!fs.existsSync(rutaCarpeta)) {
    fs.mkdirSync(rutaCarpeta, { recursive: true });
  }
}

function obtenerComandoWhisperTR() {
  return process.env.WHISPER_BIN || process.env.WHISPER_COMMAND || "whisper";
}

function crearEntornoWhisperTR(opciones = {}) {
  const envOpciones = opciones?.env && typeof opciones.env === "object"
    ? opciones.env
    : {};

  return {
    ...process.env,
    PYTHONIOENCODING: "utf-8",
    PYTHONUTF8: "1",
    PYTHONUNBUFFERED: "1",
    LANG: process.env.LANG || "C.UTF-8",
    LC_ALL: process.env.LC_ALL || "C.UTF-8",
    ...envOpciones
  };
}

function normalizarMotorWhisperTR(motorId = MOTORES_WHISPER_TR.LOCAL) {
  const motor = limpiarTextoTR(motorId) || MOTORES_WHISPER_TR.LOCAL;

  if (motor === MOTORES_WHISPER_TR.EQUILIBRADO_LEGACY) {
    return MOTORES_WHISPER_TR.LOCAL;
  }

  if (motor === MOTORES_WHISPER_TR.RAPIDO_LEGACY) {
    return MOTORES_WHISPER_TR.LOCAL;
  }

  if (motor === MOTORES_WHISPER_TR.PRECISO) {
    return MOTORES_WHISPER_TR.PRECISO;
  }

  return MOTORES_WHISPER_TR.LOCAL;
}

function obtenerRutaModeloWhisperTR(motorId = MOTORES_WHISPER_TR.LOCAL) {
  const motor = normalizarMotorWhisperTR(motorId);

  if (motor === MOTORES_WHISPER_TR.PRECISO) {
    return limpiarTextoTR(
      process.env.WHISPER_MODEL_PRECISE ||
      process.env.WHISPER_MODEL_PRECISO ||
      "small"
    );
  }

  return limpiarTextoTR(
    process.env.WHISPER_MODEL_LOCAL ||
    process.env.WHISPER_MODEL_BALANCED ||
    process.env.WHISPER_MODEL_EQUILIBRADO ||
    process.env.WHISPER_MODEL ||
    "base"
  );
}

function obtenerNombreMotorWhisperTR(motorId = MOTORES_WHISPER_TR.LOCAL) {
  const motor = normalizarMotorWhisperTR(motorId);

  if (motor === MOTORES_WHISPER_TR.PRECISO) {
    return "Motor 2 · Whisper preciso";
  }

  return "Motor 1 · Whisper local";
}

function obtenerRutaSalidaWhisperTR({ obtenerRutaData, asegurarCarpeta }) {
  const ruta = path.join(obtenerRutaData(), "procesados", "transcripciones-whisper");

  if (typeof asegurarCarpeta === "function") {
    asegurarCarpeta(ruta);
  } else {
    asegurarCarpetaTR(ruta);
  }

  return ruta;
}

function ejecutarComandoTR(comando, argumentos, opciones = {}) {
  return new Promise((resolve) => {
    const salida = [];
    const errores = [];
    const opcionesProceso = {
      ...opciones,
      windowsHide: true,
      shell: false,
      env: crearEntornoWhisperTR(opciones)
    };

    const proceso = spawn(comando, argumentos, opcionesProceso);

    const timeout = setTimeout(() => {
      proceso.kill("SIGTERM");
      resolve({
        ok: false,
        codigo: null,
        stdout: salida.join(""),
        stderr: errores.join(""),
        mensaje: "Whisper tardó demasiado y fue detenido."
      });
    }, WHISPER_TIMEOUT_MS_TR);

    proceso.stdout.on("data", (data) => {
      salida.push(String(data));
    });

    proceso.stderr.on("data", (data) => {
      errores.push(String(data));
    });

    proceso.on("error", (error) => {
      clearTimeout(timeout);
      resolve({
        ok: false,
        codigo: null,
        stdout: salida.join(""),
        stderr: errores.join(""),
        mensaje: error.message
      });
    });

    proceso.on("close", (codigo) => {
      clearTimeout(timeout);
      resolve({
        ok: codigo === 0,
        codigo,
        stdout: salida.join(""),
        stderr: errores.join(""),
        mensaje: codigo === 0 ? "Comando terminado." : `Whisper terminó con código ${codigo}.`
      });
    });
  });
}

async function verificarWhisperLocalTR() {
  const comando = obtenerComandoWhisperTR();
  const resultado = await ejecutarComandoTR(comando, ["--help"]);

  if (!resultado.ok) {
    return {
      ok: false,
      disponible: false,
      comando,
      mensaje: "Whisper local no está disponible. Instálalo o configura WHISPER_BIN.",
      detalle: resultado.stderr || resultado.mensaje
    };
  }

  return {
    ok: true,
    disponible: true,
    comando,
    mensaje: "Whisper local disponible."
  };
}

function buscarArchivoSalidaTR({ carpetaSalida, baseAudio, extension }) {
  const nombreBase = path.parse(baseAudio).name;
  const directo = path.join(carpetaSalida, `${nombreBase}.${extension}`);

  if (fs.existsSync(directo)) {
    return directo;
  }

  const archivos = fs.readdirSync(carpetaSalida)
    .filter((archivo) => archivo.toLowerCase().endsWith(`.${extension}`))
    .map((archivo) => path.join(carpetaSalida, archivo))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

  return archivos[0] || "";
}

function leerJsonWhisperTR(rutaJson) {
  if (!rutaJson || !fs.existsSync(rutaJson)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(rutaJson, "utf8"));
  } catch (error) {
    return null;
  }
}

function leerTextoSiExisteTR(rutaArchivo) {
  if (!rutaArchivo || !fs.existsSync(rutaArchivo)) {
    return "";
  }

  return limpiarTextoVisibleTR(fs.readFileSync(rutaArchivo, "utf8"));
}

function normalizarSegmentosWhisperTR(segmentos) {
  if (!Array.isArray(segmentos)) {
    return [];
  }

  return segmentos.map((segmento, indice) => ({
    id: `whisper-${indice + 1}`,
    indice: indice + 1,
    inicio: Number(segmento.start ?? segmento.inicio ?? 0) || 0,
    fin: Number(segmento.end ?? segmento.fin ?? 0) || 0,
    texto: limpiarTextoVisibleTR(segmento.text ?? segmento.texto ?? "")
  })).filter((segmento) => segmento.texto);
}

function contarPalabrasTR(texto) {
  const limpio = limpiarTextoVisibleTR(texto);

  if (!limpio) {
    return 0;
  }

  return limpio.split(/\s+/).filter(Boolean).length;
}

function crearTranscripcionWhisperTR({ datosJson, textoTxt, audio, video, idioma, motorId, modelo, diagnostico }) {
  const texto = limpiarTextoVisibleTR(datosJson?.text || datosJson?.texto || textoTxt || "");
  const segmentos = normalizarSegmentosWhisperTR(datosJson?.segments || datosJson?.segmentos || []);

  return {
    id: crearIdTR(video?.id),
    videoId: video?.id || "",
    idioma: limpiarTextoTR(idioma) || "es",
    motor: normalizarMotorWhisperTR(motorId),
    motorNombre: obtenerNombreMotorWhisperTR(motorId),
    modelo,
    modo: "real",
    texto,
    segmentos,
    resumen: {
      texto,
      resumen: texto.slice(0, 180),
      totalCaracteres: texto.length,
      totalLineas: texto ? texto.split("\n").length : 0,
      totalPalabras: contarPalabrasTR(texto),
      tieneTexto: Boolean(texto)
    },
    diagnostico,
    archivoAudio: audio || null,
    creadoEn: new Date().toISOString(),
    actualizadoEn: new Date().toISOString()
  };
}

async function transcribirAudioConWhisperTR({ audio, video, idioma, motorId, obtenerRutaData, asegurarCarpeta }) {
  const disponible = await verificarWhisperLocalTR();

  if (!disponible.ok) {
    return disponible;
  }

  if (!audio?.ruta || !fs.existsSync(audio.ruta)) {
    return {
      ok: false,
      mensaje: "No se encontró el audio preparado para Whisper."
    };
  }

  const carpetaSalida = obtenerRutaSalidaWhisperTR({ obtenerRutaData, asegurarCarpeta });
  const comando = obtenerComandoWhisperTR();
  const modelo = obtenerRutaModeloWhisperTR(motorId);
  const nombreMotor = obtenerNombreMotorWhisperTR(motorId);
  const lenguaje = idioma === "auto" ? null : limpiarTextoTR(idioma || "es");
  const argumentos = [
    audio.ruta,
    "--model",
    modelo,
    "--output_dir",
    carpetaSalida,
    "--output_format",
    "all"
  ];

  if (lenguaje) {
    argumentos.push("--language", lenguaje);
  }

  const ejecucion = await ejecutarComandoTR(comando, argumentos);

  if (!ejecucion.ok) {
    return {
      ok: false,
      mensaje: `${nombreMotor} no pudo completar la transcripción.`,
      detalle: ejecucion.stderr || ejecucion.mensaje,
      diagnostico: {
        comando,
        argumentos,
        motorId,
        nombreMotor,
        modelo,
        salida: ejecucion.stdout,
        errores: ejecucion.stderr
      }
    };
  }

  const rutaJson = buscarArchivoSalidaTR({
    carpetaSalida,
    baseAudio: audio.nombre,
    extension: "json"
  });

  const rutaTxt = buscarArchivoSalidaTR({
    carpetaSalida,
    baseAudio: audio.nombre,
    extension: "txt"
  });

  const rutaSrt = buscarArchivoSalidaTR({
    carpetaSalida,
    baseAudio: audio.nombre,
    extension: "srt"
  });

  const datosJson = leerJsonWhisperTR(rutaJson);
  const textoTxt = leerTextoSiExisteTR(rutaTxt);

  if (!datosJson && !textoTxt) {
    return {
      ok: false,
      mensaje: "Whisper terminó, pero no dejó una transcripción legible.",
      diagnostico: {
        rutaJson,
        rutaTxt,
        rutaSrt,
        motorId,
        nombreMotor,
        modelo,
        stdout: ejecucion.stdout,
        stderr: ejecucion.stderr
      }
    };
  }

  const diagnostico = {
    comando,
    modelo,
    motorId: normalizarMotorWhisperTR(motorId),
    nombreMotor,
    carpetaSalida,
    rutaJson,
    rutaTxt,
    rutaSrt,
    stdout: ejecucion.stdout,
    stderr: ejecucion.stderr
  };

  return {
    ok: true,
    mensaje: `Transcripción terminada con ${nombreMotor}.`,
    transcripcion: crearTranscripcionWhisperTR({
      datosJson,
      textoTxt,
      audio,
      video,
      idioma,
      motorId,
      modelo,
      diagnostico
    }),
    diagnostico
  };
}

module.exports = {
  verificarWhisperLocalTR,
  transcribirAudioConWhisperTR,
  obtenerComandoWhisperTR,
  obtenerRutaModeloWhisperTR
};

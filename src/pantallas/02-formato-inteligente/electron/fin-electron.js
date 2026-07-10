/* =========================================================
Nombre completo: fin-electron.js
Ruta o ubicación: /src/pantallas/02-formato-inteligente/electron/fin-electron.js
Funciones principales:
- Inspeccionar orientación, duración y resolución del video original.
- Convertir videos verticales u horizontales a 1080 x 1080.
- Reportar progreso real de FFmpeg a la interfaz.
- Permitir cancelar una conversión y limpiar archivos incompletos.
- Detectar procesos sin actividad y validar la salida final.
Con qué se conecta:
- electron/main/main.js
- electron/preload/preload.js
- 02-mejorar-audio/electron/ma-ffmpeg-runner.js
========================================================= */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawn } = require("child_process");
const { pathToFileURL } = require("url");

const {
  validarMotorFFmpeg,
  inspeccionarEntrada
} = require("../../02-mejorar-audio/electron/ma-ffmpeg-runner.js");

const TAMANO_CUADRADO = 1080;
const TAMANO_FONDO_TRABAJO = 540;
const PESO_MINIMO_VALIDO = 1024;
const LIMITE_SIN_ACTIVIDAD_MS = 90000;
const procesosActivos = new Map();

function limpiarTextoFIN(valor) {
  return String(valor || "").trim();
}

function limpiarNombreArchivoFIN(valor) {
  return limpiarTextoFIN(valor || "video")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, " ")
    .trim() || "video";
}

function crearMarcaTiempoFIN() {
  return new Date().toISOString().replace(/[:.]/g, "-").replace("T", "_").slice(0, 19);
}

function obtenerVideoOriginalFIN(video) {
  const guardado = video?.videoOriginal || video?.formatoCuadrado?.original || null;
  if (guardado?.ruta) return guardado;

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
    return { ok: false, mensaje: "No se recibió información del video." };
  }

  const original = obtenerVideoOriginalFIN(video);
  if (!original.ruta) return { ok: false, mensaje: "El video no tiene una ruta original válida." };
  if (!fs.existsSync(original.ruta)) {
    return { ok: false, mensaje: `No se encontró el archivo original: ${original.nombre || original.ruta}` };
  }

  return { ok: true, original };
}

function parsearResolucionFIN(resolucion) {
  const match = limpiarTextoFIN(resolucion).match(/^(\d{2,5})x(\d{2,5})$/i);
  return match
    ? { ancho: Number(match[1]) || 0, alto: Number(match[2]) || 0 }
    : { ancho: 0, alto: 0 };
}

function extraerRotacionFIN(stderr) {
  const texto = String(stderr || "");
  const match = texto.match(/rotation of\s+(-?\d+(?:\.\d+)?)\s+degrees/i) || texto.match(/rotate\s*:\s*(-?\d+(?:\.\d+)?)/i);
  const rotacion = match ? Number(match[1]) || 0 : 0;
  return ((rotacion % 360) + 360) % 360;
}

function crearDiagnosticoFIN(inspeccion) {
  const base = parsearResolucionFIN(inspeccion?.video?.resolucion);
  const rotacion = extraerRotacionFIN(inspeccion?.stderr);
  const intercambiar = rotacion === 90 || rotacion === 270;
  const ancho = intercambiar ? base.alto : base.ancho;
  const alto = intercambiar ? base.ancho : base.alto;
  let orientacion = "desconocida";

  if (ancho > 0 && alto > 0) {
    orientacion = ancho === alto ? "cuadrado" : ancho > alto ? "horizontal" : "vertical";
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
  const carpeta = path.join(obtenerRutaData(), "procesados", "formato-cuadrado");
  asegurarCarpeta(carpeta);
  return carpeta;
}

function crearRutaSalidaFIN({ video, obtenerRutaData, asegurarCarpeta }) {
  const original = obtenerVideoOriginalFIN(video);
  const base = limpiarNombreArchivoFIN(path.parse(original.nombre || "video").name);
  const nombre = `${base}_cuadrado-1x1_${crearMarcaTiempoFIN()}_${crypto.randomBytes(4).toString("hex")}.mp4`;
  return {
    nombre,
    ruta: path.join(obtenerCarpetaSalidaFIN({ obtenerRutaData, asegurarCarpeta }), nombre)
  };
}

function borrarArchivoFIN(rutaArchivo) {
  try {
    if (rutaArchivo && fs.existsSync(rutaArchivo)) fs.unlinkSync(rutaArchivo);
  } catch (error) {
    console.warn("[FORMATO CUADRADO] No se pudo borrar archivo incompleto:", error.message);
  }
}

function construirFiltroCuadradoFIN() {
  return [
    "[0:v:0]split=2[fin_bg_src][fin_fg_src]",
    `[fin_bg_src]scale=${TAMANO_FONDO_TRABAJO}:${TAMANO_FONDO_TRABAJO}:force_original_aspect_ratio=increase,crop=${TAMANO_FONDO_TRABAJO}:${TAMANO_FONDO_TRABAJO},boxblur=18:2,scale=${TAMANO_CUADRADO}:${TAMANO_CUADRADO}[fin_bg]`,
    `[fin_fg_src]scale=${TAMANO_CUADRADO}:${TAMANO_CUADRADO}:force_original_aspect_ratio=decrease[fin_fg]`,
    "[fin_bg][fin_fg]overlay=(W-w)/2:(H-h)/2:format=auto,setsar=1,format=yuv420p[fin_out]"
  ].join(";");
}

function enviarProgresoFIN(sender, datos) {
  try {
    if (sender && !sender.isDestroyed()) sender.send("formato:progreso", datos);
  } catch (error) {
    console.warn("[FORMATO CUADRADO] No se pudo enviar progreso:", error.message);
  }
}

function segundosDesdeMarcaFIN(valor) {
  const match = String(valor || "").match(/^(\d+):(\d+):(\d+(?:\.\d+)?)$/);
  if (!match) return 0;
  return (Number(match[1]) || 0) * 3600 + (Number(match[2]) || 0) * 60 + (Number(match[3]) || 0);
}

function ejecutarConversionFIN({ rutaFFmpeg, argumentos, processId, rutaSalida, duracionSegundos, sender, nombreVideo }) {
  return new Promise((resolve, reject) => {
    const proceso = spawn(rutaFFmpeg, argumentos, { windowsHide: true, shell: false });
    const registro = {
      proceso,
      rutaSalida,
      cancelado: false,
      ultimaActividad: Date.now()
    };
    procesosActivos.set(processId, registro);

    let stderr = "";
    let buffer = "";
    let ultimoEnvio = 0;
    const datosProgreso = {};

    const avisar = (forzar = false) => {
      const ahora = Date.now();
      if (!forzar && ahora - ultimoEnvio < 180) return;
      ultimoEnvio = ahora;

      const tiempo = Number(datosProgreso.out_time_us || datosProgreso.out_time_ms)
        ? Number(datosProgreso.out_time_us || datosProgreso.out_time_ms) / 1000000
        : segundosDesdeMarcaFIN(datosProgreso.out_time);
      const porcentaje = duracionSegundos > 0
        ? Math.max(0, Math.min(99, Math.round((tiempo / duracionSegundos) * 100)))
        : 0;

      enviarProgresoFIN(sender, {
        processId,
        etapa: "convirtiendo",
        porcentaje,
        tiempoProcesado: Number(tiempo.toFixed(2)),
        duracionSegundos,
        velocidad: datosProgreso.speed || "",
        fps: datosProgreso.fps || "",
        mensaje: `Convirtiendo ${nombreVideo} a 1080 × 1080...`,
        ultimaActividad: new Date().toISOString()
      });
    };

    const leerLineas = (texto) => {
      buffer += texto;
      const lineas = buffer.split(/\r?\n/);
      buffer = lineas.pop() || "";
      lineas.forEach((linea) => {
        const indice = linea.indexOf("=");
        if (indice <= 0) return;
        datosProgreso[linea.slice(0, indice).trim()] = linea.slice(indice + 1).trim();
        registro.ultimaActividad = Date.now();
        if (linea.startsWith("progress=")) avisar(true);
      });
    };

    proceso.stdout.on("data", (data) => leerLineas(data.toString()));
    proceso.stderr.on("data", (data) => {
      registro.ultimaActividad = Date.now();
      stderr += data.toString();
      if (stderr.length > 20000) stderr = stderr.slice(-20000);
    });

    const vigilancia = setInterval(() => {
      if (Date.now() - registro.ultimaActividad > LIMITE_SIN_ACTIVIDAD_MS) {
        registro.cancelado = true;
        proceso.kill("SIGKILL");
        clearInterval(vigilancia);
        reject(new Error("FFmpeg dejó de responder durante más de 90 segundos. Se canceló la conversión."));
      }
    }, 5000);

    proceso.on("error", (error) => {
      clearInterval(vigilancia);
      procesosActivos.delete(processId);
      reject(error);
    });

    proceso.on("close", (codigo) => {
      clearInterval(vigilancia);
      procesosActivos.delete(processId);

      if (registro.cancelado) {
        borrarArchivoFIN(rutaSalida);
        resolve({ ok: false, cancelado: true, mensaje: "Conversión cancelada." });
        return;
      }

      if (codigo !== 0) {
        const detalle = stderr.split(/\r?\n/).map((linea) => linea.trim()).filter(Boolean).slice(-10).join(" | ");
        reject(new Error(detalle || `FFmpeg terminó con código ${codigo}.`));
        return;
      }

      enviarProgresoFIN(sender, {
        processId,
        etapa: "validando",
        porcentaje: 100,
        tiempoProcesado: duracionSegundos,
        duracionSegundos,
        velocidad: datosProgreso.speed || "",
        mensaje: "Conversión terminada. Validando archivo cuadrado...",
        ultimaActividad: new Date().toISOString()
      });
      resolve({ ok: true, codigo, stderr });
    });
  });
}

async function inspeccionarVideoFormatoFIN(video) {
  const validacion = validarVideoEntradaFIN(video);
  if (!validacion.ok) return validacion;

  const motor = validarMotorFFmpeg();
  if (!motor.ok) return motor;

  const inspeccion = await inspeccionarEntrada(validacion.original.ruta);
  if (!inspeccion?.tieneVideo) return { ok: false, mensaje: "El archivo seleccionado no contiene una pista de video válida." };

  return { ok: true, original: validacion.original, diagnostico: crearDiagnosticoFIN(inspeccion) };
}

async function convertirVideoCuadradoFIN({ datos, obtenerRutaData, asegurarCarpeta, sender }) {
  const video = datos?.video;
  const processId = limpiarTextoFIN(datos?.processId) || `fin-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  const validacion = validarVideoEntradaFIN(video);
  if (!validacion.ok) return validacion;

  const motor = validarMotorFFmpeg();
  if (!motor.ok) return motor;

  enviarProgresoFIN(sender, {
    processId,
    etapa: "inspeccionando",
    porcentaje: 0,
    mensaje: `Inspeccionando ${validacion.original.nombre || "video"}...`,
    ultimaActividad: new Date().toISOString()
  });

  const inspeccion = await inspeccionarEntrada(validacion.original.ruta);
  if (!inspeccion?.tieneVideo) return { ok: false, mensaje: "El archivo original no contiene una pista de video válida." };

  const diagnosticoOriginal = crearDiagnosticoFIN(inspeccion);
  const salida = crearRutaSalidaFIN({ video, obtenerRutaData, asegurarCarpeta });
  borrarArchivoFIN(salida.ruta);

  const argumentos = [
    "-y", "-hide_banner", "-nostats",
    "-i", validacion.original.ruta,
    "-filter_complex", construirFiltroCuadradoFIN(),
    "-map", "[fin_out]", "-map", "0:a?",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
    "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
    "-movflags", "+faststart", "-metadata:s:v:0", "rotate=0",
    "-progress", "pipe:1",
    salida.ruta
  ];

  try {
    const proceso = await ejecutarConversionFIN({
      rutaFFmpeg: motor.rutaFFmpeg,
      argumentos,
      processId,
      rutaSalida: salida.ruta,
      duracionSegundos: diagnosticoOriginal.duracionSegundos,
      sender,
      nombreVideo: validacion.original.nombre || "video"
    });

    if (!proceso.ok) return proceso;
    if (!fs.existsSync(salida.ruta) || fs.statSync(salida.ruta).size <= PESO_MINIMO_VALIDO) {
      borrarArchivoFIN(salida.ruta);
      return { ok: false, mensaje: "El video cuadrado se generó vacío o incompleto." };
    }

    const inspeccionSalida = await inspeccionarEntrada(salida.ruta);
    const diagnosticoSalida = crearDiagnosticoFIN(inspeccionSalida);
    if (diagnosticoSalida.ancho !== TAMANO_CUADRADO || diagnosticoSalida.alto !== TAMANO_CUADRADO) {
      borrarArchivoFIN(salida.ruta);
      return { ok: false, mensaje: `La salida no quedó en 1080 × 1080. Resultado: ${diagnosticoSalida.resolucion || "desconocido"}.` };
    }

    const stat = fs.statSync(salida.ruta);
    const fecha = new Date().toISOString();
    return {
      ok: true,
      processId,
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
        pesoBytes: stat.size,
        fechaModificacion: stat.mtimeMs,
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
        preset: "veryfast",
        crf: 20,
        aplicado: true,
        creadoEn: fecha
      },
      diagnostico: {
        orientacionOriginal: diagnosticoOriginal.orientacion,
        resolucionOriginal: diagnosticoOriginal.resolucion,
        resolucionFinal: diagnosticoSalida.resolucion
      }
    };
  } catch (error) {
    borrarArchivoFIN(salida.ruta);
    return {
      ok: false,
      processId,
      mensaje: "No se pudo convertir el video a formato cuadrado.",
      detalle: error.message
    };
  }
}

function cancelarConversionFIN(processId) {
  const id = limpiarTextoFIN(processId);
  const registro = procesosActivos.get(id);
  if (!registro) return { ok: false, mensaje: "No hay una conversión activa con ese identificador." };

  registro.cancelado = true;
  try {
    registro.proceso.kill("SIGKILL");
  } catch (error) {
    return { ok: false, mensaje: "No se pudo cancelar la conversión.", detalle: error.message };
  }

  borrarArchivoFIN(registro.rutaSalida);
  return { ok: true, mensaje: "Cancelación solicitada." };
}

function registrarFormatoInteligenteElectron({ ipcMain, obtenerRutaData, asegurarCarpeta }) {
  if (!ipcMain || !obtenerRutaData || !asegurarCarpeta) {
    throw new Error("Faltan dependencias para registrar Formato inteligente.");
  }

  ipcMain.handle("formato:inspeccionar-video", async (_evento, video) => {
    try {
      return await inspeccionarVideoFormatoFIN(video);
    } catch (error) {
      return { ok: false, mensaje: "No se pudo inspeccionar el video.", detalle: error.message };
    }
  });

  ipcMain.handle("formato:convertir-cuadrado", async (evento, datos) => {
    try {
      return await convertirVideoCuadradoFIN({ datos, obtenerRutaData, asegurarCarpeta, sender: evento.sender });
    } catch (error) {
      return { ok: false, mensaje: "No se pudo generar el video cuadrado.", detalle: error.message };
    }
  });

  ipcMain.handle("formato:cancelar-conversion", async (_evento, processId) => cancelarConversionFIN(processId));
}

module.exports = {
  registrarFormatoInteligenteElectron
};

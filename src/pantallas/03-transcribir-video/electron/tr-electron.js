/* =========================================================
Nombre completo: tr-electron.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/electron/tr-electron.js
Funciones principales:
- Registrar procesos Electron de la pantalla Transcribir video.
- Verificar disponibilidad de Whisper local.
- Extraer audio WAV desde el video seleccionado.
- Ejecutar transcripción real sin fingir resultados.
- Devolver mensajes claros a la interfaz.
Con qué se conecta:
- electron/main/main.js
- electron/preload/preload.js
- tr-audio-extractor.js
- tr-whisper-runner.js
========================================================= */

const fs = require("fs");

const {
  extraerAudioParaTranscripcionTR,
  borrarArchivoSiExisteTR
} = require("./tr-audio-extractor.js");

const {
  verificarWhisperLocalTR,
  transcribirAudioConWhisperTR
} = require("./tr-whisper-runner.js");

function limpiarTextoTR(valor) {
  return String(valor || "").trim();
}

function validarDatosTranscripcionTR(datos) {
  const video = datos?.video || null;
  const idioma = limpiarTextoTR(datos?.idioma || "es") || "es";

  if (!video || typeof video !== "object") {
    return {
      ok: false,
      mensaje: "No se recibió el video para transcribir."
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
      mensaje: "No se encontró el archivo de video en el equipo."
    };
  }

  return {
    ok: true,
    video,
    idioma
  };
}

async function transcribirVideoElectronTR({ datosTranscripcion, obtenerRutaData, asegurarCarpeta }) {
  const validacion = validarDatosTranscripcionTR(datosTranscripcion);

  if (!validacion.ok) {
    return validacion;
  }

  let audioTemporal = null;

  try {
    const audio = await extraerAudioParaTranscripcionTR({
      video: validacion.video,
      obtenerRutaData,
      asegurarCarpeta
    });

    if (!audio.ok) {
      return audio;
    }

    audioTemporal = audio.audio;

    const transcripcion = await transcribirAudioConWhisperTR({
      audio: audio.audio,
      video: validacion.video,
      idioma: validacion.idioma,
      obtenerRutaData,
      asegurarCarpeta
    });

    if (!transcripcion.ok) {
      return transcripcion;
    }

    return {
      ok: true,
      mensaje: transcripcion.mensaje || "Transcripción terminada.",
      transcripcion: transcripcion.transcripcion,
      diagnostico: {
        audio: audio.audio,
        whisper: transcripcion.diagnostico || null
      }
    };
  } catch (error) {
    return {
      ok: false,
      mensaje: "No se pudo completar la transcripción real.",
      detalle: error.message
    };
  } finally {
    if (audioTemporal?.ruta) {
      borrarArchivoSiExisteTR(audioTemporal.ruta);
    }
  }
}

function registrarTranscripcionElectron({ ipcMain, obtenerRutaData, asegurarCarpeta }) {
  if (!ipcMain || !obtenerRutaData || !asegurarCarpeta) {
    throw new Error("Faltan dependencias para registrar Transcripción en Electron.");
  }

  ipcMain.handle("transcripcion:verificar-whisper", async () => {
    try {
      return await verificarWhisperLocalTR();
    } catch (error) {
      return {
        ok: false,
        disponible: false,
        mensaje: "No se pudo verificar Whisper local.",
        detalle: error.message
      };
    }
  });

  ipcMain.handle("transcripcion:transcribir-video", async (_evento, datosTranscripcion) => {
    try {
      return await transcribirVideoElectronTR({
        datosTranscripcion,
        obtenerRutaData,
        asegurarCarpeta
      });
    } catch (error) {
      console.error("Error en transcripción:", error);

      return {
        ok: false,
        mensaje: "No se pudo transcribir el video.",
        detalle: error.message
      };
    }
  });
}

module.exports = {
  registrarTranscripcionElectron,
  transcribirVideoElectronTR
};

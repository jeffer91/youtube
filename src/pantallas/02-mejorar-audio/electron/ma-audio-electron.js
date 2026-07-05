/* =========================================================
Nombre completo: ma-audio-electron.js
Ruta o ubicación: /src/pantallas/02-mejorar-audio/electron/ma-audio-electron.js
Funciones principales:
- Registrar los procesos Electron de la pantalla Mejorar audio.
- Recibir video, controles y perfil desde la interfaz.
- Analizar el audio antes de procesarlo.
- Verificar si existe IA con arnndn y modelo .rnnn.
- Decidir entre DSP natural, IA + DSP o limpieza extrema solo cuando haga falta.
- Procesar con tres intentos: principal, respaldo DSP y ultra seguro.
- Borrar archivos vacíos generados por intentos fallidos.
- Devolver mensajes claros, diagnóstico útil y filtros reales usados.
- Priorizar voz natural para videos hablando a cámara.
Con qué se conecta:
- electron/main/main.js
- electron/preload/preload.js
- ma-ffmpeg-runner.js
- ma-audio-analisis.js
- ma-audio-modelos.js
- ma-audio-decision.js
- ma-audio-filtros.js
========================================================= */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { pathToFileURL } = require("url");

const {
  validarMotorFFmpeg,
  procesarVideoConFiltros
} = require("./ma-ffmpeg-runner.js");

const {
  analizarAudioOriginal
} = require("./ma-audio-analisis.js");

const {
  obtenerCapacidadesIAAudio,
  crearCapacidadesIASinVerificar
} = require("./ma-audio-modelos.js");

const {
  decidirMotorAudio,
  crearDecisionDSPForzada
} = require("./ma-audio-decision.js");

const {
  normalizarControlesAudio,
  existeAlMenosUnaMejora,
  construirFiltrosAudioHibrido
} = require("./ma-audio-filtros.js");

const PERFIL_AUDIO_DEFECTO = "natural";
const PESO_MINIMO_ARCHIVO_VALIDO = 1024;

function limpiarNombreArchivo(texto) {
  const nombre = String(texto || "video")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return nombre || "video";
}

function limpiarPerfilAudio(perfilAudio) {
  const perfil = String(perfilAudio || "").trim();
  return perfil || PERFIL_AUDIO_DEFECTO;
}

function crearMarcaTiempoArchivo() {
  const fecha = new Date();

  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");
  const hour = String(fecha.getHours()).padStart(2, "0");
  const minute = String(fecha.getMinutes()).padStart(2, "0");
  const second = String(fecha.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day}_${hour}-${minute}-${second}`;
}

function obtenerRutaProcesados({ obtenerRutaData, asegurarCarpeta }) {
  const rutaProcesados = path.join(obtenerRutaData(), "procesados");
  asegurarCarpeta(rutaProcesados);
  return rutaProcesados;
}

function obtenerRutaAudioMejorado({ obtenerRutaData, asegurarCarpeta }) {
  const rutaAudioMejorado = path.join(
    obtenerRutaProcesados({ obtenerRutaData, asegurarCarpeta }),
    "audio-mejorado"
  );

  asegurarCarpeta(rutaAudioMejorado);
  return rutaAudioMejorado;
}

function crearRutaSalidaAudio({ video, perfilAudio, obtenerRutaData, asegurarCarpeta }) {
  const carpetaAudioMejorado = obtenerRutaAudioMejorado({
    obtenerRutaData,
    asegurarCarpeta
  });

  const nombreOriginal = limpiarNombreArchivo(video?.nombre || "video");
  const base = limpiarNombreArchivo(path.parse(nombreOriginal).name || "video");
  const perfil = limpiarNombreArchivo(perfilAudio || PERFIL_AUDIO_DEFECTO).toLowerCase();
  const marcaTiempo = crearMarcaTiempoArchivo();
  const unico = crypto.randomBytes(4).toString("hex");
  const nombreSalida = `${base}_audio-${perfil}_${marcaTiempo}_${unico}.mp4`;

  return {
    nombreSalida,
    rutaSalida: path.join(carpetaAudioMejorado, nombreSalida)
  };
}

function borrarArchivoSiExiste(rutaArchivo) {
  try {
    if (rutaArchivo && fs.existsSync(rutaArchivo)) {
      fs.unlinkSync(rutaArchivo);
    }
  } catch (error) {
    console.warn("No se pudo borrar archivo:", error.message);
  }
}

function obtenerPesoArchivo(rutaArchivo) {
  try {
    if (!rutaArchivo || !fs.existsSync(rutaArchivo)) {
      return 0;
    }

    return fs.statSync(rutaArchivo).size || 0;
  } catch (error) {
    return 0;
  }
}

function archivoExisteConPeso(rutaArchivo) {
  return obtenerPesoArchivo(rutaArchivo) > PESO_MINIMO_ARCHIVO_VALIDO;
}

function limpiarArchivosVaciosAudioMejorado({ obtenerRutaData, asegurarCarpeta }) {
  try {
    const carpetaAudioMejorado = obtenerRutaAudioMejorado({
      obtenerRutaData,
      asegurarCarpeta
    });

    const archivos = fs.readdirSync(carpetaAudioMejorado);

    archivos.forEach((archivo) => {
      if (!archivo.toLowerCase().endsWith(".mp4")) {
        return;
      }

      const rutaArchivo = path.join(carpetaAudioMejorado, archivo);
      const stat = fs.statSync(rutaArchivo);

      if (!stat.size || stat.size <= PESO_MINIMO_ARCHIVO_VALIDO) {
        fs.unlinkSync(rutaArchivo);
      }
    });
  } catch (error) {
    console.warn("No se pudo limpiar archivos vacíos:", error.message);
  }
}

function validarVideoEntrada(video) {
  if (!video || typeof video !== "object") {
    return {
      ok: false,
      mensaje: "No se recibió información del video."
    };
  }

  if (!video.ruta) {
    return {
      ok: false,
      mensaje: "No se recibió la ruta del video original."
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

function validarArchivoGenerado(rutaSalida) {
  if (!rutaSalida || !fs.existsSync(rutaSalida)) {
    return {
      ok: false,
      mensaje: "FFmpeg terminó, pero no se generó el archivo procesado."
    };
  }

  const stat = fs.statSync(rutaSalida);

  if (!stat.size || stat.size <= PESO_MINIMO_ARCHIVO_VALIDO) {
    return {
      ok: false,
      mensaje: "El archivo procesado se generó vacío o demasiado pequeño."
    };
  }

  return {
    ok: true,
    stat
  };
}

function limitarTexto(texto, maximo = 900) {
  const valor = String(texto || "").trim();

  if (valor.length <= maximo) {
    return valor;
  }

  return `${valor.slice(0, maximo)}...`;
}

function resumirAnalisisAudio(analisis) {
  if (!analisis) {
    return null;
  }

  return {
    ok: Boolean(analisis.ok),
    mensaje: analisis.mensaje || "",
    inspeccion: {
      tieneAudio: Boolean(analisis.inspeccion?.tieneAudio),
      tieneVideo: Boolean(analisis.inspeccion?.tieneVideo),
      audio: analisis.inspeccion?.audio || null,
      video: analisis.inspeccion?.video || null,
      duracionSegundos: analisis.inspeccion?.duracionSegundos || 0
    },
    volumen: {
      ok: Boolean(analisis.volumen?.ok),
      meanVolume: analisis.volumen?.meanVolume ?? null,
      maxVolume: analisis.volumen?.maxVolume ?? null
    },
    silencios: {
      ok: Boolean(analisis.silencios?.ok),
      totalSilencios: analisis.silencios?.totalSilencios || 0
    },
    diagnostico: analisis.diagnostico || null
  };
}

function resumirCapacidadesIA(capacidadesIA) {
  if (!capacidadesIA) {
    return null;
  }

  return {
    iaDisponible: Boolean(capacidadesIA.iaDisponible),
    mensaje: capacidadesIA.mensaje || "",
    modelo: {
      nombre: capacidadesIA.modelo?.nombre || "",
      existe: Boolean(capacidadesIA.modelo?.existe),
      ruta: capacidadesIA.modelo?.ruta || "",
      pesoBytes: capacidadesIA.modelo?.pesoBytes || 0
    },
    arnndn: {
      soportado: Boolean(capacidadesIA.arnndn?.soportado),
      mensaje: capacidadesIA.arnndn?.mensaje || ""
    }
  };
}

function resumirDecisionAudio(decisionAudio) {
  if (!decisionAudio) {
    return null;
  }

  return {
    perfilAudio: decisionAudio.perfilAudio || PERFIL_AUDIO_DEFECTO,
    motorAudio: decisionAudio.motorAudio || "dsp",
    usaIA: Boolean(decisionAudio.usaIA),
    usarArnndn: Boolean(decisionAudio.usarArnndn),
    intensidadDSP: decisionAudio.intensidadDSP || "baja",
    razon: decisionAudio.razon || ""
  };
}

async function obtenerCapacidadesIAAudioSeguro() {
  try {
    return await obtenerCapacidadesIAAudio();
  } catch (error) {
    const capacidades = crearCapacidadesIASinVerificar();
    capacidades.mensaje = `No se pudo verificar IA. Se usará DSP. Detalle: ${error.message}`;
    return capacidades;
  }
}

async function ejecutarIntentoProcesamiento({
  nombreIntento,
  rutaEntrada,
  rutaSalida,
  filtrosAudio
}) {
  borrarArchivoSiExiste(rutaSalida);

  console.log(`[MA AUDIO] Intento ${nombreIntento}`);
  console.log("[MA AUDIO] Filtros:", filtrosAudio.join(","));

  const resultado = await procesarVideoConFiltros({
    rutaEntrada,
    rutaSalida,
    filtrosAudio,
    copiarVideo: true
  });

  if (!archivoExisteConPeso(rutaSalida)) {
    throw new Error(`${nombreIntento} terminó, pero generó un archivo vacío o demasiado pequeño.`);
  }

  return {
    ok: true,
    nombreIntento,
    resultado,
    filtrosUsados: filtrosAudio
  };
}

async function procesarConRespaldo({
  rutaEntrada,
  rutaSalida,
  filtrosPrincipales,
  filtrosRespaldo,
  filtrosUltraSeguro
}) {
  const errores = [];

  try {
    const principal = await ejecutarIntentoProcesamiento({
      nombreIntento: "principal",
      rutaEntrada,
      rutaSalida,
      filtrosAudio: filtrosPrincipales
    });

    return {
      ok: true,
      modo: "principal",
      filtrosUsados: principal.filtrosUsados,
      resultado: principal.resultado,
      errores
    };
  } catch (errorPrincipal) {
    errores.push({
      intento: "principal",
      mensaje: limitarTexto(errorPrincipal.message)
    });
  }

  try {
    const respaldo = await ejecutarIntentoProcesamiento({
      nombreIntento: "respaldo-dsp",
      rutaEntrada,
      rutaSalida,
      filtrosAudio: filtrosRespaldo
    });

    return {
      ok: true,
      modo: "respaldo-dsp",
      filtrosUsados: respaldo.filtrosUsados,
      resultado: respaldo.resultado,
      errores
    };
  } catch (errorRespaldo) {
    errores.push({
      intento: "respaldo-dsp",
      mensaje: limitarTexto(errorRespaldo.message)
    });
  }

  try {
    const ultraSeguro = await ejecutarIntentoProcesamiento({
      nombreIntento: "ultra-seguro",
      rutaEntrada,
      rutaSalida,
      filtrosAudio: filtrosUltraSeguro
    });

    return {
      ok: true,
      modo: "ultra-seguro",
      filtrosUsados: ultraSeguro.filtrosUsados,
      resultado: ultraSeguro.resultado,
      errores
    };
  } catch (errorUltraSeguro) {
    errores.push({
      intento: "ultra-seguro",
      mensaje: limitarTexto(errorUltraSeguro.message)
    });
  }

  borrarArchivoSiExiste(rutaSalida);

  return {
    ok: false,
    modo: "fallido",
    filtrosUsados: [],
    resultado: null,
    errores,
    mensaje: "No se pudo procesar el audio. Fallaron el filtro principal, el respaldo DSP y el modo ultra seguro."
  };
}

function crearTextoPerfil(perfilAudio) {
  const perfil = limpiarPerfilAudio(perfilAudio);

  if (perfil === "natural") {
    return "Voz Natural";
  }

  if (perfil === "automatico") {
    return "Automático seguro";
  }

  if (perfil === "voz-baja") {
    return "Voz baja";
  }

  if (perfil === "ruido-medio") {
    return "Ruido moderado";
  }

  if (perfil === "ruido-fuerte") {
    return "Ruido fuerte";
  }

  if (perfil === "locutor-pro") {
    return "Locutor Pro";
  }

  if (perfil === "limpieza-extrema") {
    return "Limpieza extrema";
  }

  if (perfil === "personalizado") {
    return "Personalizado";
  }

  return perfil;
}

function crearMensajeFinal({ modo, perfilAudio, decisionAudio }) {
  const perfilTexto = crearTextoPerfil(perfilAudio || decisionAudio?.perfilAudio);

  if (modo === "principal") {
    return `Audio procesado con ${perfilTexto}. Compáralo con el original antes de guardarlo.`;
  }

  if (modo === "respaldo-dsp") {
    return `Audio procesado con respaldo DSP. Compáralo con el original antes de guardarlo.`;
  }

  if (modo === "ultra-seguro") {
    return "Audio procesado con modo ultra seguro. Es una mejora mínima para evitar dañar la voz.";
  }

  return "Audio procesado. Compáralo con el original antes de guardarlo.";
}

async function mejorarVideoConAudio({
  datosMejora,
  obtenerRutaData,
  asegurarCarpeta
}) {
  const motor = validarMotorFFmpeg();

  if (!motor.ok) {
    return motor;
  }

  limpiarArchivosVaciosAudioMejorado({
    obtenerRutaData,
    asegurarCarpeta
  });

  const video = datosMejora?.video || null;
  const perfilAudio = limpiarPerfilAudio(datosMejora?.perfilAudio);
  const controles = normalizarControlesAudio(datosMejora?.controles);
  const validacionVideo = validarVideoEntrada(video);

  if (!validacionVideo.ok) {
    return validacionVideo;
  }

  if (!existeAlMenosUnaMejora(controles)) {
    return {
      ok: false,
      mensaje: "Activa al menos una mejora de audio."
    };
  }

  const analisis = await analizarAudioOriginal(video.ruta);

  if (!analisis.ok) {
    return {
      ok: false,
      mensaje: analisis.mensaje || "No se pudo analizar el audio original.",
      analisisAudio: resumirAnalisisAudio(analisis)
    };
  }

  const capacidadesIA = await obtenerCapacidadesIAAudioSeguro();

  let decisionAudio = decidirMotorAudio({
    perfilAudio,
    analisis,
    capacidadesIA
  });

  if (!decisionAudio?.ok) {
    decisionAudio = crearDecisionDSPForzada("No se pudo decidir motor de audio. Se usará DSP natural.");
  }

  const filtros = construirFiltrosAudioHibrido({
    controles,
    analisis,
    decisionAudio
  });

  const { nombreSalida, rutaSalida } = crearRutaSalidaAudio({
    video,
    perfilAudio: decisionAudio.perfilAudio || perfilAudio,
    obtenerRutaData,
    asegurarCarpeta
  });

  const procesamiento = await procesarConRespaldo({
    rutaEntrada: video.ruta,
    rutaSalida,
    filtrosPrincipales: filtros.filtrosPrincipales,
    filtrosRespaldo: filtros.filtrosRespaldo,
    filtrosUltraSeguro: filtros.filtrosUltraSeguro
  });

  if (!procesamiento.ok) {
    return {
      ok: false,
      mensaje: procesamiento.mensaje,
      detalle: procesamiento.errores.map((error) => `${error.intento}: ${error.mensaje}`).join(" | "),
      erroresProcesamiento: procesamiento.errores,
      analisisAudio: resumirAnalisisAudio(analisis),
      capacidadesIA: resumirCapacidadesIA(capacidadesIA),
      decisionAudio: resumirDecisionAudio(decisionAudio),
      diagnostico: {
        modoProcesamiento: "fallido",
        errores: procesamiento.errores,
        filtrosPrincipales: filtros.filtrosPrincipales,
        filtrosRespaldo: filtros.filtrosRespaldo,
        filtrosUltraSeguro: filtros.filtrosUltraSeguro
      }
    };
  }

  const validacionSalida = validarArchivoGenerado(rutaSalida);

  if (!validacionSalida.ok) {
    borrarArchivoSiExiste(rutaSalida);

    return {
      ok: false,
      mensaje: validacionSalida.mensaje,
      detalle: "El archivo final no existe o quedó vacío después del procesamiento.",
      erroresProcesamiento: procesamiento.errores,
      analisisAudio: resumirAnalisisAudio(analisis),
      capacidadesIA: resumirCapacidadesIA(capacidadesIA),
      decisionAudio: resumirDecisionAudio(decisionAudio)
    };
  }

  const decisionResumida = resumirDecisionAudio(decisionAudio);
  const capacidadesResumidas = resumirCapacidadesIA(capacidadesIA);
  const analisisResumido = resumirAnalisisAudio(analisis);
  const mensajeFinal = crearMensajeFinal({
    modo: procesamiento.modo,
    perfilAudio,
    decisionAudio: decisionResumida
  });

  return {
    ok: true,
    mensaje: mensajeFinal,
    audioMejorado: {
      id: `ma-${video.id || Date.now()}-${Date.now()}`,
      videoId: video.id || "",
      nombre: nombreSalida,
      ruta: rutaSalida,
      url: pathToFileURL(rutaSalida).href,
      extension: "mp4",
      pesoBytes: validacionSalida.stat.size,
      fechaModificacion: validacionSalida.stat.mtimeMs,
      controles: filtros.controles,
      perfilAudio: decisionResumida?.perfilAudio || perfilAudio,
      descripcion: filtros.descripcion,
      filtrosAudio: procesamiento.filtrosUsados,
      filtrosPrincipales: filtros.filtrosPrincipales,
      filtrosRespaldo: filtros.filtrosRespaldo,
      filtrosUltraSeguro: filtros.filtrosUltraSeguro,
      modoProcesamiento: procesamiento.modo,
      decisionAudio: decisionResumida,
      capacidadesIA: capacidadesResumidas,
      analisisAudio: analisisResumido,
      erroresProcesamiento: procesamiento.errores,
      temporal: false,
      motor: decisionResumida?.usaIA ? "ffmpeg-ia-dsp-natural" : "ffmpeg-dsp-natural",
      creadoEn: new Date().toISOString()
    },
    diagnostico: {
      modoProcesamiento: procesamiento.modo,
      errores: procesamiento.errores,
      comando: procesamiento.resultado?.comando || "",
      filtrosUsados: procesamiento.filtrosUsados,
      filtrosPrincipales: filtros.filtrosPrincipales,
      filtrosRespaldo: filtros.filtrosRespaldo,
      filtrosUltraSeguro: filtros.filtrosUltraSeguro,
      decisionAudio: decisionResumida,
      capacidadesIA: capacidadesResumidas,
      analisisAudio: analisisResumido
    }
  };
}

async function descargarVideoMejorado({
  datosDescarga,
  dialog,
  obtenerVentanaPrincipal
}) {
  const audioMejorado = datosDescarga?.audioMejorado || datosDescarga?.video?.audioMejorado || null;
  const rutaOrigen = audioMejorado?.ruta || "";

  if (!rutaOrigen || !fs.existsSync(rutaOrigen)) {
    return {
      ok: false,
      mensaje: "No se encontró el archivo procesado para descargar."
    };
  }

  const nombreSugerido = limpiarNombreArchivo(
    datosDescarga?.nombreArchivo ||
    audioMejorado.nombre ||
    "video_audio_natural.mp4"
  );

  const resultado = await dialog.showSaveDialog(obtenerVentanaPrincipal(), {
    title: "Guardar video procesado",
    defaultPath: nombreSugerido.endsWith(".mp4") ? nombreSugerido : `${nombreSugerido}.mp4`,
    filters: [
      {
        name: "Video MP4",
        extensions: ["mp4"]
      }
    ]
  });

  if (resultado.canceled || !resultado.filePath) {
    return {
      ok: false,
      cancelado: true,
      mensaje: "Descarga cancelada."
    };
  }

  if (path.resolve(rutaOrigen) !== path.resolve(resultado.filePath)) {
    fs.copyFileSync(rutaOrigen, resultado.filePath);
  }

  return {
    ok: true,
    mensaje: "Video guardado correctamente.",
    ruta: resultado.filePath,
    url: pathToFileURL(resultado.filePath).href
  };
}

function registrarMejorarAudioElectron({
  ipcMain,
  dialog,
  obtenerVentanaPrincipal,
  obtenerRutaData,
  asegurarCarpeta
}) {
  if (!ipcMain || !dialog || !obtenerVentanaPrincipal || !obtenerRutaData || !asegurarCarpeta) {
    throw new Error("Faltan dependencias para registrar Mejorar audio en Electron.");
  }

  ipcMain.handle("audio:mejorar-video", async (_evento, datosMejora) => {
    try {
      return await mejorarVideoConAudio({
        datosMejora,
        obtenerRutaData,
        asegurarCarpeta
      });
    } catch (error) {
      console.error("Error al procesar audio:", error);

      return {
        ok: false,
        mensaje: "No se pudo procesar el audio.",
        detalle: error.message
      };
    }
  });

  ipcMain.handle("audio:descargar-video-mejorado", async (_evento, datosDescarga) => {
    try {
      return await descargarVideoMejorado({
        datosDescarga,
        dialog,
        obtenerVentanaPrincipal
      });
    } catch (error) {
      console.error("Error al guardar video procesado:", error);

      return {
        ok: false,
        mensaje: "No se pudo guardar el video procesado.",
        detalle: error.message
      };
    }
  });
}

module.exports = {
  registrarMejorarAudioElectron
};
/* =========================================================
Nombre completo: ma-audio-modelos.js
Ruta o ubicación: /src/pantallas/02-mejorar-audio/electron/ma-audio-modelos.js
Funciones principales:
- Localizar modelos de IA para limpieza de voz.
- Verificar si existe el modelo modelo-voz.rnnn.
- Verificar si FFmpeg tiene soporte para el filtro arnndn.
- Preparar rutas seguras para usarlas dentro de filtros FFmpeg.
- Decidir si la IA puede activarse o si se debe usar solo DSP.
Con qué se conecta:
- ma-audio-electron.js
- ma-audio-decision.js
- ma-audio-filtros.js
- ma-ffmpeg-runner.js
========================================================= */

const fs = require("fs");
const path = require("path");

const {
  ejecutarFFmpeg
} = require("./ma-ffmpeg-runner.js");

const NOMBRE_MODELO_VOZ = "modelo-voz.rnnn";

function obtenerRutaCarpetaModelos() {
  return path.resolve(__dirname, "..", "modelos");
}

function obtenerRutaModeloVoz() {
  return path.join(obtenerRutaCarpetaModelos(), NOMBRE_MODELO_VOZ);
}

function existeArchivo(rutaArchivo) {
  try {
    return Boolean(rutaArchivo && fs.existsSync(rutaArchivo) && fs.statSync(rutaArchivo).isFile());
  } catch (error) {
    return false;
  }
}

function obtenerInfoModeloVoz() {
  const rutaModelo = obtenerRutaModeloVoz();
  const existe = existeArchivo(rutaModelo);

  let pesoBytes = 0;

  if (existe) {
    try {
      pesoBytes = fs.statSync(rutaModelo).size;
    } catch (error) {
      pesoBytes = 0;
    }
  }

  return {
    nombre: NOMBRE_MODELO_VOZ,
    existe,
    ruta: rutaModelo,
    carpeta: obtenerRutaCarpetaModelos(),
    pesoBytes
  };
}

function normalizarTexto(texto) {
  return String(texto || "").toLowerCase();
}

function salidaTieneFiltroArnndn(texto) {
  const salida = normalizarTexto(texto);

  return salida.includes(" arnndn ") ||
    salida.includes("arnndn") ||
    salida.includes("reduce noise from speech");
}

async function verificarSoporteArnndn() {
  try {
    const resultado = await ejecutarFFmpeg(["-hide_banner", "-filters"], {
      aceptarCodigoError: true
    });

    const salida = `${resultado.stdout || ""}\n${resultado.stderr || ""}`;
    const soportado = salidaTieneFiltroArnndn(salida);

    return {
      ok: true,
      soportado,
      mensaje: soportado
        ? "FFmpeg soporta arnndn."
        : "FFmpeg no reporta soporte para arnndn."
    };
  } catch (error) {
    return {
      ok: false,
      soportado: false,
      mensaje: "No se pudo verificar soporte de arnndn.",
      error: error.message
    };
  }
}

function escaparRutaParaFiltroFFmpeg(rutaArchivo) {
  return String(rutaArchivo || "")
    .replace(/\\/g, "/")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'");
}

function crearFiltroArnndn(rutaModelo) {
  const rutaLimpia = escaparRutaParaFiltroFFmpeg(rutaModelo);

  if (!rutaLimpia) {
    return "";
  }

  return `arnndn=m='${rutaLimpia}'`;
}

async function obtenerCapacidadesIAAudio() {
  const modelo = obtenerInfoModeloVoz();
  const arnndn = await verificarSoporteArnndn();

  const iaDisponible = Boolean(modelo.existe && modelo.pesoBytes > 0 && arnndn.soportado);

  let mensaje = "IA no disponible. Se usará DSP.";

  if (iaDisponible) {
    mensaje = "IA disponible. Se puede usar arnndn.";
  } else if (!modelo.existe) {
    mensaje = `Falta el modelo ${NOMBRE_MODELO_VOZ}. Se usará DSP.`;
  } else if (!modelo.pesoBytes) {
    mensaje = `El modelo ${NOMBRE_MODELO_VOZ} está vacío. Se usará DSP.`;
  } else if (!arnndn.soportado) {
    mensaje = "Este FFmpeg no soporta arnndn. Se usará DSP.";
  }

  return {
    ok: true,
    iaDisponible,
    mensaje,
    modelo,
    arnndn,
    filtroArnndn: iaDisponible ? crearFiltroArnndn(modelo.ruta) : ""
  };
}

function crearCapacidadesIASinVerificar() {
  const modelo = obtenerInfoModeloVoz();

  return {
    ok: true,
    iaDisponible: false,
    mensaje: "IA no verificada. Se usará DSP.",
    modelo,
    arnndn: {
      ok: false,
      soportado: false,
      mensaje: "No verificado."
    },
    filtroArnndn: ""
  };
}

module.exports = {
  NOMBRE_MODELO_VOZ,
  obtenerRutaCarpetaModelos,
  obtenerRutaModeloVoz,
  obtenerInfoModeloVoz,
  verificarSoporteArnndn,
  escaparRutaParaFiltroFFmpeg,
  crearFiltroArnndn,
  obtenerCapacidadesIAAudio,
  crearCapacidadesIASinVerificar
};
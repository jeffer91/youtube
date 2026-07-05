/* =========================================================
Nombre completo: gs-electron-config.js
Ruta o ubicación: /electron/services/google-sheets/gs-electron-config.js
Funciones principales:
- Guardar configuración local de Google Sheets fuera del repositorio.
- Leer URL de conexión y Spreadsheet ID desde data/configuracion.
- Evitar claves o URLs privadas dentro del código fuente público.
- Preparar Google Sheets como base principal configurable.
Con qué se conecta:
- gs-http-client.js
- gs-electron.js
- electron/main/main.js
========================================================= */

const fs = require("fs");
const path = require("path");

const NOMBRE_ARCHIVO_CONFIG_GS = "google-sheets.config.json";

function limpiarTextoGS(valor) {
  return String(valor || "").trim();
}

function crearConfigVaciaGS() {
  return {
    proveedor: "GOOGLE_SHEETS",
    rol: "BASE_PRINCIPAL",
    spreadsheetId: "",
    webAppUrl: "",
    estado: "SIN_CONFIGURAR",
    actualizadoEn: new Date().toISOString()
  };
}

function obtenerRutaConfigGoogleSheetsGS({ obtenerRutaData, asegurarCarpeta }) {
  const carpetaConfiguracion = path.join(obtenerRutaData(), "configuracion");

  asegurarCarpeta(carpetaConfiguracion);

  return path.join(carpetaConfiguracion, NOMBRE_ARCHIVO_CONFIG_GS);
}

function leerConfigGoogleSheetsGS({ obtenerRutaData, asegurarCarpeta }) {
  const rutaConfig = obtenerRutaConfigGoogleSheetsGS({ obtenerRutaData, asegurarCarpeta });

  if (!fs.existsSync(rutaConfig)) {
    return {
      ok: true,
      config: crearConfigVaciaGS(),
      rutaConfig,
      existe: false
    };
  }

  try {
    const contenido = fs.readFileSync(rutaConfig, "utf8");
    const datos = JSON.parse(contenido);

    return {
      ok: true,
      config: {
        ...crearConfigVaciaGS(),
        ...datos,
        proveedor: "GOOGLE_SHEETS",
        rol: "BASE_PRINCIPAL"
      },
      rutaConfig,
      existe: true
    };
  } catch (error) {
    return {
      ok: false,
      config: crearConfigVaciaGS(),
      rutaConfig,
      existe: true,
      mensaje: "No se pudo leer la configuración de Google Sheets.",
      detalle: error.message
    };
  }
}

function guardarConfigGoogleSheetsGS({ obtenerRutaData, asegurarCarpeta, config }) {
  const rutaConfig = obtenerRutaConfigGoogleSheetsGS({ obtenerRutaData, asegurarCarpeta });
  const configFinal = {
    ...crearConfigVaciaGS(),
    spreadsheetId: limpiarTextoGS(config?.spreadsheetId),
    webAppUrl: limpiarTextoGS(config?.webAppUrl),
    estado: limpiarTextoGS(config?.estado) || "CONFIGURADO",
    actualizadoEn: new Date().toISOString()
  };

  fs.writeFileSync(rutaConfig, JSON.stringify(configFinal, null, 2), "utf8");

  return {
    ok: true,
    config: configFinal,
    rutaConfig,
    mensaje: "Configuración de Google Sheets guardada."
  };
}

function validarConfigGoogleSheetsGS(config) {
  const errores = [];

  if (!limpiarTextoGS(config?.spreadsheetId)) {
    errores.push("Falta el ID del Google Sheets.");
  }

  if (!limpiarTextoGS(config?.webAppUrl)) {
    errores.push("Falta la URL de conexión para Google Sheets.");
  }

  if (limpiarTextoGS(config?.webAppUrl) && !limpiarTextoGS(config.webAppUrl).startsWith("https://")) {
    errores.push("La URL de conexión debe iniciar con https://.");
  }

  return {
    ok: errores.length === 0,
    errores
  };
}

module.exports = {
  leerConfigGoogleSheetsGS,
  guardarConfigGoogleSheetsGS,
  validarConfigGoogleSheetsGS,
  crearConfigVaciaGS
};

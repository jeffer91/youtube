/* =========================================================
Nombre completo: gs-electron.js
Ruta o ubicación: /electron/services/google-sheets/gs-electron.js
Funciones principales:
- Registrar IPC seguro para Google Sheets desde Electron.
- Leer y guardar configuración local de conexión.
- Probar conexión con Google Sheets.
- Enviar operaciones genéricas hacia la base principal.
Con qué se conecta:
- electron/main/main.js
- electron/preload/preload.js
- gs-electron-config.js
- gs-http-client.js
========================================================= */

const {
  leerConfigGoogleSheetsGS,
  guardarConfigGoogleSheetsGS,
  validarConfigGoogleSheetsGS
} = require("./gs-electron-config.js");

const {
  postJsonGoogleSheetsGS,
  probarConexionGoogleSheetsGS
} = require("./gs-http-client.js");

function ocultarConfigSensibleGS(config) {
  return {
    proveedor: config?.proveedor || "GOOGLE_SHEETS",
    rol: config?.rol || "BASE_PRINCIPAL",
    spreadsheetId: config?.spreadsheetId || "",
    webAppUrlConfigurada: Boolean(config?.webAppUrl),
    estado: config?.estado || "SIN_CONFIGURAR",
    actualizadoEn: config?.actualizadoEn || ""
  };
}

function registrarGoogleSheetsElectron({ ipcMain, obtenerRutaData, asegurarCarpeta }) {
  if (!ipcMain || !obtenerRutaData || !asegurarCarpeta) {
    throw new Error("Faltan dependencias para registrar Google Sheets en Electron.");
  }

  ipcMain.handle("google-sheets:obtener-configuracion", async () => {
    const resultado = leerConfigGoogleSheetsGS({ obtenerRutaData, asegurarCarpeta });

    if (!resultado.ok) {
      return resultado;
    }

    return {
      ok: true,
      config: ocultarConfigSensibleGS(resultado.config),
      existe: resultado.existe,
      rutaConfig: resultado.rutaConfig
    };
  });

  ipcMain.handle("google-sheets:guardar-configuracion", async (_evento, config) => {
    const validacion = validarConfigGoogleSheetsGS(config);

    if (!validacion.ok) {
      return {
        ok: false,
        mensaje: "No se pudo guardar la configuración de Google Sheets.",
        errores: validacion.errores
      };
    }

    const resultado = guardarConfigGoogleSheetsGS({
      obtenerRutaData,
      asegurarCarpeta,
      config
    });

    return {
      ...resultado,
      config: ocultarConfigSensibleGS(resultado.config)
    };
  });

  ipcMain.handle("google-sheets:probar-conexion", async () => {
    const lectura = leerConfigGoogleSheetsGS({ obtenerRutaData, asegurarCarpeta });

    if (!lectura.ok) {
      return lectura;
    }

    const validacion = validarConfigGoogleSheetsGS(lectura.config);

    if (!validacion.ok) {
      return {
        ok: false,
        mensaje: "Google Sheets todavía no está configurado.",
        errores: validacion.errores
      };
    }

    return await probarConexionGoogleSheetsGS({
      config: lectura.config
    });
  });

  ipcMain.handle("google-sheets:enviar-operacion", async (_evento, operacion) => {
    const lectura = leerConfigGoogleSheetsGS({ obtenerRutaData, asegurarCarpeta });

    if (!lectura.ok) {
      return lectura;
    }

    const validacion = validarConfigGoogleSheetsGS(lectura.config);

    if (!validacion.ok) {
      return {
        ok: false,
        mensaje: "Google Sheets no está configurado para enviar operaciones.",
        errores: validacion.errores
      };
    }

    return await postJsonGoogleSheetsGS({
      url: lectura.config.webAppUrl,
      payload: {
        proveedor: "GOOGLE_SHEETS",
        rol: "BASE_PRINCIPAL",
        spreadsheetId: lectura.config.spreadsheetId,
        operacion,
        enviadoEn: new Date().toISOString()
      }
    });
  });
}

module.exports = {
  registrarGoogleSheetsElectron
};

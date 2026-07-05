/* =========================================================
Nombre completo: gs-electron.js
Ruta o ubicación: /electron/services/google-sheets/gs-electron.js
Funciones principales:
- Registrar IPC seguro para Google Sheets desde Electron.
- Leer y guardar configuración local de conexión.
- Probar conexión con Google Sheets.
- Enviar operaciones genéricas hacia la base principal.
- Guardar PendientesSync cuando Google Sheets no responde.
Con qué se conecta:
- electron/main/main.js
- electron/preload/preload.js
- gs-electron-config.js
- gs-http-client.js
- pendientes-sync.repository.js
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

const {
  guardarPendienteSyncLocal
} = require("../sync/pendientes-sync.repository.js");

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

function crearPendienteDesdeOperacionGS({ operacion, mensaje }) {
  return {
    operacion,
    estado: "PENDIENTE",
    intentos: 0,
    ultimoError: mensaje || "No se pudo enviar a Google Sheets.",
    creadoEn: new Date().toISOString(),
    actualizadoEn: new Date().toISOString()
  };
}

function guardarPendienteDesdeGoogleSheetsGS({ obtenerRutaData, asegurarCarpeta, operacion, mensaje }) {
  if (!operacion || typeof operacion !== "object") {
    return null;
  }

  return guardarPendienteSyncLocal({
    obtenerRutaData,
    asegurarCarpeta,
    pendiente: crearPendienteDesdeOperacionGS({
      operacion,
      mensaje
    })
  });
}

function agregarPendienteARespuestaGS({ respuesta, pendiente }) {
  if (!pendiente?.ok) {
    return respuesta;
  }

  return {
    ...respuesta,
    pendienteSync: pendiente.pendiente,
    pendienteSyncGuardado: true,
    rutaPendientesSync: pendiente.rutaArchivo
  };
}

async function enviarOperacionGoogleSheetsGS({ obtenerRutaData, asegurarCarpeta, config, operacion }) {
  const respuesta = await postJsonGoogleSheetsGS({
    url: config.webAppUrl,
    payload: {
      proveedor: "GOOGLE_SHEETS",
      rol: "BASE_PRINCIPAL",
      spreadsheetId: config.spreadsheetId,
      operacion,
      enviadoEn: new Date().toISOString()
    }
  });

  if (respuesta.ok) {
    return respuesta;
  }

  const pendiente = guardarPendienteDesdeGoogleSheetsGS({
    obtenerRutaData,
    asegurarCarpeta,
    operacion,
    mensaje: respuesta.mensaje || respuesta.detalle || "No se pudo enviar a Google Sheets."
  });

  return agregarPendienteARespuestaGS({
    respuesta,
    pendiente
  });
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
      const pendienteLectura = guardarPendienteDesdeGoogleSheetsGS({
        obtenerRutaData,
        asegurarCarpeta,
        operacion,
        mensaje: lectura.mensaje || lectura.detalle || "No se pudo leer la configuración de Google Sheets."
      });

      return agregarPendienteARespuestaGS({
        respuesta: lectura,
        pendiente: pendienteLectura
      });
    }

    const validacion = validarConfigGoogleSheetsGS(lectura.config);

    if (!validacion.ok) {
      const respuesta = {
        ok: false,
        mensaje: "Google Sheets no está configurado para enviar operaciones.",
        errores: validacion.errores
      };

      const pendiente = guardarPendienteDesdeGoogleSheetsGS({
        obtenerRutaData,
        asegurarCarpeta,
        operacion,
        mensaje: respuesta.errores.join(" | ")
      });

      return agregarPendienteARespuestaGS({
        respuesta,
        pendiente
      });
    }

    return await enviarOperacionGoogleSheetsGS({
      obtenerRutaData,
      asegurarCarpeta,
      config: lectura.config,
      operacion
    });
  });
}

module.exports = {
  registrarGoogleSheetsElectron
};

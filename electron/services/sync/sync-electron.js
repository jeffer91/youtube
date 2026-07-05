/* =========================================================
Nombre completo: sync-electron.js
Ruta o ubicación: /electron/services/sync/sync-electron.js
Funciones principales:
- Registrar IPC para consultar PendientesSync.
- Guardar pendientes manuales o automáticos.
- Reintentar operaciones pendientes contra Google Sheets.
- Entregar resumen claro de sincronización.
Con qué se conecta:
- pendientes-sync.repository.js
- gs-electron-config.js
- gs-http-client.js
- electron/main/main.js
- electron/preload/preload.js
========================================================= */

const {
  listarPendientesSyncLocal,
  guardarPendienteSyncLocal,
  actualizarPendienteSyncLocal,
  crearResumenPendientesSync
} = require("./pendientes-sync.repository.js");

const {
  leerConfigGoogleSheetsGS,
  validarConfigGoogleSheetsGS
} = require("../google-sheets/gs-electron-config.js");

const {
  postJsonGoogleSheetsGS
} = require("../google-sheets/gs-http-client.js");

function crearErrorSync(mensaje, errores = []) {
  return {
    ok: false,
    mensaje,
    errores: Array.isArray(errores) ? errores : [String(errores || "")].filter(Boolean)
  };
}

function obtenerPendientesActivos({ obtenerRutaData, asegurarCarpeta }) {
  return listarPendientesSyncLocal({
    obtenerRutaData,
    asegurarCarpeta,
    incluirCompletados: false
  });
}

async function enviarPendienteAGoogleSheets({ config, pendiente }) {
  return await postJsonGoogleSheetsGS({
    url: config.webAppUrl,
    payload: {
      proveedor: "GOOGLE_SHEETS",
      rol: "BASE_PRINCIPAL",
      spreadsheetId: config.spreadsheetId,
      operacion: pendiente.operacion,
      pendienteSyncId: pendiente.id,
      reenviadoEn: new Date().toISOString()
    }
  });
}

async function reintentarPendientesSync({ obtenerRutaData, asegurarCarpeta }) {
  const lecturaConfig = leerConfigGoogleSheetsGS({ obtenerRutaData, asegurarCarpeta });

  if (!lecturaConfig.ok) {
    return lecturaConfig;
  }

  const validacion = validarConfigGoogleSheetsGS(lecturaConfig.config);

  if (!validacion.ok) {
    return crearErrorSync("Google Sheets no está configurado para reintentar pendientes.", validacion.errores);
  }

  const lecturaPendientes = obtenerPendientesActivos({ obtenerRutaData, asegurarCarpeta });

  if (!lecturaPendientes.ok) {
    return lecturaPendientes;
  }

  const resultados = [];

  for (const pendiente of lecturaPendientes.pendientes) {
    const respuesta = await enviarPendienteAGoogleSheets({
      config: lecturaConfig.config,
      pendiente
    });

    if (respuesta.ok) {
      actualizarPendienteSyncLocal({
        obtenerRutaData,
        asegurarCarpeta,
        pendienteId: pendiente.id,
        cambios: {
          estado: "SINCRONIZADO",
          ultimoError: "",
          intentos: Number(pendiente.intentos || 0) + 1,
          sincronizadoEn: new Date().toISOString()
        }
      });

      resultados.push({
        id: pendiente.id,
        ok: true,
        mensaje: respuesta.mensaje || "Pendiente sincronizado."
      });
    } else {
      actualizarPendienteSyncLocal({
        obtenerRutaData,
        asegurarCarpeta,
        pendienteId: pendiente.id,
        cambios: {
          estado: "ERROR",
          ultimoError: respuesta.mensaje || respuesta.detalle || "No se pudo sincronizar.",
          intentos: Number(pendiente.intentos || 0) + 1
        }
      });

      resultados.push({
        id: pendiente.id,
        ok: false,
        mensaje: respuesta.mensaje || "No se pudo sincronizar."
      });
    }
  }

  const resumen = crearResumenPendientesSync({ obtenerRutaData, asegurarCarpeta });

  return {
    ok: true,
    mensaje: "Reintento de PendientesSync terminado.",
    resultados,
    resumen: resumen.resumen || {},
    pendientesActivos: resumen.pendientesActivos || 0
  };
}

function registrarPendientesSyncElectron({ ipcMain, obtenerRutaData, asegurarCarpeta }) {
  if (!ipcMain || !obtenerRutaData || !asegurarCarpeta) {
    throw new Error("Faltan dependencias para registrar PendientesSync.");
  }

  ipcMain.handle("sync:pendientes-listar", async () => {
    return listarPendientesSyncLocal({
      obtenerRutaData,
      asegurarCarpeta,
      incluirCompletados: true
    });
  });

  ipcMain.handle("sync:pendientes-resumen", async () => {
    return crearResumenPendientesSync({
      obtenerRutaData,
      asegurarCarpeta
    });
  });

  ipcMain.handle("sync:pendientes-guardar", async (_evento, pendiente) => {
    return guardarPendienteSyncLocal({
      obtenerRutaData,
      asegurarCarpeta,
      pendiente
    });
  });

  ipcMain.handle("sync:pendientes-reintentar", async () => {
    return await reintentarPendientesSync({
      obtenerRutaData,
      asegurarCarpeta
    });
  });
}

module.exports = {
  registrarPendientesSyncElectron,
  reintentarPendientesSync
};

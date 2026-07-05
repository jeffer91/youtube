/* =========================================================
Nombre completo: gs-http-client.js
Ruta o ubicación: /electron/services/google-sheets/gs-http-client.js
Funciones principales:
- Enviar solicitudes HTTPS hacia el puente de Google Sheets.
- Mantener la conexión en Electron y no en el navegador.
- Normalizar respuestas y errores de conexión.
- Preparar pruebas de conexión y futuras operaciones de lectura/escritura.
Con qué se conecta:
- gs-electron-config.js
- gs-electron.js
========================================================= */

const https = require("https");

const TIEMPO_MAXIMO_MS_GS = 30000;

function limpiarTextoGS(valor) {
  return String(valor || "").trim();
}

function crearRespuestaErrorGS(mensaje, detalle = "") {
  return {
    ok: false,
    mensaje,
    detalle: limpiarTextoGS(detalle)
  };
}

function postJsonGoogleSheetsGS({ url, payload }) {
  return new Promise((resolve) => {
    const urlLimpia = limpiarTextoGS(url);

    if (!urlLimpia || !urlLimpia.startsWith("https://")) {
      resolve(crearRespuestaErrorGS("La URL de Google Sheets no es válida."));
      return;
    }

    const cuerpo = JSON.stringify(payload || {});
    const destino = new URL(urlLimpia);

    const opciones = {
      method: "POST",
      hostname: destino.hostname,
      path: `${destino.pathname}${destino.search}`,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(cuerpo)
      },
      timeout: TIEMPO_MAXIMO_MS_GS
    };

    const solicitud = https.request(opciones, (respuesta) => {
      const partes = [];

      respuesta.on("data", (chunk) => {
        partes.push(chunk);
      });

      respuesta.on("end", () => {
        const texto = Buffer.concat(partes).toString("utf8");

        try {
          const datos = texto ? JSON.parse(texto) : {};
          resolve({
            ok: respuesta.statusCode >= 200 && respuesta.statusCode < 300 && datos.ok !== false,
            statusCode: respuesta.statusCode,
            datos,
            mensaje: datos.mensaje || datos.message || "Respuesta recibida desde Google Sheets."
          });
        } catch (error) {
          resolve({
            ok: respuesta.statusCode >= 200 && respuesta.statusCode < 300,
            statusCode: respuesta.statusCode,
            datos: { texto },
            mensaje: "Respuesta recibida desde Google Sheets, pero no era JSON.",
            detalle: error.message
          });
        }
      });
    });

    solicitud.on("timeout", () => {
      solicitud.destroy();
      resolve(crearRespuestaErrorGS("Google Sheets tardó demasiado en responder."));
    });

    solicitud.on("error", (error) => {
      resolve(crearRespuestaErrorGS("No se pudo conectar con Google Sheets.", error.message));
    });

    solicitud.write(cuerpo);
    solicitud.end();
  });
}

async function probarConexionGoogleSheetsGS({ config }) {
  return await postJsonGoogleSheetsGS({
    url: config?.webAppUrl,
    payload: {
      accion: "probarConexion",
      proveedor: "GOOGLE_SHEETS",
      rol: "BASE_PRINCIPAL",
      spreadsheetId: config?.spreadsheetId || "",
      enviadoEn: new Date().toISOString()
    }
  });
}

module.exports = {
  postJsonGoogleSheetsGS,
  probarConexionGoogleSheetsGS
};

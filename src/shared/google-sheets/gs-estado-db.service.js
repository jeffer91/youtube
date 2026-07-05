/* =========================================================
Nombre completo: gs-estado-db.service.js
Ruta o ubicación: /src/shared/google-sheets/gs-estado-db.service.js
Funciones principales:
- Consultar el estado de Google Sheets como base principal desde la app.
- Guardar configuración de Spreadsheet ID y URL de conexión.
- Probar conexión de Google Sheets desde el manual interno.
- Entregar mensajes claros para diagnóstico visual.
Con qué se conecta:
- mn-app.js
- electron/preload/preload.js
- gs-base-principal.config.js
========================================================= */

import {
  crearMetadataBasePrincipalGS
} from "./gs-base-principal.config.js";

function apiDisponibleGS(nombreFuncion) {
  return Boolean(window.videoEditorAPI && typeof window.videoEditorAPI[nombreFuncion] === "function");
}

function limpiarTextoGS(valor) {
  return String(valor || "").trim();
}

function crearEstadoNoElectronGS() {
  return {
    ok: false,
    conectado: false,
    configurado: false,
    estado: "NO_ELECTRON",
    mensaje: "Abre la app con Electron para configurar Google Sheets.",
    config: null,
    metadata: crearMetadataBasePrincipalGS()
  };
}

export async function obtenerEstadoBasePrincipalGS() {
  if (!apiDisponibleGS("obtenerConfigGoogleSheets")) {
    return crearEstadoNoElectronGS();
  }

  const resultado = await window.videoEditorAPI.obtenerConfigGoogleSheets();
  const config = resultado?.config || null;
  const configurado = Boolean(config?.spreadsheetId && config?.webAppUrlConfigurada);

  return {
    ok: Boolean(resultado?.ok),
    conectado: false,
    configurado,
    estado: configurado ? "CONFIGURADO" : "SIN_CONFIGURAR",
    mensaje: configurado
      ? "Google Sheets está configurado como base principal."
      : "Google Sheets todavía no está configurado.",
    config,
    rutaConfig: resultado?.rutaConfig || "",
    metadata: crearMetadataBasePrincipalGS(),
    errores: resultado?.errores || []
  };
}

export async function guardarConfiguracionBasePrincipalGS({ spreadsheetId, webAppUrl }) {
  if (!apiDisponibleGS("guardarConfigGoogleSheets")) {
    return crearEstadoNoElectronGS();
  }

  const resultado = await window.videoEditorAPI.guardarConfigGoogleSheets({
    spreadsheetId: limpiarTextoGS(spreadsheetId),
    webAppUrl: limpiarTextoGS(webAppUrl),
    estado: "CONFIGURADO"
  });

  return {
    ok: Boolean(resultado?.ok),
    mensaje: resultado?.mensaje || (resultado?.ok ? "Configuración guardada." : "No se pudo guardar la configuración."),
    config: resultado?.config || null,
    errores: resultado?.errores || [],
    metadata: crearMetadataBasePrincipalGS()
  };
}

export async function probarConexionBasePrincipalGS() {
  if (!apiDisponibleGS("probarConexionGoogleSheets")) {
    return crearEstadoNoElectronGS();
  }

  const resultado = await window.videoEditorAPI.probarConexionGoogleSheets();

  return {
    ok: Boolean(resultado?.ok),
    conectado: Boolean(resultado?.ok),
    estado: resultado?.ok ? "CONECTADO" : "ERROR_CONEXION",
    mensaje: resultado?.mensaje || (resultado?.ok ? "Google Sheets conectado." : "No se pudo conectar con Google Sheets."),
    detalle: resultado?.detalle || "",
    datos: resultado?.datos || null,
    errores: resultado?.errores || [],
    metadata: crearMetadataBasePrincipalGS()
  };
}

export function crearTextoEstadoBasePrincipalGS(estado) {
  if (!estado) {
    return "Estado no disponible.";
  }

  if (estado.conectado) {
    return "Conectado a Google Sheets.";
  }

  if (estado.configurado) {
    return "Configurado, pendiente de prueba de conexión.";
  }

  return estado.mensaje || "Google Sheets pendiente de configurar.";
}

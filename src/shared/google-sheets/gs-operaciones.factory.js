/* =========================================================
Nombre completo: gs-operaciones.factory.js
Ruta o ubicación: /src/shared/google-sheets/gs-operaciones.factory.js
Funciones principales:
- Crear operaciones normalizadas para enviar a Google Sheets.
- Mantener un formato único para guardar, actualizar y diagnosticar datos.
- Evitar que cada pantalla arme payloads diferentes.
- Preparar cola de sincronización futura si Google Sheets no responde.
Con qué se conecta:
- gs-proyectos.repository.js
- gs-registros.mapper.js
- electron/services/google-sheets/gs-electron.js
========================================================= */

import {
  GS_BASE_PRINCIPAL_CONFIG
} from "./gs-base-principal.config.js";

function limpiarTextoGS(valor) {
  return String(valor || "").trim();
}

function crearIdOperacionGS(tipo = "operacion") {
  return `gs-${limpiarTextoGS(tipo) || "operacion"}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function crearOperacionGoogleSheetsGS({
  tipo,
  entidad,
  payload,
  origen = "electron",
  prioridad = "NORMAL"
} = {}) {
  return {
    id: crearIdOperacionGS(tipo),
    tipo: limpiarTextoGS(tipo),
    entidad: limpiarTextoGS(entidad),
    proveedor: GS_BASE_PRINCIPAL_CONFIG.proveedor,
    rol: GS_BASE_PRINCIPAL_CONFIG.rol,
    versionContrato: GS_BASE_PRINCIPAL_CONFIG.versionContrato,
    prioridad: limpiarTextoGS(prioridad) || "NORMAL",
    origen: limpiarTextoGS(origen) || "electron",
    payload: payload || {},
    creadoEn: new Date().toISOString()
  };
}

export function crearOperacionGuardarProyectoGS(payload) {
  return crearOperacionGoogleSheetsGS({
    tipo: "guardarProyectoCompleto",
    entidad: "proyecto",
    payload,
    prioridad: "ALTA"
  });
}

export function crearOperacionActualizarProyectoGS(payload) {
  return crearOperacionGoogleSheetsGS({
    tipo: "actualizarProyecto",
    entidad: "proyecto",
    payload,
    prioridad: "ALTA"
  });
}

export function crearOperacionPendienteSyncGS({ operacion, error }) {
  return {
    id: crearIdOperacionGS("pendiente-sync"),
    accion: operacion?.tipo || "operacionPendiente",
    hoja: "PendientesSync",
    registroId: operacion?.id || "",
    payloadJson: JSON.stringify(operacion || {}),
    intentos: 0,
    ultimoError: limpiarTextoGS(error?.message || error?.mensaje || error || ""),
    estado: "PENDIENTE",
    creadoEn: new Date().toISOString(),
    actualizadoEn: new Date().toISOString(),
    origen: "electron",
    versionContrato: GS_BASE_PRINCIPAL_CONFIG.versionContrato
  };
}

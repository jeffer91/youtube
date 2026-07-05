/* =========================================================
Nombre completo: gs-proyectos.repository.js
Ruta o ubicación: /src/shared/google-sheets/gs-proyectos.repository.js
Funciones principales:
- Guardar proyectos usando Google Sheets como base principal.
- Mantener JSON local solo como respaldo temporal.
- Crear un ID único antes de guardar para que Sheets y JSON usen el mismo proyecto.
- Usar PendientesSync real cuando Google Sheets no responde.
Con qué se conecta:
- gs-registros.mapper.js
- gs-operaciones.factory.js
- cp-guardar.js
- electron/preload/preload.js
- electron/services/sync
========================================================= */

import {
  crearPayloadProyectoCompletoGS
} from "./gs-registros.mapper.js";

import {
  crearOperacionGuardarProyectoGS,
  crearOperacionPendienteSyncGS
} from "./gs-operaciones.factory.js";

function limpiarTextoGS(valor) {
  return String(valor || "").trim();
}

function limpiarNombreProyectoGS(valor) {
  return limpiarTextoGS(valor)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "proyecto";
}

export function crearIdProyectoGoogleSheetsGS(nombreProyecto) {
  const marcaTiempo = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .slice(0, 19);

  return `${marcaTiempo}_${limpiarNombreProyectoGS(nombreProyecto)}`;
}

export function asegurarProyectoConIdGoogleSheetsGS(proyecto) {
  const base = proyecto && typeof proyecto === "object" ? proyecto : {};

  return {
    ...base,
    id: limpiarTextoGS(base.id) || crearIdProyectoGoogleSheetsGS(base.nombre),
    videos: Array.isArray(base.videos) ? base.videos : [],
    capas: Array.isArray(base.capas) ? base.capas : [],
    pantallaActual: limpiarTextoGS(base.pantallaActual) || "02-mejorar-audio",
    actualizadoEn: new Date().toISOString()
  };
}

function apiGoogleSheetsDisponibleGS() {
  return Boolean(window.videoEditorAPI?.enviarOperacionGoogleSheets);
}

function apiRespaldoLocalDisponibleGS() {
  return Boolean(window.videoEditorAPI?.guardarProyecto);
}

async function enviarProyectoAGoogleSheetsGS(proyecto) {
  const payload = crearPayloadProyectoCompletoGS(proyecto);
  const operacion = crearOperacionGuardarProyectoGS(payload);

  if (!apiGoogleSheetsDisponibleGS()) {
    return {
      ok: false,
      mensaje: "Google Sheets no está disponible desde la app. Abre el programa con Electron.",
      pendienteSync: crearOperacionPendienteSyncGS({
        operacion,
        error: "API de Google Sheets no disponible."
      }),
      pendienteSyncGuardado: false
    };
  }

  const resultado = await window.videoEditorAPI.enviarOperacionGoogleSheets(operacion);

  if (!resultado?.ok) {
    return {
      ok: false,
      mensaje: resultado?.mensaje || "No se pudo guardar en Google Sheets.",
      detalle: resultado?.detalle || "",
      errores: resultado?.errores || [],
      operacion,
      pendienteSync: resultado?.pendienteSync || crearOperacionPendienteSyncGS({
        operacion,
        error: resultado?.mensaje || resultado?.detalle || "Error al guardar en Google Sheets."
      }),
      pendienteSyncGuardado: Boolean(resultado?.pendienteSyncGuardado)
    };
  }

  return {
    ok: true,
    mensaje: resultado.mensaje || "Proyecto guardado en Google Sheets.",
    respuesta: resultado,
    operacion,
    pendienteSync: null,
    pendienteSyncGuardado: false
  };
}

async function guardarRespaldoLocalProyectoGS(proyecto) {
  if (!apiRespaldoLocalDisponibleGS()) {
    return {
      ok: false,
      mensaje: "No se pudo guardar respaldo local del proyecto."
    };
  }

  return await window.videoEditorAPI.guardarProyecto(proyecto);
}

export async function guardarProyectoBasePrincipalGS(proyectoEntrada) {
  const proyecto = asegurarProyectoConIdGoogleSheetsGS(proyectoEntrada);
  const resultadoSheets = await enviarProyectoAGoogleSheetsGS(proyecto);
  const resultadoLocal = await guardarRespaldoLocalProyectoGS(proyecto);

  if (resultadoSheets.ok) {
    return {
      ok: true,
      proyecto: resultadoLocal?.proyecto || proyecto,
      rutaProyecto: resultadoLocal?.rutaProyecto || "",
      rutaArchivoProyecto: resultadoLocal?.rutaArchivoProyecto || "",
      basePrincipal: "GOOGLE_SHEETS",
      guardadoEnGoogleSheets: true,
      respaldoLocal: Boolean(resultadoLocal?.ok),
      pendienteSync: null,
      pendienteSyncGuardado: false,
      mensajes: [resultadoSheets.mensaje].filter(Boolean),
      errores: resultadoLocal?.ok ? [] : [resultadoLocal?.mensaje || "El respaldo local no se pudo guardar."].filter(Boolean)
    };
  }

  if (resultadoLocal?.ok) {
    return {
      ok: true,
      proyecto: resultadoLocal.proyecto || proyecto,
      rutaProyecto: resultadoLocal.rutaProyecto || "",
      rutaArchivoProyecto: resultadoLocal.rutaArchivoProyecto || "",
      basePrincipal: "GOOGLE_SHEETS",
      guardadoEnGoogleSheets: false,
      respaldoLocal: true,
      pendienteSync: resultadoSheets.pendienteSync || null,
      pendienteSyncGuardado: Boolean(resultadoSheets.pendienteSyncGuardado),
      mensajes: [
        "Proyecto guardado como respaldo local.",
        resultadoSheets.pendienteSyncGuardado
          ? "Google Sheets queda en PendientesSync para reintentar."
          : "Google Sheets queda pendiente de sincronización."
      ],
      errores: [resultadoSheets.mensaje || "No se pudo guardar en Google Sheets."]
    };
  }

  return {
    ok: false,
    proyecto: null,
    rutaProyecto: "",
    rutaArchivoProyecto: "",
    basePrincipal: "GOOGLE_SHEETS",
    guardadoEnGoogleSheets: false,
    respaldoLocal: false,
    pendienteSync: resultadoSheets.pendienteSync || null,
    pendienteSyncGuardado: Boolean(resultadoSheets.pendienteSyncGuardado),
    mensajes: [],
    errores: [
      resultadoSheets.mensaje || "No se pudo guardar en Google Sheets.",
      resultadoLocal?.mensaje || "No se pudo guardar respaldo local."
    ].filter(Boolean)
  };
}

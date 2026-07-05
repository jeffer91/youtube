/* =========================================================
Nombre completo: gs-hojas.contrato.js
Ruta o ubicación: /src/shared/google-sheets/gs-hojas.contrato.js
Funciones principales:
- Definir el contrato oficial de hojas y columnas para Google Sheets.
- Servir como guía única para guardar y leer datos.
- Evitar columnas duplicadas o nombres improvisados.
- Preparar la migración de JSON local a Google Sheets.
Con qué se conecta:
- gs-base-principal.config.js
- gs-registros.mapper.js
- Bloques futuros de repositorios Google Sheets
========================================================= */

import {
  GS_BASE_PRINCIPAL_CONFIG
} from "./gs-base-principal.config.js";

const H = GS_BASE_PRINCIPAL_CONFIG.hojas;

export const GS_COLUMNAS_BASE = Object.freeze([
  "id",
  "estado",
  "creadoEn",
  "actualizadoEn",
  "origen",
  "versionContrato"
]);

export const GS_CONTRATO_HOJAS = Object.freeze({
  [H.PROYECTOS]: Object.freeze([
    "id",
    "nombre",
    "estilo",
    "pantallaActual",
    "totalVideos",
    "estado",
    "creadoEn",
    "actualizadoEn",
    "origen",
    "versionContrato"
  ]),

  [H.VIDEOS]: Object.freeze([
    "id",
    "proyectoId",
    "orden",
    "nombre",
    "ruta",
    "url",
    "extension",
    "pesoBytes",
    "fechaModificacion",
    "estado",
    "creadoEn",
    "actualizadoEn",
    "origen",
    "versionContrato"
  ]),

  [H.CAPAS]: Object.freeze([
    "id",
    "proyectoId",
    "videoId",
    "tipo",
    "nombre",
    "ruta",
    "metadataJson",
    "estado",
    "creadoEn",
    "actualizadoEn",
    "origen",
    "versionContrato"
  ]),

  [H.AUDIOS]: Object.freeze([
    "id",
    "proyectoId",
    "videoId",
    "motor",
    "modo",
    "rutaOriginal",
    "rutaProcesada",
    "diagnosticoJson",
    "estado",
    "creadoEn",
    "actualizadoEn",
    "origen",
    "versionContrato"
  ]),

  [H.TRANSCRIPCIONES]: Object.freeze([
    "id",
    "proyectoId",
    "videoId",
    "idioma",
    "motor",
    "modo",
    "texto",
    "segmentosJson",
    "resumenJson",
    "diagnosticoJson",
    "estado",
    "creadoEn",
    "actualizadoEn",
    "origen",
    "versionContrato"
  ]),

  [H.SUBTITULOS]: Object.freeze([
    "id",
    "proyectoId",
    "videoId",
    "transcripcionId",
    "formato",
    "contenido",
    "segmentosJson",
    "estado",
    "creadoEn",
    "actualizadoEn",
    "origen",
    "versionContrato"
  ]),

  [H.EXPORTACIONES]: Object.freeze([
    "id",
    "proyectoId",
    "videoId",
    "tipo",
    "formato",
    "nombreArchivo",
    "rutaArchivo",
    "metadataJson",
    "estado",
    "creadoEn",
    "actualizadoEn",
    "origen",
    "versionContrato"
  ]),

  [H.PENDIENTES_SYNC]: Object.freeze([
    "id",
    "accion",
    "hoja",
    "registroId",
    "payloadJson",
    "intentos",
    "ultimoError",
    "estado",
    "creadoEn",
    "actualizadoEn",
    "origen",
    "versionContrato"
  ]),

  [H.LOGS]: Object.freeze([
    "id",
    "nivel",
    "modulo",
    "mensaje",
    "detalleJson",
    "estado",
    "creadoEn",
    "actualizadoEn",
    "origen",
    "versionContrato"
  ])
});

export function obtenerColumnasHojaGS(nombreHoja) {
  return GS_CONTRATO_HOJAS[nombreHoja] || [];
}

export function obtenerNombresHojasGS() {
  return Object.keys(GS_CONTRATO_HOJAS);
}

export function hojaExisteEnContratoGS(nombreHoja) {
  return Boolean(GS_CONTRATO_HOJAS[nombreHoja]);
}

export function crearResumenContratoGS() {
  return obtenerNombresHojasGS().map((nombreHoja) => ({
    hoja: nombreHoja,
    totalColumnas: obtenerColumnasHojaGS(nombreHoja).length,
    columnas: obtenerColumnasHojaGS(nombreHoja)
  }));
}

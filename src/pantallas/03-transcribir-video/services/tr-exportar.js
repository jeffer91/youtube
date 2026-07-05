/* =========================================================
Nombre completo: tr-exportar.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/services/tr-exportar.js
Funciones principales:
- Preparar exportaciones de transcripción en TXT, SRT y JSON.
- Generar nombres de archivo seguros.
- Validar que exista transcripción antes de exportar.
Con qué se conecta:
- tr-service.js
- tr-txt.js
- tr-srt.js
- tr-json.js
========================================================= */

import {
  crearNombreExportacionTR,
  limpiarTextoTR
} from "../helpers/tr-texto.js";

import {
  generarTxtTranscripcionTR
} from "../formatos/tr-txt.js";

import {
  generarSrtTranscripcionTR
} from "../formatos/tr-srt.js";

import {
  generarJsonTranscripcionTR
} from "../formatos/tr-json.js";

import {
  validarResultadoTranscripcionTR
} from "../validaciones/tr-validar.js";

const FORMATOS_EXPORTACION_TR = Object.freeze({
  TXT: "txt",
  SRT: "srt",
  JSON: "json"
});

export function obtenerFormatosExportacionTR() {
  return [
    {
      id: FORMATOS_EXPORTACION_TR.TXT,
      nombre: "TXT",
      descripcion: "Texto limpio para copiar o revisar.",
      mime: "text/plain"
    },
    {
      id: FORMATOS_EXPORTACION_TR.SRT,
      nombre: "SRT",
      descripcion: "Subtítulos con tiempos para la siguiente pantalla.",
      mime: "application/x-subrip"
    },
    {
      id: FORMATOS_EXPORTACION_TR.JSON,
      nombre: "JSON",
      descripcion: "Datos completos con segmentos y diagnóstico.",
      mime: "application/json"
    }
  ];
}

export function obtenerFormatoExportacionTR(formatoId) {
  const formato = limpiarTextoTR(formatoId || FORMATOS_EXPORTACION_TR.TXT).toLowerCase();
  return obtenerFormatosExportacionTR().find((item) => item.id === formato) || null;
}

function crearContenidoExportacionTR({ formatoId, proyecto, video, transcripcion }) {
  if (formatoId === FORMATOS_EXPORTACION_TR.SRT) {
    return generarSrtTranscripcionTR(transcripcion);
  }

  if (formatoId === FORMATOS_EXPORTACION_TR.JSON) {
    return generarJsonTranscripcionTR({ proyecto, video, transcripcion });
  }

  return generarTxtTranscripcionTR({ proyecto, video, transcripcion });
}

export function prepararExportacionTranscripcionTR({
  formatoId = FORMATOS_EXPORTACION_TR.TXT,
  proyecto,
  video,
  transcripcion
} = {}) {
  const formato = obtenerFormatoExportacionTR(formatoId);

  if (!formato) {
    return {
      ok: false,
      exportacion: null,
      errores: ["El formato de exportación no es válido."]
    };
  }

  const validacion = validarResultadoTranscripcionTR(transcripcion);

  if (!validacion.ok) {
    return {
      ok: false,
      exportacion: null,
      errores: validacion.errores
    };
  }

  const contenido = crearContenidoExportacionTR({
    formatoId: formato.id,
    proyecto,
    video,
    transcripcion
  });

  if (!limpiarTextoTR(contenido)) {
    return {
      ok: false,
      exportacion: null,
      errores: ["No se generó contenido para exportar."]
    };
  }

  return {
    ok: true,
    exportacion: {
      formato: formato.id,
      nombreFormato: formato.nombre,
      mime: formato.mime,
      nombreArchivo: crearNombreExportacionTR({
        proyecto,
        video,
        extension: formato.id
      }),
      contenido,
      creadoEn: new Date().toISOString()
    },
    errores: []
  };
}

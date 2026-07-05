/* =========================================================
Nombre completo: tr-json.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/formatos/tr-json.js
Funciones principales:
- Generar JSON de transcripción para guardar o exportar.
- Leer JSON de transcripción de forma segura.
- Normalizar la estructura mínima de una transcripción.
Con qué se conecta:
- tr-service.js
- tr-guardar.js
- tr-exportar.js
========================================================= */

import {
  limpiarTextoTR,
  limpiarTextoVisibleTR,
  crearResumenTextoTR,
  crearIdTranscripcionTR,
  unirTextoSegmentosTR
} from "../helpers/tr-texto.js";

import {
  normalizarSegmentosTiempoTR
} from "../helpers/tr-tiempo.js";

function normalizarSegmentosJsonTR(segmentos) {
  const base = Array.isArray(segmentos) ? segmentos : [];
  const tiempos = normalizarSegmentosTiempoTR(base);

  return tiempos
    .map((tiempo, indice) => {
      const original = base[indice] || {};
      const texto = limpiarTextoVisibleTR(original.texto || original.text || "");

      return {
        ...tiempo,
        texto
      };
    })
    .filter((segmento) => segmento.texto);
}

export function normalizarTranscripcionJsonTR(transcripcion, contexto = {}) {
  const fuente = transcripcion && typeof transcripcion === "object" ? transcripcion : {};
  const segmentos = normalizarSegmentosJsonTR(fuente.segmentos || fuente.segments || []);
  const textoBase = limpiarTextoVisibleTR(fuente.texto || fuente.text || "");
  const texto = textoBase || unirTextoSegmentosTR(segmentos);
  const video = contexto.video || {};

  return {
    id: limpiarTextoTR(fuente.id) || crearIdTranscripcionTR(video.id || fuente.videoId),
    videoId: limpiarTextoTR(fuente.videoId || video.id),
    idioma: limpiarTextoTR(fuente.idioma || fuente.language) || "es",
    motor: limpiarTextoTR(fuente.motor || fuente.engine) || "desconocido",
    modo: limpiarTextoTR(fuente.modo || fuente.mode) || "real",
    texto,
    segmentos,
    resumen: crearResumenTextoTR(texto),
    diagnostico: fuente.diagnostico || null,
    archivoAudio: fuente.archivoAudio || null,
    creadoEn: limpiarTextoTR(fuente.creadoEn) || new Date().toISOString(),
    actualizadoEn: new Date().toISOString()
  };
}

export function generarJsonTranscripcionTR({ proyecto, video, transcripcion }) {
  const normalizada = normalizarTranscripcionJsonTR(transcripcion, { video });

  return JSON.stringify({
    tipo: "transcripcion-video-editor-electron",
    version: 1,
    exportadoEn: new Date().toISOString(),
    proyecto: {
      id: limpiarTextoTR(proyecto?.id),
      nombre: limpiarTextoTR(proyecto?.nombre),
      estilo: limpiarTextoTR(proyecto?.estilo)
    },
    video: {
      id: limpiarTextoTR(video?.id),
      nombre: limpiarTextoTR(video?.nombre),
      extension: limpiarTextoTR(video?.extension)
    },
    transcripcion: normalizada
  }, null, 2);
}

export function leerJsonTranscripcionTR(contenido, contexto = {}) {
  try {
    const texto = limpiarTextoTR(contenido);

    if (!texto) {
      return {
        ok: false,
        transcripcion: null,
        errores: ["No hay contenido JSON."]
      };
    }

    const datos = JSON.parse(texto);
    const transcripcion = datos?.transcripcion || datos;

    return {
      ok: true,
      transcripcion: normalizarTranscripcionJsonTR(transcripcion, contexto),
      errores: []
    };
  } catch (error) {
    return {
      ok: false,
      transcripcion: null,
      errores: [`No se pudo leer el JSON: ${error.message}`]
    };
  }
}

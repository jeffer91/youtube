/* =========================================================
Nombre completo: tr-txt.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/formatos/tr-txt.js
Funciones principales:
- Generar archivo TXT de transcripción.
- Leer transcripción manual pegada por el usuario.
- Crear segmentos estimados cuando no existen tiempos reales.
Con qué se conecta:
- tr-service.js
- tr-exportar.js
- tr-resultado.js
- tr-texto.js
- tr-tiempo.js
========================================================= */

import {
  limpiarTextoVisibleTR,
  limpiarTextoTR,
  crearResumenTextoTR,
  crearIdTranscripcionTR,
  unirTextoSegmentosTR
} from "../helpers/tr-texto.js";

import {
  estimarDuracionPorTextoTR,
  redondearSegundosTR,
  normalizarSegmentosTiempoTR
} from "../helpers/tr-tiempo.js";

function crearLineasMetadatosTR({ proyecto, video, motor = "manual" }) {
  return [
    `Proyecto: ${limpiarTextoTR(proyecto?.nombre) || "Sin nombre"}`,
    `Video: ${limpiarTextoTR(video?.nombre) || "Sin video"}`,
    `Motor: ${limpiarTextoTR(motor) || "manual"}`,
    `Fecha: ${new Date().toISOString()}`
  ];
}

export function crearSegmentosEstimadosDesdeTextoTR(textoEntrada) {
  const texto = limpiarTextoVisibleTR(textoEntrada);

  if (!texto) {
    return [];
  }

  const bloques = texto
    .split(/\n{2,}|(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ0-9])/g)
    .map((bloque) => limpiarTextoVisibleTR(bloque))
    .filter(Boolean);

  const partes = bloques.length ? bloques : [texto];
  let cursor = 0;

  return partes.map((parte, indice) => {
    const duracion = Math.max(2, estimarDuracionPorTextoTR(parte));
    const inicio = redondearSegundosTR(cursor);
    const fin = redondearSegundosTR(cursor + duracion);

    cursor = fin + 0.15;

    return {
      id: `manual-${indice + 1}`,
      indice: indice + 1,
      inicio,
      fin,
      texto: parte
    };
  });
}

export function crearTranscripcionManualDesdeTextoTR({ texto, video, idioma = "es" } = {}) {
  const textoLimpio = limpiarTextoVisibleTR(texto);
  const resumen = crearResumenTextoTR(textoLimpio);
  const segmentos = normalizarSegmentosTiempoTR(crearSegmentosEstimadosDesdeTextoTR(textoLimpio))
    .map((segmento, indice) => ({
      ...segmento,
      texto: crearSegmentosEstimadosDesdeTextoTR(textoLimpio)[indice]?.texto || ""
    }))
    .filter((segmento) => segmento.texto);

  return {
    id: crearIdTranscripcionTR(video?.id),
    videoId: video?.id || "",
    idioma: limpiarTextoTR(idioma) || "es",
    motor: "manual",
    modo: "manual",
    texto: textoLimpio,
    segmentos,
    resumen,
    creadoEn: new Date().toISOString(),
    actualizadoEn: new Date().toISOString()
  };
}

export function extraerTextoDesdeTranscripcionTR(transcripcion) {
  const texto = limpiarTextoVisibleTR(transcripcion?.texto || "");

  if (texto) {
    return texto;
  }

  return unirTextoSegmentosTR(transcripcion?.segmentos || []);
}

export function generarTxtTranscripcionTR({ proyecto, video, transcripcion }) {
  const motor = transcripcion?.motor || transcripcion?.modo || "manual";
  const texto = extraerTextoDesdeTranscripcionTR(transcripcion);
  const segmentos = Array.isArray(transcripcion?.segmentos) ? transcripcion.segmentos : [];
  const lineas = crearLineasMetadatosTR({ proyecto, video, motor });

  lineas.push("");
  lineas.push("TRANSCRIPCION LIMPIA");
  lineas.push("====================");
  lineas.push(texto || "Sin texto transcrito.");

  if (segmentos.length) {
    lineas.push("");
    lineas.push("SEGMENTOS");
    lineas.push("=========");

    segmentos.forEach((segmento, indice) => {
      const inicio = segmento.inicioTexto || String(segmento.inicio || 0);
      const fin = segmento.finTexto || String(segmento.fin || 0);
      lineas.push(`${indice + 1}. [${inicio} - ${fin}] ${limpiarTextoVisibleTR(segmento.texto)}`);
    });
  }

  return lineas.join("\n");
}

export function leerTxtManualTR(contenido, opciones = {}) {
  const texto = limpiarTextoVisibleTR(contenido);

  if (!texto) {
    return {
      ok: false,
      transcripcion: null,
      errores: ["No hay texto para convertir en transcripción."]
    };
  }

  return {
    ok: true,
    transcripcion: crearTranscripcionManualDesdeTextoTR({
      texto,
      video: opciones.video,
      idioma: opciones.idioma || "es"
    }),
    errores: []
  };
}

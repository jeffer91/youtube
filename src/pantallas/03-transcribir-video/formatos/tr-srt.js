/* =========================================================
Nombre completo: tr-srt.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/formatos/tr-srt.js
Funciones principales:
- Generar subtítulos SRT desde segmentos de transcripción.
- Leer contenido SRT pegado o cargado manualmente.
- Validar que los subtítulos tengan texto y tiempos correctos.
Con qué se conecta:
- tr-service.js
- tr-exportar.js
- tr-resultado.js
- tr-tiempo.js
========================================================= */

import {
  normalizarSegmentosTiempoTR,
  parsearTiempoTR,
  formatearTiempoSrtTR
} from "../helpers/tr-tiempo.js";

import {
  limpiarTextoVisibleTR,
  limpiarTextoTR,
  unirTextoSegmentosTR
} from "../helpers/tr-texto.js";

function limpiarTextoSrtTR(valor) {
  return limpiarTextoVisibleTR(valor)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizarSegmentosParaSrtTR(segmentos) {
  const base = Array.isArray(segmentos) ? segmentos : [];
  const conTiempo = normalizarSegmentosTiempoTR(base);

  return conTiempo
    .map((tiempo, indice) => {
      const original = base[indice] || {};
      const texto = limpiarTextoSrtTR(original.texto || original.text || "");

      return {
        ...tiempo,
        texto
      };
    })
    .filter((segmento) => segmento.texto);
}

export function generarSrtDesdeSegmentosTR(segmentos) {
  const segmentosFinales = normalizarSegmentosParaSrtTR(segmentos);

  return segmentosFinales
    .map((segmento, indice) => {
      return [
        String(indice + 1),
        `${segmento.inicioSrt} --> ${segmento.finSrt}`,
        segmento.texto
      ].join("\n");
    })
    .join("\n\n");
}

export function generarSrtTranscripcionTR(transcripcion) {
  const segmentos = Array.isArray(transcripcion?.segmentos)
    ? transcripcion.segmentos
    : [];

  if (segmentos.length) {
    return generarSrtDesdeSegmentosTR(segmentos);
  }

  const texto = limpiarTextoSrtTR(transcripcion?.texto || "");

  if (!texto) {
    return "";
  }

  return [
    "1",
    `${formatearTiempoSrtTR(0)} --> ${formatearTiempoSrtTR(5)}`,
    texto
  ].join("\n");
}

export function validarSrtTR(contenido) {
  const texto = limpiarTextoTR(contenido);
  const errores = [];

  if (!texto) {
    errores.push("No hay contenido SRT.");
  }

  if (texto && !texto.includes("-->")) {
    errores.push("El SRT debe incluir tiempos con el formato 00:00:00,000 --> 00:00:00,000.");
  }

  return {
    ok: errores.length === 0,
    errores
  };
}

export function leerSrtManualTR(contenido) {
  const texto = limpiarTextoTR(contenido);
  const validacion = validarSrtTR(texto);

  if (!validacion.ok) {
    return {
      ok: false,
      segmentos: [],
      texto: "",
      errores: validacion.errores
    };
  }

  const bloques = texto
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split(/\n\s*\n/g)
    .map((bloque) => bloque.trim())
    .filter(Boolean);

  const segmentos = [];
  const errores = [];

  bloques.forEach((bloque, indice) => {
    const lineas = bloque.split("\n").map((linea) => linea.trim()).filter(Boolean);
    const lineaTiempo = lineas.find((linea) => linea.includes("-->"));

    if (!lineaTiempo) {
      errores.push(`El bloque ${indice + 1} no tiene tiempos.`);
      return;
    }

    const partesTiempo = lineaTiempo.split("-->").map((parte) => parte.trim());
    const posicionTiempo = lineas.indexOf(lineaTiempo);
    const lineasTexto = lineas.slice(posicionTiempo + 1);
    const textoSegmento = limpiarTextoSrtTR(lineasTexto.join("\n"));

    if (!textoSegmento) {
      errores.push(`El bloque ${indice + 1} no tiene texto.`);
      return;
    }

    segmentos.push({
      id: `srt-${indice + 1}`,
      indice: indice + 1,
      inicio: parsearTiempoTR(partesTiempo[0]),
      fin: parsearTiempoTR(partesTiempo[1]),
      texto: textoSegmento
    });
  });

  const segmentosFinales = normalizarSegmentosParaSrtTR(segmentos);

  return {
    ok: errores.length === 0 && segmentosFinales.length > 0,
    segmentos: segmentosFinales,
    texto: unirTextoSegmentosTR(segmentosFinales),
    errores: segmentosFinales.length ? errores : ["No se encontraron subtítulos válidos."].concat(errores)
  };
}

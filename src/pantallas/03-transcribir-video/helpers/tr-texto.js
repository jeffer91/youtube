/* =========================================================
Nombre completo: tr-texto.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/helpers/tr-texto.js
Funciones principales:
- Limpiar texto de transcripción.
- Escapar texto para pintar HTML de forma segura.
- Crear resúmenes simples del texto transcrito.
- Preparar nombres seguros de archivos exportados.
Con qué se conecta:
- tr-service.js
- tr-resultado.js
- tr-txt.js
- tr-json.js
========================================================= */

const LIMITE_RESUMEN_DEFECTO_TR = 180;

export function limpiarTextoTR(valor) {
  return String(valor || "").trim();
}

export function normalizarEspaciosTR(valor) {
  return limpiarTextoTR(valor)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\t ]+/g, " ")
    .replace(/ *\n+ */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function escaparHtmlTR(valor) {
  return String(valor || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function limpiarTextoVisibleTR(valor) {
  return normalizarEspaciosTR(valor)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
}

export function separarLineasTextoTR(valor) {
  return normalizarEspaciosTR(valor)
    .split("\n")
    .map((linea) => linea.trim())
    .filter(Boolean);
}

export function contarPalabrasTR(valor) {
  const texto = limpiarTextoVisibleTR(valor);

  if (!texto) {
    return 0;
  }

  return texto
    .split(/\s+/)
    .map((palabra) => palabra.trim())
    .filter(Boolean)
    .length;
}

export function limitarTextoTR(valor, maximo = LIMITE_RESUMEN_DEFECTO_TR) {
  const texto = limpiarTextoVisibleTR(valor);
  const limite = Number(maximo);

  if (!texto || !Number.isFinite(limite) || limite <= 0) {
    return "";
  }

  if (texto.length <= limite) {
    return texto;
  }

  return `${texto.slice(0, limite).trim()}...`;
}

export function crearResumenTextoTR(valor) {
  const texto = limpiarTextoVisibleTR(valor);
  const lineas = separarLineasTextoTR(texto);
  const palabras = contarPalabrasTR(texto);

  return {
    texto,
    resumen: limitarTextoTR(texto),
    totalCaracteres: texto.length,
    totalLineas: lineas.length,
    totalPalabras: palabras,
    tieneTexto: Boolean(texto)
  };
}

export function limpiarTextoParaNombreArchivoTR(valor, respaldo = "transcripcion") {
  const base = limpiarTextoTR(valor || respaldo)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return (base || respaldo).slice(0, 80);
}

export function crearNombreExportacionTR({ proyecto, video, extension }) {
  const nombreProyecto = limpiarTextoParaNombreArchivoTR(proyecto?.nombre || "proyecto");
  const nombreVideo = limpiarTextoParaNombreArchivoTR(video?.nombre || "video");
  const ext = limpiarTextoTR(extension).replace(/^\./, "") || "txt";

  return `${nombreProyecto}_${nombreVideo}_transcripcion.${ext}`;
}

export function unirTextoSegmentosTR(segmentos) {
  if (!Array.isArray(segmentos)) {
    return "";
  }

  return limpiarTextoVisibleTR(
    segmentos
      .map((segmento) => limpiarTextoTR(segmento?.texto))
      .filter(Boolean)
      .join(" ")
  );
}

export function crearIdTranscripcionTR(videoId = "") {
  const base = limpiarTextoTR(videoId) || "video";
  return `tr-${base}-${Date.now()}`;
}

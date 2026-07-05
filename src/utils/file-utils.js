/* =========================================================
Nombre completo: file-utils.js
Ruta o ubicación: /src/utils/file-utils.js
Funciones principales:
- Formatear tamaños de archivo.
- Limpiar textos básicos.
- Obtener extensiones de archivos.
- Crear nombres seguros.
- Apoyar funciones generales de la app.
========================================================= */

export function obtenerExtension(nombreArchivo) {
  if (!nombreArchivo || typeof nombreArchivo !== "string") {
    return "";
  }

  const partes = nombreArchivo.split(".");

  if (partes.length <= 1) {
    return "";
  }

  return partes.pop().toLowerCase();
}

export function formatearPeso(bytes) {
  const numero = Number(bytes);

  if (!Number.isFinite(numero) || numero <= 0) {
    return "0 MB";
  }

  const kb = numero / 1024;
  const mb = kb / 1024;
  const gb = mb / 1024;

  if (gb >= 1) {
    return `${gb.toFixed(2)} GB`;
  }

  if (mb >= 1) {
    return `${mb.toFixed(2)} MB`;
  }

  return `${kb.toFixed(1)} KB`;
}

export function limpiarTexto(texto) {
  return String(texto || "").trim();
}

export function crearNombreSeguro(texto) {
  return String(texto || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function obtenerNombreArchivo(rutaArchivo) {
  if (!rutaArchivo || typeof rutaArchivo !== "string") {
    return "";
  }

  return rutaArchivo.split(/[\\/]/).pop() || "";
}

export function esRutaValida(rutaArchivo) {
  return Boolean(rutaArchivo && typeof rutaArchivo === "string");
}
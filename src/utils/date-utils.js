/* =========================================================
Nombre completo: date-utils.js
Ruta o ubicación: /src/utils/date-utils.js
Funciones principales:
- Crear fechas legibles.
- Crear marcas de tiempo.
- Formatear fechas cortas para proyectos.
- Apoyar datos generales de la app.
========================================================= */

export function obtenerFechaISO() {
  return new Date().toISOString();
}

export function formatearFechaCorta(fecha = new Date()) {
  const fechaFinal = fecha instanceof Date ? fecha : new Date(fecha);

  if (Number.isNaN(fechaFinal.getTime())) {
    return "";
  }

  return fechaFinal.toLocaleDateString("es-EC", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

export function formatearHoraCorta(fecha = new Date()) {
  const fechaFinal = fecha instanceof Date ? fecha : new Date(fecha);

  if (Number.isNaN(fechaFinal.getTime())) {
    return "";
  }

  return fechaFinal.toLocaleTimeString("es-EC", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function crearMarcaTiempo() {
  const fecha = new Date();

  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");
  const hour = String(fecha.getHours()).padStart(2, "0");
  const minute = String(fecha.getMinutes()).padStart(2, "0");
  const second = String(fecha.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day}_${hour}-${minute}-${second}`;
}

export function crearTextoFechaProyecto() {
  const fecha = new Date();
  const fechaTexto = formatearFechaCorta(fecha);
  const horaTexto = formatearHoraCorta(fecha);

  return `${fechaTexto} ${horaTexto}`;
}
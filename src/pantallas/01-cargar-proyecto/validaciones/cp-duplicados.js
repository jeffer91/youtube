/* =========================================================
Nombre completo: cp-duplicados.js
Ruta o ubicación: /src/pantallas/01-cargar-proyecto/validaciones/cp-duplicados.js
Funciones principales:
- Detectar videos duplicados.
- Bloquear duplicados por ID o ruta.
- Separar videos nuevos y repetidos.
- Devolver mensajes cortos para la pantalla.
========================================================= */

function normalizarRuta(ruta) {
  return String(ruta || "")
    .trim()
    .toLowerCase()
    .replace(/\\/g, "/");
}

export function esVideoDuplicado(video, videosActuales = []) {
  if (!video || !Array.isArray(videosActuales)) {
    return false;
  }

  const idVideo = String(video.id || "").trim();
  const rutaVideo = normalizarRuta(video.ruta);

  return videosActuales.some((actual) => {
    const mismoId = idVideo && String(actual.id || "").trim() === idVideo;
    const mismaRuta = rutaVideo && normalizarRuta(actual.ruta) === rutaVideo;

    return mismoId || mismaRuta;
  });
}

export function obtenerDuplicados(videosNuevos = [], videosActuales = []) {
  if (!Array.isArray(videosNuevos)) {
    return [];
  }

  return videosNuevos.filter((video) => {
    return esVideoDuplicado(video, videosActuales);
  });
}

export function quitarDuplicados(videosNuevos = [], videosActuales = []) {
  if (!Array.isArray(videosNuevos)) {
    return [];
  }

  return videosNuevos.filter((video) => {
    return !esVideoDuplicado(video, videosActuales);
  });
}

export function separarVideosDuplicados(videosNuevos = [], videosActuales = []) {
  const aceptados = [];
  const duplicados = [];

  if (!Array.isArray(videosNuevos)) {
    return {
      aceptados,
      duplicados,
      mensajes: ["No se recibieron videos válidos."]
    };
  }

  videosNuevos.forEach((video) => {
    if (esVideoDuplicado(video, videosActuales) || esVideoDuplicado(video, aceptados)) {
      duplicados.push(video);
      return;
    }

    aceptados.push(video);
  });

  const mensajes = duplicados.map((video) => {
    return `Video duplicado: ${video.nombre || "sin nombre"}`;
  });

  return {
    aceptados,
    duplicados,
    mensajes
  };
}
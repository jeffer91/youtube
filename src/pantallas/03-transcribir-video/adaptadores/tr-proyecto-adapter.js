/* =========================================================
Nombre completo: tr-proyecto-adapter.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/adaptadores/tr-proyecto-adapter.js
Funciones principales:
- Validar y adaptar el proyecto activo para transcripción.
- Evitar que el módulo use proyectos vacíos o dañados.
- Mantener datos básicos del proyecto.
- Preparar compatibilidad con guardado posterior.
Con qué se conecta:
- tr-caso-cargar-videos.js
- tr-caso-guardar.js
- tr-caso-transcribir.js
========================================================= */

function limpiarTextoTR(valor) {
  return String(valor || "").trim();
}

export function adaptarProyectoParaTranscripcionTR(proyectoActivo) {
  if (!proyectoActivo || typeof proyectoActivo !== "object") {
    return {
      ok: false,
      proyecto: null,
      mensaje: "No existe un proyecto activo."
    };
  }

  if (!Array.isArray(proyectoActivo.videos)) {
    return {
      ok: false,
      proyecto: null,
      mensaje: "El proyecto activo no tiene videos."
    };
  }

  if (proyectoActivo.videos.length === 0) {
    return {
      ok: false,
      proyecto: null,
      mensaje: "El proyecto activo está vacío."
    };
  }

  return {
    ok: true,
    proyecto: {
      ...proyectoActivo,
      id: limpiarTextoTR(proyectoActivo.id),
      nombre: limpiarTextoTR(proyectoActivo.nombre) || "Proyecto sin nombre",
      estilo: limpiarTextoTR(proyectoActivo.estilo),
      videos: proyectoActivo.videos
    },
    mensaje: "Proyecto válido para transcripción."
  };
}

export function crearResumenProyectoTranscripcionTR(proyectoActivo) {
  const proyecto = adaptarProyectoParaTranscripcionTR(proyectoActivo);

  if (!proyecto.ok) {
    return {
      ok: false,
      texto: proyecto.mensaje
    };
  }

  return {
    ok: true,
    texto: `${proyecto.proyecto.nombre} · ${proyecto.proyecto.videos.length} video(s)`
  };
}
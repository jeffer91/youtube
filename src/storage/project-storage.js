/* =========================================================
Nombre completo: project-storage.js
Ruta o ubicación: /src/storage/project-storage.js
Funciones principales:
- Guardar el proyecto usando la API segura de Electron.
- Consultar la carpeta automática de proyectos.
- Abrir la carpeta de proyectos.
- Mantener separada la lógica global de guardado.
========================================================= */

export async function guardarProyectoEnDisco(proyecto) {
  if (!window.videoEditorAPI?.guardarProyecto) {
    return {
      ok: false,
      mensaje: "La API de guardado no está disponible."
    };
  }

  return window.videoEditorAPI.guardarProyecto(proyecto);
}

export async function obtenerCarpetaProyectos() {
  if (!window.videoEditorAPI?.obtenerRutaProyectos) {
    return {
      ok: false,
      ruta: null,
      mensaje: "La API de proyectos no está disponible."
    };
  }

  return window.videoEditorAPI.obtenerRutaProyectos();
}

export async function abrirCarpetaProyectos() {
  if (!window.videoEditorAPI?.abrirCarpetaProyectos) {
    return {
      ok: false,
      mensaje: "La API de proyectos no está disponible."
    };
  }

  return window.videoEditorAPI.abrirCarpetaProyectos();
}

export function crearProyectoBase({ nombre, estilo, videos }) {
  return {
    nombre: String(nombre || "").trim(),
    estilo: String(estilo || "").trim(),
    videos: Array.isArray(videos) ? videos : [],
    capas: [],
    pantallaActual: "02-mejorar-audio"
  };
}
/* =========================================================
Nombre completo: cp-guardar.js
Ruta o ubicación: /src/pantallas/01-cargar-proyecto/services/cp-guardar.js
Funciones principales:
- Crear el proyecto base.
- Validar datos antes de guardar.
- Guardar el proyecto usando Electron.
- Devolver errores claros si algo falla.
- Preparar el paso hacia Mejorar audio.
========================================================= */

import { validarProyectoCompleto } from "../validaciones/cp-validar.js";

function limpiarTexto(texto) {
  return String(texto || "").trim();
}

export function crearProyectoCargar({ nombre, estilo, videos }) {
  return {
    nombre: limpiarTexto(nombre),
    estilo: limpiarTexto(estilo),
    videos: Array.isArray(videos) ? videos : [],
    capas: [],
    pantallaActual: "02-mejorar-audio"
  };
}

export async function guardarProyectoCargar(datosProyecto) {
  const proyecto = crearProyectoCargar(datosProyecto);

  const validacion = await validarProyectoCompleto(proyecto);

  if (!validacion.ok) {
    return {
      ok: false,
      proyecto: null,
      errores: validacion.errores
    };
  }

  if (!window.videoEditorAPI?.guardarProyecto) {
    return {
      ok: false,
      proyecto: null,
      errores: ["No se puede guardar el proyecto."]
    };
  }

  const resultado = await window.videoEditorAPI.guardarProyecto(proyecto);

  if (!resultado?.ok) {
    return {
      ok: false,
      proyecto: null,
      errores: [
        resultado?.mensaje || "No se pudo guardar el proyecto.",
        resultado?.detalle || ""
      ].filter(Boolean)
    };
  }

  return {
    ok: true,
    proyecto: resultado.proyecto,
    rutaProyecto: resultado.rutaProyecto,
    rutaArchivoProyecto: resultado.rutaArchivoProyecto,
    errores: []
  };
}
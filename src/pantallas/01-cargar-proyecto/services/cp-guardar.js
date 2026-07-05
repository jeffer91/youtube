/* =========================================================
Nombre completo: cp-guardar.js
Ruta o ubicación: /src/pantallas/01-cargar-proyecto/services/cp-guardar.js
Funciones principales:
- Crear el proyecto base.
- Validar datos antes de guardar.
- Guardar el proyecto usando Google Sheets como base principal.
- Guardar JSON local solo como respaldo temporal.
- Devolver errores claros si algo falla.
- Preparar el paso hacia Mejorar audio.
Con qué se conecta:
- cp-service.js
- cp-validar.js
- gs-proyectos.repository.js
========================================================= */

import { validarProyectoCompleto } from "../validaciones/cp-validar.js";

import {
  guardarProyectoBasePrincipalGS
} from "../../../shared/google-sheets/gs-proyectos.repository.js";

function limpiarTexto(texto) {
  return String(texto || "").trim();
}

export function crearProyectoCargar({ nombre, estilo, videos }) {
  return {
    nombre: limpiarTexto(nombre),
    estilo: limpiarTexto(estilo),
    videos: Array.isArray(videos) ? videos : [],
    capas: [],
    pantallaActual: "02-mejorar-audio",
    basePrincipal: "GOOGLE_SHEETS",
    respaldoLocal: "JSON_LOCAL_RESPALDO"
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

  const resultado = await guardarProyectoBasePrincipalGS(proyecto);

  if (!resultado?.ok) {
    return {
      ok: false,
      proyecto: null,
      errores: resultado?.errores || ["No se pudo guardar el proyecto."],
      pendienteSync: resultado?.pendienteSync || null
    };
  }

  return {
    ok: true,
    proyecto: resultado.proyecto,
    rutaProyecto: resultado.rutaProyecto,
    rutaArchivoProyecto: resultado.rutaArchivoProyecto,
    basePrincipal: resultado.basePrincipal,
    guardadoEnGoogleSheets: resultado.guardadoEnGoogleSheets,
    respaldoLocal: resultado.respaldoLocal,
    pendienteSync: resultado.pendienteSync,
    mensajes: resultado.mensajes || [],
    errores: resultado.errores || []
  };
}

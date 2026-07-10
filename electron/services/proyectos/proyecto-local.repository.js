/* =========================================================
Nombre completo: proyecto-local.repository.js
Ruta o ubicación: /electron/services/proyectos/proyecto-local.repository.js
Funciones principales:
- Guardar proyectos en JSON local como respaldo temporal.
- Crear carpeta local del proyecto usando el mismo ID de Google Sheets.
- Leer y listar respaldos locales de proyectos.
- Mantener la lógica de archivos fuera de main.js.
- Mantener la pantalla actual alineada con el flujo nuevo de 12 pasos.
Con qué se conecta:
- proyecto-electron.js
- electron/main/main.js
- src/shared/google-sheets/gs-proyectos.repository.js
========================================================= */

const fs = require("fs");
const path = require("path");

const NOMBRE_ARCHIVO_PROYECTO = "proyecto.json";
const PANTALLA_INICIAL_POST_CARGA = "02-formato-inteligente";

function ahoraProyectoLocal() {
  return new Date().toISOString();
}

function limpiarTextoProyectoLocal(valor) {
  return String(valor || "").trim();
}

function limpiarNombreCarpetaProyectoLocal(texto) {
  return limpiarTextoProyectoLocal(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "proyecto";
}

function limpiarIdProyectoLocal(texto) {
  return limpiarTextoProyectoLocal(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function obtenerRutaProyectosLocal({ obtenerRutaData, asegurarCarpeta }) {
  const carpeta = path.join(obtenerRutaData(), "proyectos");
  asegurarCarpeta(carpeta);
  return carpeta;
}

function crearIdProyectoLocal(nombreProyecto) {
  const marcaTiempo = ahoraProyectoLocal()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .slice(0, 19);

  return `${marcaTiempo}_${limpiarNombreCarpetaProyectoLocal(nombreProyecto)}`;
}

function crearCarpetaProyectoLocal({ obtenerRutaData, asegurarCarpeta, nombreProyecto, idProyectoExistente = "" }) {
  const carpetaProyectos = obtenerRutaProyectosLocal({ obtenerRutaData, asegurarCarpeta });
  const idSeguro = limpiarIdProyectoLocal(idProyectoExistente);
  const idProyecto = idSeguro || crearIdProyectoLocal(nombreProyecto);
  const rutaProyecto = path.join(carpetaProyectos, idProyecto);

  asegurarCarpeta(rutaProyecto);

  return {
    idProyecto,
    rutaProyecto
  };
}

function normalizarProyectoLocal(proyecto) {
  const base = proyecto && typeof proyecto === "object" ? proyecto : {};
  const fecha = ahoraProyectoLocal();

  return {
    id: limpiarTextoProyectoLocal(base.id),
    nombre: limpiarTextoProyectoLocal(base.nombre),
    estilo: limpiarTextoProyectoLocal(base.estilo),
    videos: Array.isArray(base.videos) ? base.videos : [],
    pantallaActual: limpiarTextoProyectoLocal(base.pantallaActual) || PANTALLA_INICIAL_POST_CARGA,
    capas: Array.isArray(base.capas) ? base.capas : [],
    basePrincipal: limpiarTextoProyectoLocal(base.basePrincipal) || "GOOGLE_SHEETS",
    respaldoLocal: "JSON_LOCAL_RESPALDO",
    creadoEn: limpiarTextoProyectoLocal(base.creadoEn) || fecha,
    actualizadoEn: fecha
  };
}

function validarProyectoLocal(proyecto) {
  const errores = [];

  if (!limpiarTextoProyectoLocal(proyecto?.nombre)) {
    errores.push("Falta el nombre del proyecto.");
  }

  if (!limpiarTextoProyectoLocal(proyecto?.estilo)) {
    errores.push("Falta el estilo del proyecto.");
  }

  return {
    ok: errores.length === 0,
    errores
  };
}

function guardarProyectoLocalJSON({ obtenerRutaData, asegurarCarpeta, proyecto }) {
  const validacion = validarProyectoLocal(proyecto);

  if (!validacion.ok) {
    return {
      ok: false,
      mensaje: "Faltan datos obligatorios del proyecto.",
      errores: validacion.errores
    };
  }

  const carpeta = crearCarpetaProyectoLocal({
    obtenerRutaData,
    asegurarCarpeta,
    nombreProyecto: proyecto.nombre,
    idProyectoExistente: proyecto.id
  });

  const proyectoFinal = {
    ...normalizarProyectoLocal(proyecto),
    id: carpeta.idProyecto
  };

  const rutaArchivoProyecto = path.join(carpeta.rutaProyecto, NOMBRE_ARCHIVO_PROYECTO);

  fs.writeFileSync(rutaArchivoProyecto, JSON.stringify(proyectoFinal, null, 2), "utf8");

  return {
    ok: true,
    proyecto: proyectoFinal,
    rutaProyecto: carpeta.rutaProyecto,
    rutaArchivoProyecto,
    mensaje: "Respaldo local guardado."
  };
}

function leerProyectoLocalJSON({ rutaArchivoProyecto }) {
  if (!rutaArchivoProyecto || !fs.existsSync(rutaArchivoProyecto)) {
    return {
      ok: false,
      proyecto: null,
      mensaje: "No se encontró el archivo local del proyecto."
    };
  }

  try {
    const contenido = fs.readFileSync(rutaArchivoProyecto, "utf8");
    return {
      ok: true,
      proyecto: JSON.parse(contenido),
      rutaArchivoProyecto
    };
  } catch (error) {
    return {
      ok: false,
      proyecto: null,
      mensaje: "No se pudo leer el proyecto local.",
      detalle: error.message
    };
  }
}

function listarProyectosLocales({ obtenerRutaData, asegurarCarpeta }) {
  const carpetaProyectos = obtenerRutaProyectosLocal({ obtenerRutaData, asegurarCarpeta });

  if (!fs.existsSync(carpetaProyectos)) {
    return {
      ok: true,
      proyectos: [],
      total: 0,
      rutaProyectos: carpetaProyectos
    };
  }

  const proyectos = fs.readdirSync(carpetaProyectos, { withFileTypes: true })
    .filter((item) => item.isDirectory())
    .map((item) => {
      const rutaProyecto = path.join(carpetaProyectos, item.name);
      const rutaArchivoProyecto = path.join(rutaProyecto, NOMBRE_ARCHIVO_PROYECTO);
      return {
        id: item.name,
        rutaProyecto,
        rutaArchivoProyecto,
        existeArchivo: fs.existsSync(rutaArchivoProyecto)
      };
    });

  return {
    ok: true,
    proyectos,
    total: proyectos.length,
    rutaProyectos: carpetaProyectos
  };
}

module.exports = {
  obtenerRutaProyectosLocal,
  crearCarpetaProyectoLocal,
  guardarProyectoLocalJSON,
  leerProyectoLocalJSON,
  listarProyectosLocales,
  normalizarProyectoLocal
};

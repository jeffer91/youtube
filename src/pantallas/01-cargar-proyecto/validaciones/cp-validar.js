/* =========================================================
Nombre completo: cp-validar.js
Ruta o ubicación: /src/pantallas/01-cargar-proyecto/validaciones/cp-validar.js
Funciones principales:
- Validar el proyecto antes de guardar.
- Verificar nombre obligatorio.
- Verificar estilo obligatorio.
- Verificar videos cargados.
- Verificar existencia real de archivos.
========================================================= */

import { existeEstiloProyecto } from "../data/cp-data-estilos.js";
import {
  validarVideosBasicos,
  validarArchivosExisten
} from "./cp-val-videos.js";

function limpiarTexto(texto) {
  return String(texto || "").trim();
}

export function validarNombreProyecto(nombre) {
  const nombreFinal = limpiarTexto(nombre);

  if (!nombreFinal) {
    return {
      ok: false,
      mensaje: "Escribe el nombre del proyecto."
    };
  }

  if (nombreFinal.length < 3) {
    return {
      ok: false,
      mensaje: "El nombre debe tener al menos 3 letras."
    };
  }

  return {
    ok: true,
    mensaje: ""
  };
}

export function validarEstiloProyecto(estilo) {
  const estiloFinal = limpiarTexto(estilo);

  if (!estiloFinal) {
    return {
      ok: false,
      mensaje: "Elige un estilo."
    };
  }

  if (!existeEstiloProyecto(estiloFinal)) {
    return {
      ok: false,
      mensaje: "El estilo no es válido."
    };
  }

  return {
    ok: true,
    mensaje: ""
  };
}

export function validarProyectoBasico({ nombre, estilo, videos }) {
  const errores = [];

  const nombreValidado = validarNombreProyecto(nombre);
  const estiloValidado = validarEstiloProyecto(estilo);
  const videosValidados = validarVideosBasicos(videos);

  if (!nombreValidado.ok) {
    errores.push(nombreValidado.mensaje);
  }

  if (!estiloValidado.ok) {
    errores.push(estiloValidado.mensaje);
  }

  if (!videosValidados.ok) {
    errores.push(...videosValidados.errores);
  }

  return {
    ok: errores.length === 0,
    errores
  };
}

export async function validarProyectoCompleto({ nombre, estilo, videos }) {
  const errores = [];

  const basico = validarProyectoBasico({
    nombre,
    estilo,
    videos
  });

  if (!basico.ok) {
    errores.push(...basico.errores);
  }

  const archivos = await validarArchivosExisten(videos);

  if (!archivos.ok) {
    errores.push(...archivos.errores);
  }

  return {
    ok: errores.length === 0,
    errores
  };
}
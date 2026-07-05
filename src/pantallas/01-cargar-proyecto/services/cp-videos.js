/* =========================================================
Nombre completo: cp-videos.js
Ruta o ubicación: /src/pantallas/01-cargar-proyecto/services/cp-videos.js
Funciones principales:
- Abrir el selector de videos.
- Recibir videos desde Electron.
- Bloquear videos duplicados.
- Agregar duración y miniatura.
- Preparar videos para la pantalla Cargar proyecto.
========================================================= */

import { agregarDuracionAVideos } from "../helpers/cp-duracion.js";
import { agregarMiniaturaAVideos } from "../helpers/cp-miniatura.js";
import { separarVideosDuplicados } from "../validaciones/cp-duplicados.js";
import { reasignarOrdenVideos } from "../../../utils/video-utils.js";

function ordenarVideosIniciales(videos) {
  if (!Array.isArray(videos)) {
    return [];
  }

  return videos.map((video, index) => ({
    ...video,
    orden: index + 1
  }));
}

function unirErrores(...grupos) {
  const errores = [];

  grupos.forEach((grupo) => {
    if (Array.isArray(grupo)) {
      errores.push(...grupo.filter(Boolean));
    }
  });

  return errores;
}

export async function seleccionarVideosSistema() {
  if (!window.videoEditorAPI?.seleccionarVideos) {
    return {
      ok: false,
      cancelado: false,
      videos: [],
      errores: ["No se puede abrir el selector de videos."]
    };
  }

  const resultado = await window.videoEditorAPI.seleccionarVideos();

  if (!resultado || !resultado.ok) {
    return {
      ok: false,
      cancelado: false,
      videos: [],
      errores: [resultado?.mensaje || "No se pudieron cargar los videos."]
    };
  }

  return {
    ok: true,
    cancelado: Boolean(resultado.cancelado),
    videos: Array.isArray(resultado.videos) ? resultado.videos : [],
    errores: Array.isArray(resultado.errores) ? resultado.errores : []
  };
}

export async function prepararVideosNuevos(videosNuevos, videosActuales) {
  const separados = separarVideosDuplicados(videosNuevos, videosActuales);

  if (separados.aceptados.length === 0) {
    return {
      ok: false,
      videos: [],
      duplicados: separados.duplicados,
      errores: separados.mensajes
    };
  }

  const conOrden = ordenarVideosIniciales(separados.aceptados);
  const conDuracion = await agregarDuracionAVideos(conOrden);
  const conMiniatura = await agregarMiniaturaAVideos(conDuracion);

  return {
    ok: true,
    videos: conMiniatura,
    duplicados: separados.duplicados,
    errores: separados.mensajes
  };
}

export async function cargarVideosParaProyecto(videosActuales = []) {
  const seleccion = await seleccionarVideosSistema();

  if (!seleccion.ok || seleccion.cancelado) {
    return {
      ok: seleccion.ok,
      cancelado: seleccion.cancelado,
      videos: videosActuales,
      videosNuevos: [],
      errores: seleccion.errores,
      duplicados: []
    };
  }

  const preparados = await prepararVideosNuevos(
    seleccion.videos,
    videosActuales
  );

  const videosFinales = reasignarOrdenVideos([
    ...videosActuales,
    ...preparados.videos
  ]);

  return {
    ok: preparados.ok,
    cancelado: false,
    videos: videosFinales,
    videosNuevos: preparados.videos,
    duplicados: preparados.duplicados,
    errores: unirErrores(seleccion.errores, preparados.errores)
  };
}

export function quitarVideoPorId(videos, videoId) {
  if (!Array.isArray(videos)) {
    return [];
  }

  const filtrados = videos.filter((video) => video.id !== videoId);

  return reasignarOrdenVideos(filtrados);
}

export function actualizarVideosOrdenados(videos) {
  return reasignarOrdenVideos(videos);
}
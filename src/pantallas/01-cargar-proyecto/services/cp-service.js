/* =========================================================
Nombre completo: cp-service.js
Ruta o ubicación: /src/pantallas/01-cargar-proyecto/services/cp-service.js
Funciones principales:
- Mantener el estado interno de Cargar proyecto.
- Controlar pasos de la pantalla.
- Cargar, quitar y ordenar videos.
- Actualizar nombre y estilo.
- Guardar el proyecto final.
========================================================= */

import {
  cargarVideosParaProyecto,
  quitarVideoPorId,
  actualizarVideosOrdenados
} from "./cp-videos.js";

import { guardarProyectoCargar } from "./cp-guardar.js";

const ESTADO_INICIAL_CP = {
  pasoActual: 1,
  totalPasos: 3,
  nombre: "",
  estilo: "",
  videos: [],
  errores: [],
  mensajes: [],
  guardando: false
};

function clonar(valor) {
  return JSON.parse(JSON.stringify(valor));
}

export function crearCargarProyectoService() {
  let estado = clonar(ESTADO_INICIAL_CP);
  const listeners = new Set();

  function notificar() {
    const copia = obtenerEstado();

    listeners.forEach((listener) => {
      if (typeof listener === "function") {
        listener(copia);
      }
    });
  }

  function obtenerEstado() {
    return clonar(estado);
  }

  function actualizar(parcial) {
    estado = {
      ...estado,
      ...parcial
    };

    notificar();

    return obtenerEstado();
  }

  function limpiarMensajes() {
    return actualizar({
      errores: [],
      mensajes: []
    });
  }

  function irAPaso(numeroPaso) {
    const paso = Number(numeroPaso);

    if (!Number.isFinite(paso)) {
      return obtenerEstado();
    }

    const pasoFinal = Math.max(1, Math.min(estado.totalPasos, paso));

    return actualizar({
      pasoActual: pasoFinal
    });
  }

  function siguientePaso() {
    return irAPaso(estado.pasoActual + 1);
  }

  function pasoAnterior() {
    return irAPaso(estado.pasoActual - 1);
  }

  function actualizarNombre(nombre) {
    return actualizar({
      nombre: String(nombre || "")
    });
  }

  function actualizarEstilo(estilo) {
    return actualizar({
      estilo: String(estilo || "")
    });
  }

  async function cargarVideos() {
    limpiarMensajes();

    const resultado = await cargarVideosParaProyecto(estado.videos);

    return actualizar({
      videos: resultado.videos,
      errores: resultado.errores,
      mensajes: resultado.videosNuevos.length
        ? [`${resultado.videosNuevos.length} video(s) cargado(s).`]
        : []
    });
  }

  function quitarVideo(videoId) {
    const videos = quitarVideoPorId(estado.videos, videoId);

    return actualizar({
      videos,
      mensajes: ["Video quitado."],
      errores: []
    });
  }

  function ordenarVideos(videosOrdenados) {
    const videos = actualizarVideosOrdenados(videosOrdenados);

    return actualizar({
      videos,
      errores: []
    });
  }

  async function guardarProyecto() {
    actualizar({
      guardando: true,
      errores: [],
      mensajes: []
    });

    const resultado = await guardarProyectoCargar({
      nombre: estado.nombre,
      estilo: estado.estilo,
      videos: estado.videos
    });

    if (!resultado.ok) {
      return actualizar({
        guardando: false,
        errores: resultado.errores,
        mensajes: []
      });
    }

    return actualizar({
      guardando: false,
      mensajes: ["Proyecto guardado correctamente."],
      errores: [],
      proyectoGuardado: resultado.proyecto,
      rutaProyecto: resultado.rutaProyecto
    });
  }

  function escuchar(listener) {
    if (typeof listener !== "function") {
      return () => {};
    }

    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }

  return {
    obtenerEstado,
    actualizar,
    limpiarMensajes,
    irAPaso,
    siguientePaso,
    pasoAnterior,
    actualizarNombre,
    actualizarEstilo,
    cargarVideos,
    quitarVideo,
    ordenarVideos,
    guardarProyecto,
    escuchar
  };
}
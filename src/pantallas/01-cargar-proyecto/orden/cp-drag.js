/* =========================================================
Nombre completo: cp-drag.js
Ruta o ubicación: /src/pantallas/01-cargar-proyecto/orden/cp-drag.js
Funciones principales:
- Permitir ordenar videos arrastrando con el mouse.
- Marcar visualmente el video arrastrado.
- Reordenar los videos al soltar.
- Actualizar el estado de la pantalla.
========================================================= */

import {
  crearListaOrdenadaPorIds,
  obtenerIdsDesdeTarjetas,
  intercambiarNodos
} from "./cp-orden.js";

function obtenerTarjetaVideo(elemento) {
  if (!elemento) {
    return null;
  }

  return elemento.closest("[data-video-id]");
}

function limpiarEstadosDrag() {
  const tarjetas = document.querySelectorAll("[data-video-id]");

  tarjetas.forEach((tarjeta) => {
    tarjeta.classList.remove("is-dragging");
    tarjeta.classList.remove("is-over");
  });
}

export function conectarDragVideos({ service }) {
  const tarjetas = document.querySelectorAll("[data-video-id]");

  if (!tarjetas.length || !service?.ordenarVideos) {
    return;
  }

  let tarjetaArrastrada = null;

  tarjetas.forEach((tarjeta) => {
    tarjeta.addEventListener("dragstart", (event) => {
      tarjetaArrastrada = tarjeta;
      tarjeta.classList.add("is-dragging");

      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", tarjeta.dataset.videoId || "");
      }
    });

    tarjeta.addEventListener("dragover", (event) => {
      event.preventDefault();

      const tarjetaDestino = obtenerTarjetaVideo(event.target);

      if (!tarjetaDestino || tarjetaDestino === tarjetaArrastrada) {
        return;
      }

      limpiarEstadosDrag();
      tarjetaDestino.classList.add("is-over");
    });

    tarjeta.addEventListener("drop", (event) => {
      event.preventDefault();

      const tarjetaDestino = obtenerTarjetaVideo(event.target);

      if (!tarjetaArrastrada || !tarjetaDestino) {
        limpiarEstadosDrag();
        return;
      }

      intercambiarNodos(tarjetaArrastrada, tarjetaDestino);

      const estado = service.obtenerEstado();
      const idsOrdenados = obtenerIdsDesdeTarjetas();
      const videosOrdenados = crearListaOrdenadaPorIds(
        estado.videos,
        idsOrdenados
      );

      limpiarEstadosDrag();
      tarjetaArrastrada = null;

      service.ordenarVideos(videosOrdenados);
    });

    tarjeta.addEventListener("dragend", () => {
      limpiarEstadosDrag();
      tarjetaArrastrada = null;
    });
  });
}
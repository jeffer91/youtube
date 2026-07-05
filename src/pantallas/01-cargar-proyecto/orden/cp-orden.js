/* =========================================================
Nombre completo: cp-orden.js
Ruta o ubicación: /src/pantallas/01-cargar-proyecto/orden/cp-orden.js
Funciones principales:
- Reordenar videos por posición.
- Buscar videos por ID.
- Mover videos arriba o abajo.
- Convertir IDs del DOM en lista ordenada.
- Mantener lógica de orden separada.
========================================================= */

import { reasignarOrdenVideos } from "../../../utils/video-utils.js";

export function moverVideoPorDireccion(videos, videoId, direccion) {
  const lista = Array.isArray(videos) ? [...videos] : [];
  const indiceActual = lista.findIndex((video) => video.id === videoId);

  if (indiceActual < 0) {
    return reasignarOrdenVideos(lista);
  }

  const indiceNuevo = indiceActual + direccion;

  if (indiceNuevo < 0 || indiceNuevo >= lista.length) {
    return reasignarOrdenVideos(lista);
  }

  const videoTemporal = lista[indiceActual];
  lista[indiceActual] = lista[indiceNuevo];
  lista[indiceNuevo] = videoTemporal;

  return reasignarOrdenVideos(lista);
}

export function crearListaOrdenadaPorIds(videos, idsOrdenados) {
  if (!Array.isArray(videos) || !Array.isArray(idsOrdenados)) {
    return reasignarOrdenVideos(videos || []);
  }

  const mapaVideos = new Map();

  videos.forEach((video) => {
    mapaVideos.set(video.id, video);
  });

  const ordenados = idsOrdenados
    .map((id) => mapaVideos.get(id))
    .filter(Boolean);

  const faltantes = videos.filter((video) => {
    return !idsOrdenados.includes(video.id);
  });

  return reasignarOrdenVideos([...ordenados, ...faltantes]);
}

export function obtenerIdsDesdeTarjetas(selector = "[data-video-id]") {
  const tarjetas = document.querySelectorAll(selector);

  return Array.from(tarjetas)
    .map((tarjeta) => tarjeta.dataset.videoId)
    .filter(Boolean);
}

export function intercambiarNodos(nodoArrastrado, nodoDestino) {
  if (!nodoArrastrado || !nodoDestino) {
    return;
  }

  const contenedor = nodoDestino.parentNode;

  if (!contenedor || nodoArrastrado === nodoDestino) {
    return;
  }

  const nodos = Array.from(contenedor.children);
  const indiceArrastrado = nodos.indexOf(nodoArrastrado);
  const indiceDestino = nodos.indexOf(nodoDestino);

  if (indiceArrastrado < 0 || indiceDestino < 0) {
    return;
  }

  if (indiceArrastrado < indiceDestino) {
    contenedor.insertBefore(nodoArrastrado, nodoDestino.nextSibling);
  } else {
    contenedor.insertBefore(nodoArrastrado, nodoDestino);
  }
}
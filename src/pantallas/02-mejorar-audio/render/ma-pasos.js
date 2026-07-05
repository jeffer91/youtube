/* =========================================================
Nombre completo: ma-pasos.js
Ruta o ubicación: /src/pantallas/02-mejorar-audio/render/ma-pasos.js
Funciones principales:
- Renderizar las páginas internas de Mejorar audio.
- Marcar la página activa.
- Conectar navegación por páginas.
- Mostrar botones Atrás, Siguiente, Guardar capa y Descargar.
- Bloquear acciones cuando el proceso está cargando.
Con qué se conecta:
- ma-data.js
- ma-service.js
- ma.css
========================================================= */

import { obtenerPaginasMA } from "../data/ma-data.js";

function escaparHtml(texto) {
  return String(texto || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function estadoOcupado(estado) {
  return Boolean(estado?.procesando || estado?.guardando || estado?.descargando);
}

function videoTieneAudioMejorado(estado) {
  const videos = Array.isArray(estado?.videos) ? estado.videos : [];
  const video = videos.find((item) => item.id === estado.videoActualId) || null;

  return Boolean(video?.audioMejorado?.ruta || video?.audioMejorado?.url || estado?.resultadoActual?.ruta);
}

function crearItemPagina(pagina, paginaActual, ocupado) {
  const activo = pagina.id === paginaActual ? "is-active" : "";

  return `
    <button
      class="ma-page ${activo}"
      type="button"
      data-ma-pagina="${escaparHtml(pagina.id)}"
      ${ocupado ? "disabled" : ""}
    >
      <span class="ma-page__number">${escaparHtml(pagina.numero)}</span>
      <span class="ma-page__info">
        <strong>${escaparHtml(pagina.titulo)}</strong>
        <small>${escaparHtml(pagina.texto)}</small>
      </span>
    </button>
  `;
}

export function renderPaginasMA({ contenedor, paginaActual, procesando = false }) {
  if (!contenedor) {
    return;
  }

  const paginas = obtenerPaginasMA()
    .map((pagina) => crearItemPagina(pagina, paginaActual, procesando))
    .join("");

  contenedor.innerHTML = `
    <div class="ma-pages">
      ${paginas}
    </div>
  `;
}

export function conectarPaginasMA({ service }) {
  const botones = document.querySelectorAll("[data-ma-pagina]");

  botones.forEach((boton) => {
    boton.addEventListener("click", () => {
      if (boton.disabled) {
        return;
      }

      service.cambiarPagina(boton.dataset.maPagina);
    });
  });
}

function crearBoton({
  id,
  texto,
  variante = "ghost",
  deshabilitado = false
}) {
  const clase = variante === "primary"
    ? "app-btn"
    : "app-btn app-btn--ghost";

  return `
    <button
      id="${escaparHtml(id)}"
      class="${clase}"
      type="button"
      ${deshabilitado ? "disabled" : ""}
    >
      ${escaparHtml(texto)}
    </button>
  `;
}

function crearBotonesControles({ ocupado }) {
  return [
    crearBoton({
      id: "maBtnSiguiente",
      texto: "Ir a comparar",
      variante: "primary",
      deshabilitado: ocupado
    })
  ].join("");
}

function crearBotonesComparar({ ocupado, tieneMejora }) {
  return [
    crearBoton({
      id: "maBtnAtras",
      texto: "Volver",
      variante: "ghost",
      deshabilitado: ocupado
    }),
    crearBoton({
      id: "maBtnDescargar",
      texto: "Descargar video mejorado",
      variante: "ghost",
      deshabilitado: ocupado || !tieneMejora
    }),
    crearBoton({
      id: "maBtnSiguiente",
      texto: "Guardar capa",
      variante: "primary",
      deshabilitado: ocupado || !tieneMejora
    })
  ].join("");
}

function crearBotonesGuardar({ ocupado, tieneMejora, capaGuardada }) {
  return [
    crearBoton({
      id: "maBtnAtras",
      texto: "Volver",
      variante: "ghost",
      deshabilitado: ocupado
    }),
    crearBoton({
      id: "maBtnGuardarCapa",
      texto: capaGuardada ? "Capa guardada" : "Guardar capa de audio",
      variante: "primary",
      deshabilitado: ocupado || !tieneMejora || capaGuardada
    }),
    crearBoton({
      id: "maBtnDescargar",
      texto: "Descargar video mejorado",
      variante: "ghost",
      deshabilitado: ocupado || !tieneMejora
    })
  ].join("");
}

export function renderBotonesMA({ contenedor, estado }) {
  if (!contenedor) {
    return;
  }

  const ocupado = estadoOcupado(estado);
  const tieneMejora = videoTieneAudioMejorado(estado);
  let botones = "";

  if (estado.paginaActual === "controles") {
    botones = crearBotonesControles({
      ocupado
    });
  } else if (estado.paginaActual === "comparar") {
    botones = crearBotonesComparar({
      ocupado,
      tieneMejora
    });
  } else {
    botones = crearBotonesGuardar({
      ocupado,
      tieneMejora,
      capaGuardada: Boolean(estado.capaGuardada)
    });
  }

  contenedor.innerHTML = `
    <div class="ma-actions">
      ${botones}
    </div>
  `;
}

export function conectarBotonesMA({ service }) {
  const btnAtras = document.getElementById("maBtnAtras");
  const btnSiguiente = document.getElementById("maBtnSiguiente");
  const btnGuardarCapa = document.getElementById("maBtnGuardarCapa");
  const btnDescargar = document.getElementById("maBtnDescargar");

  if (btnAtras) {
    btnAtras.addEventListener("click", () => {
      if (!btnAtras.disabled) {
        service.paginaAnterior();
      }
    });
  }

  if (btnSiguiente) {
    btnSiguiente.addEventListener("click", () => {
      if (!btnSiguiente.disabled) {
        service.paginaSiguiente();
      }
    });
  }

  if (btnGuardarCapa) {
    btnGuardarCapa.addEventListener("click", () => {
      if (!btnGuardarCapa.disabled) {
        service.guardarCapaActual();
      }
    });
  }

  if (btnDescargar) {
    btnDescargar.addEventListener("click", () => {
      if (!btnDescargar.disabled) {
        service.descargarActual();
      }
    });
  }
}
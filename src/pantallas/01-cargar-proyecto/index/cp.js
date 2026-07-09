/* =========================================================
Nombre completo: cp.js
Ruta o ubicación: /src/pantallas/01-cargar-proyecto/index/cp.js
Funciones principales:
- Iniciar la pantalla Cargar proyecto.
- Conectar el servicio interno con la interfaz.
- Renderizar pasos, videos, estilos y mensajes.
- Cargar videos y mostrar popup.
- Guardar proyecto y pasar al flujo correcto: Cuadrado IA.
========================================================= */

import { crearCargarProyectoService } from "../services/cp-service.js";
import {
  renderPasos,
  conectarPasos,
  renderContenidoPaso,
  renderBotonesNavegacion,
  conectarBotonesNavegacion,
  conectarCamposPasoTres
} from "../render/cp-pasos.js";
import {
  renderListaVideos,
  conectarListaVideos
} from "../render/cp-lista.js";
import {
  renderSelectorEstilos,
  conectarSelectorEstilos
} from "../render/cp-estilos-ui.js";
import { conectarDragVideos } from "../orden/cp-drag.js";
import { obtenerNombreEstilo } from "../data/cp-data-estilos.js";

let serviceActual = null;
let routerActual = null;
let estadoAppActual = null;

function obtenerElementos() {
  return {
    pasos: document.getElementById("cpPasos"),
    mensajes: document.getElementById("cpMensajes"),
    contenido: document.getElementById("cpContenido"),
    resumen: document.getElementById("cpResumen"),
    acciones: document.getElementById("cpAcciones")
  };
}

function escaparHtml(texto) {
  return String(texto || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderMensajes(contenedor, estado) {
  if (!contenedor) {
    return;
  }

  const errores = Array.isArray(estado.errores) ? estado.errores : [];
  const mensajes = Array.isArray(estado.mensajes) ? estado.mensajes : [];

  if (!errores.length && !mensajes.length) {
    contenedor.innerHTML = "";
    return;
  }

  const erroresHtml = errores
    .map((error) => `<div class="cp-alert cp-alert--error">${escaparHtml(error)}</div>`)
    .join("");

  const mensajesHtml = mensajes
    .map((mensaje) => `<div class="cp-alert cp-alert--success">${escaparHtml(mensaje)}</div>`)
    .join("");

  contenedor.innerHTML = `
    <div class="cp-messages">
      ${erroresHtml}
      ${mensajesHtml}
    </div>
  `;
}

function renderResumen(contenedor, estado) {
  if (!contenedor) {
    return;
  }

  const totalVideos = Array.isArray(estado.videos) ? estado.videos.length : 0;
  const nombre = estado.nombre ? estado.nombre : "Sin nombre";
  const estilo = estado.estilo ? obtenerNombreEstilo(estado.estilo) : "Sin estilo";

  contenedor.innerHTML = `
    <div class="cp-summary__grid">
      <div class="cp-summary__item">
        <span>Videos</span>
        <strong>${totalVideos}</strong>
      </div>

      <div class="cp-summary__item">
        <span>Proyecto</span>
        <strong>${escaparHtml(nombre)}</strong>
      </div>

      <div class="cp-summary__item">
        <span>Estilo</span>
        <strong>${escaparHtml(estilo)}</strong>
      </div>
    </div>
  `;
}

function conectarCargaVideos(service) {
  const boton = document.getElementById("cpBtnCargarVideos");

  if (!boton) {
    return;
  }

  boton.addEventListener("click", async () => {
    const estadoAntes = service.obtenerEstado();
    const cantidadAntes = Array.isArray(estadoAntes.videos) ? estadoAntes.videos.length : 0;
    const estadoDespues = await service.cargarVideos();
    const cantidadDespues = Array.isArray(estadoDespues.videos) ? estadoDespues.videos.length : 0;

    if (cantidadDespues > cantidadAntes) {
      service.irAPaso(2);
    }
  });
}

function conectarPasoActual(service, estado) {
  conectarCargaVideos(service);
  conectarCamposPasoTres({ service });

  const contenedorLista = document.getElementById("cpListaVideos");

  if (contenedorLista) {
    renderListaVideos({ contenedor: contenedorLista, videos: estado.videos });
    conectarListaVideos({ service });
    conectarDragVideos({ service });
  }

  const contenedorEstilos = document.getElementById("cpSelectorEstilos");

  if (contenedorEstilos) {
    renderSelectorEstilos({ contenedor: contenedorEstilos, estiloSeleccionado: estado.estilo });
    conectarSelectorEstilos({ service });
  }
}

async function guardarYContinuar(service) {
  const estadoFinal = await service.guardarProyecto();

  if (!estadoFinal.proyectoGuardado) {
    return;
  }

  if (estadoAppActual?.establecerProyectoActivo) {
    estadoAppActual.establecerProyectoActivo(
      estadoFinal.proyectoGuardado,
      estadoFinal.rutaProyecto || null
    );
  }

  if (routerActual?.irA) {
    await routerActual.irA("17-adaptar-cuadrado");
  }
}

function renderizar(service) {
  const estado = service.obtenerEstado();
  const elementos = obtenerElementos();

  renderPasos({ contenedor: elementos.pasos, pasoActual: estado.pasoActual });
  renderMensajes(elementos.mensajes, estado);
  renderContenidoPaso({ contenedor: elementos.contenido, estado });
  renderResumen(elementos.resumen, estado);
  renderBotonesNavegacion({ contenedor: elementos.acciones, estado });
  conectarPasos({ service });
  conectarPasoActual(service, estado);
  conectarBotonesNavegacion({ service, onGuardar: () => guardarYContinuar(service) });
}

export async function iniciarPantallaCargarProyecto({ router, estadoApp }) {
  routerActual = router;
  estadoAppActual = estadoApp;
  serviceActual = crearCargarProyectoService();

  serviceActual.escuchar(() => {
    renderizar(serviceActual);
  });

  renderizar(serviceActual);
}

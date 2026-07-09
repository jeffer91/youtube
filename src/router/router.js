/* =========================================================
Nombre completo: router.js
Ruta o ubicación: /src/router/router.js
Funciones principales:
- Cargar pantallas dentro del contenedor principal.
- Insertar HTML y CSS de cada pantalla.
- Importar el JS principal de cada pantalla.
- Ejecutar la función inicial de la pantalla.
- Mantener navegación simple entre pantallas.
- Conectar el flujo profesional completo desde una configuración central.
Con qué se conecta:
- flujo-editor.js
- app.js
- pantallas/*
========================================================= */

import { RUTAS_EDITOR } from "../shared/flujo/flujo-editor.js";

const RUTAS = RUTAS_EDITOR;

function asegurarRoot(root) {
  if (!root) throw new Error("No existe el contenedor principal de pantallas.");
}

function escaparHtml(texto) {
  return String(texto || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cargarCss(ruta) {
  if (!ruta.css || !ruta.cssId || document.getElementById(ruta.cssId)) return;
  const link = document.createElement("link");
  link.id = ruta.cssId;
  link.rel = "stylesheet";
  link.href = ruta.css;
  document.head.appendChild(link);
}

async function cargarHtml(ruta) {
  if (!ruta.html) return crearPantallaPendiente(ruta);
  const respuesta = await fetch(ruta.html);
  if (!respuesta.ok) throw new Error(`No se pudo cargar el HTML de ${ruta.id}.`);
  const html = await respuesta.text();
  return html.trim() ? html : crearPantallaPendiente(ruta);
}

async function cargarModuloPantalla(ruta) {
  if (!ruta.js || !ruta.init) return null;
  const urlModulo = new URL(ruta.js, import.meta.url);
  const modulo = await import(urlModulo.href);
  if (!modulo || typeof modulo[ruta.init] !== "function") {
    throw new Error(`La pantalla ${ruta.id} no tiene función inicial.`);
  }
  return modulo[ruta.init];
}

function crearPantallaPendiente(ruta) {
  const boton = ruta.siguiente
    ? `<button class="app-btn" type="button" data-router-go="${escaparHtml(ruta.siguiente)}">Continuar al siguiente paso</button>`
    : "";

  return `
    <div class="app-empty">
      <div>
        <h3>${escaparHtml(ruta.numero || "")}. ${escaparHtml(ruta.titulo || ruta.id)}</h3>
        <p>${escaparHtml(ruta.descripcion || "Esta pantalla todavía no está construida.")}</p>
        ${ruta.criterio ? `<p><strong>Criterio:</strong> ${escaparHtml(ruta.criterio)}</p>` : ""}
        ${boton}
      </div>
    </div>
  `;
}

function crearPantallaError(mensaje) {
  return `
    <div class="app-empty">
      <div>
        <h3>No se pudo abrir la pantalla</h3>
        <p>${escaparHtml(mensaje)}</p>
      </div>
    </div>
  `;
}

export function crearRouter({ root, estadoApp, onRouteChange } = {}) {
  asegurarRoot(root);
  let rutaActual = null;

  function conectarNavegacionInterna() {
    root.querySelectorAll("[data-router-go]").forEach((boton) => {
      boton.addEventListener("click", () => {
        if (boton.dataset.routerGo) api.irA(boton.dataset.routerGo);
      });
    });
  }

  async function irA(routeId) {
    const ruta = RUTAS[routeId];
    if (!ruta) {
      root.innerHTML = crearPantallaError("La pantalla solicitada no existe.");
      return;
    }

    try {
      cargarCss(ruta);
      const html = await cargarHtml(ruta);
      root.innerHTML = html;
      conectarNavegacionInterna();
      const iniciarPantalla = await cargarModuloPantalla(ruta);
      if (iniciarPantalla) await iniciarPantalla({ root, router: api, estadoApp });

      rutaActual = routeId;
      if (estadoApp?.establecerPantallaActual) estadoApp.establecerPantallaActual(routeId);
      if (typeof onRouteChange === "function") onRouteChange(routeId);
    } catch (error) {
      root.innerHTML = crearPantallaError(error.message);
    }
  }

  function obtenerRutaActual() {
    return rutaActual;
  }

  function obtenerRutas() {
    return { ...RUTAS };
  }

  const api = { irA, obtenerRutaActual, obtenerRutas };
  return api;
}

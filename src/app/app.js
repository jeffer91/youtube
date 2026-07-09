/* =========================================================
Nombre completo: app.js
Ruta o ubicación: /src/app/app.js
Funciones principales:
- Iniciar la interfaz principal de la app.
- Crear el contenedor visual general.
- Conectar el estado global mínimo.
- Iniciar el router de pantallas.
- Cargar por defecto la pantalla 01 Video base y diagnóstico.
- Mostrar el flujo profesional de edición por capas.
- Mantener los subtítulos como última capa visible antes de exportar.
- Agregar un botón flotante único para conectar todo el flujo.
Con qué se conecta:
- app-state.js
- router.js
- flujo-editor.js
========================================================= */

import { crearEstadoApp } from "./app-state.js";
import { crearRouter } from "../router/router.js";
import {
  ACCIONES_PRINCIPALES_EDITOR,
  obtenerPantallasMenuEditor
} from "../shared/flujo/flujo-editor.js";

const appRoot = document.getElementById("appRoot");
const RUTA_INICIAL = "01-video-base-diagnostico";
const RUTA_FINAL = "12-revision-exportacion";
const PANTALLAS_BASE = obtenerPantallasMenuEditor();

function crearMenuPantallas(pantallas) {
  return pantallas.map((pantalla) => {
    return `
      <button class="app-menu__item" type="button" data-route="${pantalla.id}" title="${pantalla.numero}. ${pantalla.nombre}">
        <span class="app-menu__number">${pantalla.numero}</span>
        <span class="app-menu__text">
          <strong>${pantalla.nombre}</strong>
          <small>${pantalla.descripcion}</small>
        </span>
      </button>
    `;
  }).join("");
}

function pintarShell() {
  appRoot.innerHTML = `
    <div class="app-shell">
      <aside class="app-sidebar">
        <div class="app-brand">
          <div class="app-brand__icon">VE</div>
          <div>
            <h1>Video Editor</h1>
            <p>Video final por capas</p>
          </div>
        </div>

        <nav class="app-menu" aria-label="Pantallas de edición">
          ${crearMenuPantallas(PANTALLAS_BASE)}
        </nav>
      </aside>

      <section class="app-main">
        <header class="app-header">
          <div>
            <p class="app-header__eyebrow">Proyecto</p>
            <h2 id="appHeaderTitle">Video base</h2>
          </div>

          <div class="app-header__actions">
            <button id="btnAbrirCarpetaProyectos" class="app-btn app-btn--ghost" type="button">Proyectos</button>
          </div>
        </header>

        <section id="screenRoot" class="screen-root"></section>
      </section>

      <button id="appFloatingNext" class="app-floating-next" type="button">
        <span id="appFloatingNextMain">Continuar</span>
        <small id="appFloatingNextSub">Siguiente paso</small>
      </button>
    </div>
  `;
}

function marcarRutaActiva(routeId) {
  document.querySelectorAll("[data-route]").forEach((boton) => {
    boton.classList.toggle("is-active", boton.dataset.route === routeId);
  });
}

function conectarMenu(router) {
  document.querySelectorAll("[data-route]").forEach((boton) => {
    boton.addEventListener("click", async () => {
      await router.irA(boton.dataset.route);
    });
  });
}

function conectarBotonProyectos() {
  const boton = document.getElementById("btnAbrirCarpetaProyectos");
  if (!boton) return;

  boton.addEventListener("click", async () => {
    if (window.videoEditorAPI?.abrirCarpetaProyectos) {
      await window.videoEditorAPI.abrirCarpetaProyectos();
    }
  });
}

function actualizarTitulo(routeId) {
  const titulo = document.getElementById("appHeaderTitle");
  const pantalla = PANTALLAS_BASE.find((item) => item.id === routeId);
  if (titulo && pantalla) titulo.textContent = `${pantalla.numero}. ${pantalla.nombre}`;
}

function obtenerPantalla(routeId) {
  return PANTALLAS_BASE.find((item) => item.id === routeId) || null;
}

function obtenerBotonPrincipalDePantalla(routeId) {
  const selectores = ACCIONES_PRINCIPALES_EDITOR[routeId] || [];
  for (const selector of selectores) {
    const boton = document.querySelector(selector);
    if (boton) return boton;
  }
  return null;
}

function obtenerSiguienteRuta(router, routeId) {
  const rutas = router?.obtenerRutas?.() || {};
  return rutas[routeId]?.siguiente || null;
}

function actualizarBotonFlotante(router, routeId) {
  const boton = document.getElementById("appFloatingNext");
  const textoPrincipal = document.getElementById("appFloatingNextMain");
  const textoSecundario = document.getElementById("appFloatingNextSub");
  if (!boton || !textoPrincipal || !textoSecundario) return;

  const rutaActual = routeId || router?.obtenerRutaActual?.();
  const siguienteRuta = obtenerSiguienteRuta(router, rutaActual);
  const siguientePantalla = obtenerPantalla(siguienteRuta);
  const botonPantalla = obtenerBotonPrincipalDePantalla(rutaActual);
  const esManual = rutaActual === "99-manual-app";
  const esFinal = rutaActual === RUTA_FINAL && !siguienteRuta;

  if (esManual) {
    boton.hidden = true;
    return;
  }

  boton.hidden = false;

  if (botonPantalla) {
    const textoAccion = botonPantalla.textContent.trim() || "Continuar";
    textoPrincipal.textContent = textoAccion;
    textoSecundario.textContent = siguientePantalla ? `Luego: ${siguientePantalla.numero}. ${siguientePantalla.nombre}` : "Acción principal";
    boton.disabled = Boolean(botonPantalla.disabled);
    boton.dataset.modo = "accion";
    return;
  }

  if (siguientePantalla) {
    textoPrincipal.textContent = "Continuar";
    textoSecundario.textContent = `${siguientePantalla.numero}. ${siguientePantalla.nombre}`;
    boton.disabled = false;
    boton.dataset.modo = "ruta";
    return;
  }

  textoPrincipal.textContent = esFinal ? "Flujo completo" : "Sin siguiente paso";
  textoSecundario.textContent = esFinal ? "Puedes generar o descargar" : "Revisa el menú";
  boton.disabled = true;
  boton.dataset.modo = "final";
}

function conectarBotonFlotante(router) {
  const boton = document.getElementById("appFloatingNext");
  if (!boton) return;

  boton.addEventListener("click", async () => {
    if (boton.disabled) return;

    const rutaActual = router.obtenerRutaActual?.();
    const botonPantalla = obtenerBotonPrincipalDePantalla(rutaActual);

    if (botonPantalla && !botonPantalla.disabled) {
      botonPantalla.click();
      setTimeout(() => actualizarBotonFlotante(router, router.obtenerRutaActual?.()), 160);
      return;
    }

    const siguienteRuta = obtenerSiguienteRuta(router, rutaActual);
    if (siguienteRuta) await router.irA(siguienteRuta);
    else actualizarBotonFlotante(router, rutaActual);
  });
}

function observarCambiosPantalla(router) {
  const root = document.getElementById("screenRoot");
  if (!root || typeof MutationObserver === "undefined") return;

  let temporizador = null;
  const observer = new MutationObserver(() => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => actualizarBotonFlotante(router, router.obtenerRutaActual?.()), 80);
  });

  observer.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["disabled", "hidden", "class"]
  });
}

async function iniciarApp() {
  pintarShell();

  const estadoApp = crearEstadoApp({
    pantallaActual: RUTA_INICIAL,
    pantallas: PANTALLAS_BASE
  });

  const router = crearRouter({
    root: document.getElementById("screenRoot"),
    estadoApp,
    onRouteChange: (routeId) => {
      marcarRutaActiva(routeId);
      actualizarTitulo(routeId);
      setTimeout(() => actualizarBotonFlotante(router, routeId), 80);
    }
  });

  conectarMenu(router);
  conectarBotonProyectos();
  conectarBotonFlotante(router);
  observarCambiosPantalla(router);

  await router.irA(RUTA_INICIAL);
}

iniciarApp();

/* =========================================================
Nombre completo: app.js
Ruta o ubicación: /src/app/app.js
Funciones principales:
- Iniciar la interfaz principal de la app.
- Crear el contenedor visual general.
- Conectar el estado global mínimo.
- Iniciar el router de pantallas.
- Cargar por defecto la pantalla 01 Cargar proyecto.
- Mostrar el flujo correcto de edición por capas.
- Mantener los subtítulos como última capa visible antes de exportar.
- Agregar un botón flotante único para conectar todo el flujo.
========================================================= */

import { crearEstadoApp } from "./app-state.js";
import { crearRouter } from "../router/router.js";

const appRoot = document.getElementById("appRoot");

const PANTALLAS_BASE = [
  {
    id: "01-cargar-proyecto",
    numero: "01",
    nombre: "Video base",
    descripcion: "Cargar y validar"
  },
  {
    id: "17-adaptar-cuadrado",
    numero: "02",
    nombre: "Cuadrado IA",
    descripcion: "Sujeto centrado"
  },
  {
    id: "05-detectar-silencios",
    numero: "03",
    nombre: "Cortes",
    descripcion: "Silencios + margen"
  },
  {
    id: "15-transiciones",
    numero: "04",
    nombre: "Transiciones",
    descripcion: "Entre cortes"
  },
  {
    id: "02-mejorar-audio",
    numero: "05",
    nombre: "Audio principal",
    descripcion: "Mejorar voz"
  },
  {
    id: "11-musica-fondo",
    numero: "06",
    nombre: "Música",
    descripcion: "Audio adicional"
  },
  {
    id: "16-correccion-color",
    numero: "07",
    nombre: "Color",
    descripcion: "Limpiar imagen"
  },
  {
    id: "13-agregar-imagen-video",
    numero: "08",
    nombre: "Recursos",
    descripcion: "Imagen y logos"
  },
  {
    id: "10-texto-graficos",
    numero: "09",
    nombre: "Textos",
    descripcion: "Textos normales"
  },
  {
    id: "14-animaciones",
    numero: "10",
    nombre: "Animaciones",
    descripcion: "Recursos y textos"
  },
  {
    id: "04-subtitulos-automaticos",
    numero: "11",
    nombre: "Subtítulos",
    descripcion: "Última capa"
  },
  {
    id: "19-exportar-video-final",
    numero: "12",
    nombre: "Exportar",
    descripcion: "Video final"
  },
  {
    id: "99-manual-app",
    numero: "M",
    nombre: "Manual",
    descripcion: "Cómo funciona"
  }
];

const ACCIONES_PRINCIPALES_RUTA = {
  "01-cargar-proyecto": ["#cpBtnSiguiente", "#cpBtnGuardar"],
  "02-mejorar-audio": ["#maBtnSiguiente", "#maBtnGuardarCapa", "#maBtnContinuarFlujo"],
  "03-transcribir-video": ["#trBtnSiguiente"],
  "04-subtitulos-automaticos": ["#saBtnContinuar"],
  "19-exportar-video-final": ["#exBtnGenerar"]
};

function crearMenuPantallas(pantallas) {
  return pantallas
    .map((pantalla) => {
      return `
        <button
          class="app-menu__item"
          type="button"
          data-route="${pantalla.id}"
          title="${pantalla.numero}. ${pantalla.nombre}"
        >
          <span class="app-menu__number">${pantalla.numero}</span>
          <span class="app-menu__text">
            <strong>${pantalla.nombre}</strong>
            <small>${pantalla.descripcion}</small>
          </span>
        </button>
      `;
    })
    .join("");
}

function pintarShell() {
  appRoot.innerHTML = `
    <div class="app-shell">
      <aside class="app-sidebar">
        <div class="app-brand">
          <div class="app-brand__icon">VE</div>
          <div>
            <h1>Video Editor</h1>
            <p>Render final por capas</p>
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
            <h2 id="appHeaderTitle">Cargar proyecto</h2>
          </div>

          <div class="app-header__actions">
            <button
              id="btnAbrirCarpetaProyectos"
              class="app-btn app-btn--ghost"
              type="button"
            >
              Proyectos
            </button>
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
  const botones = document.querySelectorAll("[data-route]");

  botones.forEach((boton) => {
    const esActivo = boton.dataset.route === routeId;
    boton.classList.toggle("is-active", esActivo);
  });
}

function conectarMenu(router) {
  const botones = document.querySelectorAll("[data-route]");

  botones.forEach((boton) => {
    boton.addEventListener("click", async () => {
      const routeId = boton.dataset.route;
      await router.irA(routeId);
    });
  });
}

function conectarBotonProyectos() {
  const boton = document.getElementById("btnAbrirCarpetaProyectos");

  if (!boton) {
    return;
  }

  boton.addEventListener("click", async () => {
    if (!window.videoEditorAPI?.abrirCarpetaProyectos) {
      return;
    }

    await window.videoEditorAPI.abrirCarpetaProyectos();
  });
}

function actualizarTitulo(routeId) {
  const titulo = document.getElementById("appHeaderTitle");
  const pantalla = PANTALLAS_BASE.find((item) => item.id === routeId);

  if (!titulo || !pantalla) {
    return;
  }

  titulo.textContent = `${pantalla.numero}. ${pantalla.nombre}`;
}

function obtenerPantalla(routeId) {
  return PANTALLAS_BASE.find((item) => item.id === routeId) || null;
}

function obtenerBotonPrincipalDePantalla(routeId) {
  const selectores = ACCIONES_PRINCIPALES_RUTA[routeId] || [];

  for (const selector of selectores) {
    const boton = document.querySelector(selector);
    if (boton) {
      return boton;
    }
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

  if (!boton || !textoPrincipal || !textoSecundario) {
    return;
  }

  const rutaActual = routeId || router?.obtenerRutaActual?.();
  const siguienteRuta = obtenerSiguienteRuta(router, rutaActual);
  const siguientePantalla = obtenerPantalla(siguienteRuta);
  const botonPantalla = obtenerBotonPrincipalDePantalla(rutaActual);
  const esManual = rutaActual === "99-manual-app";
  const esFinal = rutaActual === "19-exportar-video-final" && !siguienteRuta;

  if (esManual) {
    boton.hidden = true;
    return;
  }

  boton.hidden = false;

  if (botonPantalla) {
    const textoAccion = botonPantalla.textContent.trim() || "Continuar";
    textoPrincipal.textContent = textoAccion;
    textoSecundario.textContent = siguientePantalla
      ? `Luego: ${siguientePantalla.numero}. ${siguientePantalla.nombre}`
      : "Acción principal";
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

  if (!boton) {
    return;
  }

  boton.addEventListener("click", async () => {
    if (boton.disabled) {
      return;
    }

    const rutaActual = router.obtenerRutaActual?.();
    const botonPantalla = obtenerBotonPrincipalDePantalla(rutaActual);

    if (botonPantalla && !botonPantalla.disabled) {
      botonPantalla.click();
      setTimeout(() => actualizarBotonFlotante(router, router.obtenerRutaActual?.()), 160);
      return;
    }

    const siguienteRuta = obtenerSiguienteRuta(router, rutaActual);

    if (siguienteRuta) {
      await router.irA(siguienteRuta);
      return;
    }

    actualizarBotonFlotante(router, rutaActual);
  });
}

function observarCambiosPantalla(router) {
  const root = document.getElementById("screenRoot");

  if (!root || typeof MutationObserver === "undefined") {
    return;
  }

  let temporizador = null;
  const observer = new MutationObserver(() => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => {
      actualizarBotonFlotante(router, router.obtenerRutaActual?.());
    }, 80);
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
    pantallaActual: "01-cargar-proyecto",
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

  await router.irA("01-cargar-proyecto");
}

iniciarApp();

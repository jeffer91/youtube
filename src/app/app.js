/* =========================================================
Nombre completo: app.js
Ruta o ubicación: /src/app/app.js
Funciones principales:
- Iniciar la interfaz principal de la app.
- Crear el contenedor visual general.
- Conectar el estado global mínimo.
- Iniciar el router de pantallas.
- Cargar por defecto la pantalla 01 Cargar proyecto.
- Mostrar el manual interno de uso de la app.
========================================================= */

import { crearEstadoApp } from "./app-state.js";
import { crearRouter } from "../router/router.js";

const appRoot = document.getElementById("appRoot");

const PANTALLAS_BASE = [
  {
    id: "01-cargar-proyecto",
    numero: "01",
    nombre: "Cargar",
    descripcion: "Crear proyecto"
  },
  {
    id: "02-mejorar-audio",
    numero: "02",
    nombre: "Audio",
    descripcion: "Mejorar voz"
  },
  {
    id: "03-transcribir-video",
    numero: "03",
    nombre: "Transcribir",
    descripcion: "Texto del video"
  },
  {
    id: "04-subtitulos-automaticos",
    numero: "04",
    nombre: "Subtítulos",
    descripcion: "Crear subtítulos"
  },
  {
    id: "05-detectar-silencios",
    numero: "05",
    nombre: "Silencios",
    descripcion: "Detectar pausas"
  },
  {
    id: "06-plan-video-ia",
    numero: "06",
    nombre: "Plan IA",
    descripcion: "Estructura"
  },
  {
    id: "07-cortar-video",
    numero: "07",
    nombre: "Cortar",
    descripcion: "Editar partes"
  },
  {
    id: "08-agregar-audio",
    numero: "08",
    nombre: "Agregar audio",
    descripcion: "Voz o sonidos"
  },
  {
    id: "09-efectos-audio",
    numero: "09",
    nombre: "Efectos audio",
    descripcion: "Fade y estilo"
  },
  {
    id: "10-texto-graficos",
    numero: "10",
    nombre: "Texto",
    descripcion: "Gráficos"
  },
  {
    id: "11-musica-fondo",
    numero: "11",
    nombre: "Música",
    descripcion: "Fondo"
  },
  {
    id: "12-estilo-visual",
    numero: "12",
    nombre: "Estilo",
    descripcion: "Apariencia"
  },
  {
    id: "13-agregar-imagen-video",
    numero: "13",
    nombre: "Imagen/video",
    descripcion: "Recursos"
  },
  {
    id: "14-animaciones",
    numero: "14",
    nombre: "Animaciones",
    descripcion: "Movimiento"
  },
  {
    id: "15-transiciones",
    numero: "15",
    nombre: "Transiciones",
    descripcion: "Escenas"
  },
  {
    id: "16-correccion-color",
    numero: "16",
    nombre: "Color",
    descripcion: "Corrección"
  },
  {
    id: "17-adaptar-cuadrado",
    numero: "17",
    nombre: "Cuadrado",
    descripcion: "Formato"
  },
  {
    id: "18-limpiar-imagen",
    numero: "18",
    nombre: "Limpiar",
    descripcion: "Imagen clara"
  },
  {
    id: "99-manual-app",
    numero: "M",
    nombre: "Manual",
    descripcion: "Cómo funciona"
  }
];

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
            <p>Por pasos y capas</p>
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
    }
  });

  window.videoEditorEstado = estadoApp;
  window.videoEditorRouter = router;

  conectarMenu(router);
  conectarBotonProyectos();

  await router.irA("01-cargar-proyecto");
}

document.addEventListener("DOMContentLoaded", iniciarApp);

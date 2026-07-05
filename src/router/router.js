/* =========================================================
Nombre completo: router.js
Ruta o ubicación: /src/router/router.js
Funciones principales:
- Cargar pantallas dentro del contenedor principal.
- Insertar HTML y CSS de cada pantalla.
- Importar el JS principal de cada pantalla.
- Ejecutar la función inicial de la pantalla.
- Mantener navegación simple entre pantallas.
========================================================= */

const RUTAS = {
  "01-cargar-proyecto": {
    id: "01-cargar-proyecto",
    html: "./pantallas/01-cargar-proyecto/index/cp.html",
    cssId: "css-01-cargar-proyecto",
    css: "./pantallas/01-cargar-proyecto/index/cp.css",
    js: "../pantallas/01-cargar-proyecto/index/cp.js",
    init: "iniciarPantallaCargarProyecto"
  },

  "02-mejorar-audio": {
    id: "02-mejorar-audio",
    html: "./pantallas/02-mejorar-audio/index/ma.html",
    cssId: "css-02-mejorar-audio",
    css: "./pantallas/02-mejorar-audio/index/ma.css",
    js: "../pantallas/02-mejorar-audio/index/ma.js",
    init: "iniciarPantallaMejorarAudio"
  },

  "03-transcribir-video": {
    id: "03-transcribir-video",
    html: null,
    cssId: null,
    css: null,
    js: null,
    init: null
  },

  "04-subtitulos-automaticos": {
    id: "04-subtitulos-automaticos",
    html: null,
    cssId: null,
    css: null,
    js: null,
    init: null
  },

  "05-detectar-silencios": {
    id: "05-detectar-silencios",
    html: null,
    cssId: null,
    css: null,
    js: null,
    init: null
  },

  "06-plan-video-ia": {
    id: "06-plan-video-ia",
    html: null,
    cssId: null,
    css: null,
    js: null,
    init: null
  },

  "07-cortar-video": {
    id: "07-cortar-video",
    html: null,
    cssId: null,
    css: null,
    js: null,
    init: null
  },

  "08-agregar-audio": {
    id: "08-agregar-audio",
    html: null,
    cssId: null,
    css: null,
    js: null,
    init: null
  },

  "09-efectos-audio": {
    id: "09-efectos-audio",
    html: null,
    cssId: null,
    css: null,
    js: null,
    init: null
  },

  "10-texto-graficos": {
    id: "10-texto-graficos",
    html: null,
    cssId: null,
    css: null,
    js: null,
    init: null
  },

  "11-musica-fondo": {
    id: "11-musica-fondo",
    html: null,
    cssId: null,
    css: null,
    js: null,
    init: null
  },

  "12-estilo-visual": {
    id: "12-estilo-visual",
    html: null,
    cssId: null,
    css: null,
    js: null,
    init: null
  },

  "13-agregar-imagen-video": {
    id: "13-agregar-imagen-video",
    html: null,
    cssId: null,
    css: null,
    js: null,
    init: null
  },

  "14-animaciones": {
    id: "14-animaciones",
    html: null,
    cssId: null,
    css: null,
    js: null,
    init: null
  },

  "15-transiciones": {
    id: "15-transiciones",
    html: null,
    cssId: null,
    css: null,
    js: null,
    init: null
  },

  "16-correccion-color": {
    id: "16-correccion-color",
    html: null,
    cssId: null,
    css: null,
    js: null,
    init: null
  },

  "17-adaptar-cuadrado": {
    id: "17-adaptar-cuadrado",
    html: null,
    cssId: null,
    css: null,
    js: null,
    init: null
  },

  "18-limpiar-imagen": {
    id: "18-limpiar-imagen",
    html: null,
    cssId: null,
    css: null,
    js: null,
    init: null
  }
};

function asegurarRoot(root) {
  if (!root) {
    throw new Error("No existe el contenedor principal de pantallas.");
  }
}

function cargarCss(ruta) {
  if (!ruta.css || !ruta.cssId) {
    return;
  }

  const existe = document.getElementById(ruta.cssId);

  if (existe) {
    return;
  }

  const link = document.createElement("link");
  link.id = ruta.cssId;
  link.rel = "stylesheet";
  link.href = ruta.css;

  document.head.appendChild(link);
}

async function cargarHtml(ruta) {
  if (!ruta.html) {
    return crearPantallaPendiente(ruta.id);
  }

  const respuesta = await fetch(ruta.html);

  if (!respuesta.ok) {
    throw new Error(`No se pudo cargar el HTML de ${ruta.id}.`);
  }

  const html = await respuesta.text();

  if (!html.trim()) {
    return crearPantallaPendiente(ruta.id);
  }

  return html;
}

async function cargarModuloPantalla(ruta) {
  if (!ruta.js || !ruta.init) {
    return null;
  }

  const urlModulo = new URL(ruta.js, import.meta.url);
  const modulo = await import(urlModulo.href);

  if (!modulo || typeof modulo[ruta.init] !== "function") {
    throw new Error(`La pantalla ${ruta.id} no tiene función inicial.`);
  }

  return modulo[ruta.init];
}

function crearPantallaPendiente(routeId) {
  return `
    <div class="app-empty">
      <div>
        <h3>${routeId}</h3>
        <p>Esta pantalla todavía no está construida.</p>
      </div>
    </div>
  `;
}

function crearPantallaError(mensaje) {
  return `
    <div class="app-empty">
      <div>
        <h3>No se pudo abrir la pantalla</h3>
        <p>${mensaje}</p>
      </div>
    </div>
  `;
}

export function crearRouter({ root, estadoApp, onRouteChange } = {}) {
  asegurarRoot(root);

  let rutaActual = null;

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

      const iniciarPantalla = await cargarModuloPantalla(ruta);

      if (iniciarPantalla) {
        await iniciarPantalla({
          root,
          router: api,
          estadoApp
        });
      }

      rutaActual = routeId;

      if (estadoApp?.establecerPantallaActual) {
        estadoApp.establecerPantallaActual(routeId);
      }

      if (typeof onRouteChange === "function") {
        onRouteChange(routeId);
      }
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

  const api = {
    irA,
    obtenerRutaActual,
    obtenerRutas
  };

  return api;
}
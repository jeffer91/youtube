/* =========================================================
Nombre completo: router.js
Ruta o ubicación: /src/router/router.js
Funciones principales:
- Cargar pantallas dentro del contenedor principal.
- Insertar HTML y CSS de cada pantalla.
- Importar el JS principal de cada pantalla.
- Ejecutar la función inicial de la pantalla.
- Mantener navegación simple entre pantallas.
- Mostrar pasos automáticos pendientes sin romper el flujo de 12 pasos.
========================================================= */

const RUTAS = {
  "01-cargar-proyecto": {
    id: "01-cargar-proyecto",
    numero: "01",
    titulo: "Video base",
    descripcion: "Cargar y validar el video original.",
    siguiente: "17-adaptar-cuadrado",
    html: "./pantallas/01-cargar-proyecto/index/cp.html",
    cssId: "css-01-cargar-proyecto",
    css: "./pantallas/01-cargar-proyecto/index/cp.css",
    js: "../pantallas/01-cargar-proyecto/index/cp.js",
    init: "iniciarPantallaCargarProyecto"
  },

  "17-adaptar-cuadrado": {
    id: "17-adaptar-cuadrado",
    numero: "02",
    titulo: "Cuadrado IA",
    descripcion: "Convertir el video a cuadrado o vertical manteniendo el sujeto centrado.",
    criterio: "Debe ir al inicio, porque si el formato cambia después, textos, imágenes y subtítulos pueden quedar fuera de lugar.",
    siguiente: "05-detectar-silencios",
    html: null,
    cssId: null,
    css: null,
    js: null,
    init: null
  },

  "05-detectar-silencios": {
    id: "05-detectar-silencios",
    numero: "03",
    titulo: "Cortes y silencios",
    descripcion: "Cortar silencios dejando un margen corto para que las transiciones no queden bruscas.",
    criterio: "Los cortes deben hacerse antes de capas visuales, porque cambian la línea de tiempo.",
    siguiente: "15-transiciones",
    html: null,
    cssId: null,
    css: null,
    js: null,
    init: null
  },

  "15-transiciones": {
    id: "15-transiciones",
    numero: "04",
    titulo: "Transiciones",
    descripcion: "Aplicar transiciones entre cortes cuando sean necesarias.",
    criterio: "Las transiciones van cerca de los cortes, no al final, para no afectar subtítulos ni overlays.",
    siguiente: "02-mejorar-audio",
    html: null,
    cssId: null,
    css: null,
    js: null,
    init: null
  },

  "02-mejorar-audio": {
    id: "02-mejorar-audio",
    numero: "05",
    titulo: "Audio principal",
    descripcion: "Mejorar la voz después de tener la estructura del video definida.",
    siguiente: "11-musica-fondo",
    html: "./pantallas/02-mejorar-audio/index/ma.html",
    cssId: "css-02-mejorar-audio",
    css: "./pantallas/02-mejorar-audio/index/ma.css",
    js: "../pantallas/02-mejorar-audio/index/ma.js",
    init: "iniciarPantallaMejorarAudio"
  },

  "11-musica-fondo": {
    id: "11-musica-fondo",
    numero: "06",
    titulo: "Música y audio adicional",
    descripcion: "Agregar música de fondo o sonidos sin tapar la voz principal.",
    criterio: "La música debe nivelarse automáticamente para no competir con la voz.",
    siguiente: "16-correccion-color",
    html: null,
    cssId: null,
    css: null,
    js: null,
    init: null
  },

  "16-correccion-color": {
    id: "16-correccion-color",
    numero: "07",
    titulo: "Color y limpieza",
    descripcion: "Corregir color y limpiar la imagen del video base antes de overlays.",
    criterio: "Debe ocurrir antes de imágenes, textos y subtítulos para no alterar esas capas.",
    siguiente: "13-agregar-imagen-video",
    html: null,
    cssId: null,
    css: null,
    js: null,
    init: null
  },

  "13-agregar-imagen-video": {
    id: "13-agregar-imagen-video",
    numero: "08",
    titulo: "Recursos visuales",
    descripcion: "Agregar imágenes, logos o recursos sin invadir la zona segura de subtítulos.",
    criterio: "Los recursos deben quedar debajo de la capa de subtítulos.",
    siguiente: "10-texto-graficos",
    html: null,
    cssId: null,
    css: null,
    js: null,
    init: null
  },

  "10-texto-graficos": {
    id: "10-texto-graficos",
    numero: "09",
    titulo: "Textos normales",
    descripcion: "Agregar títulos, rótulos o frases distintas a los subtítulos.",
    criterio: "Los textos normales no deben competir con los subtítulos finales.",
    siguiente: "14-animaciones",
    html: null,
    cssId: null,
    css: null,
    js: null,
    init: null
  },

  "14-animaciones": {
    id: "14-animaciones",
    numero: "10",
    titulo: "Animaciones",
    descripcion: "Animar imágenes, logos, recursos y textos según corresponda.",
    criterio: "Las animaciones pertenecen a los elementos ya agregados; no deben tapar subtítulos.",
    siguiente: "04-subtitulos-automaticos",
    html: null,
    cssId: null,
    css: null,
    js: null,
    init: null
  },

  "03-transcribir-video": {
    id: "03-transcribir-video",
    numero: "T",
    titulo: "Transcripción auxiliar",
    descripcion: "Crear la transcripción que luego usará la capa de subtítulos.",
    siguiente: "04-subtitulos-automaticos",
    html: "./pantallas/03-transcribir-video/index/tr.html",
    cssId: "css-03-transcribir-video",
    css: "./pantallas/03-transcribir-video/index/tr.css",
    js: "../pantallas/03-transcribir-video/index/tr.js",
    init: "iniciarPantallaTranscribirVideo"
  },

  "04-subtitulos-automaticos": {
    id: "04-subtitulos-automaticos",
    numero: "11",
    titulo: "Subtítulos",
    descripcion: "Preparar subtítulos como última capa visible, pero sin exportar todavía.",
    siguiente: "19-exportar-video-final",
    html: "./pantallas/04-subtitulos-automaticos/index/sa.html",
    cssId: "css-04-subtitulos-automaticos",
    css: "./pantallas/04-subtitulos-automaticos/index/sa.css",
    js: "../pantallas/04-subtitulos-automaticos/index/sa.js",
    init: "iniciarPantallaSubtitulosAutomaticos"
  },

  "19-exportar-video-final": {
    id: "19-exportar-video-final",
    numero: "12",
    titulo: "Exportar video final",
    descripcion: "Renderizar el resultado final aplicando subtítulos al último.",
    siguiente: null,
    html: "./pantallas/19-exportar-video-final/index/ex.html",
    cssId: "css-19-exportar-video-final",
    css: "./pantallas/19-exportar-video-final/index/ex.css",
    js: "../pantallas/19-exportar-video-final/index/ex.js",
    init: "iniciarPantallaExportarFinal"
  },

  "06-plan-video-ia": {
    id: "06-plan-video-ia",
    numero: "IA",
    titulo: "Plan IA",
    descripcion: "Pantalla auxiliar para planificar la estructura.",
    siguiente: "07-cortar-video",
    html: null,
    cssId: null,
    css: null,
    js: null,
    init: null
  },

  "07-cortar-video": {
    id: "07-cortar-video",
    numero: "C",
    titulo: "Cortar video",
    descripcion: "Pantalla auxiliar de cortes manuales.",
    siguiente: "15-transiciones",
    html: null,
    cssId: null,
    css: null,
    js: null,
    init: null
  },

  "08-agregar-audio": {
    id: "08-agregar-audio",
    numero: "A",
    titulo: "Agregar audio",
    descripcion: "Pantalla auxiliar para voz o sonidos.",
    siguiente: "11-musica-fondo",
    html: null,
    cssId: null,
    css: null,
    js: null,
    init: null
  },

  "09-efectos-audio": {
    id: "09-efectos-audio",
    numero: "FX",
    titulo: "Efectos de audio",
    descripcion: "Pantalla auxiliar para fades y estilo de audio.",
    siguiente: "11-musica-fondo",
    html: null,
    cssId: null,
    css: null,
    js: null,
    init: null
  },

  "12-estilo-visual": {
    id: "12-estilo-visual",
    numero: "EV",
    titulo: "Estilo visual",
    descripcion: "Pantalla auxiliar de apariencia.",
    siguiente: "16-correccion-color",
    html: null,
    cssId: null,
    css: null,
    js: null,
    init: null
  },

  "18-limpiar-imagen": {
    id: "18-limpiar-imagen",
    numero: "LI",
    titulo: "Limpiar imagen",
    descripcion: "Pantalla auxiliar integrada al paso Color y limpieza.",
    siguiente: "13-agregar-imagen-video",
    html: null,
    cssId: null,
    css: null,
    js: null,
    init: null
  },

  "99-manual-app": {
    id: "99-manual-app",
    numero: "M",
    titulo: "Manual",
    descripcion: "Cómo funciona la app.",
    siguiente: null,
    html: "./pantallas/99-manual-app/index/mn-app.html",
    cssId: "css-99-manual-app",
    css: "./pantallas/99-manual-app/index/mn-app.css",
    js: "../pantallas/99-manual-app/index/mn-app.js",
    init: "iniciarPantallaManualApp"
  }
};

function asegurarRoot(root) {
  if (!root) {
    throw new Error("No existe el contenedor principal de pantallas.");
  }
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
    return crearPantallaPendiente(ruta);
  }

  const respuesta = await fetch(ruta.html);

  if (!respuesta.ok) {
    throw new Error(`No se pudo cargar el HTML de ${ruta.id}.`);
  }

  const html = await respuesta.text();

  if (!html.trim()) {
    return crearPantallaPendiente(ruta);
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

function crearPantallaPendiente(ruta) {
  const criterio = ruta.criterio
    ? `<p><strong>Criterio:</strong> ${escaparHtml(ruta.criterio)}</p>`
    : "";
  const boton = ruta.siguiente
    ? `<button class="app-btn" type="button" data-router-go="${escaparHtml(ruta.siguiente)}">Continuar al siguiente paso</button>`
    : "";

  return `
    <div class="app-empty">
      <div>
        <h3>${escaparHtml(ruta.numero || "")}. ${escaparHtml(ruta.titulo || ruta.id)}</h3>
        <p>${escaparHtml(ruta.descripcion || "Esta pantalla todavía no está construida.")}</p>
        ${criterio}
        <p>Este paso queda ubicado en el orden correcto para que el render final no rompa capas posteriores.</p>
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
        if (boton.dataset.routerGo) {
          api.irA(boton.dataset.routerGo);
        }
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

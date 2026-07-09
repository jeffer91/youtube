/* =========================================================
Nombre completo: router.js
Ruta o ubicación: /src/router/router.js
Funciones principales:
- Cargar pantallas dentro del contenedor principal.
- Insertar HTML y CSS de cada pantalla.
- Importar el JS principal de cada pantalla.
- Ejecutar la función inicial de la pantalla.
- Mantener navegación simple entre pantallas.
- Mostrar pasos automáticos pendientes sin romper el flujo profesional de 12 pasos.
========================================================= */

const RUTAS = {
  "01-cargar-proyecto": {
    id: "01-cargar-proyecto",
    numero: "01",
    titulo: "Video base y diagnóstico",
    descripcion: "Cargar, validar y ordenar el video original antes de editar.",
    criterio: "La app debe revisar archivo, formato, duración, peso, orientación y existencia antes de crear capas.",
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
    titulo: "Formato inteligente",
    descripcion: "Elegir cuadrado, vertical u horizontal manteniendo el sujeto centrado.",
    criterio: "El formato va al inicio. Si se cambia después, textos, logos, recursos y subtítulos pueden quedar mal ubicados.",
    acciones: [
      "Detectar orientación del video.",
      "Reencuadrar con sujeto centrado.",
      "Guardar zona segura para subtítulos y elementos visuales."
    ],
    siguiente: "03-transcribir-video",
    html: null,
    cssId: null,
    css: null,
    js: null,
    init: null
  },

  "03-transcribir-video": {
    id: "03-transcribir-video",
    numero: "03",
    titulo: "Transcripción y análisis",
    descripcion: "Crear texto, tiempos y datos que alimentan cortes, subtítulos y ritmo.",
    criterio: "La transcripción es parte del cerebro de la edición, no solo un paso auxiliar para subtítulos.",
    siguiente: "05-detectar-silencios",
    html: "./pantallas/03-transcribir-video/index/tr.html",
    cssId: "css-03-transcribir-video",
    css: "./pantallas/03-transcribir-video/index/tr.css",
    js: "../pantallas/03-transcribir-video/index/tr.js",
    init: "iniciarPantallaTranscribirVideo"
  },

  "05-detectar-silencios": {
    id: "05-detectar-silencios",
    numero: "04",
    titulo: "Cortes inteligentes",
    descripcion: "Cortar silencios y partes muertas manteniendo ritmo natural.",
    criterio: "Los cortes cambian la línea de tiempo; por eso deben ocurrir antes de audio final, recursos, textos y subtítulos.",
    acciones: [
      "Detectar silencios y pausas largas.",
      "Dejar margen corto antes y después del corte.",
      "Evitar cortes robóticos o demasiado agresivos."
    ],
    siguiente: "15-transiciones",
    html: null,
    cssId: null,
    css: null,
    js: null,
    init: null
  },

  "15-transiciones": {
    id: "15-transiciones",
    numero: "05",
    titulo: "Transiciones selectivas",
    descripcion: "Aplicar transiciones solo cuando ayudan al cambio de escena o idea.",
    criterio: "No conviene poner transición en cada corte. Un corte limpio suele verse más profesional.",
    acciones: [
      "Revisar cortes bruscos.",
      "Aplicar transición solo si hay cambio visual fuerte.",
      "Mantener subtítulos y overlays fuera de esta etapa."
    ],
    siguiente: "02-mejorar-audio",
    html: null,
    cssId: null,
    css: null,
    js: null,
    init: null
  },

  "02-mejorar-audio": {
    id: "02-mejorar-audio",
    numero: "06",
    titulo: "Audio principal",
    descripcion: "Mejorar voz después de definir estructura y cortes.",
    criterio: "La voz manda. Se mejora sin dejarla metálica ni sobreprocesada.",
    siguiente: "11-musica-fondo",
    html: "./pantallas/02-mejorar-audio/index/ma.html",
    cssId: "css-02-mejorar-audio",
    css: "./pantallas/02-mejorar-audio/index/ma.css",
    js: "../pantallas/02-mejorar-audio/index/ma.js",
    init: "iniciarPantallaMejorarAudio"
  },

  "11-musica-fondo": {
    id: "11-musica-fondo",
    numero: "07",
    titulo: "Música y sonidos",
    descripcion: "Agregar música o sonidos sin tapar la voz principal.",
    criterio: "La música debe bajar automáticamente cuando hay voz y subir solo en espacios sin habla.",
    acciones: [
      "Agregar música de fondo.",
      "Aplicar ducking automático.",
      "Evitar que música o efectos tapen la voz."
    ],
    siguiente: "16-correccion-color",
    html: null,
    cssId: null,
    css: null,
    js: null,
    init: null
  },

  "16-correccion-color": {
    id: "16-correccion-color",
    numero: "08",
    titulo: "Color y limpieza",
    descripcion: "Mejorar brillo, contraste, nitidez y limpieza del video base.",
    criterio: "Debe ocurrir antes de logos, textos y subtítulos para no alterar esas capas.",
    acciones: [
      "Corregir brillo, contraste y saturación.",
      "Aplicar nitidez suave si conviene.",
      "Reducir ruido visual sin destruir detalle."
    ],
    siguiente: "13-agregar-imagen-video",
    html: null,
    cssId: null,
    css: null,
    js: null,
    init: null
  },

  "13-agregar-imagen-video": {
    id: "13-agregar-imagen-video",
    numero: "09",
    titulo: "Recursos visuales",
    descripcion: "Agregar imágenes, logos, capturas o recursos útiles.",
    criterio: "Los recursos deben ayudar al video, no ensuciarlo ni tapar la zona segura de subtítulos.",
    acciones: [
      "Agregar logos o imágenes.",
      "Respetar zona segura de subtítulos.",
      "Mantener recursos debajo de la capa final de subtítulos."
    ],
    siguiente: "10-texto-graficos",
    html: null,
    cssId: null,
    css: null,
    js: null,
    init: null
  },

  "10-texto-graficos": {
    id: "10-texto-graficos",
    numero: "10",
    titulo: "Textos y animaciones",
    descripcion: "Agregar rótulos, títulos, frases y animaciones simples.",
    criterio: "Texto y animación van juntos porque normalmente la animación pertenece a un texto o recurso ya creado.",
    acciones: [
      "Agregar títulos o rótulos normales.",
      "Aplicar animaciones de entrada y salida.",
      "Evitar animaciones exageradas o que tapen subtítulos."
    ],
    siguiente: "04-subtitulos-automaticos",
    html: null,
    cssId: null,
    css: null,
    js: null,
    init: null
  },

  "14-animaciones": {
    id: "14-animaciones",
    numero: "AUX",
    titulo: "Animaciones auxiliares",
    descripcion: "Pantalla auxiliar integrada al paso Textos y animaciones.",
    criterio: "Se mantiene como ruta auxiliar, pero el flujo principal usa Textos y animaciones como un solo paso.",
    siguiente: "04-subtitulos-automaticos",
    html: null,
    cssId: null,
    css: null,
    js: null,
    init: null
  },

  "04-subtitulos-automaticos": {
    id: "04-subtitulos-automaticos",
    numero: "11",
    titulo: "Subtítulos finales",
    descripcion: "Preparar subtítulos como última capa visible, sin exportar todavía.",
    criterio: "Los subtítulos van al final para que nada los tape. Se queman recién en la revisión/exportación.",
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
    titulo: "Revisión y exportación",
    descripcion: "Revisar calidad, generar video final y descargar.",
    criterio: "La exportación debe validar video, audio, subtítulos y orden de capas antes de generar.",
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
    criterio: "El plan IA puede alimentar cortes, textos y recursos, pero no debe romper el flujo principal.",
    siguiente: "05-detectar-silencios",
    html: null,
    cssId: null,
    css: null,
    js: null,
    init: null
  },

  "07-cortar-video": {
    id: "07-cortar-video",
    numero: "C",
    titulo: "Cortar video manual",
    descripcion: "Pantalla auxiliar de cortes manuales.",
    criterio: "Se mantiene como auxiliar, pero el flujo principal usa Cortes inteligentes.",
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
    titulo: "Agregar audio auxiliar",
    descripcion: "Pantalla auxiliar para voz o sonidos.",
    criterio: "Se mantiene como auxiliar, pero el flujo principal usa Música y sonidos.",
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
    criterio: "Los efectos de audio se integran a Música y sonidos o Audio principal.",
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
    titulo: "Estilo visual auxiliar",
    descripcion: "Pantalla auxiliar de apariencia.",
    criterio: "El estilo visual se reparte entre Formato inteligente, Color y limpieza, Recursos y Textos.",
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
    titulo: "Limpiar imagen auxiliar",
    descripcion: "Pantalla auxiliar integrada al paso Color y limpieza.",
    criterio: "Limpieza de imagen pertenece al paso Color y limpieza.",
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
    criterio: "Manual de uso y reglas internas.",
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

function crearAccionesPendientes(ruta) {
  const acciones = Array.isArray(ruta.acciones) ? ruta.acciones : [];

  if (!acciones.length) {
    return "";
  }

  return `
    <ul class="app-empty__list">
      ${acciones.map((accion) => `<li>${escaparHtml(accion)}</li>`).join("")}
    </ul>
  `;
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
        ${crearAccionesPendientes(ruta)}
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

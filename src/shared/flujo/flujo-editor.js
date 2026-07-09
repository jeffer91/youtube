/* =========================================================
Nombre completo: flujo-editor.js
Ruta o ubicación: /src/shared/flujo/flujo-editor.js
Funciones principales:
- Centralizar el flujo profesional de edición.
- Evitar duplicar rutas entre app.js y router.js.
- Definir menú, pantallas, rutas, archivos y acción principal por pantalla.
- Mantener una estructura robusta y fácil de revisar.
Con qué se conecta:
- app.js
- router.js
- paso-pendiente.js
========================================================= */

export const RUTAS_EDITOR = Object.freeze({
  "01-cargar-proyecto": {
    id: "01-cargar-proyecto",
    numero: "01",
    titulo: "Video base y diagnóstico",
    menuNombre: "Video base",
    menuDescripcion: "Diagnóstico",
    descripcion: "Cargar, validar y ordenar el video original antes de editar.",
    criterio: "La app debe revisar archivo, formato, duración, peso, orientación y existencia antes de crear capas.",
    siguiente: "17-adaptar-cuadrado",
    menu: true,
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
    menuNombre: "Formato IA",
    menuDescripcion: "Sujeto centrado",
    descripcion: "Elegir cuadrado, vertical u horizontal manteniendo el sujeto centrado.",
    criterio: "El formato va al inicio. Si se cambia después, textos, logos, recursos y subtítulos pueden quedar mal ubicados.",
    siguiente: "03-transcribir-video",
    menu: true,
    html: "./pantallas/17-adaptar-cuadrado/index/ac.html",
    cssId: "css-17-adaptar-cuadrado",
    css: "./pantallas/17-adaptar-cuadrado/index/ac.css",
    js: "../pantallas/17-adaptar-cuadrado/index/ac.js",
    init: "iniciarPantallaFormatoInteligente"
  },
  "03-transcribir-video": {
    id: "03-transcribir-video",
    numero: "03",
    titulo: "Transcripción y análisis",
    menuNombre: "Análisis",
    menuDescripcion: "Transcripción",
    descripcion: "Crear texto, tiempos y datos que alimentan cortes, subtítulos y ritmo.",
    criterio: "La transcripción es parte del cerebro de la edición, no solo un paso auxiliar para subtítulos.",
    siguiente: "05-detectar-silencios",
    menu: true,
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
    menuNombre: "Cortes",
    menuDescripcion: "Ritmo natural",
    descripcion: "Cortar silencios y partes muertas manteniendo ritmo natural.",
    criterio: "Los cortes cambian la línea de tiempo; por eso deben ocurrir antes de audio final, recursos, textos y subtítulos.",
    siguiente: "15-transiciones",
    menu: true,
    html: "./pantallas/05-detectar-silencios/index/ds.html",
    cssId: "css-05-detectar-silencios",
    css: "./pantallas/05-detectar-silencios/index/ds.css",
    js: "../pantallas/05-detectar-silencios/index/ds.js",
    init: "iniciarPantallaDetectarSilencios"
  },
  "15-transiciones": {
    id: "15-transiciones",
    numero: "05",
    titulo: "Transiciones selectivas",
    menuNombre: "Transiciones",
    menuDescripcion: "Selectivas",
    descripcion: "Aplicar transiciones solo cuando ayudan al cambio de escena o idea.",
    criterio: "No conviene poner transición en cada corte. Un corte limpio suele verse más profesional.",
    siguiente: "02-mejorar-audio",
    menu: true,
    html: "./pantallas/15-transiciones/index/tn.html",
    cssId: "css-15-transiciones",
    css: "./pantallas/15-transiciones/index/tn.css",
    js: "../pantallas/15-transiciones/index/tn.js",
    init: "iniciarPantallaTransiciones"
  },
  "02-mejorar-audio": {
    id: "02-mejorar-audio",
    numero: "06",
    titulo: "Audio principal",
    menuNombre: "Audio principal",
    menuDescripcion: "Voz clara",
    descripcion: "Mejorar voz después de definir estructura y cortes.",
    criterio: "La voz manda. Se mejora sin dejarla metálica ni sobreprocesada.",
    siguiente: "11-musica-fondo",
    menu: true,
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
    menuNombre: "Música",
    menuDescripcion: "Ducking",
    descripcion: "Agregar música o sonidos sin tapar la voz principal.",
    criterio: "La música debe bajar automáticamente cuando hay voz y subir solo en espacios sin habla.",
    siguiente: "16-correccion-color",
    menu: true,
    html: "./pantallas/11-musica-fondo/index/mf.html",
    cssId: "css-11-musica-fondo",
    css: "./pantallas/11-musica-fondo/index/mf.css",
    js: "../pantallas/11-musica-fondo/index/mf.js",
    init: "iniciarPantallaMusicaFondo"
  },
  "16-correccion-color": {
    id: "16-correccion-color",
    numero: "08",
    titulo: "Color y limpieza",
    menuNombre: "Color",
    menuDescripcion: "Limpieza",
    descripcion: "Mejorar brillo, contraste, nitidez y limpieza del video base.",
    criterio: "Debe ocurrir antes de logos, textos y subtítulos para no alterar esas capas.",
    siguiente: "13-agregar-imagen-video",
    menu: true,
    html: "./pantallas/16-correccion-color/index/cc.html",
    cssId: "css-16-correccion-color",
    css: "./pantallas/16-correccion-color/index/cc.css",
    js: "../pantallas/16-correccion-color/index/cc.js",
    init: "iniciarPantallaCorreccionColor"
  },
  "13-agregar-imagen-video": {
    id: "13-agregar-imagen-video",
    numero: "09",
    titulo: "Recursos visuales",
    menuNombre: "Recursos",
    menuDescripcion: "Visuales",
    descripcion: "Agregar imágenes, logos, capturas o recursos útiles.",
    criterio: "Los recursos deben ayudar al video, no ensuciarlo ni tapar la zona segura de subtítulos.",
    siguiente: "10-texto-graficos",
    menu: true,
    html: "./pantallas/13-agregar-imagen-video/index/rv.html",
    cssId: "css-13-agregar-imagen-video",
    css: "./pantallas/13-agregar-imagen-video/index/rv.css",
    js: "../pantallas/13-agregar-imagen-video/index/rv.js",
    init: "iniciarPantallaRecursosVisuales"
  },
  "10-texto-graficos": {
    id: "10-texto-graficos",
    numero: "10",
    titulo: "Textos y animaciones",
    menuNombre: "Textos",
    menuDescripcion: "Animación",
    descripcion: "Agregar rótulos, títulos, frases y animaciones simples.",
    criterio: "Texto y animación van juntos porque normalmente la animación pertenece a un texto o recurso ya creado.",
    siguiente: "04-subtitulos-automaticos",
    menu: true,
    html: "./pantallas/10-texto-graficos/index/tx.html",
    cssId: "css-10-texto-graficos",
    css: "./pantallas/10-texto-graficos/index/tx.css",
    js: "../pantallas/10-texto-graficos/index/tx.js",
    init: "iniciarPantallaTextosAnimaciones"
  },
  "04-subtitulos-automaticos": {
    id: "04-subtitulos-automaticos",
    numero: "11",
    titulo: "Subtítulos finales",
    menuNombre: "Subtítulos",
    menuDescripcion: "Finales",
    descripcion: "Preparar subtítulos como última capa visible, sin exportar todavía.",
    criterio: "Los subtítulos van al final para que nada los tape. Se queman recién en la revisión/exportación.",
    siguiente: "19-exportar-video-final",
    menu: true,
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
    menuNombre: "Revisión",
    menuDescripcion: "Exportación",
    descripcion: "Revisar calidad, generar video final y descargar.",
    criterio: "La exportación debe validar video, audio, subtítulos y orden de capas antes de generar.",
    siguiente: null,
    menu: true,
    html: "./pantallas/19-exportar-video-final/index/ex.html",
    cssId: "css-19-exportar-video-final",
    css: "./pantallas/19-exportar-video-final/index/ex.css",
    js: "../pantallas/19-exportar-video-final/index/ex.js",
    init: "iniciarPantallaExportarFinal"
  },
  "99-manual-app": {
    id: "99-manual-app",
    numero: "M",
    titulo: "Manual",
    menuNombre: "Manual",
    menuDescripcion: "Cómo funciona",
    descripcion: "Cómo funciona la app.",
    criterio: "Manual de uso y reglas internas.",
    siguiente: null,
    menu: true,
    html: "./pantallas/99-manual-app/index/mn-app.html",
    cssId: "css-99-manual-app",
    css: "./pantallas/99-manual-app/index/mn-app.css",
    js: "../pantallas/99-manual-app/index/mn-app.js",
    init: "iniciarPantallaManualApp"
  }
});

export const ACCIONES_PRINCIPALES_EDITOR = Object.freeze({
  "01-cargar-proyecto": ["#cpBtnSiguiente", "#cpBtnGuardar"],
  "17-adaptar-cuadrado": ["#acBtnContinuar"],
  "03-transcribir-video": ["#trBtnSiguiente"],
  "05-detectar-silencios": ["#dsBtnContinuar"],
  "15-transiciones": ["#tnBtnContinuar"],
  "02-mejorar-audio": ["#maBtnSiguiente", "#maBtnGuardarCapa", "#maBtnContinuarFlujo"],
  "11-musica-fondo": ["#mfBtnContinuar"],
  "16-correccion-color": ["#ccBtnContinuar"],
  "13-agregar-imagen-video": ["#rvBtnContinuar"],
  "10-texto-graficos": ["#txBtnContinuar"],
  "04-subtitulos-automaticos": ["#saBtnContinuar"],
  "19-exportar-video-final": ["#exBtnGenerar"]
});

export function obtenerPantallasMenuEditor() {
  return Object.values(RUTAS_EDITOR)
    .filter((ruta) => ruta.menu)
    .map((ruta) => ({
      id: ruta.id,
      numero: ruta.numero,
      nombre: ruta.menuNombre || ruta.titulo,
      descripcion: ruta.menuDescripcion || ruta.descripcion
    }));
}

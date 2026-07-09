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
  "01-video-base-diagnostico": {
    id: "01-video-base-diagnostico",
    numero: "01",
    titulo: "Video base y diagnóstico",
    menuNombre: "Video base",
    menuDescripcion: "Diagnóstico",
    descripcion: "Cargar, validar y ordenar el video original antes de editar.",
    criterio: "La app debe revisar archivo, formato, duración, peso, orientación y existencia antes de crear capas.",
    siguiente: "02-formato-inteligente",
    menu: true,
    html: "./pantallas/01-video-base-diagnostico/index/vbd.html",
    cssId: "css-01-video-base-diagnostico",
    css: "./pantallas/01-video-base-diagnostico/index/vbd.css",
    js: "../pantallas/01-video-base-diagnostico/index/vbd.js",
    init: "iniciarPantallaVideoBaseDiagnostico"
  },
  "02-formato-inteligente": {
    id: "02-formato-inteligente",
    numero: "02",
    titulo: "Formato inteligente",
    menuNombre: "Formato IA",
    menuDescripcion: "Sujeto centrado",
    descripcion: "Elegir cuadrado, vertical u horizontal manteniendo el sujeto centrado.",
    criterio: "El formato va al inicio. Si se cambia después, textos, logos, recursos y subtítulos pueden quedar mal ubicados.",
    siguiente: "03-transcripcion-analisis",
    menu: true,
    html: "./pantallas/02-formato-inteligente/index/fin.html",
    cssId: "css-02-formato-inteligente",
    css: "./pantallas/02-formato-inteligente/index/fin.css",
    js: "../pantallas/02-formato-inteligente/index/fin.js",
    init: "iniciarPantallaFormatoInteligente"
  },
  "03-transcripcion-analisis": {
    id: "03-transcripcion-analisis",
    numero: "03",
    titulo: "Transcripción y análisis",
    menuNombre: "Análisis",
    menuDescripcion: "Transcripción",
    descripcion: "Crear texto, tiempos y datos que alimentan cortes, subtítulos y ritmo.",
    criterio: "La transcripción es parte del cerebro de la edición, no solo un paso auxiliar para subtítulos.",
    siguiente: "04-cortes-inteligentes",
    menu: true,
    html: "./pantallas/03-transcripcion-analisis/index/tan.html",
    cssId: "css-03-transcripcion-analisis",
    css: "./pantallas/03-transcripcion-analisis/index/tan.css",
    js: "../pantallas/03-transcripcion-analisis/index/tan.js",
    init: "iniciarPantallaTranscripcionAnalisis"
  },
  "04-cortes-inteligentes": {
    id: "04-cortes-inteligentes",
    numero: "04",
    titulo: "Cortes inteligentes",
    menuNombre: "Cortes",
    menuDescripcion: "Ritmo natural",
    descripcion: "Cortar silencios y partes muertas manteniendo ritmo natural.",
    criterio: "Los cortes cambian la línea de tiempo; por eso deben ocurrir antes de audio final, recursos, textos y subtítulos.",
    siguiente: "05-transiciones-selectivas",
    menu: true,
    html: "./pantallas/04-cortes-inteligentes/index/coi.html",
    cssId: "css-04-cortes-inteligentes",
    css: "./pantallas/04-cortes-inteligentes/index/coi.css",
    js: "../pantallas/04-cortes-inteligentes/index/coi.js",
    init: "iniciarPantallaCortesInteligentes"
  },
  "05-transiciones-selectivas": {
    id: "05-transiciones-selectivas",
    numero: "05",
    titulo: "Transiciones selectivas",
    menuNombre: "Transiciones",
    menuDescripcion: "Selectivas",
    descripcion: "Aplicar transiciones solo cuando ayudan al cambio de escena o idea.",
    criterio: "No conviene poner transición en cada corte. Un corte limpio suele verse más profesional.",
    siguiente: "06-audio-principal",
    menu: true,
    html: "./pantallas/05-transiciones-selectivas/index/trs.html",
    cssId: "css-05-transiciones-selectivas",
    css: "./pantallas/05-transiciones-selectivas/index/trs.css",
    js: "../pantallas/05-transiciones-selectivas/index/trs.js",
    init: "iniciarPantallaTransicionesSelectivas"
  },
  "06-audio-principal": {
    id: "06-audio-principal",
    numero: "06",
    titulo: "Audio principal",
    menuNombre: "Audio principal",
    menuDescripcion: "Voz clara",
    descripcion: "Mejorar voz después de definir estructura y cortes.",
    criterio: "La voz manda. Se mejora sin dejarla metálica ni sobreprocesada.",
    siguiente: "07-musica-sonidos",
    menu: true,
    html: "./pantallas/06-audio-principal/index/aud.html",
    cssId: "css-06-audio-principal",
    css: "./pantallas/06-audio-principal/index/aud.css",
    js: "../pantallas/06-audio-principal/index/aud.js",
    init: "iniciarPantallaAudioPrincipal"
  },
  "07-musica-sonidos": {
    id: "07-musica-sonidos",
    numero: "07",
    titulo: "Música y sonidos",
    menuNombre: "Música",
    menuDescripcion: "Ducking",
    descripcion: "Agregar música o sonidos sin tapar la voz principal.",
    criterio: "La música debe bajar automáticamente cuando hay voz y subir solo en espacios sin habla.",
    siguiente: "08-color-limpieza",
    menu: true,
    html: "./pantallas/07-musica-sonidos/index/mus.html",
    cssId: "css-07-musica-sonidos",
    css: "./pantallas/07-musica-sonidos/index/mus.css",
    js: "../pantallas/07-musica-sonidos/index/mus.js",
    init: "iniciarPantallaMusicaSonidos"
  },
  "08-color-limpieza": {
    id: "08-color-limpieza",
    numero: "08",
    titulo: "Color y limpieza",
    menuNombre: "Color",
    menuDescripcion: "Limpieza",
    descripcion: "Mejorar brillo, contraste, nitidez y limpieza del video base.",
    criterio: "Debe ocurrir antes de logos, textos y subtítulos para no alterar esas capas.",
    siguiente: "09-recursos-visuales",
    menu: true,
    html: "./pantallas/08-color-limpieza/index/col.html",
    cssId: "css-08-color-limpieza",
    css: "./pantallas/08-color-limpieza/index/col.css",
    js: "../pantallas/08-color-limpieza/index/col.js",
    init: "iniciarPantallaColorLimpieza"
  },
  "09-recursos-visuales": {
    id: "09-recursos-visuales",
    numero: "09",
    titulo: "Recursos visuales",
    menuNombre: "Recursos",
    menuDescripcion: "Visuales",
    descripcion: "Agregar imágenes, logos, capturas o recursos útiles.",
    criterio: "Los recursos deben ayudar al video, no ensuciarlo ni tapar la zona segura de subtítulos.",
    siguiente: "10-textos-animaciones",
    menu: true,
    html: "./pantallas/09-recursos-visuales/index/rec.html",
    cssId: "css-09-recursos-visuales",
    css: "./pantallas/09-recursos-visuales/index/rec.css",
    js: "../pantallas/09-recursos-visuales/index/rec.js",
    init: "iniciarPantallaRecursosVisuales"
  },
  "10-textos-animaciones": {
    id: "10-textos-animaciones",
    numero: "10",
    titulo: "Textos y animaciones",
    menuNombre: "Textos",
    menuDescripcion: "Animación",
    descripcion: "Agregar rótulos, títulos, frases y animaciones simples.",
    criterio: "Texto y animación van juntos porque normalmente la animación pertenece a un texto o recurso ya creado.",
    siguiente: "11-subtitulos-finales",
    menu: true,
    html: "./pantallas/10-textos-animaciones/index/tex.html",
    cssId: "css-10-textos-animaciones",
    css: "./pantallas/10-textos-animaciones/index/tex.css",
    js: "../pantallas/10-textos-animaciones/index/tex.js",
    init: "iniciarPantallaTextosAnimaciones"
  },
  "11-subtitulos-finales": {
    id: "11-subtitulos-finales",
    numero: "11",
    titulo: "Subtítulos finales",
    menuNombre: "Subtítulos",
    menuDescripcion: "Finales",
    descripcion: "Preparar subtítulos como última capa visible, sin exportar todavía.",
    criterio: "Los subtítulos van al final para que nada los tape. Se queman recién en la revisión/exportación.",
    siguiente: "12-revision-exportacion",
    menu: true,
    html: "./pantallas/11-subtitulos-finales/index/sub.html",
    cssId: "css-11-subtitulos-finales",
    css: "./pantallas/11-subtitulos-finales/index/sub.css",
    js: "../pantallas/11-subtitulos-finales/index/sub.js",
    init: "iniciarPantallaSubtitulosFinales"
  },
  "12-revision-exportacion": {
    id: "12-revision-exportacion",
    numero: "12",
    titulo: "Revisión y exportación",
    menuNombre: "Revisión",
    menuDescripcion: "Exportación",
    descripcion: "Revisar calidad, generar video final y descargar.",
    criterio: "La exportación debe validar video, audio, subtítulos y orden de capas antes de generar.",
    siguiente: null,
    menu: true,
    html: "./pantallas/12-revision-exportacion/index/rev.html",
    cssId: "css-12-revision-exportacion",
    css: "./pantallas/12-revision-exportacion/index/rev.css",
    js: "../pantallas/12-revision-exportacion/index/rev.js",
    init: "iniciarPantallaRevisionExportacion"
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
  "01-video-base-diagnostico": ["#cpBtnSiguiente", "#cpBtnGuardar"],
  "02-formato-inteligente": ["#finBtnContinuar"],
  "03-transcripcion-analisis": ["#trBtnSiguiente"],
  "04-cortes-inteligentes": ["#coiBtnContinuar"],
  "05-transiciones-selectivas": ["#trsBtnContinuar"],
  "06-audio-principal": ["#maBtnSiguiente", "#maBtnGuardarCapa", "#maBtnContinuarFlujo"],
  "07-musica-sonidos": ["#musBtnContinuar"],
  "08-color-limpieza": ["#colBtnContinuar"],
  "09-recursos-visuales": ["#recBtnContinuar"],
  "10-textos-animaciones": ["#texBtnContinuar"],
  "11-subtitulos-finales": ["#saBtnContinuar"],
  "12-revision-exportacion": ["#exBtnGenerar"]
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

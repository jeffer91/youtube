/* =========================================================
Nombre completo: proyecto-capas.js
Ruta o ubicación: /src/shared/proyecto/proyecto-capas.js
Funciones principales:
- Centralizar el orden profesional de capas del proyecto.
- Evaluar si cada paso del flujo está listo, pendiente u opcional.
- Crear checklist para Revisión y exportación.
- Evitar que la pantalla final dependa de condiciones dispersas.
Con qué se conecta:
- 12-revision-exportacion/index/rev.js
- flujo-editor.js
- proyecto.capas
========================================================= */

export const ORDEN_CAPAS_PROYECTO = Object.freeze([
  {
    id: "video-base",
    numero: "01",
    nombre: "Video base",
    tipo: "base",
    requerido: true,
    descripcion: "Debe existir al menos un video cargado."
  },
  {
    id: "formato-inteligente",
    numero: "02",
    nombre: "Formato inteligente",
    tipo: "formato",
    requerido: false,
    descripcion: "Formato, reencuadre y zona segura definidos."
  },
  {
    id: "transcripcion-analisis",
    numero: "03",
    nombre: "Transcripción y análisis",
    tipo: "transcripcion",
    requerido: true,
    descripcion: "Todos los videos deben tener transcripción para subtítulos confiables."
  },
  {
    id: "cortes-inteligentes",
    numero: "04",
    nombre: "Cortes inteligentes",
    tipo: "cortes",
    requerido: false,
    descripcion: "Cortes y márgenes revisados."
  },
  {
    id: "transiciones-selectivas",
    numero: "05",
    nombre: "Transiciones selectivas",
    tipo: "transiciones",
    requerido: false,
    descripcion: "Transiciones revisadas solo donde aportan."
  },
  {
    id: "audio-principal",
    numero: "06",
    nombre: "Audio principal",
    tipo: "audio",
    requerido: false,
    descripcion: "Voz principal revisada o mejorada."
  },
  {
    id: "musica-y-sonidos",
    numero: "07",
    nombre: "Música y sonidos",
    tipo: "audio-extra",
    requerido: false,
    descripcion: "Música y sonidos sin tapar la voz."
  },
  {
    id: "color-y-limpieza",
    numero: "08",
    nombre: "Color y limpieza",
    tipo: "color",
    requerido: false,
    descripcion: "Imagen base revisada antes de overlays."
  },
  {
    id: "recursos-visuales",
    numero: "09",
    nombre: "Recursos visuales",
    tipo: "recursos",
    requerido: false,
    descripcion: "Logos, imágenes o capturas ubicadas debajo de subtítulos."
  },
  {
    id: "textos-y-animaciones",
    numero: "10",
    nombre: "Textos y animaciones",
    tipo: "texto-animacion",
    requerido: false,
    descripcion: "Textos normales y animaciones revisados."
  },
  {
    id: "subtitulos-finales",
    numero: "11",
    nombre: "Subtítulos finales",
    tipo: "subtitulos",
    requerido: true,
    descripcion: "Subtítulos preparados como última capa visible."
  },
  {
    id: "orden-final",
    numero: "12",
    nombre: "Orden final de capas",
    tipo: "revision",
    requerido: true,
    descripcion: "El render debe aplicar subtítulos al último."
  }
]);

function obtenerVideosPC(proyecto) {
  return Array.isArray(proyecto?.videos) ? proyecto.videos : [];
}

function obtenerCapasPC(proyecto) {
  return Array.isArray(proyecto?.capas) ? proyecto.capas : [];
}

function tieneTextoPC(valor) {
  return typeof valor === "string" && valor.trim().length > 0;
}

function transcripcionTieneContenidoPC(transcripcion) {
  if (!transcripcion) return false;
  if (tieneTextoPC(transcripcion.texto)) return true;
  if (Array.isArray(transcripcion.segmentos)) {
    return transcripcion.segmentos.some((segmento) => tieneTextoPC(segmento?.texto || segmento?.text));
  }
  return false;
}

function videoTieneTranscripcionPC(video) {
  if (transcripcionTieneContenidoPC(video?.transcripcion)) return true;
  if (Array.isArray(video?.transcripciones)) {
    return video.transcripciones.some((transcripcion) => transcripcionTieneContenidoPC(transcripcion));
  }
  return false;
}

function videoTieneSubtitulosPC(video) {
  const subtitulos = video?.subtitulos || video?.subtitulosAutomaticos?.subtitulos;
  return Array.isArray(subtitulos) && subtitulos.length > 0;
}

function videoTieneAudioMejoradoPC(video) {
  return Boolean(video?.audioMejorado?.ruta || video?.audioMejorado?.url || video?.audioMejorado?.archivo);
}

function existeCapaPC(capas, ids) {
  const buscados = Array.isArray(ids) ? ids : [ids];
  return capas.some((capa) => buscados.includes(capa?.id) || buscados.includes(capa?.tipo));
}

function contarVideosConTranscripcionPC(videos) {
  return videos.filter((video) => videoTieneTranscripcionPC(video)).length;
}

function contarVideosConSubtitulosPC(videos) {
  return videos.filter((video) => videoTieneSubtitulosPC(video)).length;
}

function contarVideosConAudioPC(videos) {
  return videos.filter((video) => videoTieneAudioMejoradoPC(video)).length;
}

function evaluarItemPC({ definicion, proyecto, videos, capas }) {
  const totalVideos = videos.length;
  let listo = false;
  let detalle = definicion.descripcion;

  if (definicion.id === "video-base") {
    listo = totalVideos > 0;
    detalle = listo ? `${totalVideos} video(s) cargado(s).` : "No hay videos cargados.";
  } else if (definicion.id === "formato-inteligente") {
    listo = existeCapaPC(capas, ["formato-inteligente", "formato"]);
  } else if (definicion.id === "transcripcion-analisis") {
    const listos = contarVideosConTranscripcionPC(videos);
    listo = totalVideos > 0 && listos === totalVideos;
    detalle = `${listos}/${totalVideos} video(s) con transcripción.`;
  } else if (definicion.id === "cortes-inteligentes") {
    listo = existeCapaPC(capas, ["cortes-inteligentes", "cortes"]);
  } else if (definicion.id === "transiciones-selectivas") {
    listo = existeCapaPC(capas, ["transiciones-selectivas", "transiciones"]);
  } else if (definicion.id === "audio-principal") {
    const listos = contarVideosConAudioPC(videos);
    listo = listos > 0 || existeCapaPC(capas, ["audio-principal", "audio"]);
    detalle = listos > 0 ? `${listos}/${totalVideos} video(s) con audio mejorado.` : definicion.descripcion;
  } else if (definicion.id === "musica-y-sonidos") {
    listo = existeCapaPC(capas, ["musica-y-sonidos", "audio-extra"]);
  } else if (definicion.id === "color-y-limpieza") {
    listo = existeCapaPC(capas, ["color-y-limpieza", "color"]);
  } else if (definicion.id === "recursos-visuales") {
    listo = existeCapaPC(capas, ["recursos-visuales", "recursos"]);
  } else if (definicion.id === "textos-y-animaciones") {
    listo = existeCapaPC(capas, ["textos-y-animaciones", "texto-animacion"]);
  } else if (definicion.id === "subtitulos-finales") {
    const listos = contarVideosConSubtitulosPC(videos);
    listo = totalVideos > 0 && listos === totalVideos;
    detalle = `${listos}/${totalVideos} video(s) con subtítulos preparados.`;
  } else if (definicion.id === "orden-final") {
    const tieneSubtitulos = totalVideos > 0 && contarVideosConSubtitulosPC(videos) === totalVideos;
    listo = tieneSubtitulos;
    detalle = listo
      ? "El render final puede aplicar subtítulos como última capa visible."
      : "Faltan subtítulos para cerrar el orden de capas.";
  }

  return {
    ...definicion,
    listo,
    estado: listo ? "ok" : definicion.requerido ? "error" : "pendiente",
    detalle
  };
}

export function crearChecklistProyecto(proyecto) {
  const videos = obtenerVideosPC(proyecto);
  const capas = obtenerCapasPC(proyecto);
  const items = ORDEN_CAPAS_PROYECTO.map((definicion) => evaluarItemPC({ definicion, proyecto, videos, capas }));
  const requeridos = items.filter((item) => item.requerido);
  const requeridosListos = requeridos.filter((item) => item.listo).length;
  const opcionalesListos = items.filter((item) => !item.requerido && item.listo).length;
  const puedeExportar = requeridos.length > 0 && requeridosListos === requeridos.length;

  return {
    items,
    total: items.length,
    requeridos: requeridos.length,
    requeridosListos,
    opcionalesListos,
    puedeExportar,
    videos: videos.length,
    capas: capas.length,
    porcentaje: items.length ? Math.round((items.filter((item) => item.listo).length / items.length) * 100) : 0
  };
}

export function obtenerOrdenCapasParaRender() {
  return ORDEN_CAPAS_PROYECTO.map((item) => ({
    id: item.id,
    numero: item.numero,
    nombre: item.nombre,
    tipo: item.tipo,
    requerido: item.requerido
  }));
}

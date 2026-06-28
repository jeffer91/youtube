import fs from 'fs';
import path from 'path';

function texto(valor, respaldo = '') {
  const limpio = String(valor ?? '').replace(/\s+/g, ' ').trim();
  return limpio || respaldo;
}

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function existeArchivo(rutaArchivo) {
  try {
    return Boolean(rutaArchivo && fs.existsSync(rutaArchivo) && fs.statSync(rutaArchivo).isFile());
  } catch (_error) {
    return false;
  }
}

function obtenerPesoArchivo(rutaArchivo, respaldo = 0) {
  try {
    return rutaArchivo && fs.existsSync(rutaArchivo) ? fs.statSync(rutaArchivo).size : respaldo;
  } catch (_error) {
    return respaldo;
  }
}

function obtenerRutaProyecto(video = {}) {
  return texto(video.rutaProyecto || video.rutaOriginal || video.ruta || video.path, '');
}

function obtenerNombreOriginal(video = {}, rutaProyecto = '') {
  return texto(video.nombreOriginal || video.nombreTemporal || video.nombreSeguro || path.basename(rutaProyecto || ''), 'video.mp4');
}

function crearVideoId(video = {}, indice = 0) {
  return texto(video.videoId || video.id || video.codigo || '', `video-${String(indice + 1).padStart(2, '0')}`);
}

export function normalizarVideoEntendimiento(video = {}, indice = 0) {
  const rutaProyecto = obtenerRutaProyecto(video);
  const nombreOriginal = obtenerNombreOriginal(video, rutaProyecto);
  const nombreSeguro = texto(video.nombreSeguro || path.basename(rutaProyecto || nombreOriginal), nombreOriginal);
  const extension = path.extname(nombreSeguro || rutaProyecto || '').toLowerCase();
  const existe = existeArchivo(rutaProyecto);
  const videoId = crearVideoId(video, indice);

  return {
    ...video,
    id: videoId,
    videoId,
    indice,
    orden: numero(video.orden, indice + 1),
    etiqueta: texto(video.etiqueta, `Video ${String(indice + 1).padStart(2, '0')}`),
    nombreOriginal,
    nombreTemporal: texto(video.nombreTemporal, ''),
    nombreSeguro,
    extension,
    tipo: texto(video.tipo, 'video'),
    tamanoBytes: numero(video.tamanoBytes || video.pesoBytes || obtenerPesoArchivo(rutaProyecto), 0),
    rutaProyecto,
    rutaOriginal: rutaProyecto,
    origen: texto(video.origen, 'api-etapas'),
    existe,
    estado: existe ? 'listo' : 'faltante',
    esPrincipal: indice === 0,
    seleccionadoParaEntendimiento: existe,
    guardadoEn: video.guardadoEn || null
  };
}

export function normalizarVideosEntendimiento(videosGuardados = {}) {
  const listaBase = Array.isArray(videosGuardados)
    ? videosGuardados
    : Array.isArray(videosGuardados?.videos)
      ? videosGuardados.videos
      : [];

  const videos = listaBase.map((video, indice) => normalizarVideoEntendimiento(video, indice));
  const videosValidos = videos.filter((video) => video.existe && video.rutaProyecto);
  const videoPrincipal = videosValidos[0] || null;

  return {
    ok: videosValidos.length > 0,
    total: videos.length,
    totalValidos: videosValidos.length,
    modo: videosValidos.length > 1 ? 'multivideo' : 'video-unico',
    esMultivideo: videosValidos.length > 1,
    videos,
    videosValidos,
    videoPrincipal,
    mensaje: videosValidos.length > 0
      ? `${videosValidos.length} video(s) válido(s) preparado(s) para entendimiento.`
      : 'No existe video original guardado para ejecutar entendimiento. Primero sube el video al proyecto.'
  };
}

export function crearEntradaVideoEntendimiento({ proyectoId, estado, video, carpetaProyecto, videosNormalizados = null, etapa = 'entendimiento' } = {}) {
  if (!video?.rutaProyecto) throw new Error('No se puede crear entrada de entendimiento porque falta rutaProyecto del video.');
  const nombreProyecto = texto(estado?.nombre, 'Proyecto AutoVideoJeff');
  const datos = estado?.datos || {};
  const todosLosVideos = videosNormalizados?.videos || [video];
  const videosValidos = videosNormalizados?.videosValidos || [video];

  return {
    ok: true,
    etapa,
    proyecto: {
      id: proyectoId,
      nombre: nombreProyecto,
      perfil: texto(datos.perfil, 'general'),
      plataforma: texto(datos.plataforma, 'tiktok'),
      modoEdicion: texto(datos.modoEdicion, 'revision_completa'),
      cantidadVideos: videosValidos.length,
      esMultivideo: videosValidos.length > 1
    },
    video: {
      id: video.videoId || video.id,
      videoId: video.videoId || video.id,
      indice: numero(video.indice, 0),
      orden: numero(video.orden, 1),
      nombreOriginal: video.nombreOriginal || video.nombreTemporal || path.basename(video.rutaProyecto),
      nombreSeguro: video.nombreSeguro || path.basename(video.rutaProyecto),
      rutaOriginal: video.rutaProyecto,
      rutaProyecto: video.rutaProyecto,
      extension: path.extname(video.rutaProyecto).toLowerCase(),
      origen: texto(video.origen, 'api-etapas')
    },
    videos: todosLosVideos,
    videosValidos,
    multivideo: {
      activo: videosValidos.length > 1,
      modo: videosNormalizados?.modo || (videosValidos.length > 1 ? 'multivideo' : 'video-unico'),
      total: todosLosVideos.length,
      totalValidos: videosValidos.length,
      videoPrincipalId: video.videoId || video.id || null
    },
    rutas: {
      carpetaProyecto,
      rutaVideoOriginal: video.rutaProyecto,
      carpetaVideosOriginales: path.dirname(video.rutaProyecto)
    }
  };
}

export default normalizarVideosEntendimiento;

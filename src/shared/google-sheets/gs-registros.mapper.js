/* =========================================================
Nombre completo: gs-registros.mapper.js
Ruta o ubicación: /src/shared/google-sheets/gs-registros.mapper.js
Funciones principales:
- Convertir objetos internos de la app a filas compatibles con Google Sheets.
- Normalizar valores antes de guardarlos en la base principal.
- Preparar registros de proyectos, videos, audios y transcripciones.
- Mantener JSON local como respaldo y no como base principal.
Con qué se conecta:
- gs-base-principal.config.js
- gs-hojas.contrato.js
- Bloques futuros de conexión y repositorios Google Sheets
========================================================= */

import {
  GS_BASE_PRINCIPAL_CONFIG
} from "./gs-base-principal.config.js";

import {
  obtenerColumnasHojaGS
} from "./gs-hojas.contrato.js";

const H = GS_BASE_PRINCIPAL_CONFIG.hojas;

function ahoraGS() {
  return new Date().toISOString();
}

function textoGS(valor) {
  return String(valor ?? "").trim();
}

function numeroGS(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
}

function jsonGS(valor) {
  if (valor === undefined || valor === null) {
    return "";
  }

  try {
    return JSON.stringify(valor);
  } catch (error) {
    return "";
  }
}

function completarColumnasGS(nombreHoja, registro) {
  const columnas = obtenerColumnasHojaGS(nombreHoja);
  const salida = {};

  columnas.forEach((columna) => {
    salida[columna] = registro[columna] ?? "";
  });

  return salida;
}

function metadataComunGS(registro = {}) {
  const fecha = ahoraGS();

  return {
    estado: textoGS(registro.estado) || "ACTIVO",
    creadoEn: textoGS(registro.creadoEn) || fecha,
    actualizadoEn: fecha,
    origen: textoGS(registro.origen) || "electron",
    versionContrato: GS_BASE_PRINCIPAL_CONFIG.versionContrato
  };
}

export function mapearProyectoAGoogleSheetsGS(proyecto) {
  const registro = {
    id: textoGS(proyecto?.id),
    nombre: textoGS(proyecto?.nombre),
    estilo: textoGS(proyecto?.estilo),
    pantallaActual: textoGS(proyecto?.pantallaActual) || "01-cargar-proyecto",
    totalVideos: Array.isArray(proyecto?.videos) ? proyecto.videos.length : 0,
    ...metadataComunGS(proyecto)
  };

  return completarColumnasGS(H.PROYECTOS, registro);
}

export function mapearVideosAGoogleSheetsGS(proyecto) {
  const proyectoId = textoGS(proyecto?.id);
  const videos = Array.isArray(proyecto?.videos) ? proyecto.videos : [];

  return videos.map((video, index) => completarColumnasGS(H.VIDEOS, {
    id: textoGS(video.id),
    proyectoId,
    orden: numeroGS(video.orden || index + 1),
    nombre: textoGS(video.nombre),
    ruta: textoGS(video.ruta),
    url: textoGS(video.url),
    extension: textoGS(video.extension),
    pesoBytes: numeroGS(video.pesoBytes),
    fechaModificacion: textoGS(video.fechaModificacion),
    ...metadataComunGS(video)
  }));
}

export function mapearAudioAGoogleSheetsGS({ proyecto, video, audio }) {
  const registro = {
    id: textoGS(audio?.id) || `audio-${textoGS(video?.id)}-${Date.now()}`,
    proyectoId: textoGS(proyecto?.id),
    videoId: textoGS(video?.id),
    motor: textoGS(audio?.motor),
    modo: textoGS(audio?.modo),
    rutaOriginal: textoGS(video?.ruta),
    rutaProcesada: textoGS(audio?.rutaProcesada || audio?.ruta),
    diagnosticoJson: jsonGS(audio?.diagnostico),
    ...metadataComunGS(audio)
  };

  return completarColumnasGS(H.AUDIOS, registro);
}

export function mapearTranscripcionAGoogleSheetsGS({ proyecto, video, transcripcion }) {
  const registro = {
    id: textoGS(transcripcion?.id) || `tr-${textoGS(video?.id)}-${Date.now()}`,
    proyectoId: textoGS(proyecto?.id),
    videoId: textoGS(video?.id),
    idioma: textoGS(transcripcion?.idioma),
    motor: textoGS(transcripcion?.motor),
    modo: textoGS(transcripcion?.modo),
    texto: textoGS(transcripcion?.texto),
    segmentosJson: jsonGS(transcripcion?.segmentos || []),
    resumenJson: jsonGS(transcripcion?.resumen || {}),
    diagnosticoJson: jsonGS(transcripcion?.diagnostico || {}),
    ...metadataComunGS(transcripcion)
  };

  return completarColumnasGS(H.TRANSCRIPCIONES, registro);
}

export function crearPayloadProyectoCompletoGS(proyecto) {
  return {
    basePrincipal: "Google Sheets",
    proyecto: mapearProyectoAGoogleSheetsGS(proyecto),
    videos: mapearVideosAGoogleSheetsGS(proyecto),
    creadoEn: ahoraGS(),
    versionContrato: GS_BASE_PRINCIPAL_CONFIG.versionContrato
  };
}

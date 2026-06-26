/*
  Modulo: exportacion
  Funcion: modelo normalizado para una salida por plataforma.
*/

import { PLATAFORMAS_DEFECTO, obtenerPlataformaExportacion } from './plataformas.config.js';

export function normalizarPlataformas(plataformas = PLATAFORMAS_DEFECTO) {
  const lista = Array.isArray(plataformas) && plataformas.length > 0 ? plataformas : PLATAFORMAS_DEFECTO;
  return [...new Set(lista.map((item) => String(item).trim().toLowerCase()))]
    .filter((id) => Boolean(obtenerPlataformaExportacion(id)));
}

export function crearExportacionModelo(datos = {}) {
  const plataforma = obtenerPlataformaExportacion(datos.plataforma);
  if (!plataforma) throw new Error(`Plataforma de exportacion no soportada: ${datos.plataforma}`);

  return {
    id: datos.id || `exportacion-${plataforma.id}-${Date.now()}`,
    proyectoId: datos.proyectoId || null,
    plataforma: plataforma.id,
    nombre: datos.nombre || plataforma.nombre,
    formato: plataforma.formato,
    width: plataforma.width,
    height: plataforma.height,
    fps: datos.fps || plataforma.fps,
    zonaSegura: plataforma.zonaSegura,
    subtitulos: datos.subtitulos || plataforma.subtitulos,
    videoOrigen: datos.videoOrigen || '',
    videoDestino: datos.videoDestino || '',
    estado: datos.estado || 'preparada',
    creadoEn: datos.creadoEn || new Date().toISOString(),
    actualizadoEn: new Date().toISOString()
  };
}

export function validarExportacionModelo(exportacion = {}) {
  const errores = [];
  if (!exportacion.plataforma) errores.push('La exportacion no tiene plataforma.');
  if (!exportacion.formato) errores.push('La exportacion no tiene formato.');
  if (!exportacion.width || !exportacion.height) errores.push('La exportacion no tiene dimensiones validas.');
  return { ok: errores.length === 0, errores };
}

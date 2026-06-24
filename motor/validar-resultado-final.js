/*
  Nombre completo: validar-resultado-final.js
  Ruta: /motor/validar-resultado-final.js

  Función:
  - Validar que el resultado final realmente exista cuando la exportación está activa.
  - Evitar que el backend diga éxito si no hay video final usable.
*/

import fs from 'fs';
import { limitarPorcentaje, porcentajeCondiciones } from './metricas/metricas-comunes.js';

function existeArchivoValido(ruta) {
  try {
    if (!ruta || !fs.existsSync(ruta)) return { ok: false, pesoBytes: 0 };
    const stats = fs.statSync(ruta);
    return { ok: stats.isFile() && stats.size > 0, pesoBytes: stats.size || 0 };
  } catch {
    return { ok: false, pesoBytes: 0 };
  }
}

export function validarResultadoFinal({ salida = {}, opciones = {}, videoEditadoUrl = null } = {}) {
  const exportacionActiva = opciones?.opcionesProcesamiento?.exportacion ?? opciones?.exportacion ?? true;

  if (!exportacionActiva || salida?.omitido) {
    return {
      ok: true,
      estado: 'EXPORTACION_OMITIDA',
      porcentajeEntrega: 0,
      errores: [],
      advertencias: ['La exportación fue omitida por selección del usuario.'],
      checks: {
        exportacionActiva: false,
        archivoExiste: false,
        pesoValido: false,
        nombreExportado: false,
        urlPublica: false,
        videoEditadoUrl: false
      },
      creadoEn: new Date().toISOString()
    };
  }

  const archivo = existeArchivoValido(salida?.rutaExportada);
  const checks = {
    exportacionActiva: true,
    salidaOk: salida?.ok === true,
    archivoExiste: archivo.ok,
    pesoValido: archivo.pesoBytes > 0 || Number(salida?.pesoBytes || 0) > 0,
    nombreExportado: Boolean(salida?.nombreExportado),
    urlPublica: Boolean(salida?.urlPublica),
    videoEditadoUrl: Boolean(videoEditadoUrl || salida?.urlPublica)
  };

  const errores = [];
  if (!checks.salidaOk) errores.push('La salida no devolvió ok=true.');
  if (!checks.archivoExiste) errores.push('El archivo final no existe o está vacío.');
  if (!checks.nombreExportado) errores.push('Falta nombreExportado del video final.');
  if (!checks.urlPublica) errores.push('Falta urlPublica del video final.');
  if (!checks.videoEditadoUrl) errores.push('Falta videoEditadoUrl para el frontend/comparativa.');

  const porcentajeEntrega = limitarPorcentaje(porcentajeCondiciones(Object.values(checks)));

  return {
    ok: errores.length === 0,
    estado: errores.length === 0 ? 'VIDEO_FINAL_VALIDADO' : 'VIDEO_FINAL_INCOMPLETO',
    porcentajeEntrega,
    errores,
    advertencias: [],
    checks,
    archivo: {
      rutaExportada: salida?.rutaExportada || null,
      pesoBytes: archivo.pesoBytes || salida?.pesoBytes || 0,
      nombreExportado: salida?.nombreExportado || null,
      urlPublica: salida?.urlPublica || null
    },
    creadoEn: new Date().toISOString()
  };
}

export function exigirResultadoFinalValido(argumentos = {}) {
  const validacion = validarResultadoFinal(argumentos);
  if (!validacion.ok) {
    const error = new Error(`El video final no llegó correctamente: ${validacion.errores.join(' ')}`);
    error.validacionFinal = validacion;
    error.etapa = 'validacion-final';
    throw error;
  }
  return validacion;
}

export default { validarResultadoFinal, exigirResultadoFinalValido };

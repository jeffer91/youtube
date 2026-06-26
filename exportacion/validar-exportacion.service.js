/*
  Modulo: exportacion
  Funcion: validar exportaciones preparadas antes de renderizar.
*/

import { obtenerIdsPlataformas } from './plataformas.config.js';
import { validarExportacionModelo } from './exportacion.modelo.js';

export function validarExportacion(exportacion = {}) {
  const errores = [...validarExportacionModelo(exportacion).errores];
  if (!obtenerIdsPlataformas().includes(exportacion.plataforma)) {
    errores.push(`Plataforma no soportada: ${exportacion.plataforma}`);
  }
  if (!exportacion.videoDestino) errores.push('La exportacion no tiene video destino.');
  return { ok: errores.length === 0, errores, exportacion };
}

export function validarExportaciones(exportaciones = []) {
  const resultados = exportaciones.map(validarExportacion);
  const errores = resultados.flatMap((resultado) => resultado.errores);
  return {
    ok: errores.length === 0 && exportaciones.length > 0,
    total: exportaciones.length,
    errores,
    resultados
  };
}

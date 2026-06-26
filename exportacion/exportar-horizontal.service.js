/*
  Modulo: exportacion
  Funcion: preparar render horizontal 16:9.
*/

import { crearExportacionModelo } from './exportacion.modelo.js';

export function crearPlanExportacionHorizontal(datos = {}) {
  const exportacion = crearExportacionModelo({ ...datos, plataforma: datos.plataforma || 'youtube' });
  if (exportacion.formato !== '16:9') {
    throw new Error(`La plataforma ${exportacion.plataforma} no es horizontal 16:9.`);
  }
  return {
    ...exportacion,
    tipoRender: 'horizontal',
    acciones: ['mantener_primer_plano', 'adaptar_16_9', 'respetar_zona_segura', 'posicionar_textos']
  };
}

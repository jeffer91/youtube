/*
  Modulo: exportacion
  Funcion: preparar render vertical 9:16. La ejecucion FFmpeg real se conectara en el bloque de motor visual/exportacion.
*/

import { crearExportacionModelo } from './exportacion.modelo.js';

export function crearPlanExportacionVertical(datos = {}) {
  const exportacion = crearExportacionModelo({ ...datos, plataforma: datos.plataforma || 'tiktok' });
  if (exportacion.formato !== '9:16') {
    throw new Error(`La plataforma ${exportacion.plataforma} no es vertical 9:16.`);
  }
  return {
    ...exportacion,
    tipoRender: 'vertical',
    acciones: ['detectar_sujeto', 'adaptar_9_16', 'respetar_zona_segura', 'posicionar_subtitulos']
  };
}

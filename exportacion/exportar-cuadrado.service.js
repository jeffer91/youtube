/*
  Modulo: exportacion
  Funcion: preparar render cuadrado 1:1.
*/

import { crearExportacionModelo } from './exportacion.modelo.js';

export function crearPlanExportacionCuadrado(datos = {}) {
  const exportacion = crearExportacionModelo({ ...datos, plataforma: datos.plataforma || 'instagram' });
  if (exportacion.formato !== '1:1') {
    throw new Error(`La plataforma ${exportacion.plataforma} no es cuadrada 1:1.`);
  }
  return {
    ...exportacion,
    tipoRender: 'cuadrado',
    acciones: ['centrar_sujeto', 'adaptar_1_1', 'respetar_zona_segura', 'compactar_textos']
  };
}

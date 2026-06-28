/*
  Modulo: biblioteca-proyecto
  Funcion: configuracion para recursos temporales guardados dentro de cada proyecto.
*/

export const BIBLIOTECA_PROYECTO_CONFIG = Object.freeze({
  version: '2.0.0-biblioteca-proyecto-simple',
  archivoIndice: 'biblioteca-proyecto.json',
  carpeta: 'biblioteca-proyecto',
  carpetaArchivos: 'biblioteca-proyecto/archivos',
  alcance: 'proyecto',
  temporal: true,
  estadosUso: Object.freeze({
    sugerido: 'sugerido',
    usado: 'usado',
    reemplazado: 'reemplazado'
  })
});

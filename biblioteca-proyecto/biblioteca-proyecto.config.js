/*
  Modulo: biblioteca-proyecto
  Funcion: configuracion para recursos guardados dentro de cada proyecto.
*/

export const BIBLIOTECA_PROYECTO_CONFIG = Object.freeze({
  version: '1.0.0',
  archivoIndice: 'biblioteca-proyecto.json',
  carpeta: 'biblioteca',
  estadosUso: Object.freeze({
    sugerido: 'sugerido',
    usado: 'usado',
    reemplazado: 'reemplazado',
    aprobado: 'aprobado',
    rechazado: 'rechazado'
  })
});

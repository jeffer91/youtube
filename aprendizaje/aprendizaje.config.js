/*
  Modulo: aprendizaje
  Funcion: configuracion para guardar preferencias aprendidas por perfil.
*/

export const APRENDIZAJE_CONFIG = Object.freeze({
  version: '1.0.0',
  carpetaRaiz: 'salida/aprendizaje',
  archivoMemoria: 'memoria-edicion.json',
  tipos: Object.freeze({
    reemplazoRecurso: 'reemplazo_recurso',
    preferenciaTexto: 'preferencia_texto',
    preferenciaVisual: 'preferencia_visual',
    preferenciaAudio: 'preferencia_audio',
    correccionManual: 'correccion_manual'
  }),
  impacto: Object.freeze({
    bajo: 'bajo',
    medio: 'medio',
    alto: 'alto'
  })
});

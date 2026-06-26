/*
  Modulo: audio
  Funcion: conexion del plan avanzado de audio para bloques nuevos.
*/

export { detectarRuidoInicial } from './detectar-ruido-inicial.service.js';
export { crearPlanLimpiezaAudio, resumirPlanLimpiezaAudio } from './limpiar-audio.service.js';
export { crearPlanSilenciarSegmento, crearPlanesSilencio } from './silenciar-segmento.service.js';
export { crearPlanCorteInicioRuidoso } from './cortar-inicio-ruidoso.service.js';
export { crearPlanAudio } from './audio-plan.service.js';
export { diagnosticarPlanAudio } from './diagnostico-audio.service.js';

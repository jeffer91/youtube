/*
  Modulo: audio
  Funcion: integrar decisiones de audio para el plan general de edicion.
*/

import { crearPlanLimpiezaAudio } from './limpiar-audio.service.js';

export function crearPlanAudio(datos = {}, opciones = {}) {
  const limpieza = crearPlanLimpiezaAudio(datos, opciones);
  const usarMusicaBaja = opciones.usarMusicaBaja !== false;

  return {
    ok: true,
    etapa: 'audio',
    limpieza,
    musica: {
      aplicar: usarMusicaBaja,
      volumenSugerido: opciones.volumenMusica ?? 0.12,
      regla: 'La musica queda baja para priorizar la voz principal.'
    },
    efectosSonido: {
      aplicar: opciones.efectosSonido !== false,
      momentos: ['titulos', 'cambios_escena', 'datos_importantes', 'zooms']
    },
    requiereRevision: Boolean(limpieza.ruidoInicial?.detectado && limpieza.ruidoInicial.nivel === 'alto'),
    creadoEn: new Date().toISOString()
  };
}

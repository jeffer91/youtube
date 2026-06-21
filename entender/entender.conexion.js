/*
  Nombre completo: entender.conexion.js
  Ruta o ubicación: AutoVideoJeff/entender/entender.conexion.js
  Función o funciones:
    - Ser la puerta de comunicación para todo lo que signifique entender el video.
    - Ejecutar análisis simple del archivo de video.
    - Ejecutar transcripción simple preparada para crecer después.
    - Devolver un objeto único con datos técnicos y texto detectado o pendiente.
  Con qué se conecta:
    - motor/flujo-principal.js
    - entender/analisis-simple/analisis.service.js
    - entender/transcripcion-simple/transcripcion.service.js
*/

import { analizarVideoSimple } from './analisis-simple/analisis.service.js';
import { transcribirVideoSimple } from './transcripcion-simple/transcripcion.service.js';

export async function entenderVideo(entrada) {
  if (!entrada?.video?.rutaOriginal) {
    throw new Error('No se puede entender el video porque falta la ruta original.');
  }

  const analisis = await analizarVideoSimple(entrada);
  const transcripcion = await transcribirVideoSimple({ entrada, analisis });

  return {
    ok: true,
    etapa: 'entender',
    resumen: {
      orientacion: analisis.orientacion,
      duracionSegundos: analisis.duracionSegundos,
      tieneTranscripcionReal: transcripcion.tipo === 'real'
    },
    analisis,
    transcripcion
  };
}

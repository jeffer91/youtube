/*
  Nueva etapa estructural - Bloque 1
  Función:
    - Ser la puerta de comunicación para entender el video antes de editar.
    - Ejecutar análisis técnico.
    - Preparar transcripción.
    - Extraer fotogramas clave.
    - Generar análisis editorial del video.
    - Guardar un reporte único de entendimiento.
*/

import { analizarVideoSimple } from './analisis-simple/analisis.service.js';
import { transcribirVideoSimple } from './transcripcion-simple/transcripcion.service.js';
import { extraerFotogramasClave } from './fotogramas/index.js';
import { analizarVideoEditorial } from './analisis-video/index.js';
import { crearReporteEntendimiento } from './reporte-entendimiento/index.js';

export async function entenderVideo(entrada, opciones = {}) {
  if (!entrada?.video?.rutaOriginal) {
    throw new Error('No se puede entender el video porque falta la ruta original.');
  }

  const analisis = await analizarVideoSimple(entrada);
  const transcripcion = await transcribirVideoSimple({ entrada, analisis, opciones });
  const fotogramas = await extraerFotogramasClave({ entrada, analisis, opciones }).catch((error) => ({
    ok: false,
    omitido: true,
    fotogramas: [],
    cantidadExtraida: 0,
    mensaje: `No se pudieron extraer fotogramas: ${error.message}`,
    errores: [{ mensaje: error.message }]
  }));
  const analisisVideo = await analizarVideoEditorial({ entrada, analisis, transcripcion, fotogramas, opciones });
  const reporteEntendimiento = await crearReporteEntendimiento({ entrada, analisis, transcripcion, fotogramas, analisisVideo, opciones });

  return {
    ok: true,
    etapa: 'entender',
    resumen: {
      orientacion: analisis.orientacion,
      duracionSegundos: analisis.duracionSegundos,
      tieneTranscripcionReal: Boolean(transcripcion.textoCompleto),
      fotogramasExtraidos: fotogramas.cantidadExtraida || 0,
      listoParaEditar: reporteEntendimiento.listoParaEditar
    },
    analisis,
    transcripcion,
    fotogramas,
    analisisVideo,
    reporteEntendimiento,
    mensaje: reporteEntendimiento.mensaje
  };
}

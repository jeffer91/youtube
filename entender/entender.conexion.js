import { analizarVideoSimple } from './analisis-simple/analisis.service.js';
import { transcribirVideoSimple } from './transcripcion-simple/transcripcion.service.js';
import { extraerFotogramasClave } from './fotogramas/index.js';
import { analizarVideoEditorial } from './analisis-video/index.js';
import { crearReporteEntendimiento } from './reporte-entendimiento/index.js';

async function intentarTranscripcionDisponible({ entrada, analisis, opciones }) {
  const simple = await transcribirVideoSimple({ entrada, analisis, opciones });
  if (simple?.textoCompleto) return simple;

  try {
    const modulo = await import('../transcripcion/transcripcion.conexion.js');
    if (typeof modulo.procesarTranscripcion !== 'function') return simple;
    const resultado = await modulo.procesarTranscripcion({
      entrada,
      entendimiento: { ok: true, analisis },
      audio: null,
      opciones
    });
    if (resultado?.transcripcion?.textoCompleto) {
      return {
        ...resultado.transcripcion,
        rutaTranscripcion: simple.rutaTranscripcion || resultado.archivosTranscripcion?.json || null,
        paqueteTranscripcion: resultado
      };
    }
    return {
      ...simple,
      paqueteTranscripcion: resultado || null,
      observacion: resultado?.mensaje || simple.observacion || simple.mensaje || 'Transcripción no disponible.'
    };
  } catch (error) {
    return {
      ...simple,
      observacion: simple.observacion || `No se pudo usar el módulo ampliado de transcripción: ${error.message}`,
      errorTranscripcionAmpliada: error.message
    };
  }
}

export async function entenderVideo(entrada, opciones = {}) {
  if (!entrada?.video?.rutaOriginal) {
    throw new Error('No se puede entender el video porque falta la ruta original.');
  }

  const analisis = await analizarVideoSimple(entrada);
  const transcripcion = await intentarTranscripcionDisponible({ entrada, analisis, opciones });
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
      tieneAudio: Boolean(analisis.tieneAudio),
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

export default entenderVideo;

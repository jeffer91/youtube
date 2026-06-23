import path from 'path';
import { escribirJson, asegurarCarpeta } from '../../../comun/archivos.js';
import { detectarSilenciosFfmpeg } from './detectar-silencios.service.js';
import { normalizarSilencios } from './normalizar-silencios.js';
import { crearPlanCortes } from './crear-plan-cortes.service.js';
import { validarPlanCortes } from './validar-plan-cortes.js';
import { aplicarCortesVideo } from './aplicar-cortes-video.service.js';

function obtenerRutaAnalisisAudio({ entrada, audio, config }) {
  if (config.cortes.usarAudioMejoradoParaSilencios && audio?.ok && audio?.usarAudioMejorado && audio?.rutaAudioMejorado) return audio.rutaAudioMejorado;
  return entrada?.video?.rutaOriginal || null;
}

function crearRespuestaOmitida({ mensaje, carpetaCortes, planCortes = null, silencios = [], advertencias = [] }) {
  return {
    ok: true,
    omitido: true,
    etapa: 'edicion-dinamica-cortes',
    mensaje,
    videoDinamico: null,
    audioDinamico: null,
    silencios,
    planCortes,
    advertencias,
    resumen: { cantidadSilenciosDetectados: silencios.length, cantidadCortesAplicados: 0, segundosEliminados: 0 },
    carpetaCortes,
    creadoEn: new Date().toISOString()
  };
}

export async function procesarCortesDinamicos({ entrada, entendimiento, audio = null, config, carpetaEdicionDinamica, opciones = {} } = {}) {
  const carpetaCortes = path.join(carpetaEdicionDinamica, 'cortes');
  asegurarCarpeta(carpetaCortes);

  try {
    if (!config?.cortes?.activo) return crearRespuestaOmitida({ mensaje: 'El corte de silencios está desactivado.', carpetaCortes });

    const rutaVideoOriginal = entrada?.video?.rutaOriginal;
    const rutaAnalisisAudio = obtenerRutaAnalisisAudio({ entrada, audio, config });
    const tieneAudio = Boolean(entendimiento?.analisis?.tieneAudio);

    if (!rutaVideoOriginal || !rutaAnalisisAudio) {
      return crearRespuestaOmitida({ mensaje: 'Falta video o audio para analizar silencios.', carpetaCortes });
    }

    if (!tieneAudio) {
      return crearRespuestaOmitida({
        mensaje: 'El video no tiene audio detectable; se omite corte de silencios y continúa el flujo.',
        carpetaCortes,
        advertencias: ['video-sin-audio']
      });
    }

    const duracionSegundos = Number(entendimiento?.analisis?.duracionSegundos) || null;
    const deteccion = await detectarSilenciosFfmpeg({ rutaEntrada: rutaAnalisisAudio, ruidoDb: config.cortes.ruidoDb, silencioMinimoSegundos: config.cortes.silencioMinimoSegundos, duracionSegundos });
    const silencios = normalizarSilencios(deteccion.silencios, { duracionSegundos, silencioMinimoSegundos: config.cortes.silencioMinimoSegundos });
    const planCortes = crearPlanCortes({ silencios, duracionSegundos, config, opciones });
    const validacion = validarPlanCortes({ planCortes, duracionSegundos, config });

    await escribirJson(path.join(carpetaCortes, 'silencios-detectados.json'), { ...deteccion, silenciosNormalizados: silencios });
    await escribirJson(path.join(carpetaCortes, 'plan-cortes.json'), { ...planCortes, validacion });

    if (!validacion.ok || planCortes.cortes.length === 0) {
      return crearRespuestaOmitida({ mensaje: validacion.mensaje || 'No hay cortes seguros para aplicar.', carpetaCortes, planCortes: { ...planCortes, validacion }, silencios, advertencias: validacion.advertencias || [] });
    }

    const resultadoAplicacion = await aplicarCortesVideo({ rutaVideoOriginal, segmentosConservados: planCortes.segmentosConservados, carpetaCortes, nombreSalida: 'video-sin-silencios.mp4', tieneAudio });
    const resultado = {
      ok: true,
      omitido: false,
      etapa: 'edicion-dinamica-cortes',
      mensaje: 'Cortes de silencio aplicados correctamente.',
      videoDinamico: resultadoAplicacion.rutaSalida,
      audioDinamico: null,
      silencios,
      planCortes: { ...planCortes, validacion },
      resumen: { cantidadSilenciosDetectados: silencios.length, cantidadCortesAplicados: planCortes.cortes.length, duracionOriginal: planCortes.duracionOriginal, duracionEditada: planCortes.duracionEditada, segundosEliminados: planCortes.segundosEliminados, porcentajeEliminado: planCortes.porcentajeEliminado },
      ffmpeg: resultadoAplicacion.ffmpeg,
      tieneAudio,
      carpetaCortes,
      creadoEn: new Date().toISOString()
    };

    await escribirJson(path.join(carpetaCortes, 'resultado-cortes.json'), resultado);
    return resultado;
  } catch (error) {
    if (config?.modoSeguro !== false) return crearRespuestaOmitida({ mensaje: `Modo seguro: no se aplicaron cortes porque ocurrió un error: ${error.message}`, carpetaCortes, advertencias: [error.message] });
    throw error;
  }
}

export default procesarCortesDinamicos;

import path from 'path';
import { escribirJson, asegurarCarpeta } from '../../../comun/archivos.js';
import { reportarModulo } from '../../../progreso/progreso-modulo.js';
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

export async function procesarCortesDinamicos({ entrada, entendimiento, audio = null, config, carpetaEdicionDinamica, opciones = {}, progreso = null } = {}) {
  const carpetaCortes = path.join(carpetaEdicionDinamica, 'cortes');
  asegurarCarpeta(carpetaCortes);

  try {
    await reportarModulo(progreso, { etapa: 'edicion-dinamica', porcentaje: 56, titulo: 'Detectando silencios', detalle: 'Preparando análisis de pausas del video.', archivo: 'editar/edicion-dinamica/cortes/cortes.conexion.js' });

    if (!config?.cortes?.activo) {
      await reportarModulo(progreso, { etapa: 'edicion-dinamica', porcentaje: 57, titulo: 'Cortes omitidos', detalle: 'El corte de silencios está desactivado.', archivo: 'editar/edicion-dinamica/cortes/cortes.conexion.js' });
      return crearRespuestaOmitida({ mensaje: 'El corte de silencios está desactivado.', carpetaCortes });
    }

    const rutaVideoOriginal = entrada?.video?.rutaOriginal;
    const rutaAnalisisAudio = obtenerRutaAnalisisAudio({ entrada, audio, config });
    const tieneAudio = Boolean(entendimiento?.analisis?.tieneAudio);

    if (!rutaVideoOriginal || !rutaAnalisisAudio) {
      await reportarModulo(progreso, { etapa: 'edicion-dinamica', porcentaje: 57, titulo: 'Cortes omitidos', detalle: 'Falta video o audio para analizar silencios.', archivo: 'editar/edicion-dinamica/cortes/cortes.conexion.js' });
      return crearRespuestaOmitida({ mensaje: 'Falta video o audio para analizar silencios.', carpetaCortes });
    }

    if (!tieneAudio) {
      await reportarModulo(progreso, { etapa: 'edicion-dinamica', porcentaje: 58, titulo: 'Video sin audio', detalle: 'No se detectó audio; se omite corte de silencios y continúa la edición.', archivo: 'editar/edicion-dinamica/cortes/cortes.conexion.js' });
      return crearRespuestaOmitida({ mensaje: 'El video no tiene audio detectable; se omite corte de silencios y continúa el flujo.', carpetaCortes, advertencias: ['video-sin-audio'] });
    }

    const duracionSegundos = Number(entendimiento?.analisis?.duracionSegundos) || null;

    await reportarModulo(progreso, { etapa: 'edicion-dinamica', porcentaje: 58, titulo: 'Analizando pausas', detalle: `Buscando silencios con umbral ${config.cortes.ruidoDb} dB.`, archivo: 'editar/edicion-dinamica/cortes/detectar-silencios.service.js' });
    const deteccion = await detectarSilenciosFfmpeg({ rutaEntrada: rutaAnalisisAudio, ruidoDb: config.cortes.ruidoDb, silencioMinimoSegundos: config.cortes.silencioMinimoSegundos, duracionSegundos });

    const silencios = normalizarSilencios(deteccion.silencios, { duracionSegundos, silencioMinimoSegundos: config.cortes.silencioMinimoSegundos });
    await reportarModulo(progreso, { etapa: 'edicion-dinamica', porcentaje: 61, titulo: 'Silencios detectados', detalle: `Se detectaron ${silencios.length} silencios útiles.`, datos: { silencios: silencios.length }, archivo: 'editar/edicion-dinamica/cortes/normalizar-silencios.js' });

    const planCortes = crearPlanCortes({ silencios, duracionSegundos, config, opciones });
    const validacion = validarPlanCortes({ planCortes, duracionSegundos, config });
    await reportarModulo(progreso, { etapa: 'edicion-dinamica', porcentaje: 63, titulo: 'Plan de cortes creado', detalle: `${planCortes.cortes.length} cortes propuestos · ${planCortes.segundosEliminados || 0}s a reducir.`, datos: { cortes: planCortes.cortes.length, segundosEliminados: planCortes.segundosEliminados || 0 }, archivo: 'editar/edicion-dinamica/cortes/crear-plan-cortes.service.js' });

    await escribirJson(path.join(carpetaCortes, 'silencios-detectados.json'), { ...deteccion, silenciosNormalizados: silencios });
    await escribirJson(path.join(carpetaCortes, 'plan-cortes.json'), { ...planCortes, validacion });

    if (!validacion.ok || planCortes.cortes.length === 0) {
      await reportarModulo(progreso, { etapa: 'edicion-dinamica', porcentaje: 64, titulo: 'Sin cortes seguros', detalle: validacion.mensaje || 'No hay cortes seguros para aplicar.', datos: { advertencias: validacion.advertencias || [] }, archivo: 'editar/edicion-dinamica/cortes/validar-plan-cortes.js' });
      return crearRespuestaOmitida({ mensaje: validacion.mensaje || 'No hay cortes seguros para aplicar.', carpetaCortes, planCortes: { ...planCortes, validacion }, silencios, advertencias: validacion.advertencias || [] });
    }

    await reportarModulo(progreso, { etapa: 'edicion-dinamica', porcentaje: 65, titulo: 'Aplicando cortes', detalle: `Generando video sin silencios con ${planCortes.cortes.length} cortes.`, archivo: 'editar/edicion-dinamica/cortes/aplicar-cortes-video.service.js' });
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
    await reportarModulo(progreso, { etapa: 'edicion-dinamica', porcentaje: 68, titulo: 'Cortes aplicados', detalle: `${planCortes.cortes.length} cortes aplicados · ${planCortes.segundosEliminados || 0}s reducidos.`, datos: resultado.resumen, archivo: 'editar/edicion-dinamica/cortes/cortes.conexion.js' });

    return resultado;
  } catch (error) {
    await reportarModulo(progreso, { etapa: 'edicion-dinamica', porcentaje: 64, titulo: 'Cortes en modo seguro', detalle: `No se aplicaron cortes: ${error.message}`, archivo: 'editar/edicion-dinamica/cortes/cortes.conexion.js' });
    if (config?.modoSeguro !== false) return crearRespuestaOmitida({ mensaje: `Modo seguro: no se aplicaron cortes porque ocurrió un error: ${error.message}`, carpetaCortes, advertencias: [error.message] });
    throw error;
  }
}

export default procesarCortesDinamicos;

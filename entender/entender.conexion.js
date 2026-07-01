import { analizarVideoSimple } from './analisis-simple/analisis.service.js';
import { transcribirVideoSimple } from './transcripcion-simple/transcripcion.service.js';
import { extraerFotogramasClave } from './fotogramas/index.js';
import { analizarVideoEditorial } from './analisis-video/index.js';
import { crearReporteEntendimiento } from './reporte-entendimiento/index.js';
import { procesarTranscripcionMultimotor } from '../transcripcion/motores/gestor-motores-transcripcion.service.js';

function tieneTextoTranscrito(transcripcion) {
  return Boolean(String(transcripcion?.textoCompleto || '').trim());
}

function describirVideoProgreso(entrada = {}) {
  const video = entrada.video || {};
  const etiqueta = video.etiqueta || video.videoId || video.id || 'video';
  const orden = video.orden || (Number.isFinite(Number(video.indice)) ? Number(video.indice) + 1 : null);
  return orden ? `${etiqueta} (${orden})` : etiqueta;
}

async function notificarProgresoEntendimiento(opciones = {}, entrada = {}, detalle = '') {
  if (typeof opciones.onProgreso !== 'function') return;
  try {
    await opciones.onProgreso({
      etapa: 'entendimiento',
      videoId: entrada?.video?.videoId || entrada?.video?.id || null,
      ordenVideo: entrada?.video?.orden || null,
      detalle,
      mensaje: detalle,
      fecha: new Date().toISOString()
    });
  } catch (error) {
    console.warn('[Entendimiento] No se pudo reportar progreso:', error.message);
  }
}

function crearTranscripcionesPorMotorDesdeMultimotor(paqueteMultimotor) {
  const resultados = Array.isArray(paqueteMultimotor?.resultados) ? paqueteMultimotor.resultados : [];
  return resultados.map((resultado) => ({
    motor: resultado.motor || resultado.transcripcion?.motor || 'desconocido',
    ok: Boolean(resultado.ok || resultado.transcripcion?.ok),
    estado: resultado.estado || resultado.transcripcion?.estado || 'pendiente',
    mensaje: resultado.mensaje || resultado.transcripcion?.mensaje || '',
    resumen: resultado.resumen || resultado.transcripcion?.resumen || null,
    transcripcion: resultado.transcripcion || null,
    error: resultado.error || resultado.transcripcion?.error || null
  }));
}

function crearTranscripcionDesdeMultimotor(paqueteMultimotor, transcripcionBase = null) {
  const principal = paqueteMultimotor?.transcripcionPrincipal || null;
  const motorPrincipal = paqueteMultimotor?.motorPrincipal || principal?.motor || null;
  const transcripcionesPorMotor = crearTranscripcionesPorMotorDesdeMultimotor(paqueteMultimotor);

  if (principal && tieneTextoTranscrito(principal)) {
    return {
      ...principal,
      tipo: 'transcripcion-multimotor',
      motor: motorPrincipal,
      motorPrincipal,
      transcripcionPrincipal: principal,
      transcripcionesPorMotor,
      resumenTranscripcion: paqueteMultimotor?.resumen || null,
      paqueteMultimotor,
      rutaTranscripcion: paqueteMultimotor?.guardado?.principal?.ruta || transcripcionBase?.rutaTranscripcion || null,
      observacion: paqueteMultimotor.mensaje || `Transcripción principal seleccionada desde ${motorPrincipal}.`
    };
  }

  return {
    ...(transcripcionBase || {}),
    tipo: transcripcionBase?.tipo || 'estructura-preparada',
    motor: transcripcionBase?.motor || 'transcripcion-simple',
    textoCompleto: transcripcionBase?.textoCompleto || '',
    segmentos: transcripcionBase?.segmentos || [],
    transcripcionPrincipal: null,
    transcripcionesPorMotor,
    resumenTranscripcion: paqueteMultimotor?.resumen || null,
    paqueteMultimotor,
    observacion: paqueteMultimotor?.mensaje || transcripcionBase?.observacion || 'Transcripción multimotor sin texto útil.'
  };
}

async function intentarTranscripcionLegacy({ entrada, analisis, opciones, transcripcionBase, paqueteMultimotor }) {
  try {
    const modulo = await import('../transcripcion/transcripcion.conexion.js');
    if (typeof modulo.procesarTranscripcion !== 'function') return transcripcionBase;
    const resultado = await modulo.procesarTranscripcion({
      entrada,
      entendimiento: { ok: true, analisis },
      audio: null,
      opciones
    });
    if (resultado?.transcripcion?.textoCompleto) {
      return {
        ...resultado.transcripcion,
        tipo: 'transcripcion-ampliada-legacy',
        motor: resultado.transcripcion.motor || 'modulo-transcripcion',
        rutaTranscripcion: transcripcionBase?.rutaTranscripcion || resultado.archivosTranscripcion?.json || null,
        paqueteTranscripcion: resultado,
        paqueteMultimotor,
        transcripcionesPorMotor: crearTranscripcionesPorMotorDesdeMultimotor(paqueteMultimotor),
        resumenTranscripcion: paqueteMultimotor?.resumen || null
      };
    }
    return {
      ...transcripcionBase,
      paqueteTranscripcion: resultado || null,
      paqueteMultimotor,
      transcripcionesPorMotor: crearTranscripcionesPorMotorDesdeMultimotor(paqueteMultimotor),
      resumenTranscripcion: paqueteMultimotor?.resumen || null,
      observacion: resultado?.mensaje || transcripcionBase?.observacion || transcripcionBase?.mensaje || 'Transcripción no disponible.'
    };
  } catch (error) {
    return {
      ...transcripcionBase,
      paqueteMultimotor,
      transcripcionesPorMotor: crearTranscripcionesPorMotorDesdeMultimotor(paqueteMultimotor),
      resumenTranscripcion: paqueteMultimotor?.resumen || null,
      observacion: transcripcionBase?.observacion || `No se pudo usar el módulo ampliado de transcripción: ${error.message}`,
      errorTranscripcionAmpliada: error.message
    };
  }
}

async function intentarTranscripcionDisponible({ entrada, analisis, opciones }) {
  const simple = await transcribirVideoSimple({ entrada, analisis, opciones });
  if (tieneTextoTranscrito(simple)) {
    return {
      ...simple,
      transcripcionPrincipal: simple,
      transcripcionesPorMotor: [{
        motor: simple.motor || 'manual',
        ok: true,
        estado: 'ok',
        mensaje: simple.observacion || 'Texto manual disponible.',
        resumen: null,
        transcripcion: simple,
        error: null
      }],
      resumenTranscripcion: {
        motorPrincipal: simple.motor || 'manual',
        totalMotores: 1,
        resultados: []
      }
    };
  }

  const entradaConAnalisis = { ...entrada, analisis };
  let transcripcionMultimotor = null;

  if (opciones.usarTranscripcionMultimotor !== false) {
    try {
      transcripcionMultimotor = await procesarTranscripcionMultimotor({
        entrada: entradaConAnalisis,
        audio: null,
        opciones
      });

      const desdeMultimotor = crearTranscripcionDesdeMultimotor(transcripcionMultimotor, simple);
      if (tieneTextoTranscrito(desdeMultimotor)) return desdeMultimotor;
    } catch (error) {
      transcripcionMultimotor = {
        ok: false,
        motorPrincipal: null,
        resultados: [],
        resumen: null,
        mensaje: `No se pudo procesar transcripción multimotor: ${error.message}`,
        error: { mensaje: error.message }
      };
    }
  }

  const baseConMultimotor = crearTranscripcionDesdeMultimotor(transcripcionMultimotor, simple);
  return await intentarTranscripcionLegacy({
    entrada,
    analisis,
    opciones,
    transcripcionBase: baseConMultimotor,
    paqueteMultimotor: transcripcionMultimotor
  });
}

export async function entenderVideo(entrada, opciones = {}) {
  if (!entrada?.video?.rutaOriginal) {
    throw new Error('No se puede entender el video porque falta la ruta original.');
  }

  const videoProgreso = describirVideoProgreso(entrada);
  await notificarProgresoEntendimiento(opciones, entrada, `Analizando datos técnicos de ${videoProgreso}.`);
  const analisis = await analizarVideoSimple(entrada);

  await notificarProgresoEntendimiento(opciones, entrada, `Transcribiendo audio de ${videoProgreso}. Esta parte puede demorar según el tamaño del video y el motor disponible.`);
  const transcripcion = await intentarTranscripcionDisponible({ entrada, analisis, opciones });

  await notificarProgresoEntendimiento(opciones, entrada, `Extrayendo fotogramas clave de ${videoProgreso}.`);
  const fotogramas = await extraerFotogramasClave({ entrada, analisis, opciones }).catch((error) => ({
    ok: false,
    omitido: true,
    fotogramas: [],
    cantidadExtraida: 0,
    mensaje: `No se pudieron extraer fotogramas: ${error.message}`,
    errores: [{ mensaje: error.message }]
  }));

  await notificarProgresoEntendimiento(opciones, entrada, `Creando análisis editorial de ${videoProgreso}.`);
  const analisisVideo = await analizarVideoEditorial({ entrada, analisis, transcripcion, fotogramas, opciones });

  await notificarProgresoEntendimiento(opciones, entrada, `Guardando reporte de entendimiento de ${videoProgreso}.`);
  const reporteEntendimiento = await crearReporteEntendimiento({ entrada, analisis, transcripcion, fotogramas, analisisVideo, opciones });

  return {
    ok: true,
    etapa: 'entender',
    resumen: {
      orientacion: analisis.orientacion,
      duracionSegundos: analisis.duracionSegundos,
      tieneAudio: Boolean(analisis.tieneAudio),
      tieneTranscripcionReal: Boolean(transcripcion.textoCompleto),
      motorTranscripcionPrincipal: transcripcion.motorPrincipal || transcripcion.motor || null,
      transcripcionesGeneradas: Array.isArray(transcripcion.transcripcionesPorMotor) ? transcripcion.transcripcionesPorMotor.length : 0,
      fotogramasExtraidos: fotogramas.cantidadExtraida || 0,
      listoParaEditar: reporteEntendimiento.listoParaEditar
    },
    analisis,
    transcripcion,
    transcripcionPrincipal: transcripcion.transcripcionPrincipal || (transcripcion.textoCompleto ? transcripcion : null),
    transcripcionesPorMotor: transcripcion.transcripcionesPorMotor || [],
    resumenTranscripcion: transcripcion.resumenTranscripcion || null,
    fotogramas,
    analisisVideo,
    reporteEntendimiento,
    mensaje: reporteEntendimiento.mensaje
  };
}

export default entenderVideo;

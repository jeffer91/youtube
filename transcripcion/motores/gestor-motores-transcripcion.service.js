import {
  ESTADOS_TRANSCRIPCION,
  MOTORES_TRANSCRIPCION,
  crearResultadoMotorTranscripcion,
  crearTranscripcionNormalizadaMotor,
  elegirMejorResultadoTranscripcion,
  transcripcionTieneTextoUtil
} from '../modelos/transcripcion-normalizada.modelo.js';
import { obtenerConfigMultimotorTranscripcion } from './motores-transcripcion.config.js';
import { prepararAudioMotoresTranscripcion } from '../servicios/preparar-audio-motores.service.js';
import { guardarLoteResultadosTranscripcion } from '../servicios/guardar-resultados-motores.service.js';
import { transcribirConFasterWhisper, verificarFasterWhisper } from './faster-whisper/faster-whisper.service.js';
import { transcribirConWhisperCpp, verificarWhisperCpp } from './whisper-cpp/whisper-cpp.service.js';
import { transcribirConVosk, verificarVosk } from './vosk/vosk.service.js';

function limpiarTexto(valor) {
  return String(valor || '').replace(/\s+/g, ' ').trim();
}

function obtenerTextoManual(opciones = {}) {
  return limpiarTexto(
    opciones.textoTranscripcionManual ||
    opciones.transcripcionManual ||
    opciones.textoManual ||
    opciones.transcripcionTexto ||
    ''
  );
}

function crearResultadoManual({ entrada, opciones = {}, audioPreparado = null } = {}) {
  const texto = obtenerTextoManual(opciones);
  if (!texto) {
    return crearResultadoMotorTranscripcion({
      motor: MOTORES_TRANSCRIPCION.MANUAL,
      estado: ESTADOS_TRANSCRIPCION.OMITIDA,
      mensaje: 'No se recibió texto manual para transcripción.',
      metadata: { motivo: 'sin-texto-manual' }
    });
  }

  const duracion = Number(entrada?.video?.duracionSegundos || entrada?.analisis?.duracionSegundos || 0) || null;
  const transcripcion = crearTranscripcionNormalizadaMotor({
    motor: MOTORES_TRANSCRIPCION.MANUAL,
    estado: ESTADOS_TRANSCRIPCION.OK,
    idioma: opciones.idiomaTranscripcion || opciones.idioma || 'es',
    textoCompleto: texto,
    segmentos: [{
      id: 'seg-0001',
      indice: 0,
      inicio: 0,
      fin: duracion,
      texto,
      confianza: 1,
      metadata: { origen: 'texto-manual' }
    }],
    duracionSegundos: duracion,
    confianza: 1,
    fuenteAudio: audioPreparado?.audio ? { tipo: 'manual-con-audio-referencia', ruta: audioPreparado.audio.ruta } : null,
    mensaje: 'Transcripción manual recibida correctamente.',
    metadata: { origen: 'manual', proyectoId: entrada?.proyecto?.id || null }
  });

  return crearResultadoMotorTranscripcion({
    motor: MOTORES_TRANSCRIPCION.MANUAL,
    transcripcion,
    estado: transcripcion.estado,
    mensaje: transcripcion.mensaje,
    metadata: transcripcion.metadata
  });
}

function crearResultadoOmitido(motor, mensaje, metadata = {}) {
  return crearResultadoMotorTranscripcion({
    motor,
    estado: ESTADOS_TRANSCRIPCION.OMITIDA,
    mensaje,
    metadata
  });
}

function crearResultadoError(motor, error, metadata = {}) {
  return crearResultadoMotorTranscripcion({
    motor,
    estado: ESTADOS_TRANSCRIPCION.ERROR,
    mensaje: error?.message || String(error),
    error,
    metadata
  });
}

async function ejecutarMotorTranscripcion({ motor, entrada, audioPreparado, opciones, diagnostico = null } = {}) {
  try {
    switch (motor) {
      case MOTORES_TRANSCRIPCION.MANUAL:
        return crearResultadoManual({ entrada, opciones, audioPreparado });
      case MOTORES_TRANSCRIPCION.FASTER_WHISPER:
        if (diagnostico && diagnostico.ok === false) return crearResultadoOmitido(motor, diagnostico.mensaje || 'faster-whisper no disponible.', { diagnostico });
        return await transcribirConFasterWhisper({ entrada, audio: audioPreparado, opciones });
      case MOTORES_TRANSCRIPCION.WHISPER_CPP:
        if (diagnostico && diagnostico.ok === false) return crearResultadoOmitido(motor, diagnostico.mensaje || 'whisper.cpp no disponible.', { diagnostico });
        return await transcribirConWhisperCpp({ entrada, audio: audioPreparado, opciones });
      case MOTORES_TRANSCRIPCION.VOSK:
        if (diagnostico && diagnostico.ok === false) return crearResultadoOmitido(motor, diagnostico.mensaje || 'Vosk no disponible.', { diagnostico });
        return await transcribirConVosk({ entrada, audio: audioPreparado, opciones });
      case MOTORES_TRANSCRIPCION.GEMINI:
        return crearResultadoOmitido(motor, 'Gemini queda opcional y no se ejecuta en el gestor gratuito.', { motivo: 'motor-cloud-opcional' });
      default:
        return crearResultadoOmitido(motor, `Motor no reconocido: ${motor}`, { motor });
    }
  } catch (error) {
    return crearResultadoError(motor, error, { fase: 'ejecutar-motor' });
  }
}

export async function verificarMotoresTranscripcion({ opciones = {} } = {}) {
  const config = obtenerConfigMultimotorTranscripcion(opciones);
  const verificadores = {
    [MOTORES_TRANSCRIPCION.MANUAL]: async () => ({
      ok: true,
      motor: MOTORES_TRANSCRIPCION.MANUAL,
      mensaje: obtenerTextoManual(opciones) ? 'Texto manual disponible.' : 'Texto manual no ingresado.',
      opcional: true
    }),
    [MOTORES_TRANSCRIPCION.FASTER_WHISPER]: verificarFasterWhisper,
    [MOTORES_TRANSCRIPCION.WHISPER_CPP]: verificarWhisperCpp,
    [MOTORES_TRANSCRIPCION.VOSK]: verificarVosk,
    [MOTORES_TRANSCRIPCION.GEMINI]: async () => ({
      ok: false,
      motor: MOTORES_TRANSCRIPCION.GEMINI,
      mensaje: 'Gemini no se verifica en el gestor gratuito.',
      opcional: true
    })
  };

  const resultados = [];
  for (const motor of config.ordenMotores) {
    const verificar = verificadores[motor];
    if (!verificar) {
      resultados.push({ ok: false, motor, mensaje: 'Sin verificador disponible.' });
      continue;
    }

    try {
      resultados.push(await verificar({ opciones }));
    } catch (error) {
      resultados.push({ ok: false, motor, mensaje: error.message || String(error), error: { mensaje: error.message || String(error) } });
    }
  }

  return {
    ok: true,
    version: '1.0.0-gestor-multimotor',
    ordenMotores: config.ordenMotores,
    resultados,
    disponibles: resultados.filter((item) => item.ok).map((item) => item.motor),
    actualizadoEn: new Date().toISOString()
  };
}

export async function procesarTranscripcionMultimotor({ entrada, audio = null, opciones = {} } = {}) {
  if (!entrada?.rutas?.carpetaProyecto) throw new Error('No se puede procesar transcripción multimotor porque falta carpetaProyecto.');

  const config = obtenerConfigMultimotorTranscripcion(opciones);
  const diagnostico = await verificarMotoresTranscripcion({ opciones });
  const diagnosticoPorMotor = new Map(diagnostico.resultados.map((item) => [item.motor, item]));
  const audioPreparado = await prepararAudioMotoresTranscripcion({ entrada, audio, opciones });
  const resultados = [];

  for (const motor of config.ordenMotores) {
    const resultado = await ejecutarMotorTranscripcion({
      motor,
      entrada,
      audioPreparado,
      opciones,
      diagnostico: diagnosticoPorMotor.get(motor)
    });

    resultados.push(resultado);

    if (config.detenerAlEncontrarTextoUtil && transcripcionTieneTextoUtil(resultado?.transcripcion || {})) {
      break;
    }
  }

  const principal = elegirMejorResultadoTranscripcion(resultados, config.ordenMotores);
  const guardado = await guardarLoteResultadosTranscripcion({ entrada, resultados, principal, opciones });

  return {
    ok: Boolean(principal),
    version: '1.0.0-gestor-multimotor',
    motorPrincipal: principal?.motor || null,
    transcripcionPrincipal: principal?.transcripcion || null,
    resultados,
    resumen: guardado?.resumen?.resumen || null,
    guardado,
    audioPreparado,
    diagnostico,
    mensaje: principal
      ? `Transcripción principal seleccionada desde ${principal.motor}.`
      : 'No se pudo obtener una transcripción útil con los motores disponibles.',
    creadoEn: new Date().toISOString()
  };
}

export default procesarTranscripcionMultimotor;

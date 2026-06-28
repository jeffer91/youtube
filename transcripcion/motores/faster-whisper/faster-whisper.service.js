import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { escribirJson } from '../../../comun/archivos.js';
import { prepararAudioMotoresTranscripcion, crearFuenteAudioParaMotor } from '../../servicios/preparar-audio-motores.service.js';
import { obtenerPythonPreferido, resolverPythonParaModulo } from '../python-local.service.js';
import {
  ESTADOS_TRANSCRIPCION,
  MOTORES_TRANSCRIPCION,
  crearResultadoMotorTranscripcion,
  crearTranscripcionNormalizadaMotor
} from '../../modelos/transcripcion-normalizada.modelo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RUNNER_FASTER_WHISPER = path.join(__dirname, 'faster_whisper_runner.py');

export const FASTER_WHISPER_CONFIG = Object.freeze({
  motor: MOTORES_TRANSCRIPCION.FASTER_WHISPER,
  modelo: 'small',
  idioma: 'es',
  device: 'cpu',
  computeType: 'int8',
  beamSize: 5,
  timeoutMs: 30 * 60 * 1000
});

function existeArchivo(rutaArchivo) {
  try {
    return Boolean(rutaArchivo && fs.existsSync(rutaArchivo) && fs.statSync(rutaArchivo).size > 0);
  } catch (_error) {
    return false;
  }
}

function obtenerPython(opciones = {}) {
  return obtenerPythonPreferido(opciones, ['pythonFasterWhisper']);
}

function obtenerConfigFasterWhisper(opciones = {}) {
  return {
    ...FASTER_WHISPER_CONFIG,
    modelo: String(opciones.modeloFasterWhisper || opciones.fasterWhisperModelo || FASTER_WHISPER_CONFIG.modelo).trim(),
    idioma: String(opciones.idiomaTranscripcion || opciones.idioma || FASTER_WHISPER_CONFIG.idioma).trim(),
    device: String(opciones.fasterWhisperDevice || FASTER_WHISPER_CONFIG.device).trim(),
    computeType: String(opciones.fasterWhisperComputeType || FASTER_WHISPER_CONFIG.computeType).trim(),
    beamSize: Number(opciones.fasterWhisperBeamSize || FASTER_WHISPER_CONFIG.beamSize),
    timeoutMs: Number(opciones.fasterWhisperTimeoutMs || FASTER_WHISPER_CONFIG.timeoutMs)
  };
}

function ejecutarProceso({ comando, args, timeoutMs }) {
  return new Promise((resolve) => {
    const inicio = Date.now();
    const child = spawn(comando, args, { windowsHide: true });
    let stdout = '';
    let stderr = '';
    let terminado = false;

    const timeout = setTimeout(() => {
      if (terminado) return;
      terminado = true;
      child.kill('SIGKILL');
      resolve({ ok: false, code: -1, stdout, stderr, duracionMs: Date.now() - inicio, error: `Timeout de ${timeoutMs}ms ejecutando faster-whisper.` });
    }, timeoutMs);

    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });
    child.on('error', (error) => {
      if (terminado) return;
      terminado = true;
      clearTimeout(timeout);
      resolve({ ok: false, code: -2, stdout, stderr, duracionMs: Date.now() - inicio, error: error.message });
    });
    child.on('close', (code) => {
      if (terminado) return;
      terminado = true;
      clearTimeout(timeout);
      resolve({ ok: code === 0, code, stdout, stderr, duracionMs: Date.now() - inicio, error: code === 0 ? null : stderr || stdout || `Proceso finalizó con código ${code}` });
    });
  });
}

function parsearJsonSeguro(texto) {
  try {
    const limpio = String(texto || '').trim();
    if (!limpio) return null;
    return JSON.parse(limpio.split('\n').filter(Boolean).at(-1));
  } catch (_error) {
    return null;
  }
}

function obtenerRutaSalidaRunner(entrada) {
  const carpetaProyecto = entrada?.rutas?.carpetaProyecto;
  if (!carpetaProyecto) throw new Error('No se puede ejecutar faster-whisper porque falta carpetaProyecto.');
  return path.join(carpetaProyecto, 'transcripciones', 'motores', 'faster-whisper', 'raw-faster-whisper.json');
}

function crearResultadoError({ mensaje, error = null, metadata = {} }) {
  return crearResultadoMotorTranscripcion({
    motor: MOTORES_TRANSCRIPCION.FASTER_WHISPER,
    estado: ESTADOS_TRANSCRIPCION.ERROR,
    mensaje,
    error: error || new Error(mensaje),
    metadata
  });
}

export async function verificarFasterWhisper({ opciones = {} } = {}) {
  if (!existeArchivo(RUNNER_FASTER_WHISPER)) {
    return { ok: false, motor: MOTORES_TRANSCRIPCION.FASTER_WHISPER, mensaje: 'No existe el runner faster_whisper_runner.py.' };
  }

  const resolucion = await resolverPythonParaModulo({
    modulo: 'faster_whisper',
    opciones,
    clavesOpciones: ['pythonFasterWhisper'],
    timeoutMs: 15000
  });

  return {
    ok: resolucion.ok,
    motor: MOTORES_TRANSCRIPCION.FASTER_WHISPER,
    python: resolucion.python,
    mensaje: resolucion.ok ? 'faster-whisper disponible.' : 'faster-whisper no está instalado en ningún Python local detectado.',
    detalle: resolucion.ok ? null : resolucion.mensaje,
    intentos: resolucion.ok ? undefined : resolucion.intentos
  };
}

export async function transcribirConFasterWhisper({ entrada, audio = null, opciones = {} } = {}) {
  const config = obtenerConfigFasterWhisper(opciones);
  const resolucionPython = await resolverPythonParaModulo({
    modulo: 'faster_whisper',
    opciones,
    clavesOpciones: ['pythonFasterWhisper'],
    timeoutMs: 15000
  });
  const python = resolucionPython.ok ? resolucionPython.python : obtenerPython(opciones);

  if (!resolucionPython.ok) {
    return crearResultadoError({
      mensaje: 'faster-whisper no está instalado en el Python local detectado.',
      metadata: { resolucionPython, python, config }
    });
  }

  const metadataAudio = audio?.ok && audio?.audio?.ruta ? audio : await prepararAudioMotoresTranscripcion({ entrada, audio: null, opciones });
  const fuenteAudio = crearFuenteAudioParaMotor({ entrada, metadata: metadataAudio });

  if (!fuenteAudio.ok) {
    return crearResultadoError({ mensaje: 'No existe audio WAV preparado para faster-whisper.', metadata: { fuenteAudio, metadataAudio } });
  }

  const rutaSalida = obtenerRutaSalidaRunner(entrada);
  await fs.promises.mkdir(path.dirname(rutaSalida), { recursive: true });

  const args = [
    RUNNER_FASTER_WHISPER,
    '--audio', fuenteAudio.ruta,
    '--output', rutaSalida,
    '--model', config.modelo,
    '--language', config.idioma,
    '--device', config.device,
    '--compute-type', config.computeType,
    '--beam-size', String(config.beamSize)
  ];

  const proceso = await ejecutarProceso({ comando: python, args, timeoutMs: config.timeoutMs });
  const desdeArchivo = existeArchivo(rutaSalida) ? JSON.parse(await fs.promises.readFile(rutaSalida, 'utf-8')) : null;
  const desdeStdout = parsearJsonSeguro(proceso.stdout);
  const raw = desdeArchivo || desdeStdout;

  if (!raw) {
    return crearResultadoError({
      mensaje: proceso.error || 'faster-whisper no devolvió JSON válido.',
      metadata: { proceso, python, fuenteAudio, config }
    });
  }

  if (raw.ok === false || raw.estado === ESTADOS_TRANSCRIPCION.ERROR) {
    return crearResultadoError({
      mensaje: raw.mensaje || 'faster-whisper falló.',
      error: new Error(raw.error?.mensaje || raw.mensaje || 'faster-whisper falló.'),
      metadata: { proceso, python, fuenteAudio, config, raw }
    });
  }

  const transcripcion = crearTranscripcionNormalizadaMotor({
    motor: MOTORES_TRANSCRIPCION.FASTER_WHISPER,
    estado: raw.estado || ESTADOS_TRANSCRIPCION.OK,
    idioma: raw.idioma || config.idioma,
    textoCompleto: raw.textoCompleto || '',
    segmentos: raw.segmentos || [],
    duracionSegundos: raw.duracionSegundos || null,
    confianza: raw.confianza || null,
    fuenteAudio,
    mensaje: raw.mensaje || 'Transcripción generada con faster-whisper.',
    metadata: { ...(raw.metadata || {}), python, proceso: { code: proceso.code, duracionMs: proceso.duracionMs }, rutaRaw: rutaSalida }
  });

  const resultado = crearResultadoMotorTranscripcion({
    motor: MOTORES_TRANSCRIPCION.FASTER_WHISPER,
    transcripcion,
    estado: transcripcion.estado,
    mensaje: transcripcion.mensaje,
    metadata: transcripcion.metadata
  });

  await escribirJson(path.join(path.dirname(rutaSalida), 'resultado-faster-whisper.json'), resultado);
  return resultado;
}

export default transcribirConFasterWhisper;
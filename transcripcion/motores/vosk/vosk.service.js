import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { escribirJson, obtenerRutaRaiz } from '../../../comun/archivos.js';
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
const RUNNER_VOSK = path.join(__dirname, 'vosk_runner.py');

export const VOSK_CONFIG = Object.freeze({
  motor: MOTORES_TRANSCRIPCION.VOSK,
  idioma: 'es',
  timeoutMs: 30 * 60 * 1000,
  archivoRaw: 'raw-vosk.json',
  archivoResultado: 'resultado-vosk.json'
});

function existeArchivo(rutaArchivo) {
  try {
    return Boolean(rutaArchivo && fs.existsSync(rutaArchivo) && fs.statSync(rutaArchivo).size > 0);
  } catch (_error) {
    return false;
  }
}

function existeCarpeta(rutaCarpeta) {
  try {
    return Boolean(rutaCarpeta && fs.existsSync(rutaCarpeta) && fs.statSync(rutaCarpeta).isDirectory());
  } catch (_error) {
    return false;
  }
}

function obtenerPython(opciones = {}) {
  return obtenerPythonPreferido(opciones, ['pythonVosk']);
}

function buscarModeloVoskLocal() {
  const raiz = obtenerRutaRaiz();
  const candidatosDirectos = [
    path.join(raiz, 'vosk-model-small-es-0.42'),
    path.join(raiz, 'vosk-model-small-es'),
    path.join(raiz, 'modelos', 'vosk-model-small-es-0.42'),
    path.join(raiz, 'modelos', 'vosk-model-small-es'),
    path.join(raiz, 'modelos', 'transcripcion', 'vosk-model-small-es-0.42'),
    path.join(raiz, 'modelos', 'transcripcion', 'vosk-model-small-es'),
    path.join(raiz, 'modelos', 'vosk', 'vosk-model-small-es-0.42'),
    path.join(raiz, 'modelos', 'vosk', 'vosk-model-small-es')
  ];
  const directo = candidatosDirectos.find(existeCarpeta);
  if (directo) return directo;

  const carpetasPadre = [
    raiz,
    path.join(raiz, 'modelos'),
    path.join(raiz, 'modelos', 'transcripcion'),
    path.join(raiz, 'modelos', 'vosk')
  ];

  for (const carpeta of carpetasPadre) {
    if (!existeCarpeta(carpeta)) continue;
    const encontrada = fs.readdirSync(carpeta)
      .map((nombre) => path.join(carpeta, nombre))
      .find((ruta) => existeCarpeta(ruta) && path.basename(ruta).toLowerCase().startsWith('vosk-model'));
    if (encontrada) return encontrada;
  }

  return '';
}

function buscarZipModeloVoskLocal() {
  const raiz = obtenerRutaRaiz();
  const candidatos = [
    path.join(raiz, 'vosk-model-small-es-0.42.zip'),
    path.join(raiz, 'modelos', 'vosk-model-small-es-0.42.zip'),
    path.join(raiz, 'modelos', 'transcripcion', 'vosk-model-small-es-0.42.zip'),
    path.join(raiz, 'modelos', 'vosk', 'vosk-model-small-es-0.42.zip')
  ];
  return candidatos.find(existeArchivo) || '';
}

function resolverModeloVosk(opciones = {}) {
  const configurado = String(
    opciones.voskModel ||
    opciones.rutaModeloVosk ||
    process.env.AUTOVIDEOJEFF_VOSK_MODEL ||
    process.env.VOSK_MODEL ||
    ''
  ).trim();
  if (configurado) return configurado;
  return buscarModeloVoskLocal();
}

function obtenerConfigVosk(opciones = {}) {
  return {
    ...VOSK_CONFIG,
    idioma: String(opciones.idiomaTranscripcion || opciones.idioma || VOSK_CONFIG.idioma).trim(),
    timeoutMs: Number(opciones.voskTimeoutMs || VOSK_CONFIG.timeoutMs),
    python: obtenerPython(opciones),
    modelo: resolverModeloVosk(opciones),
    zipModeloDetectado: buscarZipModeloVoskLocal(),
    words: opciones.voskWords !== false
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
      resolve({ ok: false, code: -1, stdout, stderr, duracionMs: Date.now() - inicio, error: `Timeout de ${timeoutMs}ms ejecutando Vosk.` });
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

function obtenerCarpetaMotor(entrada) {
  const carpetaProyecto = entrada?.rutas?.carpetaProyecto;
  if (!carpetaProyecto) throw new Error('No se puede ejecutar Vosk porque falta carpetaProyecto.');
  return path.join(carpetaProyecto, 'transcripciones', 'motores', 'vosk');
}

function obtenerRutaRawVosk(entrada) {
  return path.join(obtenerCarpetaMotor(entrada), VOSK_CONFIG.archivoRaw);
}

function obtenerRutaResultadoVosk(entrada) {
  return path.join(obtenerCarpetaMotor(entrada), VOSK_CONFIG.archivoResultado);
}

function crearResultadoError({ mensaje, error = null, metadata = {} }) {
  return crearResultadoMotorTranscripcion({
    motor: MOTORES_TRANSCRIPCION.VOSK,
    estado: ESTADOS_TRANSCRIPCION.ERROR,
    mensaje,
    error: error || new Error(mensaje),
    metadata
  });
}

function mensajeModeloFaltante(config = {}) {
  if (config.zipModeloDetectado) {
    return `Falta extraer el modelo Vosk. Se encontró ZIP: ${config.zipModeloDetectado}. Extrae ese ZIP y vuelve a procesar.`;
  }
  return 'Falta la carpeta del modelo Vosk. Configura AUTOVIDEOJEFF_VOSK_MODEL o coloca una carpeta vosk-model dentro de modelos/vosk.';
}

export async function verificarVosk({ opciones = {} } = {}) {
  const config = obtenerConfigVosk(opciones);
  if (!existeArchivo(RUNNER_VOSK)) {
    return { ok: false, motor: MOTORES_TRANSCRIPCION.VOSK, mensaje: 'No existe el runner vosk_runner.py.' };
  }

  if (!config.modelo || !existeCarpeta(config.modelo)) {
    return {
      ok: false,
      motor: MOTORES_TRANSCRIPCION.VOSK,
      python: config.python,
      modelo: config.modelo,
      zipModeloDetectado: config.zipModeloDetectado,
      mensaje: mensajeModeloFaltante(config)
    };
  }

  const resolucion = await resolverPythonParaModulo({
    modulo: 'vosk',
    opciones,
    clavesOpciones: ['pythonVosk'],
    timeoutMs: 15000
  });

  return {
    ok: resolucion.ok,
    motor: MOTORES_TRANSCRIPCION.VOSK,
    python: resolucion.ok ? resolucion.python : config.python,
    modelo: config.modelo,
    mensaje: resolucion.ok ? 'Vosk disponible.' : 'Vosk no está instalado en ningún Python local detectado.',
    detalle: resolucion.ok ? null : resolucion.mensaje,
    intentos: resolucion.ok ? undefined : resolucion.intentos
  };
}

export async function transcribirConVosk({ entrada, audio = null, opciones = {} } = {}) {
  const config = obtenerConfigVosk(opciones);
  if (!config.modelo) {
    return crearResultadoError({
      mensaje: mensajeModeloFaltante(config),
      metadata: { config }
    });
  }

  if (!existeCarpeta(config.modelo)) {
    return crearResultadoError({
      mensaje: mensajeModeloFaltante(config),
      metadata: { config }
    });
  }

  const resolucionPython = await resolverPythonParaModulo({
    modulo: 'vosk',
    opciones,
    clavesOpciones: ['pythonVosk'],
    timeoutMs: 15000
  });
  const python = resolucionPython.ok ? resolucionPython.python : config.python;
  if (!resolucionPython.ok) {
    return crearResultadoError({
      mensaje: 'Vosk no está instalado en el Python local detectado.',
      metadata: { config, resolucionPython }
    });
  }

  const metadataAudio = audio?.ok && audio?.audio?.ruta ? audio : await prepararAudioMotoresTranscripcion({ entrada, audio: null, opciones });
  const fuenteAudio = crearFuenteAudioParaMotor({ entrada, metadata: metadataAudio });
  if (!fuenteAudio.ok) {
    return crearResultadoError({ mensaje: 'No existe audio WAV preparado para Vosk.', metadata: { fuenteAudio, metadataAudio, config } });
  }

  const carpetaMotor = obtenerCarpetaMotor(entrada);
  await fs.promises.mkdir(carpetaMotor, { recursive: true });
  const rutaRaw = obtenerRutaRawVosk(entrada);

  const args = [
    RUNNER_VOSK,
    '--audio', fuenteAudio.ruta,
    '--output', rutaRaw,
    '--model', config.modelo,
    '--language', config.idioma,
    '--words', config.words ? 'true' : 'false'
  ];

  const proceso = await ejecutarProceso({ comando: python, args, timeoutMs: config.timeoutMs });
  const rawArchivo = existeArchivo(rutaRaw) ? JSON.parse(await fs.promises.readFile(rutaRaw, 'utf-8')) : null;
  const rawStdout = parsearJsonSeguro(proceso.stdout);
  const raw = rawArchivo || rawStdout;

  if (!raw) {
    return crearResultadoError({
      mensaje: proceso.error || 'Vosk no devolvió JSON válido.',
      metadata: { proceso, config: { ...config, python }, fuenteAudio }
    });
  }

  if (raw.ok === false || raw.estado === ESTADOS_TRANSCRIPCION.ERROR) {
    return crearResultadoError({
      mensaje: raw.mensaje || 'Vosk falló.',
      error: new Error(raw.error?.mensaje || raw.mensaje || 'Vosk falló.'),
      metadata: { proceso, config: { ...config, python }, fuenteAudio, raw }
    });
  }

  const transcripcion = crearTranscripcionNormalizadaMotor({
    motor: MOTORES_TRANSCRIPCION.VOSK,
    estado: raw.estado || ESTADOS_TRANSCRIPCION.OK,
    idioma: raw.idioma || config.idioma,
    textoCompleto: raw.textoCompleto || '',
    segmentos: raw.segmentos || [],
    duracionSegundos: raw.duracionSegundos || null,
    confianza: raw.confianza || null,
    fuenteAudio,
    mensaje: raw.mensaje || 'Transcripción generada con Vosk.',
    metadata: { ...(raw.metadata || {}), python, proceso: { code: proceso.code, duracionMs: proceso.duracionMs }, rutaRaw }
  });

  const resultado = crearResultadoMotorTranscripcion({
    motor: MOTORES_TRANSCRIPCION.VOSK,
    transcripcion,
    estado: transcripcion.estado,
    mensaje: transcripcion.mensaje,
    metadata: transcripcion.metadata
  });

  await escribirJson(obtenerRutaResultadoVosk(entrada), resultado);
  return resultado;
}

export default transcribirConVosk;
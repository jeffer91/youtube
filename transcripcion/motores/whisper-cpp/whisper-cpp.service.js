import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { prepararAudioMotoresTranscripcion, crearFuenteAudioParaMotor } from '../../servicios/preparar-audio-motores.service.js';
import {
  ESTADOS_TRANSCRIPCION,
  MOTORES_TRANSCRIPCION,
  crearResultadoMotorTranscripcion,
  crearTranscripcionNormalizadaMotor
} from '../../modelos/transcripcion-normalizada.modelo.js';
import { escribirJson } from '../../../comun/archivos.js';

export const WHISPER_CPP_CONFIG = Object.freeze({
  motor: MOTORES_TRANSCRIPCION.WHISPER_CPP,
  idioma: 'es',
  threads: 4,
  timeoutMs: 30 * 60 * 1000,
  archivoSalidaRaw: 'raw-whisper-cpp',
  archivoResultado: 'resultado-whisper-cpp.json'
});

function existeArchivo(rutaArchivo) {
  try {
    return Boolean(rutaArchivo && fs.existsSync(rutaArchivo) && fs.statSync(rutaArchivo).size > 0);
  } catch (_error) {
    return false;
  }
}

function resolverEjecutableWhisperCpp(opciones = {}) {
  const candidatos = [
    opciones.whisperCppExecutable,
    opciones.rutaWhisperCpp,
    process.env.AUTOVIDEOJEFF_WHISPER_CPP,
    process.env.WHISPER_CPP_PATH,
    process.platform === 'win32' ? 'whisper-cli.exe' : 'whisper-cli',
    process.platform === 'win32' ? 'main.exe' : 'main'
  ].filter(Boolean).map((valor) => String(valor).trim());

  return candidatos.find(Boolean) || (process.platform === 'win32' ? 'whisper-cli.exe' : 'whisper-cli');
}

function resolverModeloWhisperCpp(opciones = {}) {
  return String(
    opciones.whisperCppModel ||
    opciones.rutaModeloWhisperCpp ||
    process.env.AUTOVIDEOJEFF_WHISPER_CPP_MODEL ||
    process.env.WHISPER_CPP_MODEL ||
    ''
  ).trim();
}

function obtenerConfigWhisperCpp(opciones = {}) {
  return {
    ...WHISPER_CPP_CONFIG,
    idioma: String(opciones.idiomaTranscripcion || opciones.idioma || WHISPER_CPP_CONFIG.idioma).trim(),
    threads: Number(opciones.whisperCppThreads || WHISPER_CPP_CONFIG.threads),
    timeoutMs: Number(opciones.whisperCppTimeoutMs || WHISPER_CPP_CONFIG.timeoutMs),
    ejecutable: resolverEjecutableWhisperCpp(opciones),
    modelo: resolverModeloWhisperCpp(opciones)
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
      resolve({ ok: false, code: -1, stdout, stderr, duracionMs: Date.now() - inicio, error: `Timeout de ${timeoutMs}ms ejecutando whisper.cpp.` });
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

function obtenerCarpetaMotor(entrada) {
  const carpetaProyecto = entrada?.rutas?.carpetaProyecto;
  if (!carpetaProyecto) throw new Error('No se puede ejecutar whisper.cpp porque falta carpetaProyecto.');
  return path.join(carpetaProyecto, 'transcripciones', 'motores', 'whisper-cpp');
}

function obtenerPrefijoSalidaRaw(entrada) {
  return path.join(obtenerCarpetaMotor(entrada), WHISPER_CPP_CONFIG.archivoSalidaRaw);
}

function obtenerRutaResultado(entrada) {
  return path.join(obtenerCarpetaMotor(entrada), WHISPER_CPP_CONFIG.archivoResultado);
}

function leerJsonSeguro(rutaArchivo) {
  try {
    if (!existeArchivo(rutaArchivo)) return null;
    return JSON.parse(fs.readFileSync(rutaArchivo, 'utf-8'));
  } catch (_error) {
    return null;
  }
}

function leerTextoSeguro(rutaArchivo) {
  try {
    if (!existeArchivo(rutaArchivo)) return '';
    return fs.readFileSync(rutaArchivo, 'utf-8');
  } catch (_error) {
    return '';
  }
}

function convertirMsASegundos(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return null;
  return Number((numero / 1000).toFixed(3));
}

function normalizarSegmentosDesdeJsonWhisperCpp(raw = {}) {
  const segmentosRaw = raw.transcription || raw.segments || raw.result || [];
  if (!Array.isArray(segmentosRaw)) return [];

  return segmentosRaw.map((segmento, indice) => {
    const inicio = segmento.inicio ?? segmento.start ?? convertirMsASegundos(segmento.offsets?.from) ?? 0;
    const fin = segmento.fin ?? segmento.end ?? convertirMsASegundos(segmento.offsets?.to) ?? inicio;
    const texto = String(segmento.texto ?? segmento.text ?? '').trim();
    return {
      id: `seg-${String(indice + 1).padStart(4, '0')}`,
      indice,
      inicio: Number(Number(inicio).toFixed(3)),
      fin: Number(Number(fin).toFixed(3)),
      texto,
      confianza: null,
      metadata: { origen: 'whisper-cpp-json' }
    };
  }).filter((segmento) => segmento.texto || segmento.fin > segmento.inicio);
}

function normalizarSegmentosDesdeTxt(texto = '') {
  const limpio = String(texto || '').replace(/\r/g, '').trim();
  if (!limpio) return [];

  const lineas = limpio.split('\n').map((linea) => linea.trim()).filter(Boolean);
  const textoUnido = lineas
    .filter((linea) => !/^\[?\d{1,2}:\d{2}/.test(linea))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim() || limpio.replace(/\s+/g, ' ').trim();

  return textoUnido ? [{
    id: 'seg-0001',
    indice: 0,
    inicio: 0,
    fin: null,
    texto: textoUnido,
    confianza: null,
    metadata: { origen: 'whisper-cpp-txt' }
  }] : [];
}

function extraerTextoCompleto(segmentos = [], raw = {}, txt = '') {
  const desdeSegmentos = segmentos.map((segmento) => segmento.texto).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  if (desdeSegmentos) return desdeSegmentos;
  const desdeJson = String(raw.text || raw.textoCompleto || '').replace(/\s+/g, ' ').trim();
  if (desdeJson) return desdeJson;
  return String(txt || '').replace(/\s+/g, ' ').trim();
}

function crearResultadoError({ mensaje, error = null, metadata = {} }) {
  return crearResultadoMotorTranscripcion({
    motor: MOTORES_TRANSCRIPCION.WHISPER_CPP,
    estado: ESTADOS_TRANSCRIPCION.ERROR,
    mensaje,
    error: error || new Error(mensaje),
    metadata
  });
}

function construirArgsWhisperCpp({ config, fuenteAudio, prefijoSalida }) {
  const args = [
    '-m', config.modelo,
    '-f', fuenteAudio.ruta,
    '-l', config.idioma,
    '-t', String(config.threads),
    '-oj',
    '-otxt',
    '-of', prefijoSalida
  ];

  return args.filter((valor) => String(valor ?? '').trim() !== '');
}

export async function verificarWhisperCpp({ opciones = {} } = {}) {
  const config = obtenerConfigWhisperCpp(opciones);
  if (!config.modelo) {
    return {
      ok: false,
      motor: MOTORES_TRANSCRIPCION.WHISPER_CPP,
      ejecutable: config.ejecutable,
      modelo: config.modelo,
      mensaje: 'Falta ruta del modelo whisper.cpp. Configura AUTOVIDEOJEFF_WHISPER_CPP_MODEL o whisperCppModel.'
    };
  }

  const resultado = await ejecutarProceso({ comando: config.ejecutable, args: ['--help'], timeoutMs: 15000 });
  return {
    ok: Boolean(resultado.ok || resultado.stdout || resultado.stderr),
    motor: MOTORES_TRANSCRIPCION.WHISPER_CPP,
    ejecutable: config.ejecutable,
    modelo: config.modelo,
    mensaje: resultado.ok || resultado.stdout || resultado.stderr ? 'whisper.cpp disponible.' : 'whisper.cpp no está disponible o no responde.',
    detalle: resultado.error || null
  };
}

export async function transcribirConWhisperCpp({ entrada, audio = null, opciones = {} } = {}) {
  const config = obtenerConfigWhisperCpp(opciones);
  if (!config.modelo) {
    return crearResultadoError({
      mensaje: 'Falta modelo de whisper.cpp. Configura rutaModeloWhisperCpp, whisperCppModel o AUTOVIDEOJEFF_WHISPER_CPP_MODEL.',
      metadata: { config }
    });
  }

  const metadataAudio = audio?.ok && audio?.audio?.ruta ? audio : await prepararAudioMotoresTranscripcion({ entrada, audio: null, opciones });
  const fuenteAudio = crearFuenteAudioParaMotor({ entrada, metadata: metadataAudio });
  if (!fuenteAudio.ok) {
    return crearResultadoError({ mensaje: 'No existe audio WAV preparado para whisper.cpp.', metadata: { fuenteAudio, metadataAudio, config } });
  }

  const carpetaMotor = obtenerCarpetaMotor(entrada);
  await fs.promises.mkdir(carpetaMotor, { recursive: true });
  const prefijoSalida = obtenerPrefijoSalidaRaw(entrada);
  const args = construirArgsWhisperCpp({ config, fuenteAudio, prefijoSalida });
  const proceso = await ejecutarProceso({ comando: config.ejecutable, args, timeoutMs: config.timeoutMs });

  const rutaJson = `${prefijoSalida}.json`;
  const rutaTxt = `${prefijoSalida}.txt`;
  const rawJson = leerJsonSeguro(rutaJson) || {};
  const rawTxt = leerTextoSeguro(rutaTxt);
  const segmentosJson = normalizarSegmentosDesdeJsonWhisperCpp(rawJson);
  const segmentos = segmentosJson.length ? segmentosJson : normalizarSegmentosDesdeTxt(rawTxt);
  const textoCompleto = extraerTextoCompleto(segmentos, rawJson, rawTxt);

  if (!textoCompleto && !proceso.ok) {
    return crearResultadoError({
      mensaje: proceso.error || 'whisper.cpp no generó transcripción útil.',
      metadata: { proceso, config, fuenteAudio, rutaJson, rutaTxt }
    });
  }

  const transcripcion = crearTranscripcionNormalizadaMotor({
    motor: MOTORES_TRANSCRIPCION.WHISPER_CPP,
    estado: textoCompleto ? ESTADOS_TRANSCRIPCION.OK : ESTADOS_TRANSCRIPCION.VACIA,
    idioma: config.idioma,
    textoCompleto,
    segmentos,
    duracionSegundos: null,
    confianza: null,
    fuenteAudio,
    mensaje: textoCompleto ? 'Transcripción generada con whisper.cpp.' : 'whisper.cpp terminó sin texto útil.',
    metadata: {
      ejecutable: config.ejecutable,
      modelo: config.modelo,
      threads: config.threads,
      proceso: { code: proceso.code, duracionMs: proceso.duracionMs },
      rutas: { json: rutaJson, txt: rutaTxt }
    }
  });

  const resultado = crearResultadoMotorTranscripcion({
    motor: MOTORES_TRANSCRIPCION.WHISPER_CPP,
    transcripcion,
    estado: transcripcion.estado,
    mensaje: transcripcion.mensaje,
    metadata: transcripcion.metadata
  });

  await escribirJson(obtenerRutaResultado(entrada), resultado);
  return resultado;
}

export default transcribirConWhisperCpp;

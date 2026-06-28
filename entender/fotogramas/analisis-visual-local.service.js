import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { escribirJson } from '../../comun/archivos.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RUNNER_VISION_LOCAL = path.join(__dirname, 'vision_local_runner.py');

function obtenerPython(opciones = {}) {
  return String(
    opciones.pythonPath ||
    opciones.pythonVisionLocal ||
    process.env.AUTOVIDEOJEFF_PYTHON ||
    process.env.PYTHON ||
    (process.platform === 'win32' ? 'python' : 'python3')
  ).trim();
}

function existeArchivo(rutaArchivo) {
  try {
    return Boolean(rutaArchivo && fs.existsSync(rutaArchivo) && fs.statSync(rutaArchivo).size > 0);
  } catch (_error) {
    return false;
  }
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
      resolve({ ok: false, code: -1, stdout, stderr, duracionMs: Date.now() - inicio, error: `Timeout de ${timeoutMs}ms ejecutando análisis visual local.` });
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

function obtenerCarpetaEntendimiento(entrada = {}) {
  const carpetaProyecto = entrada?.rutas?.carpetaProyecto;
  if (!carpetaProyecto) throw new Error('No se puede ejecutar análisis visual local porque falta carpetaProyecto.');
  return path.join(carpetaProyecto, 'entendimiento');
}

function crearResultadoOmitido(mensaje, metadata = {}) {
  return {
    ok: false,
    omitido: true,
    fuente: 'vision-local-omitida',
    mensaje,
    descripciones: [],
    escenas: [],
    resumen: null,
    metadata
  };
}

export async function verificarAnalisisVisualLocal({ opciones = {} } = {}) {
  const python = obtenerPython(opciones);
  if (!existeArchivo(RUNNER_VISION_LOCAL)) {
    return { ok: false, python, mensaje: 'No existe el runner vision_local_runner.py.' };
  }
  const resultado = await ejecutarProceso({
    comando: python,
    args: ['-c', 'import cv2; print("opencv-ok")'],
    timeoutMs: 15000
  });
  const opencvOk = resultado.ok && resultado.stdout.includes('opencv-ok');
  return {
    ok: opencvOk,
    python,
    mensaje: opencvOk ? 'OpenCV disponible para análisis visual local.' : 'OpenCV no está instalado o Python no está disponible.',
    detalle: opencvOk ? null : resultado.error
  };
}

export async function analizarFotogramasLocal({ entrada, rutaVideo, fotogramas = [], opciones = {} } = {}) {
  if (!rutaVideo || !fs.existsSync(rutaVideo)) {
    return crearResultadoOmitido('No se puede analizar visualmente: falta video original.', { rutaVideo });
  }
  if (!Array.isArray(fotogramas) || !fotogramas.length) {
    return crearResultadoOmitido('No se puede analizar visualmente: no hay fotogramas extraídos.', { total: 0 });
  }
  if (!existeArchivo(RUNNER_VISION_LOCAL)) {
    return crearResultadoOmitido('No existe el runner local de visión.', { runner: RUNNER_VISION_LOCAL });
  }

  const carpetaEntendimiento = obtenerCarpetaEntendimiento(entrada);
  await fs.promises.mkdir(carpetaEntendimiento, { recursive: true });
  const rutaEntrada = path.join(carpetaEntendimiento, 'analisis-visual-local-input.json');
  const rutaSalida = path.join(carpetaEntendimiento, 'analisis-visual-local.json');
  const python = obtenerPython(opciones);
  const payload = {
    proyectoId: entrada?.proyecto?.id || null,
    fotogramas: fotogramas.map((frame) => ({
      id: frame.id,
      segundo: frame.segundo,
      rutaArchivo: frame.rutaArchivo,
      nombreArchivo: frame.nombreArchivo
    }))
  };
  await escribirJson(rutaEntrada, payload);

  const args = [
    RUNNER_VISION_LOCAL,
    '--video', rutaVideo,
    '--frames-json', rutaEntrada,
    '--output', rutaSalida
  ];
  const timeoutMs = Number(opciones.visionLocalTimeoutMs || 8 * 60 * 1000);
  const proceso = await ejecutarProceso({ comando: python, args, timeoutMs });
  const desdeArchivo = existeArchivo(rutaSalida) ? JSON.parse(await fs.promises.readFile(rutaSalida, 'utf-8')) : null;
  const desdeStdout = parsearJsonSeguro(proceso.stdout);
  const resultado = desdeArchivo || desdeStdout;

  if (!resultado) {
    return crearResultadoOmitido(proceso.error || 'El análisis visual local no devolvió JSON válido.', { proceso, python, runner: RUNNER_VISION_LOCAL });
  }

  return {
    ...resultado,
    ok: Boolean(resultado.ok),
    omitido: !resultado.ok,
    fuente: resultado.fuente || 'vision-local',
    metadata: {
      ...(resultado.metadata || {}),
      python,
      runner: RUNNER_VISION_LOCAL,
      entrada: rutaEntrada,
      salida: rutaSalida,
      proceso: { code: proceso.code, duracionMs: proceso.duracionMs }
    }
  };
}

export default analizarFotogramasLocal;

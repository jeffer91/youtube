import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { normalizarSegmentos } from './normalizar-segmentos.js';
import { limpiarTextoTranscripcion } from './normalizar-texto-transcripcion.js';

function existeArchivo(ruta) {
  return Boolean(ruta && typeof ruta === 'string' && fs.existsSync(ruta));
}

function crearCarpetaWhisper(carpetaProyecto) {
  const ruta = path.join(carpetaProyecto, 'whisper-local');
  fs.mkdirSync(ruta, { recursive: true });
  return ruta;
}

function ejecutarComando(comando, args, opciones = {}) {
  return new Promise((resolve) => {
    const proceso = spawn(comando, args, { shell: true, windowsHide: true, cwd: opciones.cwd || process.cwd() });
    let stdout = '';
    let stderr = '';
    proceso.stdout.on('data', (data) => { stdout += data.toString(); });
    proceso.stderr.on('data', (data) => { stderr += data.toString(); });
    proceso.on('error', (error) => resolve({ ok: false, code: -1, stdout, stderr, error: error.message }));
    proceso.on('close', (code) => resolve({ ok: code === 0, code, stdout, stderr, error: code === 0 ? null : stderr || stdout || `Whisper terminó con código ${code}.` }));
  });
}

function buscarJsonWhisper(carpetaSalida) {
  if (!fs.existsSync(carpetaSalida)) return null;
  const archivos = fs.readdirSync(carpetaSalida).filter((archivo) => archivo.toLowerCase().endsWith('.json')).map((archivo) => path.join(carpetaSalida, archivo)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return archivos[0] || null;
}

function leerSalidaWhisper(rutaJson, opciones = {}) {
  const data = JSON.parse(fs.readFileSync(rutaJson, 'utf-8'));
  const segmentos = normalizarSegmentos(data.segments || data.segmentos || [], opciones);
  const textoCompleto = limpiarTextoTranscripcion(data.text || data.texto || segmentos.map((segmento) => segmento.texto).join(' '));
  return { textoCompleto, segmentos };
}

export async function transcribirConWhisperLocal({ rutaAudio, carpetaProyecto, idioma = 'es', opciones = {} } = {}) {
  if (!existeArchivo(rutaAudio)) return { ok: false, mensaje: 'No existe archivo de audio o video para Whisper local.', textoCompleto: '', segmentos: [], error: 'Fuente no encontrada.' };
  if (!carpetaProyecto) return { ok: false, mensaje: 'Falta carpeta del proyecto para guardar salida de Whisper.', textoCompleto: '', segmentos: [], error: 'Carpeta del proyecto no definida.' };
  const carpetaSalida = crearCarpetaWhisper(carpetaProyecto);
  const comando = opciones.whisperComando || 'whisper';
  const args = [`"${rutaAudio}"`, '--output_format', 'json', '--output_dir', `"${carpetaSalida}"`];
  if (idioma && idioma !== 'auto') args.push('--language', idioma);
  if (opciones.whisperModel) args.push('--model', opciones.whisperModel);
  const ejecucion = await ejecutarComando(comando, args);
  if (!ejecucion.ok) return { ok: false, mensaje: 'Whisper local no pudo ejecutarse. Verifica si está instalado en tu computadora.', textoCompleto: '', segmentos: [], stdout: ejecucion.stdout, stderr: ejecucion.stderr, error: ejecucion.error };
  const rutaJson = buscarJsonWhisper(carpetaSalida);
  if (!rutaJson) return { ok: false, mensaje: 'Whisper terminó, pero no se encontró archivo JSON de salida.', textoCompleto: '', segmentos: [], stdout: ejecucion.stdout, stderr: ejecucion.stderr, error: 'JSON Whisper no encontrado.' };
  const salida = leerSalidaWhisper(rutaJson, opciones);
  return { ok: salida.segmentos.length > 0 || salida.textoCompleto.length > 0, mensaje: 'Whisper local generó la transcripción correctamente.', fuente: 'whisper-local', rutaJson, textoCompleto: salida.textoCompleto, segmentos: salida.segmentos, stdout: ejecucion.stdout, stderr: ejecucion.stderr, creadoEn: new Date().toISOString() };
}

export default transcribirConWhisperLocal;

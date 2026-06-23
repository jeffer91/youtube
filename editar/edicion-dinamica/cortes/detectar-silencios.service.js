import fs from 'fs';
import { spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import { redondearTiempo } from '../edicion-dinamica.config.js';

function resolverRutaFfmpeg() {
  return typeof ffmpegStatic === 'string' ? ffmpegStatic : ffmpegStatic?.path;
}

function validarEntrada(rutaEntrada) {
  if (!rutaEntrada || typeof rutaEntrada !== 'string') throw new Error('No se indicó archivo para detectar silencios.');
  if (!fs.existsSync(rutaEntrada)) throw new Error(`No existe el archivo para detectar silencios: ${rutaEntrada}`);
}

function ejecutarFfmpegSilenceDetect({ rutaEntrada, ruidoDb, silencioMinimoSegundos }) {
  return new Promise((resolve) => {
    const rutaFfmpeg = resolverRutaFfmpeg();
    if (!rutaFfmpeg || !fs.existsSync(rutaFfmpeg)) {
      resolve({ ok: false, stderr: '', stdout: '', code: -1, error: 'No se encontró FFmpeg.' });
      return;
    }
    const filtro = `silencedetect=noise=${ruidoDb}dB:d=${silencioMinimoSegundos}`;
    const args = ['-hide_banner', '-i', rutaEntrada, '-af', filtro, '-f', 'null', '-'];
    const proceso = spawn(rutaFfmpeg, args, { windowsHide: true });
    let stdout = '';
    let stderr = '';
    proceso.stdout.on('data', (data) => { stdout += data.toString(); });
    proceso.stderr.on('data', (data) => { stderr += data.toString(); });
    proceso.on('error', (error) => resolve({ ok: false, stdout, stderr, code: -1, error: error.message }));
    proceso.on('close', (code) => resolve({ ok: code === 0, stdout, stderr, code, error: code === 0 ? null : stderr || stdout || `FFmpeg terminó con código ${code}.` }));
  });
}

export function parsearSilenciosDesdeFfmpeg(stderr = '', duracionSegundos = null) {
  const lineas = String(stderr || '').split(/\r?\n/g);
  const silencios = [];
  let silencioAbierto = null;
  for (const linea of lineas) {
    const matchInicio = linea.match(/silence_start:\s*([0-9.]+)/i);
    const matchFin = linea.match(/silence_end:\s*([0-9.]+)\s*\|\s*silence_duration:\s*([0-9.]+)/i);
    if (matchInicio) silencioAbierto = { inicio: redondearTiempo(Number(matchInicio[1])), fin: null, duracion: null };
    if (matchFin) {
      const fin = redondearTiempo(Number(matchFin[1]));
      const duracion = redondearTiempo(Number(matchFin[2]));
      const inicio = silencioAbierto?.inicio ?? redondearTiempo(fin - duracion);
      silencios.push({ inicio, fin, duracion, origen: 'ffmpeg-silencedetect' });
      silencioAbierto = null;
    }
  }
  if (silencioAbierto && Number.isFinite(Number(duracionSegundos))) {
    const fin = redondearTiempo(Number(duracionSegundos));
    const duracion = redondearTiempo(fin - silencioAbierto.inicio);
    if (duracion > 0) silencios.push({ inicio: silencioAbierto.inicio, fin, duracion, origen: 'ffmpeg-silencedetect-abierto' });
  }
  return silencios;
}

export async function detectarSilenciosFfmpeg({ rutaEntrada, ruidoDb = -34, silencioMinimoSegundos = 0.45, duracionSegundos = null } = {}) {
  validarEntrada(rutaEntrada);
  const inicioProceso = Date.now();
  const ejecucion = await ejecutarFfmpegSilenceDetect({ rutaEntrada, ruidoDb, silencioMinimoSegundos });
  const silencios = ejecucion.ok ? parsearSilenciosDesdeFfmpeg(ejecucion.stderr, duracionSegundos) : [];
  return { ok: ejecucion.ok, etapa: 'detectar-silencios', rutaEntrada, ruidoDb, silencioMinimoSegundos, cantidadSilencios: silencios.length, silencios, ffmpeg: { code: ejecucion.code, error: ejecucion.error, duracionMs: Date.now() - inicioProceso }, creadoEn: new Date().toISOString() };
}

export default detectarSilenciosFfmpeg;

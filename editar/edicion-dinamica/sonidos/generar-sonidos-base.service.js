import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import { asegurarCarpeta } from '../../../comun/archivos.js';

function resolverRutaFfmpeg() {
  return typeof ffmpegStatic === 'string' ? ffmpegStatic : ffmpegStatic?.path;
}

function ejecutarFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const rutaFfmpeg = resolverRutaFfmpeg();

    if (!rutaFfmpeg || !fs.existsSync(rutaFfmpeg)) {
      reject(new Error('No se encontró FFmpeg para generar sonidos base.'));
      return;
    }

    const proceso = spawn(rutaFfmpeg, args, { windowsHide: true });
    let stdout = '';
    let stderr = '';

    proceso.stdout.on('data', (data) => { stdout += data.toString(); });
    proceso.stderr.on('data', (data) => { stderr += data.toString(); });
    proceso.on('error', (error) => reject(error));
    proceso.on('close', (code) => {
      if (code === 0) resolve({ ok: true, stdout, stderr, code });
      else reject(new Error(`FFmpeg no pudo generar sonido base. Código ${code}. ${stderr || stdout}`));
    });
  });
}

async function generarSonido({ nombre, definicion, carpetaGenerados }) {
  const rutaSalida = path.join(carpetaGenerados, `${nombre}.wav`);

  if (fs.existsSync(rutaSalida)) {
    return { nombre, ruta: rutaSalida, generado: false };
  }

  const frecuencia = Number(definicion.frecuencia || 700);
  const duracion = Number(definicion.duracion || 0.1);
  const volumen = Number(definicion.volumen || 0.2);
  const filtro = `sine=frequency=${frecuencia}:duration=${duracion}`;

  await ejecutarFfmpeg([
    '-y',
    '-hide_banner',
    '-f',
    'lavfi',
    '-i',
    filtro,
    '-af',
    `volume=${volumen},afade=t=out:st=${Math.max(0, duracion - 0.025)}:d=0.025`,
    '-ac',
    '2',
    '-ar',
    '48000',
    rutaSalida
  ]);

  return { nombre, ruta: rutaSalida, generado: true };
}

export async function generarSonidosBase({ carpetaSonidos, config } = {}) {
  if (!carpetaSonidos) {
    throw new Error('No se puede generar sonidos base sin carpeta de sonidos.');
  }

  const carpetaGenerados = path.join(carpetaSonidos, config.carpetaGenerados || 'generados');
  asegurarCarpeta(carpetaGenerados);

  const sonidos = {};

  for (const [nombre, definicion] of Object.entries(config.sonidosBase || {})) {
    sonidos[nombre] = await generarSonido({ nombre, definicion, carpetaGenerados });
  }

  return {
    ok: true,
    carpetaGenerados,
    sonidos,
    cantidad: Object.keys(sonidos).length,
    creadoEn: new Date().toISOString()
  };
}

export default generarSonidosBase;

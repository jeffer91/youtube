/*
  Nueva etapa estructural - Bloque 1
  Función: extraer fotogramas clave para que la app entienda el video antes de editar.
*/

import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { asegurarCarpeta, escribirJson, crearRutaRelativaParaWeb } from '../../comun/archivos.js';

function resolverRutaFfmpeg() {
  return typeof ffmpegStatic === 'string' ? ffmpegStatic : ffmpegStatic?.path;
}

const rutaFfmpeg = resolverRutaFfmpeg();
if (rutaFfmpeg) ffmpeg.setFfmpegPath(rutaFfmpeg);

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function calcularTiempos(duracionSegundos = 0, cantidad = 6) {
  const duracion = numero(duracionSegundos, 0);
  if (duracion <= 0) return [0];
  const total = Math.max(1, Math.min(8, Number(cantidad) || 6));
  const margen = duracion > 8 ? 1.2 : 0;
  const inicio = margen;
  const fin = Math.max(inicio, duracion - margen);
  if (total === 1) return [Number((duracion / 2).toFixed(2))];
  return Array.from({ length: total }, (_item, index) => {
    const t = inicio + ((fin - inicio) * index) / (total - 1);
    return Number(Math.min(Math.max(t, 0), duracion).toFixed(2));
  });
}

function tomarScreenshot({ rutaVideo, rutaSalida, segundo }) {
  return new Promise((resolve, reject) => {
    if (!rutaFfmpeg) {
      reject(new Error('No se encontró FFmpeg para extraer fotogramas.'));
      return;
    }

    ffmpeg(rutaVideo)
      .seekInput(segundo)
      .frames(1)
      .outputOptions(['-q:v 3'])
      .output(rutaSalida)
      .on('end', () => resolve(rutaSalida))
      .on('error', (error) => reject(error))
      .run();
  });
}

function crearRegistroFotograma({ rutaArchivo, segundo, index }) {
  const existe = fs.existsSync(rutaArchivo);
  const stats = existe ? fs.statSync(rutaArchivo) : null;
  return {
    id: `frame-${String(index + 1).padStart(2, '0')}`,
    segundo,
    rutaArchivo,
    rutaRelativa: existe ? crearRutaRelativaParaWeb(rutaArchivo) : null,
    nombreArchivo: path.basename(rutaArchivo),
    pesoBytes: stats?.size || 0,
    estado: existe && stats?.size > 0 ? 'extraido' : 'vacio'
  };
}

function analizarFotogramasBasico(fotogramas = [], analisis = {}) {
  const duracion = numero(analisis?.duracionSegundos, 0);
  return {
    total: fotogramas.length,
    puntosAnalizados: fotogramas.map((frame) => frame.segundo),
    cobertura: duracion > 0 ? Number(((fotogramas.length / Math.max(1, Math.ceil(duracion / 10))) * 100).toFixed(1)) : null,
    lecturaVisual: fotogramas.length > 0 ? 'Fotogramas extraídos para análisis visual y selección de momentos.' : 'No se pudieron extraer fotogramas.',
    advertencias: fotogramas.length === 0 ? ['Sin fotogramas disponibles para análisis visual.'] : []
  };
}

export async function extraerFotogramasClave({ entrada, analisis, opciones = {} } = {}) {
  const rutaVideo = entrada?.video?.rutaOriginal;
  if (!rutaVideo || !fs.existsSync(rutaVideo)) {
    return { ok: false, omitido: true, fotogramas: [], mensaje: 'No se pudieron extraer fotogramas: falta video original.' };
  }

  const carpetaProyecto = entrada?.rutas?.carpetaProyecto;
  const carpetaFotogramas = path.join(carpetaProyecto, 'entendimiento', 'fotogramas');
  asegurarCarpeta(carpetaFotogramas);

  const cantidad = Math.max(3, Math.min(8, numero(opciones?.cantidadFotogramasEntendimiento, 6)));
  const tiempos = calcularTiempos(analisis?.duracionSegundos, cantidad);
  const fotogramas = [];
  const errores = [];

  for (let i = 0; i < tiempos.length; i += 1) {
    const segundo = tiempos[i];
    const rutaSalida = path.join(carpetaFotogramas, `frame-${String(i + 1).padStart(2, '0')}-${String(Math.round(segundo * 10)).padStart(4, '0')}.jpg`);
    try {
      await tomarScreenshot({ rutaVideo, rutaSalida, segundo });
      fotogramas.push(crearRegistroFotograma({ rutaArchivo: rutaSalida, segundo, index: i }));
    } catch (error) {
      errores.push({ segundo, mensaje: error.message });
    }
  }

  const analisisFotogramas = analizarFotogramasBasico(fotogramas, analisis);
  const resultado = {
    ok: fotogramas.length > 0,
    etapa: 'entender-fotogramas',
    tipo: 'fotogramas-clave',
    carpetaFotogramas,
    cantidadSolicitada: cantidad,
    cantidadExtraida: fotogramas.length,
    fotogramas,
    analisisFotogramas,
    errores,
    mensaje: fotogramas.length > 0 ? `${fotogramas.length} fotogramas clave extraídos.` : 'No se pudieron extraer fotogramas clave.',
    creadoEn: new Date().toISOString()
  };

  await escribirJson(path.join(carpetaProyecto, 'entendimiento', 'fotogramas-clave.json'), resultado);
  return resultado;
}

export default extraerFotogramasClave;

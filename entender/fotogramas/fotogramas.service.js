import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { asegurarCarpeta, escribirJson, crearRutaRelativaParaWeb, obtenerRutasDatosBase } from '../../comun/archivos.js';
import { analizarFotogramasLocal } from './analisis-visual-local.service.js';

function resolverRutaFfmpeg() {
  return typeof ffmpegStatic === 'string' ? ffmpegStatic : ffmpegStatic?.path;
}

const rutaFfmpeg = resolverRutaFfmpeg();
if (rutaFfmpeg) ffmpeg.setFfmpegPath(rutaFfmpeg);

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function texto(valor, respaldo = '') {
  const limpio = String(valor || '').replace(/\s+/g, ' ').trim();
  return limpio || respaldo;
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

async function copiarPreviewPublico({ rutaArchivo, rutaPublica }) {
  if (!rutaArchivo || !rutaPublica || rutaArchivo === rutaPublica) return false;
  await fs.promises.mkdir(path.dirname(rutaPublica), { recursive: true });
  await fs.promises.copyFile(rutaArchivo, rutaPublica);
  return true;
}

function obtenerCarpetaPreviewPublica(entrada) {
  const rutas = obtenerRutasDatosBase();
  const proyectoId = entrada?.proyecto?.id || 'proyecto';
  return path.join(rutas.videosExportados, 'fotogramas', proyectoId);
}

function crearUrlPreviewPublica(rutaPublica) {
  if (!rutaPublica) return null;
  const rutas = obtenerRutasDatosBase();
  const relativa = path.relative(rutas.videosExportados, rutaPublica).replace(/\\/g, '/');
  return `/exports/${relativa}`;
}

function crearAnalisisVisualBasico({ frame, index, total, analisis }) {
  const duracion = numero(analisis?.duracionSegundos, 0);
  const posicion = index === 0 ? 'inicio / posible hook' : index === total - 1 ? 'cierre' : 'desarrollo';
  const porcentaje = duracion > 0 ? Math.round((numero(frame.segundo, 0) / duracion) * 100) : null;
  const descripcion = `Fotograma ${frame.id} extraído en ${frame.segundo}s${porcentaje !== null ? ` (${porcentaje}% del video)` : ''}. Ubicación narrativa: ${posicion}.`;
  return {
    ok: true,
    fuente: 'lectura-tecnica-local',
    descripcion,
    escena: posicion,
    objetos: [],
    personas: 'no evaluado todavía por OpenCV',
    textoVisible: 'no evaluado localmente',
    accion: 'frame extraído para análisis de continuidad',
    valorEditorial: index === 0 ? 'Sirve para revisar el gancho inicial.' : index === total - 1 ? 'Sirve para revisar el cierre.' : 'Sirve para revisar ritmo y continuidad.',
    recomendacion: 'Ejecutar análisis visual local para medir cambios, movimiento, iluminación y encuadre.'
  };
}

function crearRegistroFotograma({ rutaArchivo, rutaPreview, segundo, index, total, analisis }) {
  const existe = fs.existsSync(rutaArchivo);
  const stats = existe ? fs.statSync(rutaArchivo) : null;
  const base = {
    id: `frame-${String(index + 1).padStart(2, '0')}`,
    segundo,
    rutaArchivo,
    rutaRelativa: existe ? crearRutaRelativaParaWeb(rutaArchivo) : null,
    rutaPreview: rutaPreview || null,
    urlPublica: rutaPreview ? crearUrlPreviewPublica(rutaPreview) : null,
    nombreArchivo: path.basename(rutaArchivo),
    pesoBytes: stats?.size || 0,
    estado: existe && stats?.size > 0 ? 'extraido' : 'vacio'
  };
  const analisisVisual = crearAnalisisVisualBasico({ frame: base, index, total, analisis });
  return { ...base, descripcionVisual: analisisVisual.descripcion, analisisVisual };
}

function mezclarAnalisisVisualLocal(fotogramas = [], resultadoLocal = {}) {
  if (!resultadoLocal?.ok || !Array.isArray(resultadoLocal.descripciones)) return fotogramas;
  const porId = new Map(resultadoLocal.descripciones.map((item) => [String(item.id || '').trim(), item]));
  return fotogramas.map((frame) => {
    const encontrado = porId.get(frame.id);
    if (!encontrado) return frame;
    const analisisVisual = {
      ...frame.analisisVisual,
      ...encontrado,
      ok: Boolean(encontrado.ok),
      fuente: encontrado.fuente || resultadoLocal.fuente || 'vision-local'
    };
    return {
      ...frame,
      descripcionVisual: texto(encontrado.descripcion, frame.descripcionVisual),
      analisisVisual
    };
  });
}

function analizarFotogramasBasico(fotogramas = [], analisis = {}, analisisVisualGlobal = null) {
  const duracion = numero(analisis?.duracionSegundos, 0);
  const resumenLocal = analisisVisualGlobal?.resumen || {};
  return {
    total: fotogramas.length,
    puntosAnalizados: fotogramas.map((frame) => frame.segundo),
    cobertura: duracion > 0 ? Number(((fotogramas.length / Math.max(1, Math.ceil(duracion / 10))) * 100).toFixed(1)) : null,
    lecturaVisual: fotogramas.length > 0 ? 'Fotogramas extraídos y analizados localmente para continuidad visual, cambios de escena, iluminación, nitidez y encuadre.' : 'No se pudieron extraer fotogramas.',
    fuenteDescripcion: analisisVisualGlobal?.fuente || 'lectura-tecnica-local',
    escenasDetectadas: resumenLocal.escenasDetectadas ?? (Array.isArray(analisisVisualGlobal?.escenas) ? analisisVisualGlobal.escenas.length : 0),
    cambiosFuertes: resumenLocal.cambiosFuertes ?? 0,
    hayCambiosEnGrabacion: Boolean(resumenLocal.hayCambiosEnGrabacion),
    advertencias: [
      ...(fotogramas.length === 0 ? ['Sin fotogramas disponibles para análisis visual.'] : []),
      ...(analisisVisualGlobal?.ok ? [] : [analisisVisualGlobal?.mensaje || 'Análisis visual local no disponible. Instalar opencv-python y scenedetect.'])
    ].filter(Boolean)
  };
}

export async function extraerFotogramasClave({ entrada, analisis, opciones = {} } = {}) {
  const rutaVideo = entrada?.video?.rutaOriginal;
  if (!rutaVideo || !fs.existsSync(rutaVideo)) {
    return { ok: false, omitido: true, fotogramas: [], mensaje: 'No se pudieron extraer fotogramas: falta video original.' };
  }

  const carpetaProyecto = entrada?.rutas?.carpetaProyecto;
  const carpetaFotogramas = path.join(carpetaProyecto, 'entendimiento', 'fotogramas');
  const carpetaPreview = obtenerCarpetaPreviewPublica(entrada);
  asegurarCarpeta(carpetaFotogramas);
  asegurarCarpeta(carpetaPreview);

  const cantidad = Math.max(3, Math.min(8, numero(opciones?.cantidadFotogramasEntendimiento, 6)));
  const tiempos = calcularTiempos(analisis?.duracionSegundos, cantidad);
  const fotogramas = [];
  const errores = [];

  for (let i = 0; i < tiempos.length; i += 1) {
    const segundo = tiempos[i];
    const nombreArchivo = `frame-${String(i + 1).padStart(2, '0')}-${String(Math.round(segundo * 10)).padStart(4, '0')}.jpg`;
    const rutaSalida = path.join(carpetaFotogramas, nombreArchivo);
    const rutaPreview = path.join(carpetaPreview, nombreArchivo);
    try {
      await tomarScreenshot({ rutaVideo, rutaSalida, segundo });
      await copiarPreviewPublico({ rutaArchivo: rutaSalida, rutaPublica: rutaPreview });
      fotogramas.push(crearRegistroFotograma({ rutaArchivo: rutaSalida, rutaPreview, segundo, index: i, total: tiempos.length, analisis }));
    } catch (error) {
      errores.push({ segundo, mensaje: error.message });
    }
  }

  const analisisVisualGlobal = await analizarFotogramasLocal({ entrada, rutaVideo, fotogramas, opciones });
  const fotogramasConDescripcion = mezclarAnalisisVisualLocal(fotogramas, analisisVisualGlobal);
  const analisisFotogramas = analizarFotogramasBasico(fotogramasConDescripcion, analisis, analisisVisualGlobal);
  const resultado = {
    ok: fotogramasConDescripcion.length > 0,
    etapa: 'entender-fotogramas',
    tipo: 'fotogramas-clave',
    carpetaFotogramas,
    carpetaPreview,
    cantidadSolicitada: cantidad,
    cantidadExtraida: fotogramasConDescripcion.length,
    fotogramas: fotogramasConDescripcion,
    analisisFotogramas,
    analisisVisualGlobal,
    errores,
    mensaje: fotogramasConDescripcion.length > 0 ? `${fotogramasConDescripcion.length} fotogramas clave extraídos y analizados localmente.` : 'No se pudieron extraer fotogramas clave.',
    creadoEn: new Date().toISOString()
  };

  await escribirJson(path.join(carpetaProyecto, 'entendimiento', 'fotogramas-clave.json'), resultado);
  return resultado;
}

export default extraerFotogramasClave;

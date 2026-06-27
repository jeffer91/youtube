import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { asegurarCarpeta, escribirJson, crearRutaRelativaParaWeb, obtenerRutasDatosBase } from '../../comun/archivos.js';
import { obtenerConfigTranscripcion } from '../../transcripcion/transcripcion.config.js';

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
    ok: false,
    fuente: 'lectura-tecnica-local',
    descripcion,
    escena: posicion,
    objetos: [],
    personas: 'pendiente de análisis visual con IA',
    textoVisible: 'pendiente de análisis visual con IA',
    accion: 'pendiente de análisis visual con IA',
    valorEditorial: index === 0 ? 'Sirve para revisar el gancho inicial.' : index === total - 1 ? 'Sirve para revisar el cierre.' : 'Sirve para revisar ritmo y continuidad.',
    recomendacion: 'Activar Gemini para describir visualmente qué aparece en este fotograma.'
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

function limpiarJsonGemini(textoRespuesta) {
  const textoLimpio = String(textoRespuesta || '').replace(/```json/gi, '').replace(/```/g, '').trim();
  const inicio = textoLimpio.indexOf('{');
  const fin = textoLimpio.lastIndexOf('}');
  if (inicio < 0 || fin < inicio) return { ok: false, error: 'Gemini no devolvió JSON reconocible.' };
  try {
    return { ok: true, data: JSON.parse(textoLimpio.slice(inicio, fin + 1)) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

function obtenerTextoGeminiDesdeRespuesta(json) {
  const partes = json?.candidates?.[0]?.content?.parts || [];
  return partes.map((parte) => parte.text || '').filter(Boolean).join('\n');
}

function crearEndpointGemini({ modelo, apiKey }) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelo || 'gemini-1.5-flash')}:generateContent?key=${encodeURIComponent(apiKey)}`;
}

function crearPromptVisual({ fotogramas, analisis }) {
  return [
    'Eres un editor profesional de video. Analiza los fotogramas clave para entender qué aparece visualmente antes de crear el plan de edición.',
    'No identifiques personas por nombre propio. Describe solo escena, objetos, acciones, texto visible y valor editorial.',
    `Duración aproximada: ${analisis?.duracionSegundos || 'desconocida'} segundos. Orientación: ${analisis?.orientacion || 'desconocida'}.`,
    'Devuelve solamente JSON válido sin markdown con esta forma exacta:',
    '{"fotogramas":[{"id":"frame-01","descripcion":"qué se ve","escena":"tipo de escena","objetos":["objeto"],"personas":"descripción general","textoVisible":"texto visible o ninguno","accion":"qué ocurre","valorEditorial":"para qué sirve en edición","recomendacion":"qué hacer con este frame"}]}',
    'Fotogramas a analizar:',
    fotogramas.map((frame) => `${frame.id}: segundo ${frame.segundo}`).join('\n')
  ].join('\n');
}

async function analizarFotogramasConGemini({ fotogramas, analisis, opciones }) {
  const config = obtenerConfigTranscripcion(opciones);
  if (!config.gemini.usarGemini || !config.gemini.credencial) {
    return { ok: false, omitido: true, fuente: 'sin-gemini', mensaje: 'Gemini no está activo para describir fotogramas.' };
  }

  const framesValidos = fotogramas.filter((frame) => frame.rutaArchivo && fs.existsSync(frame.rutaArchivo)).slice(0, 8);
  if (!framesValidos.length) return { ok: false, omitido: true, fuente: 'sin-frames', mensaje: 'No hay fotogramas válidos para describir.' };

  const parts = [{ text: crearPromptVisual({ fotogramas: framesValidos, analisis }) }];
  for (const frame of framesValidos) {
    const buffer = await fs.promises.readFile(frame.rutaArchivo);
    parts.push({ text: `Analiza este fotograma con id ${frame.id}, segundo ${frame.segundo}.` });
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: buffer.toString('base64') } });
  }

  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: Number(config.gemini.temperatura || 0.2),
      maxOutputTokens: Number(opciones.geminiMaxOutputTokensVision || 4096),
      responseMimeType: 'application/json'
    }
  };

  try {
    const respuesta = await fetch(crearEndpointGemini({ modelo: config.gemini.modelo, apiKey: config.gemini.credencial }), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const json = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) throw new Error(json?.error?.message || `Gemini visión respondió HTTP ${respuesta.status}`);
    const limpio = limpiarJsonGemini(obtenerTextoGeminiDesdeRespuesta(json));
    if (!limpio.ok) throw new Error(limpio.error);
    const descripciones = Array.isArray(limpio.data?.fotogramas) ? limpio.data.fotogramas : [];
    return { ok: descripciones.length > 0, omitido: false, fuente: 'gemini-vision', descripciones, mensaje: `${descripciones.length} fotogramas descritos con Gemini.` };
  } catch (error) {
    return { ok: false, omitido: true, fuente: 'gemini-vision-error', mensaje: `No se pudieron describir fotogramas con Gemini: ${error.message}` };
  }
}

function mezclarDescripcionesVisuales(fotogramas, resultadoGemini) {
  if (!resultadoGemini?.ok || !Array.isArray(resultadoGemini.descripciones)) return fotogramas;
  const porId = new Map(resultadoGemini.descripciones.map((item) => [String(item.id || '').trim(), item]));
  return fotogramas.map((frame) => {
    const encontrado = porId.get(frame.id);
    if (!encontrado) return frame;
    const analisisVisual = {
      ...frame.analisisVisual,
      ...encontrado,
      ok: true,
      fuente: 'gemini-vision'
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
  return {
    total: fotogramas.length,
    puntosAnalizados: fotogramas.map((frame) => frame.segundo),
    cobertura: duracion > 0 ? Number(((fotogramas.length / Math.max(1, Math.ceil(duracion / 10))) * 100).toFixed(1)) : null,
    lecturaVisual: fotogramas.length > 0 ? 'Fotogramas extraídos y descritos para análisis visual y selección de momentos.' : 'No se pudieron extraer fotogramas.',
    fuenteDescripcion: analisisVisualGlobal?.fuente || 'lectura-tecnica-local',
    advertencias: [
      ...(fotogramas.length === 0 ? ['Sin fotogramas disponibles para análisis visual.'] : []),
      ...(analisisVisualGlobal?.ok ? [] : [analisisVisualGlobal?.mensaje || 'Descripción visual semántica no disponible.'])
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

  const analisisVisualGlobal = await analizarFotogramasConGemini({ fotogramas, analisis, opciones });
  const fotogramasConDescripcion = mezclarDescripcionesVisuales(fotogramas, analisisVisualGlobal);
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
    mensaje: fotogramasConDescripcion.length > 0 ? `${fotogramasConDescripcion.length} fotogramas clave extraídos.` : 'No se pudieron extraer fotogramas clave.',
    creadoEn: new Date().toISOString()
  };

  await escribirJson(path.join(carpetaProyecto, 'entendimiento', 'fotogramas-clave.json'), resultado);
  return resultado;
}

export default extraerFotogramasClave;

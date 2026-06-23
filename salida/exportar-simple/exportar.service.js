import fs from 'fs';
import path from 'path';
import { exportarConFfmpeg } from '../../comun/ffmpeg.js';
import { asegurarCarpeta, escribirJson, obtenerRutaRaiz, crearRutaRelativaParaWeb } from '../../comun/archivos.js';

const PLATAFORMA_PREDETERMINADA = 'tiktok';
const MODO_VIDEO_PREDETERMINADO = 'cuadrado-centro';

function obtenerRutaVideoRender({ entrada, edicion }) {
  return edicion?.render?.rutaVideoEntrada || edicion?.entrada?.rutaVideoRender || entrada?.video?.rutaOriginal || null;
}

function obtenerRutaAudioConSonidos(edicion) {
  return edicion?.render?.rutaAudioConSonidos || edicion?.sonidos?.audioConSonidos || null;
}

function obtenerRutaAudioMejoradoSeguro(audio) {
  if (!audio?.usarAudioMejorado || !audio?.rutaAudioMejorado) return null;
  return fs.existsSync(audio.rutaAudioMejorado) ? audio.rutaAudioMejorado : null;
}

function validarEntradaExportacion({ entrada, edicion }) {
  const rutaVideoRender = obtenerRutaVideoRender({ entrada, edicion });
  const rutaAudioConSonidos = obtenerRutaAudioConSonidos(edicion);

  if (!entrada?.video?.rutaOriginal) throw new Error('No se puede exportar: falta ruta del video original.');
  if (!rutaVideoRender) throw new Error('No se puede exportar: falta ruta del video que se debe renderizar.');
  if (!fs.existsSync(rutaVideoRender)) throw new Error(`No se puede exportar: no existe el video de render ${rutaVideoRender}`);
  if (!entrada?.rutas?.carpetaProyecto) throw new Error('No se puede exportar: falta carpeta del proyecto.');
  if (!edicion?.render?.filtroVideo) throw new Error('No se puede exportar: falta filtro FFmpeg de video.');
  if (!edicion?.salida?.nombreExportado) throw new Error('No se puede exportar: falta nombre del archivo exportado.');

  if (rutaAudioConSonidos && !fs.existsSync(rutaAudioConSonidos)) {
    throw new Error(`No se puede exportar: no existe el audio con sonidos ${rutaAudioConSonidos}`);
  }
}

function normalizarTexto(valor, valorPorDefecto) {
  if (typeof valor !== 'string') return valorPorDefecto;
  const limpio = valor.trim();
  return limpio.length > 0 ? limpio : valorPorDefecto;
}

function normalizarModoVideo({ edicion, opciones }) {
  const modo = normalizarTexto(edicion?.modo || opciones?.modo, MODO_VIDEO_PREDETERMINADO).toLowerCase();
  if (['cuadrado-centro', 'tiktok-cuadrado-centro', 'square-center'].includes(modo)) return 'cuadrado-centro';
  if (['simple', 'tiktok-simple'].includes(modo)) return 'simple';
  return modo;
}

function crearUrlPublica(nombreExportado) {
  return `/exports/${encodeURIComponent(nombreExportado)}`;
}

async function validarArchivoExportado(rutaExportada) {
  let stats = null;
  try {
    stats = await fs.promises.stat(rutaExportada);
  } catch (_error) {
    throw new Error(`FFmpeg terminó, pero no se encontró el archivo exportado: ${rutaExportada}`);
  }
  if (!stats.isFile() || stats.size <= 0) throw new Error(`El archivo exportado está vacío o no es válido: ${rutaExportada}`);
  return stats;
}

function obtenerRutaAudioParaExportar({ audio, edicion }) {
  const rutaAudioConSonidos = obtenerRutaAudioConSonidos(edicion);
  if (rutaAudioConSonidos) return rutaAudioConSonidos;
  if (edicion?.render?.usarAudioDelVideoRender) return null;
  return obtenerRutaAudioMejoradoSeguro(audio);
}

function crearResumenAudioExportado({ audio, rutaAudioExterno, edicion }) {
  const rutaAudioConSonidos = obtenerRutaAudioConSonidos(edicion);

  if (rutaAudioConSonidos && rutaAudioExterno === rutaAudioConSonidos) {
    return { tipo: 'sonidos-edicion', modulo: 'edicion-dinamica-sonidos', omitido: false, rutaAudioMejorado: rutaAudioExterno, nombreAudioMejorado: path.basename(rutaAudioExterno), mensaje: 'Se usó audio mezclado con efectos de sonido.' };
  }

  if (edicion?.render?.usarAudioDelVideoRender) {
    return { tipo: 'video-render', modulo: 'edicion-dinamica', omitido: false, rutaAudioMejorado: null, nombreAudioMejorado: null, mensaje: 'Se usó el audio integrado en el video dinámico.' };
  }

  if (rutaAudioExterno) {
    return { tipo: 'mejorado', modulo: audio?.tipo || 'limpieza-simple', omitido: false, rutaAudioMejorado: rutaAudioExterno, nombreAudioMejorado: audio?.nombreAudioMejorado || path.basename(rutaAudioExterno), mensaje: audio?.mensaje || 'Se usó audio mejorado.' };
  }

  if (audio?.usarAudioMejorado && audio?.rutaAudioMejorado && !fs.existsSync(audio.rutaAudioMejorado)) {
    return { tipo: 'original', modulo: audio?.tipo || null, omitido: true, rutaAudioMejorado: null, nombreAudioMejorado: null, mensaje: 'Se usó audio original porque el audio mejorado no existe o no está disponible.' };
  }

  return { tipo: 'original', modulo: audio?.tipo || null, omitido: Boolean(audio?.omitido), rutaAudioMejorado: null, nombreAudioMejorado: null, mensaje: audio?.mensaje || 'Se usó el audio original del video.' };
}

function crearNombreResumenSalida(modo) {
  if (modo === 'cuadrado-centro') return 'salida-tiktok-cuadrado-centro.json';
  return 'salida-simple.json';
}

function crearResumenEdicion(edicion) {
  return { tipo: edicion?.tipo || null, plataforma: edicion?.plataforma || null, modo: edicion?.modo || null, preset: edicion?.preset?.nombre || edicion?.presetUsado?.nombre || null, rutaEdicion: edicion?.rutaEdicion || edicion?.salida?.rutaEdicion || null, filtroVideo: edicion?.render?.filtroVideo || null, salida: edicion?.salida || null, composicion: edicion?.composicion || null, videoRender: { rutaVideoEntrada: edicion?.render?.rutaVideoEntrada || edicion?.entrada?.rutaVideoRender || null, origenVideoEntrada: edicion?.render?.origenVideoEntrada || edicion?.entrada?.origenVideoRender || 'original', usarAudioDelVideoRender: Boolean(edicion?.render?.usarAudioDelVideoRender) }, visualDinamico: edicion?.visualDinamico || null, sonidos: edicion?.sonidos || null, edicionDinamica: edicion?.edicionDinamica || null };
}

export async function exportarVideoSimple({ entrada, entendimiento, audio = null, edicion, opciones = {} }) {
  validarEntradaExportacion({ entrada, edicion });

  const raiz = obtenerRutaRaiz();
  const carpetaExportados = path.join(raiz, 'datos', 'videos-exportados');
  const nombreExportado = edicion.salida.nombreExportado;
  const rutaExportada = path.join(carpetaExportados, nombreExportado);
  const modo = normalizarModoVideo({ edicion, opciones });
  const plataforma = normalizarTexto(edicion.plataforma || opciones.plataforma, PLATAFORMA_PREDETERMINADA);
  const nombreResumenSalida = crearNombreResumenSalida(modo);
  const rutaResumenSalida = path.join(entrada.rutas.carpetaProyecto, nombreResumenSalida);
  const rutaResumenCompatibilidad = path.join(entrada.rutas.carpetaProyecto, 'salida-simple.json');
  const rutaVideoRender = obtenerRutaVideoRender({ entrada, edicion });
  const rutaAudioExterno = obtenerRutaAudioParaExportar({ audio, edicion });

  asegurarCarpeta(carpetaExportados);

  const resultadoFfmpeg = await exportarConFfmpeg({ rutaEntrada: rutaVideoRender, rutaSalida: rutaExportada, filtroVideo: edicion.render.filtroVideo, rutaAudioExterno, codecVideo: edicion.render.codecVideo || 'libx264', codecAudio: edicion.render.codecAudio || 'aac', crf: edicion.render.crf || 23, presetFfmpeg: edicion.render.presetFfmpeg || 'veryfast', audioBitrate: edicion.render.audioBitrate || '160k' });

  const stats = await validarArchivoExportado(rutaExportada);
  const resumenAudio = crearResumenAudioExportado({ audio, rutaAudioExterno, edicion });

  const salida = { ok: true, etapa: 'salida', tipo: 'exportar-simple', plataforma, modo, rutaExportada, rutaRelativa: crearRutaRelativaParaWeb(rutaExportada), nombreExportado, urlPublica: crearUrlPublica(nombreExportado), pesoBytes: stats.size, audio: resumenAudio, edicion: crearResumenEdicion(edicion), ffmpeg: { audioUsado: resultadoFfmpeg?.audioUsado || resumenAudio.tipo, videoRenderUsado: rutaVideoRender }, render: { filtroVideo: edicion.render.filtroVideo, codecVideo: edicion.render.codecVideo || 'libx264', codecAudio: edicion.render.codecAudio || 'aac', crf: edicion.render.crf || 23, presetFfmpeg: edicion.render.presetFfmpeg || 'veryfast', audioBitrate: edicion.render.audioBitrate || '160k', pixFmt: edicion.render.pixFmt || 'yuv420p' }, entrada: { nombreOriginal: entrada.video.nombreOriginal || null, rutaOriginal: entrada.video.rutaOriginal, rutaVideoRender, origenVideoRender: edicion?.render?.origenVideoEntrada || edicion?.entrada?.origenVideoRender || 'original' }, entendimiento: { orientacion: entendimiento?.analisis?.orientacion || null, duracionSegundos: entendimiento?.analisis?.duracionSegundos || null, tieneAudio: Boolean(entendimiento?.analisis?.tieneAudio) }, opciones: { ...opciones, plataforma, modo }, archivos: { resumenSalida: nombreResumenSalida, resumenCompatibilidad: 'salida-simple.json' }, creadoEn: new Date().toISOString() };

  await escribirJson(rutaResumenSalida, salida);
  if (rutaResumenCompatibilidad !== rutaResumenSalida) await escribirJson(rutaResumenCompatibilidad, salida);

  return { ...salida, rutaResumenSalida };
}

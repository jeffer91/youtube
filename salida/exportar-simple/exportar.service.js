import fs from 'fs';
import path from 'path';
import { exportarConFfmpeg } from '../../comun/ffmpeg.js';
import { asegurarCarpeta, escribirJson, obtenerRutaRaiz, crearRutaRelativaParaWeb } from '../../comun/archivos.js';
import { reportarModulo } from '../../progreso/progreso-modulo.js';

const PLATAFORMA_PREDETERMINADA = 'tiktok';
const MODO_VIDEO_PREDETERMINADO = 'cuadrado-centro';

function convertirBooleano(valor, respaldo = true) {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'string') {
    const limpio = valor.trim().toLowerCase();
    if (['true', '1', 'si', 'sí', 'yes', 'on', 'activo', 'activado'].includes(limpio)) return true;
    if (['false', '0', 'no', 'off', 'inactivo', 'desactivado'].includes(limpio)) return false;
  }
  return respaldo;
}

function debeExportar(opciones = {}) {
  return convertirBooleano(opciones.exportacion ?? opciones.opcionesProcesamiento?.exportacion, true);
}

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

function crearNombreResumenSalida(modo) {
  return modo === 'cuadrado-centro' ? 'salida-tiktok-cuadrado-centro.json' : 'salida-simple.json';
}

function crearResumenEdicion(edicion) {
  return {
    tipo: edicion?.tipo || null,
    plataforma: edicion?.plataforma || null,
    modo: edicion?.modo || null,
    preset: edicion?.preset?.nombre || edicion?.presetUsado?.nombre || null,
    rutaEdicion: edicion?.rutaEdicion || edicion?.salida?.rutaEdicion || null,
    filtroVideo: edicion?.render?.filtroVideo || null,
    salida: edicion?.salida || null,
    composicion: edicion?.composicion || null,
    videoRender: {
      rutaVideoEntrada: edicion?.render?.rutaVideoEntrada || edicion?.entrada?.rutaVideoRender || null,
      origenVideoEntrada: edicion?.render?.origenVideoEntrada || edicion?.entrada?.origenVideoRender || 'original',
      usarAudioDelVideoRender: Boolean(edicion?.render?.usarAudioDelVideoRender)
    },
    visualDinamico: edicion?.visualDinamico || null,
    sonidos: edicion?.sonidos || null,
    edicionDinamica: edicion?.edicionDinamica || null
  };
}

function crearExportacionOmitida({ entrada, edicion, opciones = {} }) {
  return {
    ok: true,
    etapa: 'salida',
    tipo: 'exportacion-omitida',
    omitido: true,
    exportado: false,
    mensaje: 'Exportación omitida por selección del usuario.',
    plataforma: edicion?.plataforma || opciones.plataforma || entrada?.proyecto?.plataforma || PLATAFORMA_PREDETERMINADA,
    modo: edicion?.modo || opciones.modo || entrada?.proyecto?.modo || MODO_VIDEO_PREDETERMINADO,
    rutaExportada: null,
    rutaRelativa: null,
    nombreExportado: null,
    urlPublica: null,
    audio: { tipo: 'sin-exportacion', omitido: true, mensaje: 'No se generó audio final porque la exportación fue omitida.' },
    edicion: crearResumenEdicion(edicion),
    opciones: { ...opciones, exportacion: false },
    creadoEn: new Date().toISOString()
  };
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
  if (rutaAudioConSonidos && !fs.existsSync(rutaAudioConSonidos)) throw new Error(`No se puede exportar: no existe el audio con sonidos ${rutaAudioConSonidos}`);
}

async function validarArchivoExportado(rutaExportada) {
  let stats = null;
  try {
    stats = await fs.promises.stat(rutaExportada);
  } catch {
    throw new Error(`FFmpeg terminó, pero no se encontró el archivo exportado: ${rutaExportada}`);
  }

  if (!stats.isFile() || stats.size <= 0) {
    throw new Error(`El archivo exportado está vacío o no es válido: ${rutaExportada}`);
  }

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

  return { tipo: 'original', modulo: audio?.tipo || null, omitido: Boolean(audio?.omitido), rutaAudioMejorado: null, nombreAudioMejorado: null, mensaje: audio?.mensaje || 'Se usó el audio original del video.' };
}

export async function exportarVideoSimple({ entrada, entendimiento, audio = null, edicion, opciones = {}, progreso = null }) {
  if (!debeExportar(opciones)) {
    await reportarModulo(progreso, { etapa: 'salida', porcentaje: 92, titulo: 'Exportación omitida', detalle: 'No se llamó a FFmpeg porque Exportar video final está desmarcado.', archivo: 'salida/exportar-simple/exportar.service.js' });
    return crearExportacionOmitida({ entrada, edicion, opciones });
  }

  await reportarModulo(progreso, { etapa: 'salida', porcentaje: 92, titulo: 'Preparando exportación', detalle: 'Validando rutas, audio y filtro final.', archivo: 'salida/exportar-simple/exportar.service.js' });
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

  await reportarModulo(progreso, { etapa: 'salida', porcentaje: 94, titulo: 'Renderizando video', detalle: `FFmpeg está exportando ${nombreExportado}.`, datos: { rutaVideoRender, rutaAudioExterno: rutaAudioExterno || null }, archivo: 'comun/ffmpeg.js' });

  const resultadoFfmpeg = await exportarConFfmpeg({
    rutaEntrada: rutaVideoRender,
    rutaSalida: rutaExportada,
    filtroVideo: edicion.render.filtroVideo,
    rutaAudioExterno,
    codecVideo: edicion.render.codecVideo || 'libx264',
    codecAudio: edicion.render.codecAudio || 'aac',
    crf: edicion.render.crf || 23,
    presetFfmpeg: edicion.render.presetFfmpeg || 'veryfast',
    audioBitrate: edicion.render.audioBitrate || '160k'
  });

  await reportarModulo(progreso, { etapa: 'salida', porcentaje: 98, titulo: 'Validando archivo final', detalle: 'Comprobando que el MP4 exportado exista y no esté vacío.', archivo: 'salida/exportar-simple/exportar.service.js' });
  const stats = await validarArchivoExportado(rutaExportada);
  const resumenAudio = crearResumenAudioExportado({ audio, rutaAudioExterno, edicion });

  const salida = {
    ok: true,
    etapa: 'salida',
    tipo: 'exportar-simple',
    plataforma,
    modo,
    rutaExportada,
    rutaRelativa: crearRutaRelativaParaWeb(rutaExportada),
    nombreExportado,
    urlPublica: crearUrlPublica(nombreExportado),
    pesoBytes: stats.size,
    audio: resumenAudio,
    edicion: crearResumenEdicion(edicion),
    ffmpeg: { audioUsado: resultadoFfmpeg?.audioUsado || resumenAudio.tipo, videoRenderUsado: rutaVideoRender },
    render: { filtroVideo: edicion.render.filtroVideo, codecVideo: edicion.render.codecVideo || 'libx264', codecAudio: edicion.render.codecAudio || 'aac', crf: edicion.render.crf || 23, presetFfmpeg: edicion.render.presetFfmpeg || 'veryfast', audioBitrate: edicion.render.audioBitrate || '160k', pixFmt: edicion.render.pixFmt || 'yuv420p' },
    entrada: { nombreOriginal: entrada.video.nombreOriginal || null, rutaOriginal: entrada.video.rutaOriginal, rutaVideoRender, origenVideoRender: edicion?.render?.origenVideoEntrada || edicion?.entrada?.origenVideoRender || 'original' },
    entendimiento: { orientacion: entendimiento?.analisis?.orientacion || null, duracionSegundos: entendimiento?.analisis?.duracionSegundos || null, tieneAudio: Boolean(entendimiento?.analisis?.tieneAudio) },
    opciones: { ...opciones, plataforma, modo },
    archivos: { resumenSalida: nombreResumenSalida, resumenCompatibilidad: 'salida-simple.json' },
    creadoEn: new Date().toISOString()
  };

  await escribirJson(rutaResumenSalida, salida);
  if (rutaResumenCompatibilidad !== rutaResumenSalida) await escribirJson(rutaResumenCompatibilidad, salida);

  await reportarModulo(progreso, { etapa: 'salida', porcentaje: 99, titulo: 'Archivo final listo', detalle: `${nombreExportado} exportado correctamente · ${(stats.size / (1024 * 1024)).toFixed(1)} MB.`, datos: { nombreExportado, pesoBytes: stats.size, urlPublica: salida.urlPublica }, archivo: 'salida/exportar-simple/exportar.service.js' });

  return { ...salida, rutaResumenSalida };
}

export default { exportarVideoSimple };

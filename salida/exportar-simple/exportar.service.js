import fs from 'fs';
import path from 'path';
import { exportarConFfmpeg } from '../../comun/ffmpeg.js';
import { asegurarCarpeta, escribirJson, obtenerRutaRaiz, crearRutaRelativaParaWeb } from '../../comun/archivos.js';
import { reportarModulo } from '../../progreso/progreso-modulo.js';
import { crearAntesDespues } from '../antes-despues/antes-despues.conexion.js';
import { crearReporteFinalEdicion } from '../reporte-final/reporte-final.service.js';
import { crearPlanAudioExportacionSeguro, crearResumenAudioSeguro } from './audio-exportacion-segura.service.js';

const PLATAFORMA_PREDETERMINADA = 'tiktok';
const MODO_VIDEO_PREDETERMINADO = 'cuadrado-centro';

function obtenerRutaVideoRender({ entrada, edicion }) { return edicion?.render?.rutaVideoEntrada || edicion?.entrada?.rutaVideoRender || entrada?.video?.rutaOriginal || null; }
function obtenerRutaAudioConSonidos(edicion) { return edicion?.render?.rutaAudioConSonidos || edicion?.sonidos?.audioConSonidos || null; }

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

function normalizarTexto(valor, valorPorDefecto) { if (typeof valor !== 'string') return valorPorDefecto; const limpio = valor.trim(); return limpio.length > 0 ? limpio : valorPorDefecto; }
function normalizarModoVideo({ edicion, opciones }) { const modo = normalizarTexto(edicion?.modo || opciones?.modo, MODO_VIDEO_PREDETERMINADO).toLowerCase(); if (['cuadrado-centro', 'tiktok-cuadrado-centro', 'square-center'].includes(modo)) return 'cuadrado-centro'; if (['simple', 'tiktok-simple'].includes(modo)) return 'simple'; return modo; }
function crearUrlPublica(nombreExportado) { return `/exports/${encodeURIComponent(nombreExportado)}`; }

async function validarArchivoExportado(rutaExportada) {
  let stats = null;
  try { stats = await fs.promises.stat(rutaExportada); } catch (_error) { throw new Error(`FFmpeg terminó, pero no se encontró el archivo exportado: ${rutaExportada}`); }
  if (!stats.isFile() || stats.size <= 0) throw new Error(`El archivo exportado está vacío o no es válido: ${rutaExportada}`);
  return stats;
}

function crearNombreResumenSalida(modo) { return modo === 'cuadrado-centro' ? 'salida-tiktok-cuadrado-centro.json' : 'salida-simple.json'; }
function crearResumenEdicion(edicion) { return { tipo: edicion?.tipo || null, plataforma: edicion?.plataforma || null, modo: edicion?.modo || null, preset: edicion?.preset?.nombre || edicion?.presetUsado?.nombre || null, rutaEdicion: edicion?.rutaEdicion || edicion?.salida?.rutaEdicion || null, filtroVideo: edicion?.render?.filtroVideo || null, salida: edicion?.salida || null, composicion: edicion?.composicion || null, videoRender: { rutaVideoEntrada: edicion?.render?.rutaVideoEntrada || edicion?.entrada?.rutaVideoRender || null, origenVideoEntrada: edicion?.render?.origenVideoEntrada || edicion?.entrada?.origenVideoRender || 'original', usarAudioDelVideoRender: Boolean(edicion?.render?.usarAudioDelVideoRender) }, visualDinamico: edicion?.visualDinamico || null, sonidos: edicion?.sonidos || null, edicionDinamica: edicion?.edicionDinamica || null }; }

function obtenerFiltroFallbackVideo(edicion) {
  const principal = edicion?.render?.filtroVideo || '';
  const fallback = edicion?.render?.filtroVideoBase || edicion?.composicion?.filtroVideoBase || '';
  if (!fallback || fallback === principal) return null;
  return fallback;
}

async function exportarConFallbackVisual({ rutaVideoRender, rutaExportada, filtroPrincipal, filtroFallback, planAudio, edicion }) {
  const parametros = { rutaEntrada: rutaVideoRender, rutaSalida: rutaExportada, rutaAudioExterno: planAudio?.rutaAudioExterno || null, filtroAudio: planAudio?.filtroAudioFinal || null, codecVideo: edicion.render.codecVideo || 'libx264', codecAudio: edicion.render.codecAudio || 'aac', crf: edicion.render.crf || 23, presetFfmpeg: edicion.render.presetFfmpeg || 'veryfast', audioBitrate: edicion.render.audioBitrate || '192k' };
  try { const resultado = await exportarConFfmpeg({ ...parametros, filtroVideo: filtroPrincipal }); return { resultado, filtroUsado: filtroPrincipal, fallbackVisualUsado: false, errorPrincipal: null }; }
  catch (errorPrincipal) { if (!filtroFallback) throw errorPrincipal; const resultado = await exportarConFfmpeg({ ...parametros, filtroVideo: filtroFallback }); return { resultado, filtroUsado: filtroFallback, fallbackVisualUsado: true, errorPrincipal: errorPrincipal.message }; }
}

export async function exportarVideoSimple({ entrada, entendimiento, audio = null, transcripcion = null, edicionDinamica = null, edicion, opciones = {}, progreso = null }) {
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
  const filtroFallback = obtenerFiltroFallbackVideo(edicion);
  asegurarCarpeta(carpetaExportados);

  const planAudio = await crearPlanAudioExportacionSeguro({ rutaVideoRender, audio, edicion, entendimiento, opciones });
  await escribirJson(path.join(entrada.rutas.carpetaProyecto, 'audio-exportacion-segura.json'), planAudio);
  await reportarModulo(progreso, { etapa: 'salida', porcentaje: 94, titulo: 'Renderizando video', detalle: `FFmpeg está exportando ${nombreExportado}. Audio: ${planAudio.modo}.`, datos: { rutaVideoRender, rutaAudioExterno: planAudio.rutaAudioExterno || null, audioModo: planAudio.modo, fallbackVisualDisponible: Boolean(filtroFallback), advertenciasAudio: planAudio.advertencias || [] }, archivo: 'comun/ffmpeg.js' });

  const exportacion = await exportarConFallbackVisual({ rutaVideoRender, rutaExportada, filtroPrincipal: edicion.render.filtroVideo, filtroFallback, planAudio, edicion });
  if (exportacion.fallbackVisualUsado) await reportarModulo(progreso, { etapa: 'salida', porcentaje: 96, titulo: 'Render seguro aplicado', detalle: 'El filtro avanzado falló. Se exportó con el filtro base para no detener el video.', datos: { errorPrincipal: exportacion.errorPrincipal }, archivo: 'salida/exportar-simple/exportar.service.js' });

  await reportarModulo(progreso, { etapa: 'salida', porcentaje: 98, titulo: 'Validando archivo final', detalle: 'Comprobando que el MP4 exportado exista y no esté vacío.', archivo: 'salida/exportar-simple/exportar.service.js' });
  const stats = await validarArchivoExportado(rutaExportada);
  const resumenAudio = crearResumenAudioSeguro({ planAudio, audio, edicion });
  const salidaBase = { ok: true, etapa: 'salida', tipo: 'exportar-simple', plataforma, modo, rutaExportada, rutaRelativa: crearRutaRelativaParaWeb(rutaExportada), nombreExportado, urlPublica: crearUrlPublica(nombreExportado), pesoBytes: stats.size, audio: resumenAudio, edicion: crearResumenEdicion(edicion), ffmpeg: { audioUsado: exportacion.resultado?.audioUsado || resumenAudio.tipo, videoRenderUsado: rutaVideoRender, filtroAudioAplicado: Boolean(exportacion.resultado?.filtroAudioAplicado), filtroAudio: exportacion.resultado?.filtroAudio || null, fallbackVisualUsado: exportacion.fallbackVisualUsado, errorFiltroPrincipal: exportacion.errorPrincipal }, render: { filtroVideo: exportacion.filtroUsado, filtroVideoOriginal: edicion.render.filtroVideo, filtroFallbackDisponible: Boolean(filtroFallback), planAudio, codecVideo: edicion.render.codecVideo || 'libx264', codecAudio: edicion.render.codecAudio || 'aac', crf: edicion.render.crf || 23, presetFfmpeg: edicion.render.presetFfmpeg || 'veryfast', audioBitrate: edicion.render.audioBitrate || '192k', pixFmt: edicion.render.pixFmt || 'yuv420p' }, entrada: { nombreOriginal: entrada.video.nombreOriginal || null, rutaOriginal: entrada.video.rutaOriginal, rutaVideoRender, origenVideoRender: edicion?.render?.origenVideoEntrada || edicion?.entrada?.origenVideoRender || 'original' }, entendimiento: { orientacion: entendimiento?.analisis?.orientacion || null, duracionSegundos: entendimiento?.analisis?.duracionSegundos || null, tieneAudio: Boolean(entendimiento?.analisis?.tieneAudio) }, opciones: { ...opciones, plataforma, modo }, archivos: { resumenSalida: nombreResumenSalida, resumenCompatibilidad: 'salida-simple.json', audioExportacionSegura: 'audio-exportacion-segura.json', reporteFinal: 'reporte-final-edicion.json' }, creadoEn: new Date().toISOString() };

  const antesDespues = await crearAntesDespues({ entrada, salida: salidaBase, audio, transcripcion, edicionDinamica, edicion, opciones: { ...opciones, plataforma, modo } });
  const salidaSinReporte = { ...salidaBase, antesDespues };
  const reporteFinal = await crearReporteFinalEdicion({ entrada, entendimiento, audio, transcripcion, edicion, salida: salidaSinReporte, opciones: { ...opciones, plataforma, modo } });
  const salida = { ...salidaSinReporte, reporteFinal };

  await escribirJson(rutaResumenSalida, salida);
  if (rutaResumenCompatibilidad !== rutaResumenSalida) await escribirJson(rutaResumenCompatibilidad, salida);
  await reportarModulo(progreso, { etapa: 'salida', porcentaje: 99, titulo: 'Resultado y reporte listo', detalle: `${nombreExportado} exportado con reporte final de efectos, textos, imágenes, animaciones y audio.`, datos: { nombreExportado, pesoBytes: stats.size, urlPublica: salida.urlPublica, audio: resumenAudio.tipo, antesDespues: Boolean(antesDespues?.ok), fallbackVisualUsado: exportacion.fallbackVisualUsado, reporteFinal: reporteFinal.nombreArchivo }, archivo: 'salida/reporte-final/reporte-final.service.js' });
  return { ...salida, rutaResumenSalida };
}

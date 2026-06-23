import path from 'path';
import { fileURLToPath } from 'url';
import { escribirJson, leerJsonSiExiste, normalizarNombreArchivo } from '../../comun/archivos.js';
import { reportarModulo } from '../../progreso/progreso-modulo.js';
import { aplicarCapasTranscripcion } from '../comun/aplicar-capas-transcripcion.js';
import { procesarVisualDinamico } from '../edicion-dinamica/visual/visual.conexion.js';
import { procesarSonidosEdicion } from '../edicion-dinamica/sonidos/sonidos.conexion.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function obtenerRutaPreset() { return path.resolve(__dirname, '../../biblioteca/tiktok-simple.json'); }
function numeroValido(valor, valorPorDefecto) { const numero = Number(valor); return Number.isFinite(numero) && numero > 0 ? numero : valorPorDefecto; }
function validarPreset(preset) { if (!preset || typeof preset !== 'object') throw new Error('El preset TikTok no es válido o no existe.'); if (!preset.video || typeof preset.video !== 'object') throw new Error('El preset TikTok no tiene configuración de video.'); if (!preset.exportacion || typeof preset.exportacion !== 'object') throw new Error('El preset TikTok no tiene configuración de exportación.'); }

async function leerPresetTikTok() {
  const rutaPreset = obtenerRutaPreset();
  const preset = await leerJsonSiExiste(rutaPreset, null);
  if (!preset) throw new Error(`No se encontró el preset requerido: ${rutaPreset}`);
  validarPreset(preset);
  return { ...preset, video: { ...preset.video, width: numeroValido(preset.video.width, 1080), height: numeroValido(preset.video.height, 1920), fps: numeroValido(preset.video.fps, 30), formato: preset.video.formato || '9:16' }, exportacion: { ...preset.exportacion, contenedor: preset.exportacion.contenedor || 'mp4', codecVideo: preset.exportacion.codecVideo || 'libx264', codecAudio: preset.exportacion.codecAudio || 'aac', crf: numeroValido(preset.exportacion.crf, 23), presetFfmpeg: preset.exportacion.presetFfmpeg || 'veryfast', audioBitrate: preset.exportacion.audioBitrate || '160k' } };
}

function crearFiltroVertical(preset) { return [`scale=${preset.video.width}:${preset.video.height}:force_original_aspect_ratio=increase`, `crop=${preset.video.width}:${preset.video.height}`, `fps=${preset.video.fps}`, 'setsar=1', 'format=yuv420p'].join(','); }

function crearNombreExportado(entrada) {
  const nombreBase = entrada.proyecto?.nombre || entrada.video?.nombreSeguro || 'video';
  const nombreSeguro = normalizarNombreArchivo(nombreBase).replace(/\.[a-z0-9]+$/i, '');
  const fecha = new Date().toISOString().slice(0, 10);
  const idProyecto = entrada.proyecto?.id || Date.now();
  return `${nombreSeguro}-tiktok-${fecha}-${idProyecto}.mp4`;
}

function seleccionarVideoRender(entrada, edicionDinamica) {
  if (edicionDinamica?.activo && !edicionDinamica?.omitido && edicionDinamica?.videoDinamico) return { ruta: edicionDinamica.videoDinamico, origen: 'edicion-dinamica', usarAudioDelVideoRender: true };
  return { ruta: entrada.video.rutaOriginal, origen: 'original', usarAudioDelVideoRender: false };
}

function seleccionarTranscripcionRender(transcripcion, edicionDinamica) { return edicionDinamica?.transcripcionAjustada || transcripcion; }

export async function crearEdicionTikTokSimple({ entrada, entendimiento, audio = null, transcripcion = null, edicionDinamica = null, opciones = {}, progreso = null }) {
  await reportarModulo(progreso, { etapa: 'editar', porcentaje: 77, titulo: 'Leyendo preset simple', detalle: 'Preparando formato vertical 9:16.', archivo: 'editar/tiktok-simple/tiktok.service.js' });
  const preset = await leerPresetTikTok();
  const videoRender = seleccionarVideoRender(entrada, edicionDinamica);
  const transcripcionRender = seleccionarTranscripcionRender(transcripcion, edicionDinamica);
  const filtroVideoBase = crearFiltroVertical(preset);

  await reportarModulo(progreso, { etapa: 'editar', porcentaje: 78, titulo: 'Aplicando subtítulos', detalle: 'Agregando subtítulos y textos flotantes al filtro base.', archivo: 'editar/comun/aplicar-capas-transcripcion.js' });
  const capasTranscripcion = aplicarCapasTranscripcion({ filtroBase: filtroVideoBase, transcripcion: transcripcionRender });

  const visualDinamico = await procesarVisualDinamico({ filtroBase: capasTranscripcion.filtroVideo, edicionDinamica, transcripcion: transcripcionRender, entendimiento, salida: { width: preset.video.width, height: preset.video.height, fps: preset.video.fps }, opciones, progreso });
  const sonidos = await procesarSonidosEdicion({ rutaVideoBase: videoRender.ruta, visualDinamico, edicionDinamica, opciones, progreso });

  const nombreExportado = crearNombreExportado(entrada);
  const rutaEdicion = path.join(entrada.rutas.carpetaProyecto, 'edicion-tiktok-simple.json');
  const edicion = { ok: true, etapa: 'editar', tipo: 'tiktok-simple', plataforma: 'tiktok', modo: 'simple', presetUsado: { nombre: preset.nombre || 'tiktok-simple', descripcion: preset.descripcion || '', plataforma: preset.plataforma || 'tiktok' }, entrada: { rutaVideoOriginal: entrada.video.rutaOriginal, rutaVideoRender: videoRender.ruta, origenVideoRender: videoRender.origen, nombreOriginal: entrada.video.nombreOriginal || null, orientacionDetectada: entendimiento?.analisis?.orientacion || 'desconocida', duracionSegundos: entendimiento?.analisis?.duracionSegundos || null, tieneAudio: Boolean(entendimiento?.analisis?.tieneAudio) }, salida: { nombreExportado, extension: '.mp4', formato: preset.video.formato, width: preset.video.width, height: preset.video.height, fps: preset.video.fps }, render: { rutaVideoEntrada: videoRender.ruta, origenVideoEntrada: videoRender.origen, usarAudioDelVideoRender: videoRender.usarAudioDelVideoRender, rutaAudioConSonidos: sonidos?.audioConSonidos || null, usarAudioConSonidos: Boolean(sonidos?.audioConSonidos && !sonidos?.omitido), filtroVideo: visualDinamico.filtroVideo, filtroVideoBase, codecVideo: preset.exportacion.codecVideo, codecAudio: preset.exportacion.codecAudio, crf: preset.exportacion.crf, presetFfmpeg: preset.exportacion.presetFfmpeg, audioBitrate: preset.exportacion.audioBitrate }, transcripcion: { capasAplicadas: Boolean(capasTranscripcion.aplicadas), mensaje: capasTranscripcion.mensaje, capasVideo: capasTranscripcion.capasVideo, ajustadaPorEdicionDinamica: Boolean(edicionDinamica?.transcripcionAjustada) }, visualDinamico, sonidos, opciones: { ...opciones, audioRecibido: Boolean(audio) }, notas: ['Edición simple: convierte el video a formato vertical 9:16.', videoRender.origen === 'edicion-dinamica' ? 'Se usa el video sin silencios generado por edición dinámica.' : 'Se usa el video original.', capasTranscripcion.aplicadas ? 'Se aplicaron subtítulos y/o textos flotantes.' : 'No se aplicaron capas de transcripción.', visualDinamico.omitido ? 'Visual dinámico omitido.' : 'Visual dinámico aplicado.', sonidos?.omitido ? 'Efectos de sonido omitidos.' : 'Efectos de sonido aplicados.'], creadoEn: new Date().toISOString() };

  await escribirJson(rutaEdicion, edicion);
  await reportarModulo(progreso, { etapa: 'editar', porcentaje: 91, titulo: 'Edición simple lista', detalle: `Filtro preparado · visuales: ${visualDinamico.omitido ? 'no' : 'sí'} · sonidos: ${sonidos?.omitido ? 'no' : 'sí'}.`, archivo: 'editar/tiktok-simple/tiktok.service.js' });
  return { ...edicion, rutaEdicion };
}

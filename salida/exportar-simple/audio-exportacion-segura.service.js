/*
  Nueva etapa estructural - Bloque 4
  Función: decidir qué audio usar en la salida final sin desfasar ni agregar ruido artificial.
*/

import fs from 'fs';
import path from 'path';
import { obtenerDuracionMediaFfmpeg } from '../../comun/ffmpeg.js';

function existe(ruta) { return Boolean(ruta && typeof ruta === 'string' && fs.existsSync(ruta)); }
function segundos(valor) { const n = Number(valor); return Number.isFinite(n) ? n : null; }
function obtenerRutaAudioConSonidos(edicion) { return edicion?.render?.rutaAudioConSonidos || edicion?.sonidos?.audioConSonidos || null; }
function obtenerRutaAudioMejorado(audio) { return audio?.usarAudioMejorado && existe(audio?.rutaAudioMejorado) ? audio.rutaAudioMejorado : null; }

function audioForzado(opciones = {}) {
  return opciones.usarAudioMejoradoEnSalida === true || opciones.forzarAudioMejorado === true || opciones.usarAudioProcesadoFinal === true;
}

function preservarOriginal(opciones = {}) {
  return opciones.preservarAudioOriginal !== false && !audioForzado(opciones);
}

async function compararDuraciones(rutaVideo, rutaAudio) {
  if (!rutaAudio) return { ok: true, diferencia: null, video: null, audio: null, mensaje: 'Sin audio externo.' };
  const video = await obtenerDuracionMediaFfmpeg(rutaVideo);
  const audio = await obtenerDuracionMediaFfmpeg(rutaAudio);
  const duracionVideo = segundos(video.duracionSegundos);
  const duracionAudio = segundos(audio.duracionSegundos);
  if (duracionVideo === null || duracionAudio === null) return { ok: false, diferencia: null, video, audio, mensaje: 'No se pudo medir duración para validar sincronía.' };
  const diferencia = Math.abs(duracionVideo - duracionAudio);
  return { ok: diferencia <= 0.45, diferencia, video, audio, mensaje: diferencia <= 0.45 ? 'Duraciones compatibles.' : `Duraciones diferentes: video ${duracionVideo.toFixed(2)}s vs audio ${duracionAudio.toFixed(2)}s.` };
}

export async function crearPlanAudioExportacionSeguro({ rutaVideoRender, audio = null, edicion = null, entendimiento = null, opciones = {} } = {}) {
  const rutaAudioConSonidos = obtenerRutaAudioConSonidos(edicion);
  const rutaAudioMejorado = obtenerRutaAudioMejorado(audio);
  const videoDinamico = Boolean(edicion?.render?.usarAudioDelVideoRender || edicion?.render?.origenVideoEntrada === 'edicion-dinamica');
  const plan = {
    ok: true,
    modo: 'audio-original-seguro',
    rutaAudioExterno: null,
    filtroAudioFinal: null,
    preservarSinProcesar: true,
    motivo: 'Se conserva el audio del video render para evitar ruido nuevo o desfase.',
    validacionSincronia: null,
    advertencias: [],
    datos: { videoDinamico, tieneAudio: Boolean(entendimiento?.analisis?.tieneAudio), rutaAudioConSonidos, rutaAudioMejorado }
  };

  if (!entendimiento?.analisis?.tieneAudio) {
    return { ...plan, modo: 'sin-audio-detectado', motivo: 'El video no tiene audio detectable.' };
  }

  if (rutaAudioConSonidos && existe(rutaAudioConSonidos)) {
    const validacion = await compararDuraciones(rutaVideoRender, rutaAudioConSonidos);
    if (validacion.ok) return { ...plan, modo: 'audio-con-sonidos-sincronizado', rutaAudioExterno: rutaAudioConSonidos, preservarSinProcesar: false, motivo: 'Se usa audio con sonidos porque su duración coincide con el video render.', validacionSincronia: validacion };
    return { ...plan, validacionSincronia: validacion, advertencias: [`Audio con sonidos omitido por sincronía: ${validacion.mensaje}`] };
  }

  if (videoDinamico) {
    return { ...plan, modo: 'audio-video-dinamico-original', motivo: 'El video ya fue editado/cortado; se conserva su propio audio para evitar desfase.' };
  }

  if (rutaAudioMejorado && audioForzado(opciones)) {
    const validacion = await compararDuraciones(rutaVideoRender, rutaAudioMejorado);
    if (validacion.ok) return { ...plan, modo: 'audio-mejorado-forzado-sincronizado', rutaAudioExterno: rutaAudioMejorado, preservarSinProcesar: false, motivo: 'Se usa audio mejorado porque fue solicitado y está sincronizado.', validacionSincronia: validacion };
    return { ...plan, validacionSincronia: validacion, advertencias: [`Audio mejorado omitido por sincronía: ${validacion.mensaje}`] };
  }

  if (rutaAudioMejorado && !preservarOriginal(opciones)) {
    const validacion = await compararDuraciones(rutaVideoRender, rutaAudioMejorado);
    if (validacion.ok) return { ...plan, modo: 'audio-mejorado-sincronizado', rutaAudioExterno: rutaAudioMejorado, preservarSinProcesar: false, motivo: 'Se usa audio mejorado porque la opción de preservar original está desactivada.', validacionSincronia: validacion };
    return { ...plan, validacionSincronia: validacion, advertencias: [`Audio mejorado omitido por sincronía: ${validacion.mensaje}`] };
  }

  return plan;
}

export function crearResumenAudioSeguro({ planAudio, audio = null, edicion = null } = {}) {
  const rutaAudioConSonidos = obtenerRutaAudioConSonidos(edicion);
  if (planAudio?.rutaAudioExterno === rutaAudioConSonidos) return { tipo: 'sonidos-edicion-sincronizados', modulo: 'audio-exportacion-segura', omitido: false, rutaAudioMejorado: planAudio.rutaAudioExterno, nombreAudioMejorado: path.basename(planAudio.rutaAudioExterno), filtroAudioFinal: null, mensaje: planAudio.motivo, planAudio };
  if (planAudio?.rutaAudioExterno) return { tipo: 'audio-externo-sincronizado', modulo: audio?.tipo || 'audio-exportacion-segura', omitido: false, rutaAudioMejorado: planAudio.rutaAudioExterno, nombreAudioMejorado: path.basename(planAudio.rutaAudioExterno), filtroAudioFinal: null, mensaje: planAudio.motivo, planAudio };
  return { tipo: planAudio?.modo || 'audio-original-seguro', modulo: 'audio-exportacion-segura', omitido: Boolean(audio?.omitido), rutaAudioMejorado: null, nombreAudioMejorado: null, filtroAudioFinal: null, mensaje: planAudio?.motivo || 'Se conserva audio original.', planAudio };
}

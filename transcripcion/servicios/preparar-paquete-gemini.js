import { TRANSCRIPCION_CONFIG, limitarNumero, normalizarTexto, obtenerConfigTranscripcion } from '../transcripcion.config.js';
import { normalizarSegmentos } from './normalizar-segmentos.js';

function recortarTexto(texto, maxCaracteres) {
  const limpio = normalizarTexto(texto, '');
  return limpio.length <= maxCaracteres ? limpio : `${limpio.slice(0, maxCaracteres).trim()}...`;
}

function datosVideo(entrada, entendimiento) {
  const a = entendimiento?.analisis || {};
  return {
    nombreOriginal: entrada?.video?.nombreOriginal || null,
    proyectoId: entrada?.proyecto?.id || null,
    plataforma: entrada?.proyecto?.plataforma || 'tiktok',
    modo: entrada?.proyecto?.modo || null,
    duracionSegundos: a.duracionSegundos || null,
    orientacion: a.orientacion || null,
    width: a.width || a.ancho || null,
    height: a.height || a.alto || null,
    tieneAudio: Boolean(a.tieneAudio),
    codecAudio: a.codecAudio || null
  };
}

function resumenAudio(audio) {
  if (!audio || typeof audio !== 'object') return { disponible: false, tipo: 'desconocido', mensaje: 'Sin resultado de audio.' };
  return { disponible: audio.ok === true, tipo: audio.tipo || null, omitido: Boolean(audio.omitido), usarAudioMejorado: Boolean(audio.usarAudioMejorado), mensaje: audio.mensaje || null };
}

function segmentosParaAnalisis(segmentos, config) {
  const maxSegmentos = limitarNumero(config.gemini?.maxSegmentos || 220, 20, 500, 220);
  return normalizarSegmentos(segmentos, { config }).slice(0, maxSegmentos).map((s) => ({ id: s.id, inicio: s.inicio, fin: s.fin, texto: s.texto }));
}

export function prepararPaqueteGemini({ entrada, entendimiento, audio, transcripcion, subtitulos = null, opciones = {} } = {}) {
  const config = obtenerConfigTranscripcion(opciones);
  const segmentos = segmentosParaAnalisis(transcripcion?.segmentos || [], config);
  const maxTexto = limitarNumero(config.transcripcion.maxCaracteresTextoCompleto, 1000, 50000, 18000);
  return {
    ok: true,
    tipo: 'paquete-transcripcion',
    version: config.version,
    datosVideo: datosVideo(entrada, entendimiento),
    audio: resumenAudio(audio),
    transcripcion: {
      idioma: transcripcion?.idioma || config.transcripcion.idioma,
      fuente: transcripcion?.fuente || null,
      textoCompleto: recortarTexto(transcripcion?.textoCompleto || '', maxTexto),
      cantidadSegmentos: segmentos.length,
      segmentos
    },
    subtitulos: subtitulos ? { generados: subtitulos.ok === true && subtitulos.omitido !== true, estilo: subtitulos.estilo || config.subtitulos.estilo, segmentosUsados: subtitulos.segmentosUsados || 0 } : null,
    guiaUsuario: {
      texto: normalizarTexto(config.gemini.guiaUsuario, 'Detecta ideas importantes y crea textos flotantes breves.'),
      idioma: config.transcripcion.idioma,
      cantidadMaximaTextos: config.gemini.cantidadMaximaTextos,
      duracionMinima: config.textosFlotantes.duracionMinima,
      duracionMaxima: config.textosFlotantes.duracionMaxima,
      estiloPredeterminado: config.textosFlotantes.estiloPredeterminado,
      posicionPredeterminada: config.textosFlotantes.posicionPredeterminada
    },
    reglasRespuesta: { devolverSoloJson: true, usarTiemposDeSegmentos: true, textoCorto: true },
    creadoEn: new Date().toISOString()
  };
}

export default prepararPaqueteGemini;

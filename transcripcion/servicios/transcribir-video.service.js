import { obtenerConfigTranscripcion, MODOS_TRANSCRIPCION, normalizarTexto } from '../transcripcion.config.js';
import { resolverFuenteAudioTranscripcion } from './extraer-audio-transcripcion.service.js';
import { crearTranscripcionNormalizada } from './normalizar-segmentos.js';
import { transcribirConGemini } from './transcribir-gemini.service.js';

function obtenerTextoManual(opciones = {}, config) {
  return normalizarTexto(opciones.textoTranscripcionManual || opciones.transcripcionManual || opciones.textoManual || config.transcripcion.textoManualPorDefecto || '', '');
}

function obtenerSegmentosManual(opciones = {}) {
  if (Array.isArray(opciones.segmentosTranscripcion)) return opciones.segmentosTranscripcion;
  if (Array.isArray(opciones.transcripcionSegmentos)) return opciones.transcripcionSegmentos;
  return [];
}

function transcripcionVacia({ entrada, fuenteAudio, config, motivo }) {
  return { ok: true, omitido: true, etapa: 'transcripcion', fuente: 'sin-transcripcion-real', idioma: config.transcripcion.idioma, textoCompleto: '', segmentos: [], cantidadSegmentos: 0, duracionSegundos: null, fuenteAudio, proyectoId: entrada?.proyecto?.id || null, mensaje: motivo, creadoEn: new Date().toISOString() };
}

export async function transcribirVideo({ entrada, entendimiento, audio = null, opciones = {} } = {}) {
  const config = obtenerConfigTranscripcion(opciones);
  if (!config.transcripcion.crearTranscripcion) return transcripcionVacia({ entrada, fuenteAudio: null, config, motivo: 'La transcripción está desactivada.' });
  const fuenteAudio = resolverFuenteAudioTranscripcion({ entrada, audio, opciones: { usarAudioMejoradoSiExiste: config.transcripcion.usarAudioMejoradoSiExiste } });
  if (!fuenteAudio.ok) return transcripcionVacia({ entrada, fuenteAudio, config, motivo: fuenteAudio.mensaje });

  const textoManual = obtenerTextoManual(opciones, config);
  const segmentosManuales = obtenerSegmentosManual(opciones);
  if (textoManual || segmentosManuales.length > 0) {
    const transcripcion = crearTranscripcionNormalizada({ textoCompleto: textoManual, segmentos: segmentosManuales, idioma: config.transcripcion.idioma, fuente: 'manual', duracionSegundos: entendimiento?.analisis?.duracionSegundos || null, opciones: { config } });
    return { ...transcripcion, ok: true, omitido: false, etapa: 'transcripcion', fuenteAudio, proyectoId: entrada?.proyecto?.id || null, mensaje: 'Transcripción manual normalizada correctamente.' };
  }

  if (config.gemini.usarGemini && config.gemini.credencial) {
    try {
      const transcripcionGemini = await transcribirConGemini({ entrada, entendimiento, fuenteAudio, opciones });
      if (transcripcionGemini?.ok && !transcripcionGemini.omitido && transcripcionGemini.textoCompleto) return transcripcionGemini;
      if (!config.gemini.permitirFallbackLocal) return transcripcionGemini;
    } catch (error) {
      if (!config.gemini.permitirFallbackLocal) throw error;
      return transcripcionVacia({ entrada, fuenteAudio, config, motivo: `Gemini no pudo transcribir y se usó fallback controlado: ${error.message}` });
    }
  }

  if (config.transcripcion.modoTranscripcion === MODOS_TRANSCRIPCION.MANUAL) return transcripcionVacia({ entrada, fuenteAudio, config, motivo: 'Modo manual activo, pero no se recibió texto manual de transcripción.' });
  return transcripcionVacia({ entrada, fuenteAudio, config, motivo: `Modo ${config.transcripcion.modoTranscripcion} preparado, pero todavía no tiene motor real conectado.` });
}

export default transcribirVideo;

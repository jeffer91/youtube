export function obtenerResumenAudio(datos, mejorarAudioActivo = false) {
  const audioFinal = datos.resultado?.audio;
  const audioModulo = datos.audio;
  if (audioFinal?.tipo === 'mejorado') return 'Audio final: mejorado con limpieza de ruido, normalización y claridad de voz.';
  if (audioModulo?.omitido) return `Audio final: original. ${audioModulo.mensaje || 'La mejora de audio fue omitida.'}`;
  if (mejorarAudioActivo) return 'Audio final: original. No se recibió una pista mejorada desde el módulo de audio.';
  return 'Audio final: original. La mejora de audio estaba desactivada.';
}

export function obtenerResumenTranscripcion(datos) {
  const transcripcion = datos.transcripcion;
  if (!transcripcion) return 'Transcripción: no se recibió información del módulo.';
  if (transcripcion.omitido) return `Transcripción: omitida. ${transcripcion.mensaje || ''}`.trim();
  const segmentos = transcripcion.transcripcion?.cantidadSegmentos || 0;
  const subtitulos = transcripcion.capasVideo?.usarSubtitulos ? 'sí' : 'no';
  const textos = transcripcion.textosFlotantes?.cantidad || 0;
  const origen = transcripcion.fallback?.ok ? 'fallback local' : transcripcion.gemini?.ok && !transcripcion.gemini?.omitido ? 'Gemini' : 'sin análisis externo';
  return `Transcripción: ${segmentos} segmentos · Subtítulos: ${subtitulos} · Textos flotantes: ${textos} · Origen: ${origen}.`;
}

export default { obtenerResumenAudio, obtenerResumenTranscripcion };

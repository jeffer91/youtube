export function obtenerResumenAudio(datos, mejorarAudioActivo = false) {
  const audioFinal = datos.resultado?.audio;
  const audioModulo = datos.audio;

  if (audioFinal?.tipo === 'sonidos-edicion') return 'Audio final: voz sincronizada con efectos de sonido suaves.';
  if (audioFinal?.tipo === 'video-render') return 'Audio final: se usó el audio del video dinámico para mantener sincronía.';
  if (audioFinal?.tipo === 'mejorado') return 'Audio final: mejorado con limpieza de ruido, normalización y claridad de voz.';
  if (audioModulo?.omitido) return `Audio final: original. ${audioModulo.mensaje || 'La mejora de audio fue omitida.'}`;
  if (mejorarAudioActivo) return 'Audio final: original. No se recibió una pista mejorada desde el módulo de audio.';
  return 'Audio final: original. La mejora de audio estaba desactivada.';
}

export function obtenerResumenTranscripcion(datos) {
  const transcripcion = datos.transcripcion;
  const edicion = datos.edicion;
  if (!transcripcion) return 'Subtítulos/textos: no se recibió información del módulo.';
  if (transcripcion.omitido) return `Subtítulos/textos: omitidos. ${transcripcion.mensaje || ''}`.trim();
  const segmentos = transcripcion.transcripcion?.cantidadSegmentos || 0;
  const subtitulos = edicion?.transcripcion?.capasAplicadas || transcripcion.capasVideo?.usarSubtitulos ? 'sí' : 'no';
  const textos = transcripcion.textosFlotantes?.cantidad || edicion?.visualDinamico?.eventosVisuales?.length || 0;
  const origen = transcripcion.fallback?.ok ? 'fallback local' : transcripcion.gemini?.ok && !transcripcion.gemini?.omitido ? 'Gemini' : 'automático/local';
  return `Subtítulos/textos: ${segmentos} segmentos · Subtítulos: ${subtitulos} · Textos/eventos: ${textos} · Origen: ${origen}.`;
}

export default { obtenerResumenAudio, obtenerResumenTranscripcion };

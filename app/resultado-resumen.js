/*
  Nombre completo: resultado-resumen.js
  Ruta: /app/resultado-resumen.js

  Función:
  - Crear resúmenes simples del audio, transcripción, subtítulos y textos.
  - Incluir porcentajes de ejecución e impacto cuando existan.
*/

function opcionActiva(datos = {}, clave, respaldo = false) {
  const opciones = datos.opcionesProcesamiento || {};
  if (typeof opciones[clave] === 'boolean') return opciones[clave];
  return respaldo;
}

function textoLimpio(valor) { if (valor === null || valor === undefined) return ''; return String(valor).trim(); }
function formatoImpacto(modulo) { if (!modulo) return ''; return ` Ejecutado ${modulo.ejecutado ?? 0}% · impacto ${modulo.impacto ?? 0}%.`; }

export function obtenerResumenAudio(datos = {}, mejorarAudioActivo = false) {
  const audioFinal = datos.resultado?.audio;
  const audioModulo = datos.audio;
  const audioImpacto = datos.reporteImpacto?.modulos?.audio || audioModulo?.impactoAudio;
  const audioActivadoPorChecklist = opcionActiva(datos, 'mejorarAudio', mejorarAudioActivo);

  if (!audioActivadoPorChecklist) return `Audio final: mejora de audio omitida por selección del usuario.${formatoImpacto(audioImpacto)}`;
  if (audioFinal?.tipo === 'sonidos-edicion') return `Audio final: voz sincronizada con efectos de sonido suaves.${formatoImpacto(audioImpacto)}`;
  if (audioFinal?.tipo === 'video-render') return `Audio final: se usó el audio del video dinámico para mantener sincronía.${formatoImpacto(audioImpacto)}`;
  if (audioFinal?.tipo === 'mejorado') return `Audio final: mejorado con limpieza de ruido, normalización y claridad de voz.${formatoImpacto(audioImpacto)}`;
  if (audioModulo?.omitido) return `Audio final: original. ${audioModulo.mensaje || 'La mejora de audio fue omitida.'}${formatoImpacto(audioImpacto)}`.trim();
  if (mejorarAudioActivo) return `Audio final: original. No se recibió una pista mejorada desde el módulo de audio.${formatoImpacto(audioImpacto)}`;
  return `Audio final: original.${formatoImpacto(audioImpacto)}`;
}

export function obtenerResumenTranscripcion(datos = {}) {
  const transcripcion = datos.transcripcion;
  const edicion = datos.edicion;
  const transcripcionActiva = opcionActiva(datos, 'transcripcion', true);
  const subtitulosActivos = opcionActiva(datos, 'subtitulos', true);
  const textosActivos = opcionActiva(datos, 'textosFlotantes', true);
  const mTrans = datos.reporteImpacto?.modulos?.transcripcion;
  const mSub = datos.reporteImpacto?.modulos?.subtitulos;
  const mTextos = datos.reporteImpacto?.modulos?.textosFlotantes;

  if (!transcripcionActiva) return `Subtítulos/textos: transcripción omitida por selección del usuario.${formatoImpacto(mTrans)}`;
  if (!transcripcion) return 'Subtítulos/textos: no se recibió información del módulo.';
  if (transcripcion.omitido) return `Subtítulos/textos: omitidos. ${textoLimpio(transcripcion.mensaje)}${formatoImpacto(mTrans)}`.trim();

  const segmentos = transcripcion.transcripcion?.cantidadSegmentos || 0;
  const subtitulos = subtitulosActivos ? (edicion?.transcripcion?.capasAplicadas || transcripcion.capasVideo?.usarSubtitulos ? 'sí' : 'no') : 'omitidos';
  const textos = textosActivos ? (transcripcion.textosFlotantes?.cantidad || edicion?.visualDinamico?.eventosVisuales?.length || 0) : 'omitidos';
  let origen = 'automático/local';
  if (!textosActivos) origen = 'textos omitidos';
  else if (transcripcion.fallback?.ok) origen = 'fallback local';
  else if (transcripcion.gemini?.ok && !transcripcion.gemini?.omitido) origen = 'Gemini';

  return `Subtítulos/textos: ${segmentos} segmentos · Subtítulos: ${subtitulos}${formatoImpacto(mSub)} Textos/eventos: ${textos}${formatoImpacto(mTextos)} Origen: ${origen}.`;
}

export function obtenerResumenProcesamiento(datos = {}) {
  const resumen = datos.resumenProcesamiento;
  const detalle = datos.detalleProcesamiento;
  if (resumen?.texto) return resumen.texto;
  const procesadas = detalle?.procesadas || [];
  const omitidas = detalle?.omitidas || [];
  if (!procesadas.length && !omitidas.length) return 'Procesamiento: no se recibió resumen del checklist.';
  const partes = [];
  if (procesadas.length) partes.push(`Procesadas: ${procesadas.map((item) => item.etiqueta || item.clave).join(', ')}.`);
  if (omitidas.length) partes.push(`Omitidas: ${omitidas.map((item) => item.etiqueta || item.clave).join(', ')}.`);
  return partes.join(' ');
}

export default { obtenerResumenAudio, obtenerResumenTranscripcion, obtenerResumenProcesamiento };

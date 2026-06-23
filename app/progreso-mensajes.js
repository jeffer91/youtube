export function crearMensajesProceso({ mejorarAudio, crearTranscripcion, agregarSubtitulos, agregarTextosFlotantes, usarGemini } = {}) {
  const mensajes = ['Subiendo video al motor modular.', 'Analizando video y preparando edición.'];
  if (mejorarAudio) mensajes.push('Limpiando audio y mejorando claridad de voz.');
  if (crearTranscripcion) mensajes.push('Preparando transcripción del video.');
  if (agregarSubtitulos) mensajes.push('Generando subtítulos visuales.');
  if (usarGemini) mensajes.push('Analizando puntos importantes con Gemini.');
  if (agregarTextosFlotantes) mensajes.push('Creando textos flotantes para el video.');
  mensajes.push(mejorarAudio ? 'Exportando video con audio mejorado.' : 'Exportando video con audio original.');
  return mensajes;
}

export default crearMensajesProceso;

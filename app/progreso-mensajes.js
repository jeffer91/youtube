export function crearMensajesProceso({ mejorarAudio, crearTranscripcion, agregarSubtitulos, agregarTextosFlotantes, usarGemini, edicionDinamica, agregarSonidosEdicion } = {}) {
  const mensajes = [
    'Subiendo video al motor automático.',
    'Analizando video y preparando edición.'
  ];

  if (mejorarAudio) mensajes.push('Limpiando audio y mejorando claridad de voz.');
  if (crearTranscripcion) mensajes.push('Preparando transcripción y subtítulos cuando haya datos disponibles.');
  if (edicionDinamica) mensajes.push('Detectando silencios y creando cortes automáticos.');
  if (edicionDinamica) mensajes.push('Ajustando tiempos para que textos y subtítulos no se desfasen.');
  if (usarGemini) mensajes.push('Analizando puntos importantes con Gemini.');
  if (agregarSubtitulos || agregarTextosFlotantes) mensajes.push('Agregando subtítulos, textos y elementos visuales.');
  if (agregarSonidosEdicion) mensajes.push('Agregando sonidos suaves sin tapar la voz.');
  mensajes.push('Exportando video final automáticamente.');

  return mensajes;
}

export default crearMensajesProceso;

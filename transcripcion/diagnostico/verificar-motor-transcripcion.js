import { MODOS_TRANSCRIPCION, obtenerConfigTranscripcion, normalizarTexto } from '../transcripcion.config.js';

export function verificarMotorTranscripcion(opciones = {}) {
  const config = obtenerConfigTranscripcion(opciones);
  const modo = config.transcripcion.modoTranscripcion;
  const textoManual = normalizarTexto(opciones.textoTranscripcionManual || opciones.transcripcionManual || opciones.textoManual || '', '');
  const resultado = { ok: true, modo, disponible: false, necesitaAccionUsuario: false, mensaje: '', recomendaciones: [] };
  if (!config.transcripcion.crearTranscripcion) {
    resultado.disponible = false;
    resultado.mensaje = 'La transcripción está desactivada.';
    return resultado;
  }
  if (modo === MODOS_TRANSCRIPCION.MANUAL) {
    resultado.disponible = textoManual.length > 0;
    resultado.necesitaAccionUsuario = textoManual.length === 0;
    resultado.mensaje = textoManual.length > 0 ? 'Hay transcripción manual para procesar.' : 'Modo manual activo, pero falta pegar la transcripción.';
    if (!resultado.disponible) resultado.recomendaciones.push('Pega la transcripción manual en la interfaz.');
    return resultado;
  }
  if (modo === MODOS_TRANSCRIPCION.WHISPER_LOCAL) {
    resultado.disponible = true;
    resultado.mensaje = 'Modo Whisper local seleccionado. Requiere tener Whisper instalado en la computadora.';
    resultado.recomendaciones.push('Instala Whisper localmente si todavía no está disponible.');
    return resultado;
  }
  if (modo === MODOS_TRANSCRIPCION.API) {
    resultado.disponible = false;
    resultado.necesitaAccionUsuario = true;
    resultado.mensaje = 'Modo API reservado para una conexión futura.';
    resultado.recomendaciones.push('Configurar proveedor de transcripción por API.');
    return resultado;
  }
  resultado.mensaje = `Modo de transcripción no reconocido: ${modo}`;
  resultado.ok = false;
  return resultado;
}

export default verificarMotorTranscripcion;

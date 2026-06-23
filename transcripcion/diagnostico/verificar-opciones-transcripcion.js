import { obtenerConfigTranscripcion } from '../transcripcion.config.js';

export function verificarOpcionesTranscripcion(opciones = {}) {
  const config = obtenerConfigTranscripcion(opciones);
  const advertencias = [];
  const errores = [];
  if (!config.transcripcion.crearTranscripcion) advertencias.push('La transcripción está desactivada.');
  if (config.subtitulos.agregarSubtitulos && !config.transcripcion.crearTranscripcion) advertencias.push('Los subtítulos están activos, pero la transcripción está desactivada.');
  if (config.textosFlotantes.agregarTextosFlotantes && !config.transcripcion.crearTranscripcion) advertencias.push('Los textos flotantes están activos, pero la transcripción está desactivada.');
  if (config.gemini.usarGemini && !config.gemini.credencial) advertencias.push('Gemini está activo, pero no se recibió credencial.');
  if (config.gemini.cantidadMaximaTextos < 1 || config.gemini.cantidadMaximaTextos > 12) errores.push('La cantidad máxima de textos Gemini debe estar entre 1 y 12.');
  if (config.textosFlotantes.cantidadMaxima < 1 || config.textosFlotantes.cantidadMaxima > 12) errores.push('La cantidad máxima de textos flotantes debe estar entre 1 y 12.');
  return { ok: errores.length === 0, advertencias, errores, resumen: { crearTranscripcion: config.transcripcion.crearTranscripcion, modoTranscripcion: config.transcripcion.modoTranscripcion, agregarSubtitulos: config.subtitulos.agregarSubtitulos, agregarTextosFlotantes: config.textosFlotantes.agregarTextosFlotantes, usarGemini: config.gemini.usarGemini, permitirFallbackLocal: config.gemini.permitirFallbackLocal, cantidadMaximaTextos: config.textosFlotantes.cantidadMaxima } };
}

export default verificarOpcionesTranscripcion;

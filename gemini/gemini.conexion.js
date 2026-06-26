/*
  Modulo: gemini
  Funcion: punto unico de conexion para inteligencia de edicion con Gemini.
*/

export { GEMINI_CONFIG, obtenerConfigGemini } from './gemini.config.js';
export { validarRespuestaGemini, extraerJsonSeguro, crearRespuestaFallback } from './validar-respuesta-gemini.service.js';
export { prepararAnalisisTranscripcion, crearAnalisisTranscripcionFallback } from './analizar-transcripcion.service.js';
export { prepararSugerenciaRecursos, crearSugerenciasRecursosFallback } from './sugerir-recursos.service.js';
export { prepararSugerenciaTextos, crearTextosFallback } from './sugerir-textos.service.js';
export { prepararSugerenciaGraficos, crearGraficosFallback } from './sugerir-graficos.service.js';
export { prepararSugerenciaEstiloEdicion, crearEstiloEdicionFallback } from './sugerir-estilo-edicion.service.js';

export function crearPaqueteGeminiEdicion({ proyecto = {}, perfil = {}, transcripcion = {}, analisis = null, biblioteca = [], plataformas = [], opciones = {} } = {}) {
  const analisisBase = analisis || crearAnalisisTranscripcionFallback({ transcripcion, perfil: perfil.id || proyecto.perfil || 'general' });
  return {
    ok: true,
    proyectoId: proyecto.id || null,
    perfil: perfil.id || proyecto.perfil || 'general',
    tareas: {
      analisis: prepararAnalisisTranscripcion({ transcripcion, perfil, proyecto, opciones }),
      recursos: prepararSugerenciaRecursos({ analisis: analisisBase, perfil, biblioteca, opciones }),
      textos: prepararSugerenciaTextos({ transcripcion, analisis: analisisBase, perfil, plataforma: plataformas[0] || 'tiktok', opciones }),
      graficos: prepararSugerenciaGraficos({ analisis: analisisBase, perfil, opciones }),
      estilo: prepararSugerenciaEstiloEdicion({ perfil, proyecto, plataformas, analisis: analisisBase, opciones })
    },
    creadoEn: new Date().toISOString()
  };
}

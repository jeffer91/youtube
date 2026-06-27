/*
  Modulo: gemini
  Funcion: punto unico de conexion para inteligencia de edicion con Gemini.
*/

import { GEMINI_CONFIG, obtenerConfigGemini } from './gemini.config.js';
import { GEMINI_INSTRUCCIONES_PERFIL, obtenerInstruccionesPerfilGemini, construirBloquePerfilGemini } from './perfiles-gemini.config.js';
import { validarRespuestaGemini, extraerJsonSeguro, crearRespuestaFallback } from './validar-respuesta-gemini.service.js';
import { prepararAnalisisTranscripcion, crearAnalisisTranscripcionFallback } from './analizar-transcripcion.service.js';
import { prepararSugerenciaRecursos, crearSugerenciasRecursosFallback } from './sugerir-recursos.service.js';
import { prepararSugerenciaTextos, crearTextosFallback } from './sugerir-textos.service.js';
import { prepararSugerenciaGraficos, crearGraficosFallback } from './sugerir-graficos.service.js';
import { prepararSugerenciaEstiloEdicion, crearEstiloEdicionFallback } from './sugerir-estilo-edicion.service.js';
import { ejecutarTareaGeminiReal } from './cliente-gemini.service.js';
import { ejecutarPaqueteGeminiEdicion } from './ejecutar-paquete-gemini.service.js';

export {
  GEMINI_CONFIG,
  obtenerConfigGemini,
  GEMINI_INSTRUCCIONES_PERFIL,
  obtenerInstruccionesPerfilGemini,
  construirBloquePerfilGemini,
  validarRespuestaGemini,
  extraerJsonSeguro,
  crearRespuestaFallback,
  prepararAnalisisTranscripcion,
  crearAnalisisTranscripcionFallback,
  prepararSugerenciaRecursos,
  crearSugerenciasRecursosFallback,
  prepararSugerenciaTextos,
  crearTextosFallback,
  prepararSugerenciaGraficos,
  crearGraficosFallback,
  prepararSugerenciaEstiloEdicion,
  crearEstiloEdicionFallback,
  ejecutarTareaGeminiReal,
  ejecutarPaqueteGeminiEdicion
};

export function crearPaqueteGeminiEdicion({ proyecto = {}, perfil = {}, transcripcion = {}, analisis = null, biblioteca = [], plataformas = [], opciones = {} } = {}) {
  const analisisBase = analisis || crearAnalisisTranscripcionFallback({ transcripcion, perfil: perfil.id || proyecto.perfil || 'general' });
  return {
    ok: true,
    proyectoId: proyecto.id || null,
    perfil: perfil.id || proyecto.perfil || 'general',
    perfilNombre: perfil.nombre || 'General',
    modo: opciones.usarGemini ? 'gemini_real_si_credencial' : 'fallback_local',
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

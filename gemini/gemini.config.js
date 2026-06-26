/*
  Modulo: gemini
  Funcion: configuracion central de Gemini para inteligencia de edicion.
*/

export const GEMINI_CONFIG = Object.freeze({
  version: '1.0.0',
  proveedor: 'gemini',
  modeloPorDefecto: 'gemini-1.5-flash',
  temperatura: 0.35,
  maxTokens: 4096,
  usarFallbackLocal: true,
  requiereClaveApi: true,
  tareas: Object.freeze({
    analizarTranscripcion: 'analizar_transcripcion',
    sugerirRecursos: 'sugerir_recursos',
    sugerirTextos: 'sugerir_textos',
    sugerirGraficos: 'sugerir_graficos',
    sugerirEstilo: 'sugerir_estilo_edicion'
  }),
  reglas: Object.freeze([
    'Gemini propone, Produccion aprueba.',
    'No elegir recursos sin fuente ni licencia.',
    'Priorizar biblioteca interna antes de buscar afuera.',
    'No tapar sujeto, rostro ni zonas importantes.',
    'Adaptar la respuesta al perfil de edicion.'
  ])
});

export function obtenerConfigGemini(opciones = {}) {
  return {
    ...GEMINI_CONFIG,
    modelo: opciones.modelo || GEMINI_CONFIG.modeloPorDefecto,
    temperatura: opciones.temperatura ?? GEMINI_CONFIG.temperatura,
    apiKey: opciones.apiKey || process.env.GEMINI_API_KEY || ''
  };
}

import { limitarNumero, normalizarTexto, convertirBooleano, obtenerConfigTranscripcion } from '../transcripcion.config.js';

export const GEMINI_CONFIG = Object.freeze({
  proveedor: 'google-gemini',
  modeloPredeterminado: 'gemini-1.5-flash',
  endpointBase: 'https://generativelanguage.googleapis.com/v1beta',
  timeoutMs: 60000,
  temperatura: 0.35,
  maxOutputTokens: 1200,
  topP: 0.9,
  topK: 40,
  usarFallbackLocal: true
});

export function normalizarCredencialGemini(valor) {
  return normalizarTexto(valor, '');
}

export function tieneCredencialGemini(valor) {
  return normalizarCredencialGemini(valor).length > 0;
}

export function normalizarModeloGemini(modelo) {
  const limpio = normalizarTexto(modelo, GEMINI_CONFIG.modeloPredeterminado);
  if (!/^[a-zA-Z0-9._-]+$/.test(limpio)) return GEMINI_CONFIG.modeloPredeterminado;
  return limpio;
}

export function obtenerConfigGemini(opciones = {}) {
  const configTranscripcion = obtenerConfigTranscripcion(opciones);
  const gemini = configTranscripcion.gemini || {};
  const credencial = normalizarCredencialGemini(opciones.geminiCredencial || opciones.geminiApiKey || gemini.credencial || '');
  const modelo = normalizarModeloGemini(opciones.geminiModelo || gemini.modelo || GEMINI_CONFIG.modeloPredeterminado);
  const endpointBase = normalizarTexto(opciones.geminiEndpointBase || GEMINI_CONFIG.endpointBase, GEMINI_CONFIG.endpointBase).replace(/\/+$/g, '');
  return {
    ...GEMINI_CONFIG,
    usarGemini: convertirBooleano(opciones.usarGemini, gemini.usarGemini || false),
    credencial,
    tieneCredencial: tieneCredencialGemini(credencial),
    modelo,
    endpointBase,
    endpointGeneracion: `${endpointBase}/models/${modelo}:generateContent`,
    temperatura: limitarNumero(opciones.geminiTemperatura ?? gemini.temperatura ?? GEMINI_CONFIG.temperatura, 0, 1, GEMINI_CONFIG.temperatura),
    maxOutputTokens: limitarNumero(opciones.geminiMaxOutputTokens ?? gemini.maxOutputTokens ?? GEMINI_CONFIG.maxOutputTokens, 256, 4096, GEMINI_CONFIG.maxOutputTokens),
    timeoutMs: limitarNumero(opciones.geminiTimeoutMs ?? gemini.timeoutMs ?? GEMINI_CONFIG.timeoutMs, 10000, 180000, GEMINI_CONFIG.timeoutMs),
    guiaUsuario: normalizarTexto(opciones.geminiGuia || gemini.guiaUsuario || '', ''),
    cantidadMaximaTextos: limitarNumero(opciones.maxTextosFlotantes ?? gemini.cantidadMaximaTextos ?? 6, 1, 12, 6),
    usarFallbackLocal: convertirBooleano(opciones.usarFallbackGemini, gemini.permitirFallbackLocal ?? GEMINI_CONFIG.usarFallbackLocal)
  };
}

export function crearResumenGeminiConfig(configGemini) {
  return {
    proveedor: configGemini?.proveedor || GEMINI_CONFIG.proveedor,
    usarGemini: Boolean(configGemini?.usarGemini),
    tieneCredencial: Boolean(configGemini?.tieneCredencial),
    modelo: configGemini?.modelo || GEMINI_CONFIG.modeloPredeterminado,
    timeoutMs: configGemini?.timeoutMs || GEMINI_CONFIG.timeoutMs,
    cantidadMaximaTextos: configGemini?.cantidadMaximaTextos || 6,
    usarFallbackLocal: Boolean(configGemini?.usarFallbackLocal)
  };
}

export default GEMINI_CONFIG;
